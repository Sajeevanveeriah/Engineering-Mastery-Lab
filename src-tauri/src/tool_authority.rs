//! Session-scoped authority for external engineering executables. Only a path
//! returned by the host native picker can be stored here. Renderer IPC carries
//! a known tool identifier, never a filesystem path.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use crate::tools::{
    detect_tool, is_known_tool, resolve_program, validate_selected_executable, ToolDetection,
};

#[derive(Clone, Default)]
pub(crate) struct ToolAuthority(Arc<Mutex<HashMap<String, PathBuf>>>);

impl ToolAuthority {
    pub(crate) fn selected(&self, tool: &str) -> Result<Option<PathBuf>, String> {
        if !is_known_tool(tool) {
            return Err(format!("unknown tool {tool:?}"));
        }
        self.0
            .lock()
            .map_err(|_| "tool authority lock failed".to_string())
            .map(|paths| paths.get(tool).cloned())
    }

    pub(crate) fn detect(&self, tool: &str) -> ToolDetection {
        match self.selected(tool) {
            Ok(selected) => detect_tool(tool, selected.as_deref()),
            Err(error) => ToolDetection {
                found: false,
                path: None,
                version: None,
                error: Some(error),
            },
        }
    }

    pub(crate) fn resolve(&self, tool: &str) -> Result<PathBuf, String> {
        let selected = self.selected(tool)?;
        resolve_program(tool, selected.as_deref())
    }

    /// Validate and register a native-picker result. A failed selection never
    /// replaces an existing valid session selection.
    pub(crate) fn authorise_selected(
        &self,
        tool: &str,
        selected: &Path,
    ) -> Result<ToolDetection, String> {
        let (canonical, version) = validate_selected_executable(tool, selected)?;
        self.store_validated(tool, canonical.clone())?;
        Ok(ToolDetection {
            found: true,
            path: Some(canonical.to_string_lossy().into_owned()),
            version: Some(version),
            error: None,
        })
    }

    pub(crate) fn clear(&self, tool: &str) -> Result<(), String> {
        if !is_known_tool(tool) {
            return Err(format!("unknown tool {tool:?}"));
        }
        self.0
            .lock()
            .map_err(|_| "tool authority lock failed".to_string())?
            .remove(tool);
        Ok(())
    }

    fn store_validated(&self, tool: &str, canonical: PathBuf) -> Result<(), String> {
        if !is_known_tool(tool) {
            return Err(format!("unknown tool {tool:?}"));
        }
        self.0
            .lock()
            .map_err(|_| "tool authority lock failed".to_string())?
            .insert(tool.to_string(), canonical);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tools::{TOOL_KICAD, TOOL_NGSPICE};

    #[test]
    fn selections_are_isolated_by_known_tool_and_can_be_cleared() {
        let authority = ToolAuthority::default();
        let ngspice = PathBuf::from("C:/trusted/ngspice.exe");
        let kicad = PathBuf::from("C:/trusted/kicad-cli.exe");

        authority
            .store_validated(TOOL_NGSPICE, ngspice.clone())
            .unwrap();
        authority
            .store_validated(TOOL_KICAD, kicad.clone())
            .unwrap();

        assert_eq!(authority.selected(TOOL_NGSPICE).unwrap(), Some(ngspice));
        assert_eq!(authority.selected(TOOL_KICAD).unwrap(), Some(kicad));
        authority.clear(TOOL_NGSPICE).unwrap();
        assert_eq!(authority.selected(TOOL_NGSPICE).unwrap(), None);
        assert!(authority
            .selected("shell")
            .unwrap_err()
            .contains("unknown tool"));
    }

    #[test]
    fn invalid_picker_result_does_not_replace_existing_selection() {
        let authority = ToolAuthority::default();
        let original = PathBuf::from("C:/trusted/ngspice.exe");
        authority
            .store_validated(TOOL_NGSPICE, original.clone())
            .unwrap();

        let error = authority
            .authorise_selected(TOOL_NGSPICE, Path::new("Z:/missing/ngspice.exe"))
            .unwrap_err();

        assert!(error.contains("could not be resolved"));
        assert_eq!(authority.selected(TOOL_NGSPICE).unwrap(), Some(original));
    }
}
