//! External process execution with timeouts, output caps and cancellation.
//! Processes are always spawned with argument vectors — never a shell string.

use std::io::Read;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

pub const DEFAULT_TIMEOUT_MS: u64 = 60_000;
pub const MAX_TIMEOUT_MS: u64 = 300_000;
pub const MAX_OUTPUT_BYTES: usize = 2 * 1024 * 1024;
const POLL_INTERVAL: Duration = Duration::from_millis(25);

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

/// Read a child stream on a background thread, capping at MAX_OUTPUT_BYTES.
fn capped_reader<R: Read + Send + 'static>(mut stream: R) -> Arc<Mutex<(Vec<u8>, bool)>> {
    let buf: Arc<Mutex<(Vec<u8>, bool)>> = Arc::new(Mutex::new((Vec::new(), false)));
    let out = Arc::clone(&buf);
    std::thread::spawn(move || {
        let mut chunk = [0u8; 8192];
        loop {
            match stream.read(&mut chunk) {
                Ok(0) | Err(_) => break,
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
    });
    buf
}

fn drain(buf: &Arc<Mutex<(Vec<u8>, bool)>>) -> (String, bool) {
    let guard = buf.lock().expect("reader lock");
    (String::from_utf8_lossy(&guard.0).into_owned(), guard.1)
}

fn kill_child(child: &mut Child) {
    let _ = child.kill();
    let _ = child.wait();
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

    let started = Instant::now();
    let mut child = command
        .spawn()
        .map_err(|e| format!("failed to start process: {e}"))?;
    let stdout_buf = capped_reader(child.stdout.take().expect("stdout piped"));
    let stderr_buf = capped_reader(child.stderr.take().expect("stderr piped"));

    let mut timed_out = false;
    let mut cancelled = false;
    let exit_code: Option<i32>;
    loop {
        if let Some(status) = child.try_wait().map_err(|e| format!("wait failed: {e}"))? {
            exit_code = status.code();
            break;
        }
        if let Some(flag) = &cancel_flag {
            if flag.load(Ordering::Relaxed) {
                cancelled = true;
                kill_child(&mut child);
                exit_code = None;
                break;
            }
        }
        if started.elapsed() >= timeout {
            timed_out = true;
            kill_child(&mut child);
            exit_code = None;
            break;
        }
        std::thread::sleep(POLL_INTERVAL);
    }

    // Give the reader threads a short window to drain remaining output.
    std::thread::sleep(Duration::from_millis(30));
    let (stdout, stdout_truncated) = drain(&stdout_buf);
    let (stderr, stderr_truncated) = drain(&stderr_buf);

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
}
