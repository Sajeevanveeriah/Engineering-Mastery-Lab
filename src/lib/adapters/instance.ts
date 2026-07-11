// Application-wide adapter registry. External executable authority stays in
// the Rust host; the renderer registry contains no executable paths.

import { AdapterRegistry } from "./registry";
import { createBuiltinAdapters } from "./builtin";
import { NgspiceAdapter } from "./ngspice/adapter";
import { KicadAdapter } from "./kicad/adapter";

export function createRegistry(): AdapterRegistry {
  const registry = new AdapterRegistry();
  for (const adapter of createBuiltinAdapters()) registry.register(adapter);
  registry.register(new NgspiceAdapter());
  registry.register(new KicadAdapter());
  return registry;
}
