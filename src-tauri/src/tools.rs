//! Tool detection and allow-listed request → argument-vector construction.

use std::path::{Path, PathBuf};
use std::process::Command;

use crate::paths::{canonical_root, validate_rel_path, PathError};
use crate::process::run_with_limits;

pub const TOOL_NGSPICE: &str = "ngspice";
pub const TOOL_KICAD: &str = "kicad-cli";
const DETECT_TIMEOUT_MS: u64 = 10_000;

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolDetection {
    pub found: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Typed process request from the frontend. Only these two shapes exist; the
/// frontend can never pass raw argument arrays.
#[derive(Debug, serde::Deserialize)]
#[serde(tag = "tool")]
pub enum ToolRunRequest {
    #[serde(rename = "ngspice")]
    Ngspice {
        #[serde(rename = "netlistRelPath")]
        netlist_rel_path: String,
        #[serde(rename = "outputDirRelPath")]
        output_dir_rel_path: String,
    },
    #[serde(rename = "kicad-cli")]
    KicadCli {
        subcommand: String,
        #[serde(rename = "inputRelPath")]
        input_rel_path: String,
        #[serde(rename = "outputRelPath")]
        output_rel_path: String,
    },
}

impl ToolRunRequest {
    pub fn tool_id(&self) -> &'static str {
        match self {
            ToolRunRequest::Ngspice { .. } => TOOL_NGSPICE,
            ToolRunRequest::KicadCli { .. } => TOOL_KICAD,
        }
    }

    /// Validate every embedded path lexically and build the argument vector.
    /// All paths stay relative; the process working directory is the
    /// canonicalised workspace root.
    pub fn build_args(&self) -> Result<Vec<String>, String> {
        match self {
            ToolRunRequest::Ngspice {
                netlist_rel_path,
                output_dir_rel_path,
            } => {
                validate_rel_path(netlist_rel_path).map_err(|e| e.to_string())?;
                validate_rel_path(output_dir_rel_path).map_err(|e| e.to_string())?;
                Ok(vec!["-b".into(), netlist_rel_path.clone()])
            }
            ToolRunRequest::KicadCli {
                subcommand,
                input_rel_path,
                output_rel_path,
            } => {
                validate_rel_path(input_rel_path).map_err(|e| e.to_string())?;
                validate_rel_path(output_rel_path).map_err(|e| e.to_string())?;
                let head: &[&str] = match subcommand.as_str() {
                    "sch-erc" => &["sch", "erc", "--format", "json"],
                    "pcb-drc" => &["pcb", "drc", "--format", "json"],
                    "sch-export-netlist" => &["sch", "export", "netlist"],
                    "sch-export-bom" => &["sch", "export", "bom"],
                    "pcb-export-gerbers" => &["pcb", "export", "gerbers"],
                    "pcb-export-drill" => &["pcb", "export", "drill"],
                    "pcb-render" => &["pcb", "render"],
                    other => {
                        return Err(format!(
                            "kicad-cli subcommand {other:?} is not on the allow-list"
                        ))
                    }
                };
                let mut args: Vec<String> = head.iter().map(|s| s.to_string()).collect();
                args.push("--output".into());
                args.push(output_rel_path.clone());
                args.push(input_rel_path.clone());
                Ok(args)
            }
        }
    }
}

/// Candidate executable names per tool (PATH lookup), most specific first.
fn path_candidates(tool: &str) -> Vec<&'static str> {
    match tool {
        TOOL_NGSPICE => {
            if cfg!(windows) {
                vec!["ngspice_con", "ngspice"]
            } else {
                vec!["ngspice"]
            }
        }
        TOOL_KICAD => vec!["kicad-cli"],
        _ => vec![],
    }
}

/// Well-known install locations checked when PATH lookup fails.
fn well_known_locations(tool: &str) -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    match tool {
        TOOL_NGSPICE => {
            if cfg!(windows) {
                candidates.push(PathBuf::from("C:/Spice64/bin/ngspice_con.exe"));
                candidates.push(PathBuf::from("C:/Spice64/bin/ngspice.exe"));
            } else {
                candidates.push(PathBuf::from("/usr/local/bin/ngspice"));
                candidates.push(PathBuf::from("/opt/homebrew/bin/ngspice"));
            }
        }
        TOOL_KICAD => {
            if cfg!(windows) {
                for major in ["9.0", "8.0", "7.0"] {
                    candidates.push(PathBuf::from(format!(
                        "C:/Program Files/KiCad/{major}/bin/kicad-cli.exe"
                    )));
                }
            } else if cfg!(target_os = "macos") {
                candidates.push(PathBuf::from(
                    "/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli",
                ));
            } else {
                candidates.push(PathBuf::from("/usr/bin/kicad-cli"));
                candidates.push(PathBuf::from("/usr/local/bin/kicad-cli"));
            }
        }
        _ => {}
    }
    candidates
}

fn version_args(tool: &str) -> &'static [&'static str] {
    match tool {
        TOOL_NGSPICE => &["--version"],
        TOOL_KICAD => &["version"],
        _ => &[],
    }
}

/// Pick the first output line that carries a digit — works for both
/// "ngspice-44 ..." banners and bare "8.0.4" version prints.
pub fn extract_version_line(stdout: &str, stderr: &str) -> Option<String> {
    stdout
        .lines()
        .chain(stderr.lines())
        .map(str::trim)
        .find(|l| !l.is_empty() && l.chars().any(|c| c.is_ascii_digit()))
        .map(|l| l.chars().take(200).collect())
}

