import {
  buildAcademyStageContent,
  type AcademyStageUnitSeed
} from "../authoring";
import { academyLessonTeachingProfilesE2 } from "../lessonTeachingProfiles/E2";

const e2Seeds = [
  {
    unitId: "EML-E2-D09",
    focuses: [
      "Engineering material selection compares stiffness, strength, density, temperature range, environment, process route, variability and evidence quality against the actual function.",
      "Stress describes internal force intensity, strain describes deformation relative to original size and failure criteria compare multi-axial loading with observed material limits.",
      "Beams carry bending and shear, shafts transmit torque and fasteners create controlled clamping; each requires a load path, boundary conditions and credible failure modes.",
      "Bearings support relative motion, gears transform torque and speed, and belts and chains transmit motion with different alignment, compliance, lubrication and maintenance needs.",
      "Springs store mechanical energy, couplings accommodate bounded misalignment and mechanisms or linkages transform constrained motion through geometry.",
      "Machine design reconciles duty, transmission ratio, power, losses, contact, lubrication, tolerance, safety margin and service access rather than sizing one element in isolation.",
      "Mechanical safety controls stored and moving energy, while inspection and maintenance use observable degradation, intervals and acceptance criteria to prevent hidden loss of function."
    ],
    formulaKeys: [null, "stress", "stress", "power", "spring", "power", null]
  },
  {
    unitId: "EML-E2-D10",
    focuses: [
      "Manufacturing process selection matches material, geometry, quantity, tolerance, surface, lead time and lifecycle needs to a process capability supported by evidence.",
      "Machining removes material through controlled relative motion; feeds, speeds, tool geometry, workholding and thermal effects influence time, finish, accuracy and tool life.",
      "Sheet-metal design accounts for bend radius, allowance, grain direction, springback, tooling access, edge distance and a practical flat pattern.",
      "Casting fills a mould with fluid material and moulding shapes polymers or composites, so draft, shrinkage, flow, porosity and parting strategy must be designed rather than discovered.",
      "Additive manufacturing builds layer by layer, enabling complex geometry while introducing orientation, support, anisotropy, surface and post-processing constraints.",
      "Design for manufacture and assembly reduces unnecessary operations, ambiguous orientation, inaccessible fasteners and tolerance sensitivity while preserving function and serviceability.",
      "Metrology and quality compare output with specification, while lifecycle and sustainability account for material, energy, repair, reuse and end-of-life consequences."
    ],
    formulaKeys: [null, "machiningSpeed", null, null, null, null, null]
  },
  {
    unitId: "EML-E2-D11",
    focuses: [
      "Charge is an electrical quantity, voltage is energy per charge, current is charge flow, resistance opposes current and electrical power is the rate of energy transfer.",
      "Kirchhoff current law conserves charge at a node and Kirchhoff voltage law conserves energy around a loop, allowing network equations to be solved with consistent signs.",
      "Capacitors store electric-field energy, inductors store magnetic-field energy and AC impedance combines magnitude and phase to describe frequency-dependent circuit behaviour.",
      "Diodes conduct asymmetrically and transistors use a smaller signal to control current, enabling rectification, switching and analogue amplification within rated limits.",
      "An operational amplifier drives its output to reduce input difference when negative feedback and supply limits permit, enabling gain, buffering, filtering and signal conditioning.",
      "Combinational logic depends on present inputs, while sequential logic retains state through clocks or feedback and therefore requires timing, reset and invalid-state reasoning.",
      "Power supplies and batteries source bounded energy, power electronics and drives switch it, PCB layout shapes current paths, and protection, grounding and thermal design contain faults."
    ],
    formulaKeys: ["ohm", "ohm", "rcCutoff", "diodeShockley", "linear", null, "power"]
  },
  {
    unitId: "EML-E2-D12",
    focuses: [
      "A sensor converts a physical quantity through a transduction mechanism whose sensitivity, range, bandwidth, loading and environmental cross-sensitivities limit the result.",
      "An instrumentation chain maps measurand to electrical signal, digital value and engineering unit, with calibration parameters and uncertainty attached to each conversion.",
      "Signal conditioning shifts, scales, filters, protects or linearises a sensor signal so the downstream converter receives a useful range without clipping or hidden distortion.",
      "An ADC maps a continuous input range to discrete codes and a DAC performs the reverse, so resolution, reference, quantisation, sampling and settling all bound accuracy.",
      "Grounding establishes reference paths, shielding intercepts coupled fields and electromagnetic compatibility controls emissions and susceptibility through geometry and current return.",
      "A multimeter measures scalar electrical quantities, an oscilloscope reveals voltage over time and a logic analyser decodes digital timing; probe loading and setup affect every observation.",
      "Data acquisition coordinates sensor range, conditioning, sampling, timestamping, calibration, quality flags and storage so later analysis can distinguish signal from acquisition failure."
    ],
    formulaKeys: ["linear", "linear", "linear", "adcResolution", null, null, "linear"]
  },
  {
    unitId: "EML-E2-D13",
    focuses: [
      "A microcontroller integrates processor, memory, buses and peripherals; memory maps expose registers whose documented bits configure and report hardware behaviour.",
      "GPIO connects firmware to digital pins, requiring electrical-level checks, direction, pull resistors, reset states, debounce and fault-safe output behaviour.",
      "Interrupts request bounded asynchronous service, timers count clock events and PWM represents average command through duty cycle; latency and priority determine missed deadlines.",
      "ADC and DAC connect analogue values, while direct memory access transfers data without per-sample processor intervention and therefore needs explicit ownership and completion handling.",
      "Embedded C and C++ map software closely to hardware, so integer width, volatile access, lifetime, allocation, bounds and error handling affect deterministic behaviour.",
      "Real-time behaviour means meeting timing constraints, while an RTOS schedules tasks and synchronisation; concurrency must prevent races, deadlocks and unbounded priority inversion.",
      "Power modes, bootloaders and updates govern field behaviour, debugging and instrumentation expose faults, and hardware-in-the-loop tests firmware against controlled real-time interfaces."
    ],
    formulaKeys: [null, "ohm", "pwmDuty", "adcResolution", null, "timing", null]
  },
  {
    unitId: "EML-E2-D14",
    focuses: [
      "Industrial inputs and outputs connect sensors and actuators through voltage, current and isolation conventions, while relays and contactors switch loads with explicit de-energised states.",
      "A PLC scans inputs, executes deterministic logic and updates outputs; ladder logic expresses relay-style conditions and structured text expresses algorithms and data handling.",
      "Sequential control defines states, transitions, guards, timeouts and recovery, while event-driven automation responds to changes without allowing ambiguous or unauthorised transitions.",
      "SCADA supervises distributed behaviour, an HMI communicates state and action, interlocks prevent prohibited operation and alarm management ensures abnormal conditions are actionable.",
      "UART, SPI and I2C connect local devices and CAN provides robust multi-node messaging; system context decides framing, arbitration, timing, error detection and recovery.",
      "Modbus exchanges registers, MQTT publishes named messages and OPC UA models interoperable information; each requires explicit addressing, semantics, quality and security boundaries.",
      "Ethernet and TCP/IP transport network data, DDS supports distributed real-time data exchange and commissioning proves end-to-end architecture under nominal and fault conditions."
    ],
    formulaKeys: ["ohm", "timing", "timing", null, "timing", "timing", "timing"]
  },
  {
    unitId: "EML-E2-D15",
    focuses: [
      "A signal is a quantity varying over an independent variable, and a system transforms signals according to stated causality, memory, linearity, time dependence and physical limits.",
      "Continuous signals are defined over continuous time, discrete signals at indexed samples and digital signals add finite numeric representation to the discrete sequence.",
      "Sampling measures a continuous signal at intervals, reconstruction estimates the original and aliasing occurs when distinct frequencies produce indistinguishable sampled sequences.",
      "A filter changes signal content by frequency or time behaviour; its passband, stopband, phase, order and transient response must match the measurement or control purpose.",
      "Fourier reasoning represents a signal as weighted frequency components, exposing periodic content, bandwidth, harmonics, noise and the cost of finite observation windows.",
      "A transfer function describes input-output dynamics under linear assumptions, a block diagram exposes signal flow and a state-space model tracks internal variables over time.",
      "System identification estimates model parameters from excitation and response, while noise characterisation and data-acquisition design determine whether those parameters are observable."
    ],
    formulaKeys: [null, null, "sampling", "rcCutoff", "fourier", "stateSpace", "linear"]
  },
  {
    unitId: "EML-E2-D16",
    focuses: [
      "A physical model selects states, inputs, parameters, conservation laws and constitutive relationships, then expresses their evolution with differential equations and stated simplifications.",
      "Feedback compares a measured output with a reference and acts on the error, shaping transient behaviour before settling and the steady-state difference that remains.",
      "Stability asks whether bounded disturbances and initial errors remain bounded or decay; simulation that looks calm for one case is not a general stability argument.",
      "PID control combines proportional response, integral accumulation and derivative damping, with each term affecting tracking, disturbance rejection, noise and actuator demand.",
      "Frequency response shows how gain and phase vary with sinusoidal frequency, supporting robustness reasoning about bandwidth, resonance, disturbance rejection and uncertainty.",
      "Digital control samples and computes commands, state estimation reconstructs unmeasured variables and motor drives convert control demand into switched voltage and current.",
      "Identification supports tuning, while saturation, noise and integral windup create practical behaviour that must be handled and verified instead of hidden by an ideal model."
    ],
    formulaKeys: ["firstOrderStep", "control", null, "pid", "transferMagnitude", "estimate", "pid"]
  }
] satisfies AcademyStageUnitSeed[];

export const academyStageE2 = buildAcademyStageContent(
  "E2",
  e2Seeds,
  academyLessonTeachingProfilesE2
);

export default academyStageE2;
