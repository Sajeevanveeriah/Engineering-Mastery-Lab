//! Workspace-scoped file IO: reads, atomic writes, listing and hashing.
//! Every function takes (root, rel) and goes through `safe_join`.

use sha2::{Digest, Sha256};
use std::fs;
use std::io::{self, Read, Write};
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use crate::paths::safe_join;

const MAX_READ_BYTES: u64 = 16 * 1024 * 1024;
const TEMP_CREATE_ATTEMPTS: usize = 128;
static TEMP_FILE_COUNTER: AtomicU64 = AtomicU64::new(0);
static ATOMIC_REPLACE_LOCK: Mutex<()> = Mutex::new(());

pub fn read_text_file(root: &str, rel: &str, max_bytes: Option<u64>) -> Result<String, String> {
    let path = safe_join(root, rel).map_err(|e| e.to_string())?;
    let limit = max_bytes.unwrap_or(MAX_READ_BYTES).min(MAX_READ_BYTES);
    let file = fs::File::open(&path).map_err(|e| format!("cannot open {rel}: {e}"))?;
    let metadata = file
        .metadata()
        .map_err(|e| format!("cannot inspect {rel}: {e}"))?;
    if metadata.len() > limit {
        return Err(format!(
            "cannot read {rel}: file is {} bytes and exceeds the maximum of {limit} bytes",
            metadata.len()
        ));
    }

    let mut buf = Vec::with_capacity(metadata.len() as usize);
    file.take(limit.saturating_add(1))
        .read_to_end(&mut buf)
        .map_err(|e| format!("cannot read {rel}: {e}"))?;
    if buf.len() as u64 > limit {
        return Err(format!(
            "cannot read {rel}: file grew beyond the maximum of {limit} bytes while being read"
        ));
    }

    String::from_utf8(buf)
        .map_err(|e| format!("cannot read {rel}: content is not valid UTF-8: {e}"))
}

fn create_unique_sibling_temp(path: &Path) -> io::Result<(fs::File, std::path::PathBuf)> {
    let parent = path
        .parent()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "destination has no parent"))?;
    let file_name = path
        .file_name()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "destination has no filename"))?
        .to_string_lossy();

    for _ in 0..TEMP_CREATE_ATTEMPTS {
        let sequence = TEMP_FILE_COUNTER.fetch_add(1, Ordering::Relaxed);
        let temp_path = parent.join(format!(
            ".{file_name}.tmp-{}-{sequence}",
            std::process::id()
        ));
        match fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temp_path)
        {
            Ok(file) => return Ok((file, temp_path)),
            Err(error) if error.kind() == io::ErrorKind::AlreadyExists => continue,
            Err(error) => return Err(error),
        }
    }
    Err(io::Error::new(
        io::ErrorKind::AlreadyExists,
        "could not allocate a unique sibling temporary file",
    ))
}

#[cfg(not(windows))]
fn replace_file_atomic(temp_path: &Path, destination: &Path) -> io::Result<()> {
    // POSIX rename replaces an existing same-filesystem destination atomically.
    fs::rename(temp_path, destination)
}

#[cfg(windows)]
fn replace_file_atomic(temp_path: &Path, destination: &Path) -> io::Result<()> {
    use std::os::windows::ffi::OsStrExt;

    const MOVEFILE_REPLACE_EXISTING: u32 = 0x0000_0001;
    const MOVEFILE_WRITE_THROUGH: u32 = 0x0000_0008;

    #[link(name = "Kernel32")]
    extern "system" {
        #[link_name = "MoveFileExW"]
        fn move_file_ex_w(
            existing_file_name: *const u16,
            new_file_name: *const u16,
            flags: u32,
        ) -> i32;
    }

    let temp_wide: Vec<u16> = temp_path
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    let destination_wide: Vec<u16> = destination
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    // SAFETY: both pointers reference NUL-terminated UTF-16 buffers that live
    // for the duration of the call. The paths are sibling files, so the move
    // cannot cross volumes. MOVEFILE_REPLACE_EXISTING avoids deleting the old
    // destination before the OS has accepted the replacement.
    let replaced = unsafe {
        move_file_ex_w(
            temp_wide.as_ptr(),
            destination_wide.as_ptr(),
            MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH,
        )
    };
    if replaced == 0 {
        Err(io::Error::last_os_error())
    } else {
        Ok(())
    }
}