fn try_version(program: &Path, tool: &str) -> Option<String> {
    let mut command = Command::new(program);
    command.args(version_args(tool));
    match run_with_limits(command, Some(DETECT_TIMEOUT_MS), None) {
        Ok(outcome) if !outcome.timed_out => extract_version_line(&outcome.stdout, &outcome.stderr),
        _ => None,
    }
}

/// Detect a tool: explicit override path first, then PATH, then well-known
/// install locations. The override must exist and be a file.
pub fn detect_tool(tool: &str, override_path: Option<&str>) -> ToolDetection {
    if tool != TOOL_NGSPICE && tool != TOOL_KICAD {
        return ToolDetection {
            found: false,
            path: None,
            version: None,
            error: Some(format!("unknown tool {tool:?}")),
        };
    }

    if let Some(overridden) = override_path {
        let p = Path::new(overridden);
        if !p.is_file() {
            return ToolDetection {
                found: false,
                path: None,
                version: None,
                error: Some(format!(
                    "configured executable does not exist: {overridden}"
                )),
            };
        }
        return match try_version(p, tool) {
            Some(version) => ToolDetection {
                found: true,
                path: Some(overridden.to_string()),
                version: Some(version),
                error: None,
            },
            None => ToolDetection {
                found: false,
                path: Some(overridden.to_string()),
                version: None,
                error: Some(
                    "configured executable did not report a version; is it the right binary?"
                        .into(),
                ),
            },
        };
    }

    for name in path_candidates(tool) {
        if let Some(version) = try_version(Path::new(name), tool) {
            return ToolDetection {
                found: true,
                path: Some(name.to_string()),
                version: Some(version),
                error: None,
            };
        }
    }
    for location in well_known_locations(tool) {
        if location.is_file() {
            if let Some(version) = try_version(&location, tool) {
                return ToolDetection {
                    found: true,
                    path: Some(location.to_string_lossy().into_owned()),
                    version: Some(version),
                    error: None,
                };
            }
        }
    }
    ToolDetection {
        found: false,
        path: None,
        version: None,
        error: Some(format!(
            "{tool} was not found on PATH or in well-known install locations"
        )),
    }
}

/// Resolve the program to execute for a run request.
pub fn resolve_program(tool: &str, override_path: Option<&str>) -> Result<PathBuf, String> {
    let detection = detect_tool(tool, override_path);
    match (detection.found, detection.path) {
        (true, Some(p)) => Ok(PathBuf::from(p)),
        _ => Err(detection
            .error
            .unwrap_or_else(|| format!("{tool} is not available"))),
    }
}

/// Ensure the workspace root exists and is a directory before running.
pub fn validated_root(root: &str) -> Result<PathBuf, PathError> {
    canonical_root(root)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ngspice_args_are_batch_mode_with_relative_netlist() {
        let req = ToolRunRequest::Ngspice {
            netlist_rel_path: "simulations/run.deck.cir".into(),
            output_dir_rel_path: "results".into(),
        };
        assert_eq!(
            req.build_args().unwrap(),
            vec!["-b", "simulations/run.deck.cir"]
        );
    }

    #[test]
    fn kicad_subcommands_map_to_fixed_argument_vectors() {
        let req = ToolRunRequest::KicadCli {
            subcommand: "pcb-drc".into(),
            input_rel_path: "pcb/board.kicad_pcb".into(),
            output_rel_path: "results/drc.report.json".into(),
        };
        assert_eq!(
            req.build_args().unwrap(),
            vec![
                "pcb",
                "drc",
                "--format",
                "json",
                "--output",
                "results/drc.report.json",
                "pcb/board.kicad_pcb"
            ]
        );
    }

    #[test]
    fn unknown_kicad_subcommands_are_rejected() {
        let req = ToolRunRequest::KicadCli {
            subcommand: "pcb-nuke; rm -rf /".into(),
            input_rel_path: "pcb/board.kicad_pcb".into(),
            output_rel_path: "results/x".into(),
        };
        assert!(req.build_args().unwrap_err().contains("allow-list"));
    }

    #[test]
    fn injection_attempts_in_paths_are_rejected_before_spawn() {
        for evil in [
            "../outside.cir",
            "/abs/path.cir",
            "C:/x.cir",
            "a\\b.cir",
            "x/../../y",
        ] {
            let req = ToolRunRequest::Ngspice {
                netlist_rel_path: evil.into(),
                output_dir_rel_path: "results".into(),
            };
            assert!(req.build_args().is_err(), "{evil} should be rejected");
        }
        // Argument-vector spawning means shell metacharacters are inert, but the
        // path validator still rejects separator tricks embedded in them.
        let quoted = ToolRunRequest::Ngspice {
            netlist_rel_path: "a.cir; rm -rf /".into(),
            output_dir_rel_path: "results".into(),
        };
        // "; rm -rf /" contains '/' segments that make it a multi-segment path
        // with empty component (" /" trailing) — rejected lexically.
        assert!(quoted.build_args().is_err());
    }

    #[test]
    fn unknown_tools_and_bad_overrides_fail_detection() {
        let det = detect_tool("make", None);
        assert!(!det.found);
        let det = detect_tool(TOOL_NGSPICE, Some("Z:/nope/ngspice.exe"));
        assert!(!det.found);
        assert!(det.error.unwrap().contains("does not exist"));
    }

    #[test]
    fn version_line_extraction_handles_banners_and_bare_versions() {
        assert_eq!(
            extract_version_line(
                "******\n** ngspice-44 : Circuit level simulation program\n",
                ""
            ),
            Some("** ngspice-44 : Circuit level simulation program".to_string())
        );
        assert_eq!(
            extract_version_line("8.0.4\n", ""),
            Some("8.0.4".to_string())
        );
        assert_eq!(extract_version_line("no digits here", ""), None);
    }
}
