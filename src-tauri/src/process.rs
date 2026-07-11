//! External process execution with timeouts, output caps and cancellation.
//! Processes are always spawned with argument vectors — never a shell string.

use std::io::Read;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;
use std::time::{Duration, Instant};

#[cfg(windows)]
use std::os::windows::io::AsRawHandle;

#[cfg(windows)]
use windows_sys::Win32::Foundation::{CloseHandle, HANDLE};
#[cfg(windows)]
use windows_sys::Win32::System::JobObjects::{
    AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
    SetInformationJobObject, TerminateJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
    JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
};

pub const DEFAULT_TIMEOUT_MS: u64 = 60_000;
pub const MAX_TIMEOUT_MS: u64 = 300_000;
pub const MAX_OUTPUT_BYTES: usize = 2 * 1024 * 1024;
const POLL_INTERVAL: Duration = Duration::from_millis(25);
const READER_DRAIN_TIMEOUT: Duration = Duration::from_millis(500);

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessOutcome {
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    pub timed_out: bool,
    pub cancelled: bool,
    pub truncated: bool,
    pub duration_ms: u64,
}

struct CappedReader {
    buffer: Arc<Mutex<(Vec<u8>, bool)>>,
    handle: JoinHandle<()>,
    finished: Receiver<()>,
}

impl CappedReader {
    fn finish(self, stream_name: &str, deadline: Instant) -> Result<(String, bool), String> {
        let remaining = deadline.saturating_duration_since(Instant::now());
        let completed = match self.finished.recv_timeout(remaining) {
            Ok(()) => true,
            Err(RecvTimeoutError::Disconnected) => {
                self.handle
                    .join()
                    .map_err(|_| format!("{stream_name} reader thread failed"))?;
                return Err(format!(
                    "{stream_name} reader thread ended without a completion signal"
                ));
            }
            Err(RecvTimeoutError::Timeout) => false,
        };
        if completed {
            self.handle
                .join()
                .map_err(|_| format!("{stream_name} reader thread failed"))?;
        }
        let guard = self
            .buffer
            .lock()
            .map_err(|_| format!("{stream_name} reader buffer lock was poisoned"))?;
        Ok((
            String::from_utf8_lossy(&guard.0).into_owned(),
            guard.1 || !completed,
        ))
    }
}

/// Read a child stream on a background thread, capping at MAX_OUTPUT_BYTES.
fn capped_reader<R: Read + Send + 'static>(mut stream: R) -> CappedReader {
    let buf: Arc<Mutex<(Vec<u8>, bool)>> = Arc::new(Mutex::new((Vec::new(), false)));
    let out = Arc::clone(&buf);
    let (finished_tx, finished) = mpsc::channel();
    let handle = std::thread::spawn(move || {
        let mut chunk = [0u8; 8192];
        loop {
            match stream.read(&mut chunk) {
                Ok(0) => break,
                Err(_) => {
                    if let Ok(mut guard) = out.lock() {
                        guard.1 = true;
                    }
                    break;
                }
                Ok(n) => {
                    let mut guard = out.lock().expect("reader lock");
                    if guard.0.len() < MAX_OUTPUT_BYTES {
                        let take = n.min(MAX_OUTPUT_BYTES - guard.0.len());
                        guard.0.extend_from_slice(&chunk[..take]);
                        if take < n {
                            guard.1 = true; // truncated; keep draining so the child never blocks
                        }
                    } else {
                        guard.1 = true;
                    }
                }
            }
        }
        let _ = finished_tx.send(());
    });
    CappedReader {
        buffer: buf,
        handle,
        finished,
    }
}

#[cfg(windows)]
struct ProcessTree {
    job: HANDLE,
}

#[cfg(windows)]
impl ProcessTree {
    fn create() -> Result<Self, String> {
        // The unnamed job is host-owned and cannot be opened by renderer input.
        let job = unsafe { CreateJobObjectW(std::ptr::null(), std::ptr::null()) };
        if job.is_null() {
            return Err(format!(
                "failed to create process containment job: {}",
                std::io::Error::last_os_error()
            ));
        }

        let mut limits = JOBOBJECT_EXTENDED_LIMIT_INFORMATION::default();
        limits.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
        let configured = unsafe {
            SetInformationJobObject(
                job,
                JobObjectExtendedLimitInformation,
                std::ptr::from_ref(&limits).cast(),
                std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
            )
        };
        if configured == 0 {
            let error = std::io::Error::last_os_error();
            unsafe {
                CloseHandle(job);
            }
            return Err(format!(
                "failed to configure process containment job: {error}"
            ));
        }
        Ok(Self { job })
    }

    fn attach(&self, child: &Child) -> Result<(), String> {
        let process = child.as_raw_handle() as HANDLE;
        if unsafe { AssignProcessToJobObject(self.job, process) } == 0 {
            return Err(format!(
                "failed to attach process to containment job: {}",
                std::io::Error::last_os_error()
            ));
        }
        Ok(())
    }

