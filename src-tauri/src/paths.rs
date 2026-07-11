//! Workspace path validation. Every file path received from the frontend is a
//! *relative* path joined to a user-chosen workspace root. Validation is
//! lexical (reject before touching the filesystem) plus root canonicalisation.

use std::path::{Component, Path, PathBuf};

#[derive(Debug, PartialEq, Eq)]
pub enum PathError {
    EmptyOrTooLong,
    NotRelative,
    ForbiddenComponent(String),
    RootInvalid(String),
}

impl std::fmt::Display for PathError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PathError::EmptyOrTooLong => write!(f, "path is empty or exceeds 4096 characters"),
            PathError::NotRelative => write!(f, "path must be workspace-relative (no absolute paths, drive letters or UNC prefixes)"),
            PathError::ForbiddenComponent(c) => write!(f, "path contains a forbidden component: {c:?}"),
            PathError::RootInvalid(msg) => write!(f, "workspace root is invalid: {msg}"),
        }
    }
}

/// Lexical validation of a workspace-relative path (POSIX separators required).
pub fn validate_rel_path(rel: &str) -> Result<(), PathError> {
    if rel.is_empty() || rel.len() > 4096 {
        return Err(PathError::EmptyOrTooLong);
    }
    if rel.contains('\0') || rel.contains('\\') {
        return Err(PathError::ForbiddenComponent(rel.to_string()));
    }
    if rel.starts_with('/') || rel.starts_with('~') {
        return Err(PathError::NotRelative);
    }
    // Windows drive letter ("C:") or UNC-ish prefixes.
    let bytes = rel.as_bytes();
    if bytes.len() >= 2 && bytes[1] == b':' && bytes[0].is_ascii_alphabetic() {
        return Err(PathError::NotRelative);
    }
    for seg in rel.split('/') {
        if seg.is_empty() || seg == "." || seg == ".." {
            return Err(PathError::ForbiddenComponent(seg.to_string()));
        }
    }
    // Belt and braces: let std parse it too, rejecting anything that is not a
    // plain Normal component (catches platform-specific prefixes).
    for component in Path::new(rel).components() {
        match component {
            Component::Normal(_) => {}
            other => return Err(PathError::ForbiddenComponent(format!("{other:?}"))),
        }
    }
    Ok(())
}

/// Canonicalise the workspace root and join a validated relative path.
/// The joined path is guaranteed to stay under the root because the relative
/// part contains only `Normal` components (no `..`, no absolute segments).
pub fn safe_join(root: &str, rel: &str) -> Result<PathBuf, PathError> {
    validate_rel_path(rel)?;
    let root_path = Path::new(root)
        .canonicalize()
        .map_err(|e| PathError::RootInvalid(e.to_string()))?;
    if !root_path.is_dir() {
        return Err(PathError::RootInvalid("not a directory".into()));
    }
    Ok(root_path.join(rel))
}

/// Canonicalise the root alone (for use as a process working directory).
pub fn canonical_root(root: &str) -> Result<PathBuf, PathError> {
    let root_path = Path::new(root)
        .canonicalize()
        .map_err(|e| PathError::RootInvalid(e.to_string()))?;
    if !root_path.is_dir() {
        return Err(PathError::RootInvalid("not a directory".into()));
    }
    Ok(root_path)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_plain_relative_paths() {
        for ok in ["a.txt", "circuits/rc.cir", "results/deep/nested/file.csv"] {
            assert!(validate_rel_path(ok).is_ok(), "{ok}");
        }
    }

    #[test]
    fn rejects_traversal_absolute_and_platform_tricks() {
        for bad in [
            "",
            "../x",
            "a/../b",
            "a/..",
            "..",
            ".",
            "a/./b",
            "/etc/passwd",
            "~/x",
            "C:/Windows/system32",
            "c:evil",
            "\\\\server\\share",
            "a\\b",
            "a//b",
            "nul\0byte",
        ] {
            assert!(
                validate_rel_path(bad).is_err(),
                "{bad:?} should be rejected"
            );
        }
    }

    #[test]
    fn safe_join_stays_under_root() {
        let dir = std::env::temp_dir().join("ewb-paths-test");
        std::fs::create_dir_all(&dir).unwrap();
        let root = dir.to_str().unwrap();
        let joined = safe_join(root, "sub/file.txt").unwrap();
        assert!(joined.starts_with(dir.canonicalize().unwrap()));
        assert!(safe_join(root, "../escape.txt").is_err());
        assert!(safe_join("Z:/definitely/not/a/real/root", "a.txt").is_err());
    }
}
