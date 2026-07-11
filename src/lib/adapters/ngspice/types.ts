// ngspice analysis request types (adapter capability parameters).

export interface OpAnalysis {
  kind: "op";
}

export interface DcAnalysis {
  kind: "dc";
  /** Swept source name, e.g. "V1". */
  source: string;
  start: number;
  stop: number;
  step: number;
}

export interface AcAnalysis {
  kind: "ac";
  /** Points per decade. */
  pointsPerDecade: number;
  fStart: number;
  fStop: number;
}

export interface TranAnalysis {
  kind: "tran";
  /** Timestep in seconds. */
  tStep: number;
  /** Stop time in seconds. */
  tStop: number;
}

export type NgspiceAnalysis = OpAnalysis | DcAnalysis | AcAnalysis | TranAnalysis;

export interface NgspiceRunParams {
  /** Base netlist, workspace-relative (e.g. "circuits/rc.cir"). */
  netlistRelPath: string;
  analysis: NgspiceAnalysis;
  /**
   * Vectors to record for sweep analyses, e.g. ["v(out)", "i(V1)"].
   * Ignored for the operating point, which records all node voltages.
   */
  vectors: string[];
}
