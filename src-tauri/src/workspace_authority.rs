//! Session-scoped authority for workspace roots selected through the native
//! host directory picker. Renderer-provided paths are identifiers only: every
//! filesystem or tool command must resolve to a root in this allow-list.

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use crate::paths::canonical_root;

const MAX_AUTHORISED_ROOTS: usize = 64;

#[derive(Clone, Default)]
pub(crate) struct WorkspaceAuthority(Arc<Mutex<HashSet<PathBuf>>>);

impl WorkspaceAuthority {
    fn canonicalise(root: &Path) -> Result<PathBuf, String> {
        let root = root
            .to_str()
            .ok_or_else(|| "workspace root cannot be represented as text".to_string())?;
        canonical_root(root).map_err(|error| error.to_string())
    }

    fn as_ipc_string(root: &Path) -> Result<String, String> {
        root.to_str()
            .map(str::to_owned)
            .ok_or_else(|| "workspace root cannot be represented as text".to_string())
    }

    /// Register a directory returned by the host picker and return its
    /// canonical string representation to the renderer.
    pub(crate) fn authorise_selected_root(&self, selected: PathBuf) -> Result<String, String> {
        let canonical = Self::canonicalise(&selected)?;
        let mut roots = self
            .0
            .lock()
            .map_err(|_| "workspace authority lock failed".to_string())?;
        if !roots.contains(&canonical) && roots.len() >= MAX_AUTHORISED_ROOTS {
            return Err(format!(
                "workspace authority limit reached ({MAX_AUTHORISED_ROOTS} roots per session)"
            ));
        }
        roots.insert(canonical.clone());
        Self::as_ipc_string(&canonical)
    }

    /// Canonicalise a renderer-supplied identifier and require that the exact
    /// canonical root was previously approved through the host picker.
    pub(crate) fn require_root(&self, requested: &str) -> Result<PathBuf, String> {
        let canonical = canonical_root(requested).map_err(|error| error.to_string())?;
        let roots = self
            .0
            .lock()
            .map_err(|_| "workspace authority lock failed".to_string())?;
        if roots.contains(&canonical) {
            Ok(canonical)
        } else {
            Err("workspace root is not authorised for this session; choose it with the native folder picker first".to_string())
        }
    }

    pub(crate) fn require_root_string(&self, requested: &str) -> Result<String, String> {
        let canonical = self.require_root(requested)?;
        Self::as_ipc_string(&canonical)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};

    static TEMP_COUNTER: AtomicU64 = AtomicU64::new(0);

    fn temp_root(name: &str) -> PathBuf {
        let sequence = TEMP_COUNTER.fetch_add(1, Ordering::Relaxed);
        let root = std::env::temp_dir().join(format!(
            "ewb-authority-{name}-{}-{sequence}",
            std::process::id()
        ));
        std::fs::create_dir_all(&root).unwrap();
        root
    }

    #[test]
    fn arbitrary_existing_root_is_rejected_until_registered() {
        let root = temp_root("rejected");
        let authority = WorkspaceAuthority::default();

        let error = authority.require_root(root.to_str().unwrap()).unwrap_err();

        assert!(
            error.contains("not authorised"),
            "unexpected error: {error}"
        );
    }

    #[test]
    fn registered_root_and_its_canonical_alias_are_allowed() {
        let root = temp_root("allowed");
        let authority = WorkspaceAuthority::default();
        let returned = authority.authorise_selected_root(root.join(".")).unwrap();

        let allowed = authority.require_root(&returned).unwrap();

        assert_eq!(allowed, root.canonicalize().unwrap());
        assert_eq!(returned, allowed.to_str().unwrap());
    }

    #[test]
    fn missing_directory_cannot_be_registered() {
        let root = temp_root("missing").join("not-created");
        let authority = WorkspaceAuthority::default();

        let error = authority.authorise_selected_root(root).unwrap_err();

        assert!(error.contains("workspace root is invalid"));
    }
}