    fn terminate(&self) -> Result<(), String> {
        if unsafe { TerminateJobObject(self.job, 1) } == 0 {
            return Err(format!(
                "failed to terminate contained process tree: {}",
                std::io::Error::last_os_error()
            ));
        }
        Ok(())
    }
}

#[cfg(windows)]
impl Drop for ProcessTree {
    fn drop(&mut self) {
        unsafe {
            CloseHandle(self.job);
        }
    }
}

#[cfg(unix)]
struct ProcessTree {
    process_group: libc::pid_t,
}

#[cfg(unix)]
impl ProcessTree {
    fn create() -> Result<Self, String> {
        Ok(Self { process_group: 0 })
    }

    fn attach(&mut self, child: &Child) -> Result<(), String> {
        self.process_group = child.id() as libc::pid_t;
        Ok(())
    }

    fn terminate(&self) -> Result<(), String> {
        if self.process_group <= 0 {
            return Ok(());
        }
        if unsafe { libc::kill(-self.process_group, libc::SIGKILL) } == 0 {
            return Ok(());
        }
        let error = std::io::Error::last_os_error();
        if error.raw_os_error() == Some(libc::ESRCH) {
            Ok(())
        } else {
            Err(format!(
                "failed to terminate contained process group: {error}"
            ))
        }
    }
}

fn terminate_tree(child: &mut Child, tree: &ProcessTree) -> Result<(), String> {
    let tree_result = tree.terminate();
    // Direct-child termination is a final fallback and also ensures the
    // process is reaped when platform tree termination reports an error.
    let _ = child.kill();
    let wait_result = child.wait();
    tree_result?;
    wait_result
        .map(|_| ())
        .map_err(|error| format!("failed to reap terminated process: {error}"))
}

