//! Workspace-scoped file IO: reads, atomic writes, listing and hashing.
//! Every function takes (root, rel) and goes through `safe_join`.

use sha2::{Digest, Sha256};
use std::fs;
use std::io::Read;

use crate::paths::safe_join;

const MAX_READ_BYTES: u64 = 16 * 1024 * 1024;

pub fn read_text_file(root: &str, rel: &str, max_bytes: Option<u64>) -> Result<String, String> {
    let path = safe_join(root, rel).map_err(|e| e.to_string())?;
    let limit = max_bytes.unwrap_or(MAX_READ_BYTES).min(MAX_READ_BYTES);
    let file = fs::File::open(&path).map_err(|e| format!("cannot open {rel}: {e}"))?;
    let mut buf = Vec::new();
    file.take(limit)
        .read_to_end(&mut buf)
        .map_err(|e| format!("cannot read {rel}: {e}"))?;
    Ok(String::from_utf8_lossy(&buf).into_owned())
}

/// Write via a sibling temp file + rename. On Windows, rename over an existing
/// file fails, so the destination is removed first — a narrow non-atomic
/// window, accepted and documented (ADR-0003: "atomic where possible").
pub fn write_text_file_atomic(root: &str, rel: &str, contents: &str) -> Result<(), String> {
    let path = safe_join(root, rel).map_err(|e| e.to_string())?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("cannot create parent directory for {rel}: {e}"))?;
    }
    let tmp = path.with_extension(format!(
        "{}.tmp-{}",
        path.extension()
            .map(|e| e.to_string_lossy().into_owned())
            .unwrap_or_default(),
        std::process::id()
    ));
    fs::write(&tmp, contents).map_err(|e| format!("cannot write temp file for {rel}: {e}"))?;
    match fs::rename(&tmp, &path) {
        Ok(()) => Ok(()),
        Err(_) => {
            fs::remove_file(&path).map_err(|e| format!("cannot replace {rel}: {e}"))?;
            fs::rename(&tmp, &path).map_err(|e| format!("cannot finalise write of {rel}: {e}"))
        }
    }
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
    fn read_respects_byte_limit() {
        let root = temp_root("limit");
        write_text_file_atomic(&root, "big.txt", &"x".repeat(1000)).unwrap();
        assert_eq!(
            read_text_file(&root, "big.txt", Some(10)).unwrap().len(),
            10
        );
    }
}
