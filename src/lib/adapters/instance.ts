// Application-wide adapter registry, built from the current tool settings.

import { AdapterRegistry } from "./registry";
import { createBuiltinAdapters } from "./builtin";
import { NgspiceAdapter } from "./ngspice/adapter";
import { KicadAdapter } from "./kicad/adapter";
import { ToolSettings } from "../settings";

export function createRegistry(settings: ToolSettings = {}): AdapterRegistry {
  const registry = new AdapterRegistry();
  for (const adapter of createBuiltinAdapters()) registry.register(adapter);
  registry.register(new NgspiceAdapter({ executablePath: settings.ngspicePath }));
  registry.register(new KicadAdapter({ executablePath: settings.kicadCliPath }));
  return registry;
}