/// Run `command` to completion with a timeout ceiling and a cancellation flag.
pub fn run_with_limits(
    mut command: Command,
    timeout_ms: Option<u64>,
    cancel_flag: Option<Arc<AtomicBool>>,
) -> Result<ProcessOutcome, String> {
    let timeout =
        Duration::from_millis(timeout_ms.unwrap_or(DEFAULT_TIMEOUT_MS).min(MAX_TIMEOUT_MS));
    command
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        // A new process group makes all descendants addressable as one unit.
        command.process_group(0);
    }

    #[cfg(windows)]
    let process_tree = ProcessTree::create()?;
    #[cfg(unix)]
    let mut process_tree = ProcessTree::create()?;

    let started = Instant::now();
    let mut child = command
        .spawn()
        .map_err(|e| format!("failed to start process: {e}"))?;
    if let Err(error) = process_tree.attach(&child) {
        let _ = child.kill();
        let _ = child.wait();
        return Err(error);
    }
    let stdout_reader = capped_reader(child.stdout.take().expect("stdout piped"));
    let stderr_reader = capped_reader(child.stderr.take().expect("stderr piped"));

    let mut timed_out = false;
    let mut cancelled = false;
    let exit_code: Option<i32>;
    loop {
        if let Some(status) = child.try_wait().map_err(|e| format!("wait failed: {e}"))? {
            exit_code = status.code();
            // A correctly behaving CLI waits for its descendants. Kill any
            // process that outlives the direct child before draining pipes.
            process_tree.terminate()?;
            break;
        }
        if let Some(flag) = &cancel_flag {
            if flag.load(Ordering::Relaxed) {
                cancelled = true;
                terminate_tree(&mut child, &process_tree)?;
                exit_code = None;
                break;
            }
        }
        if started.elapsed() >= timeout {
            timed_out = true;
            terminate_tree(&mut child, &process_tree)?;
            exit_code = None;
            break;
        }
        std::thread::sleep(POLL_INTERVAL);
    }

    // Join readers when their pipes reach EOF. A killed shell can leave a
    // grandchild holding an inherited pipe, so use one shared deadline rather
    // than allowing a join to block past the process timeout. An unfinished
    // reader is detached and its snapshot is explicitly marked truncated.
    let reader_deadline = Instant::now() + READER_DRAIN_TIMEOUT;
    let (stdout, stdout_truncated) = stdout_reader.finish("stdout", reader_deadline)?;
    let (stderr, stderr_truncated) = stderr_reader.finish("stderr", reader_deadline)?;

    Ok(ProcessOutcome {
        exit_code,
        stdout,
        stderr,
        timed_out,
        cancelled,
        truncated: stdout_truncated || stderr_truncated,
        duration_ms: started.elapsed().as_millis() as u64,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn shell_command(script: &str) -> Command {
        // Tests only: run a tiny script via the platform interpreter. Production
        // code paths never construct commands from strings.
        #[cfg(windows)]
        {
            let mut c = Command::new("cmd");
            c.args(["/C", script]);
            c
        }
        #[cfg(not(windows))]
        {
            let mut c = Command::new("sh");
            c.args(["-c", script]);
            c
        }
    }

    #[test]
    fn captures_output_and_exit_code() {
        let outcome = run_with_limits(shell_command("echo hello"), Some(10_000), None).unwrap();
        assert_eq!(outcome.exit_code, Some(0));
        assert!(outcome.stdout.contains("hello"));
        assert!(!outcome.timed_out && !outcome.cancelled && !outcome.truncated);
    }

    #[test]
    fn reports_nonzero_exit() {
        let outcome = run_with_limits(shell_command("exit 3"), Some(10_000), None).unwrap();
        assert_eq!(outcome.exit_code, Some(3));
    }

    #[test]
    fn kills_on_timeout() {
        #[cfg(windows)]
        let script = "ping -n 30 127.0.0.1 > nul";
        #[cfg(not(windows))]
        let script = "sleep 30";
        let started = Instant::now();
        let outcome = run_with_limits(shell_command(script), Some(300), None).unwrap();
        assert!(outcome.timed_out);
        assert_eq!(outcome.exit_code, None);
        assert!(started.elapsed() < Duration::from_secs(10));
    }

    #[test]
    fn honours_cancellation() {
        #[cfg(windows)]
        let script = "ping -n 30 127.0.0.1 > nul";
        #[cfg(not(windows))]
        let script = "sleep 30";
        let flag = Arc::new(AtomicBool::new(false));
        let setter = Arc::clone(&flag);
        std::thread::spawn(move || {
            std::thread::sleep(Duration::from_millis(200));
            setter.store(true, Ordering::Relaxed);
        });
        let outcome = run_with_limits(shell_command(script), Some(60_000), Some(flag)).unwrap();
        assert!(outcome.cancelled);
        assert!(!outcome.timed_out);
    }

    #[test]
    fn truncates_oversized_output() {
        // Emit ~4 MiB; the cap is 2 MiB.
        #[cfg(windows)]
        let script = "for /L %i in (1,1,40000) do @echo 0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789";
        #[cfg(not(windows))]
        let script = "yes 0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789 | head -n 40000";
        let outcome = run_with_limits(shell_command(script), Some(120_000), None).unwrap();
        assert!(outcome.truncated);
        assert!(outcome.stdout.len() <= MAX_OUTPUT_BYTES);
    }

    #[test]
    fn missing_executable_is_a_structured_error() {
        let err = run_with_limits(
            Command::new("definitely-not-a-real-binary-ewb"),
            Some(1_000),
            None,
        )
        .unwrap_err();
        assert!(err.contains("failed to start process"));
    }

    #[test]
    fn descendant_leaf_helper() {
        let Ok(marker) = std::env::var("EWB_DESCENDANT_LEAF_MARKER") else {
            return;
        };
        std::thread::sleep(Duration::from_millis(1_200));
        std::fs::write(marker, "descendant survived").unwrap();
    }

    #[test]
    fn descendant_parent_helper() {
        let Ok(marker) = std::env::var("EWB_DESCENDANT_PARENT_MARKER") else {
            return;
        };
        let mut descendant = Command::new(std::env::current_exe().unwrap());
        descendant
            .args([
                "--exact",
                "process::tests::descendant_leaf_helper",
                "--nocapture",
            ])
            .env("EWB_DESCENDANT_LEAF_MARKER", marker)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        let mut descendant = descendant.spawn().unwrap();
        std::thread::sleep(Duration::from_secs(30));
        let _ = descendant.wait();
    }

    fn descendant_parent_command(marker: &std::path::Path) -> Command {
        let mut parent = Command::new(std::env::current_exe().unwrap());
        parent
            .args([
                "--exact",
                "process::tests::descendant_parent_helper",
                "--nocapture",
            ])
            .env("EWB_DESCENDANT_PARENT_MARKER", marker);
        parent
    }

    fn descendant_marker(name: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!(
            "ewb-descendant-{name}-{}-{}.txt",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ))
    }

    #[test]
    fn timeout_terminates_descendant_process_tree() {
        let marker = descendant_marker("timeout-marker");
        let _ = std::fs::remove_file(&marker);

        let outcome = run_with_limits(descendant_parent_command(&marker), Some(300), None).unwrap();
        assert!(outcome.timed_out);

        std::thread::sleep(Duration::from_millis(1_500));
        assert!(
            !marker.exists(),
            "a descendant survived process-tree termination and wrote {marker:?}"
        );
    }

    #[test]
    fn cancellation_terminates_descendant_process_tree() {
        let marker = descendant_marker("cancel-marker");
        let _ = std::fs::remove_file(&marker);
        let flag = Arc::new(AtomicBool::new(false));
        let setter = Arc::clone(&flag);
        std::thread::spawn(move || {
            std::thread::sleep(Duration::from_millis(200));
            setter.store(true, Ordering::Relaxed);
        });

        let outcome =
            run_with_limits(descendant_parent_command(&marker), Some(60_000), Some(flag)).unwrap();
        assert!(outcome.cancelled);

        std::thread::sleep(Duration::from_millis(1_500));
        assert!(
            !marker.exists(),
            "a descendant survived cancellation and wrote {marker:?}"
        );
    }
}