fn write_text_file_atomic_with<F>(
    root: &str,
    rel: &str,
    contents: &str,
    replace: F,
) -> Result<(), String>
where
    F: FnOnce(&Path, &Path) -> io::Result<()>,
{
    let path = safe_join(root, rel).map_err(|e| e.to_string())?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("cannot create parent directory for {rel}: {e}"))?;
    }

    let (mut temp_file, temp_path) = create_unique_sibling_temp(&path)
        .map_err(|e| format!("cannot create temp file for {rel}: {e}"))?;
    let prepared = temp_file
        .write_all(contents.as_bytes())
        .and_then(|()| temp_file.flush())
        .and_then(|()| temp_file.sync_all());
    if let Err(error) = prepared {
        drop(temp_file);
        let _ = fs::remove_file(&temp_path);
        return Err(format!("cannot flush temp file for {rel}: {error}"));
    }
    drop(temp_file);

    let replace_guard = match ATOMIC_REPLACE_LOCK.lock() {
        Ok(guard) => guard,
        Err(_) => {
            let _ = fs::remove_file(&temp_path);
            return Err(format!(
                "cannot atomically replace {rel}: replacement lock failed"
            ));
        }
    };
    let replacement = replace(&temp_path, &path);
    drop(replace_guard);
    if let Err(error) = replacement {
        let cleanup_error = fs::remove_file(&temp_path).err();
        return match cleanup_error {
            Some(cleanup) => Err(format!(
                "cannot atomically replace {rel}: {error}; temp cleanup also failed: {cleanup}"
            )),
            None => Err(format!("cannot atomically replace {rel}: {error}")),
        };
    }
    Ok(())
}

/// Write and flush a unique sibling temporary file, then atomically replace
/// the destination without deleting the previous file first.
pub fn write_text_file_atomic(root: &str, rel: &str, contents: &str) -> Result<(), String> {
    write_text_file_atomic_with(root, rel, contents, replace_file_atomic)
}

pub fn list_dir(root: &str, rel: &str) -> Result<Vec<String>, String> {
    let path = safe_join(root, rel).map_err(|e| e.to_string())?;
    let mut names: Vec<String> = fs::read_dir(&path)
        .map_err(|e| format!("cannot list {rel}: {e}"))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.path().is_file())
        .map(|entry| entry.file_name().to_string_lossy().into_owned())
        .collect();
    names.sort();
    Ok(names)
}

pub fn hash_file(root: &str, rel: &str) -> Result<String, String> {
    let path = safe_join(root, rel).map_err(|e| e.to_string())?;
    let mut file = fs::File::open(&path).map_err(|e| format!("cannot open {rel}: {e}"))?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 65536];
    loop {
        let n = file
            .read(&mut buf)
            .map_err(|e| format!("cannot read {rel}: {e}"))?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(hex::encode(hasher.finalize()))
}

pub fn create_dir_all(root: &str, rel: &str) -> Result<(), String> {
    let path = safe_join(root, rel).map_err(|e| e.to_string())?;
    fs::create_dir_all(&path).map_err(|e| format!("cannot create {rel}: {e}"))
}

pub fn file_exists(root: &str, rel: &str) -> Result<bool, String> {
    let path = safe_join(root, rel).map_err(|e| e.to_string())?;
    Ok(path.is_file())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Barrier};

    fn temp_root(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("ewb-fs-{name}-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        dir.to_string_lossy().into_owned()
    }

    #[test]
    fn write_read_round_trip_and_atomic_replace() {
        let root = temp_root("rw");
        write_text_file_atomic(&root, "sub/a.json", "{\"v\":1}").unwrap();
        assert_eq!(
            read_text_file(&root, "sub/a.json", None).unwrap(),
            "{\"v\":1}"
        );
        write_text_file_atomic(&root, "sub/a.json", "{\"v\":2}").unwrap();
        assert_eq!(
            read_text_file(&root, "sub/a.json", None).unwrap(),
            "{\"v\":2}"
        );
        // No stray temp files left behind.
        let names = list_dir(&root, "sub").unwrap();
        assert_eq!(names, vec!["a.json"]);
    }

    #[test]
    fn replacement_failure_preserves_existing_file_and_cleans_temp() {
        let root = temp_root("replace-failure");
        write_text_file_atomic(&root, "failure/state.json", "old-state").unwrap();

        let error = write_text_file_atomic_with(
            &root,
            "failure/state.json",
            "new-state",
            |temp_path, destination| {
                assert_eq!(fs::read_to_string(temp_path).unwrap(), "new-state");
                assert_eq!(fs::read_to_string(destination).unwrap(), "old-state");
                Err(io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "injected replacement failure",
                ))
            },
        )
        .unwrap_err();

        assert!(error.contains("cannot atomically replace"));
        assert_eq!(
            read_text_file(&root, "failure/state.json", None).unwrap(),
            "old-state"
        );
        assert_eq!(list_dir(&root, "failure").unwrap(), vec!["state.json"]);
    }

    #[test]
    fn concurrent_replacements_are_complete_and_leave_no_temp_files() {
        const WRITERS: usize = 8;
        let root = Arc::new(temp_root("concurrent"));
        let barrier = Arc::new(Barrier::new(WRITERS));
        let mut handles = Vec::new();
        for writer in 0..WRITERS {
            let root = Arc::clone(&root);
            let barrier = Arc::clone(&barrier);
            handles.push(std::thread::spawn(move || {
                let contents = format!("writer-{writer}:{}", "x".repeat(64 * 1024));
                barrier.wait();
                let result = write_text_file_atomic(&root, "race/value.json", &contents);
                (contents, result)
            }));
        }

        let mut candidates = Vec::new();
        for handle in handles {
            let (contents, result) = handle.join().unwrap();
            result.unwrap();
            candidates.push(contents);
        }

        let final_contents = read_text_file(&root, "race/value.json", None).unwrap();
        assert!(candidates.contains(&final_contents));
        assert_eq!(list_dir(&root, "race").unwrap(), vec!["value.json"]);
    }

    #[test]
    fn rejects_escapes_on_every_operation() {
        let root = temp_root("esc");
        assert!(read_text_file(&root, "../x", None).is_err());
        assert!(write_text_file_atomic(&root, "/abs.txt", "x").is_err());
        assert!(hash_file(&root, "..",).is_err());
        assert!(list_dir(&root, "a\\b").is_err());
        assert!(create_dir_all(&root, "C:/evil").is_err());
    }

    #[test]
    fn hash_matches_known_vector() {
        let root = temp_root("hash");
        write_text_file_atomic(&root, "abc.txt", "abc").unwrap();
        assert_eq!(
            hash_file(&root, "abc.txt").unwrap(),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
    }

    #[test]
    fn oversized_read_is_rejected_instead_of_returning_a_prefix() {
        let root = temp_root("limit");
        write_text_file_atomic(&root, "big.txt", &"x".repeat(1000)).unwrap();
        let error = read_text_file(&root, "big.txt", Some(10)).unwrap_err();
        assert!(error.contains("big.txt"));
        assert!(error.contains("file is 1000 bytes"));
        assert!(error.contains("exceeds the maximum of 10 bytes"));
    }

    #[test]
    fn invalid_utf8_is_rejected() {
        let root = temp_root("invalid-utf8");
        let path = Path::new(&root).join("invalid.txt");
        fs::write(path, [0x66, 0x6f, 0x80, 0x6f]).unwrap();

        let error = read_text_file(&root, "invalid.txt", None).unwrap_err();
        assert!(error.contains("invalid.txt"));
        assert!(error.contains("content is not valid UTF-8"));
    }

    #[test]
    fn allowed_utf8_text_round_trips_at_the_byte_limit() {
        let root = temp_root("utf8-round-trip");
        let contents = "Motor speed: 1 500 r/min\nTorque: 12.4 N\u{00b7}m";
        write_text_file_atomic(&root, "measurements.txt", contents).unwrap();

        assert_eq!(
            read_text_file(&root, "measurements.txt", Some(contents.len() as u64)).unwrap(),
            contents
        );
    }
}
