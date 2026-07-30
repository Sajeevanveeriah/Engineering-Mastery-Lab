import type { AcademyLessonTeachingProfileRegistry } from "../lessonTeachingProfileValidation";

export const academyLessonTeachingProfilesE2 = {
  "EML-E2-D09-L01": {
    systemModel: "Material selection matches functional loads and environment to stiffness, strength, density, temperature capability, degradation, process route and the quality of supporting property data.",
    failurePattern: "Choosing the strongest catalogue material can increase mass, corrosion risk, manufacturing difficulty or variability while failing the actual service condition.",
    visualExplanation: "A property-selection chart and requirement filter narrow candidate materials by performance index, environment, process compatibility and evidence confidence.",
    applicationTask: "Compare three candidate materials for a mobile-robot bracket, rank their governing properties and reject any option that violates environment or manufacturing constraints."
  },
  "EML-E2-D09-L02": {
    systemModel: "Stress relates internal force to area, strain measures relative deformation and a failure criterion compares the resulting stress state with material evidence.",
    failurePattern: "Using nominal area after yielding or comparing a multiaxial state with a single tensile limit can understate the likelihood of failure.",
    visualExplanation: "A loaded specimen links external force to internal stress distribution, stress-strain response and a failure envelope for the combined state.",
    applicationTask: "Calculate stress and strain for a loaded member, state the area and material assumptions and compare the result with an appropriate failure boundary."
  },
  "EML-E2-D09-L03": {
    systemModel: "Beams carry shear and bending, shafts transmit torque and fasteners establish clamping forces, all within a load path set by supports and interfaces.",
    failurePattern: "Sizing each element from one peak load can miss stress concentration, joint separation, combined loading or a support reaction that redirects the load.",
    visualExplanation: "A structural load path traces reactions through a beam, shaft and bolted joint, with shear, moment, torque and clamp-force diagrams aligned below.",
    applicationTask: "Trace a gearbox support load through beam, shaft and fasteners, identify the governing section and check one combined or joint-separation failure case."
  },
  "EML-E2-D09-L04": {
    systemModel: "Bearings support constrained relative motion, gears change torque and speed, and belts or chains transmit motion through distinct contact, alignment and maintenance mechanisms.",
    failurePattern: "A transmission selected only by ratio or static rating can fail through bearing misalignment, tooth contact, belt slip, chain wear or inadequate lubrication.",
    visualExplanation: "A drivetrain schematic follows shaft reactions and power through bearings and alternative gear, belt or chain paths, marking contact and alignment sensitivities.",
    applicationTask: "Choose a transmission and bearing arrangement for a bounded motor duty, then check ratio, reactions, alignment, lubrication and service access."
  },
  "EML-E2-D09-L05": {
    systemModel: "Springs store recoverable energy, couplings accommodate limited misalignment and linkages transform motion according to geometry and constraint.",
    failurePattern: "A mechanism can reach its nominal position yet bind, exceed spring travel or impose coupling misalignment outside the permitted envelope.",
    visualExplanation: "A motion sequence overlays linkage positions, spring force-displacement behaviour and coupling offsets across the complete operating range.",
    applicationTask: "Model a spring-loaded linkage through its travel, identify toggle or interference regions and verify force and misalignment at both end positions."
  },
  "EML-E2-D09-L06": {
    systemModel: "Machine design reconciles duty cycle, power flow, transmission ratio, efficiency, contact, lubrication, tolerance and service life across interacting elements.",
    failurePattern: "Optimising a single component rating can move loss, heat, wear or overload into another interface and reduce system life despite an apparent safety margin.",
    visualExplanation: "A duty-to-life diagram maps operating points through transmission losses, contact loads, lubricant regime, temperature and candidate wear mechanisms.",
    applicationTask: "Evaluate a small drivetrain over its duty cycle, account for losses and thermal limits and test sensitivity to one uncertain load or friction input."
  },
  "EML-E2-D09-L07": {
    systemModel: "Mechanical safety controls hazardous energy, while inspection and maintenance convert observable wear, looseness, damage and performance drift into timely intervention decisions.",
    failurePattern: "A fixed service interval can miss rapid degradation or cause needless work when no failure mechanism, inspection method or rejection criterion supports it.",
    visualExplanation: "A hazard and degradation chain connects stored or moving energy to controls, inspection locations, condition indicators, thresholds and safe maintenance state.",
    applicationTask: "Create an inspection plan for a robot drivetrain, identify hazardous-energy isolation, observable degradation and an evidence-based accept, repair or replace criterion."
  },
  "EML-E2-D10-L01": {
    systemModel: "Manufacturing process selection maps material, geometry, tolerance, surface, quantity and lead time to a feasible process window and verification route.",
    failurePattern: "Selecting a process from shape alone can ignore tooling access, achievable tolerance, material condition or production volume and make the design uneconomic or unverifiable.",
    visualExplanation: "A process-capability matrix crosses part requirements with candidate methods, then highlights disqualifying limits, secondary operations and inspection needs.",
    applicationTask: "Screen machining, forming, casting and additive routes for one component, document exclusions and justify the retained process against measurable requirements."
  },
  "EML-E2-D10-L02": {
    systemModel: "Machining removes material through a cutting tool whose speed, feed, engagement, geometry, workholding and thermal behaviour determine capability and tool life.",
    failurePattern: "Aggressive cutting values or weak fixturing can produce chatter, deflection, heat and dimensional error even when the nominal tool path is correct.",
    visualExplanation: "A machining diagram links spindle speed, feed per tooth, chip formation, cutting forces, fixture reactions, heat and the resulting surface.",
    applicationTask: "Plan a simple milling or turning operation, select defensible cutting conditions and identify how workholding and tool wear will be checked."
  },
  "EML-E2-D10-L03": {
    systemModel: "Sheet-metal fabrication transforms a flat pattern through cuts and bends governed by thickness, bend radius, allowance, grain direction and tooling access.",
    failurePattern: "Ignoring bend deduction, springback or edge distance can shift finished holes, crack a bend or make the part impossible to form with available tools.",
    visualExplanation: "A flat pattern folds into the finished part while bend lines, neutral axis, allowance, reliefs, grain and tool-clearance envelopes remain linked.",
    applicationTask: "Develop a flat pattern for a bent bracket, calculate bend allowance and verify hole location, relief and tooling access after forming."
  },
  "EML-E2-D10-L04": {
    systemModel: "Casting fills a mould and polymer or composite moulding shapes material through a controlled flow, solidification or cure cycle around a parting strategy.",
    failurePattern: "Poor draft, uneven section, trapped gas, shrinkage or misplaced gating can create porosity, warpage, incomplete fill or damage during ejection.",
    visualExplanation: "A mould cross-section shows parting line, draft, gate, flow front, vents, cooling or cure, shrinkage zones and ejection direction.",
    applicationTask: "Redesign a small housing for casting or moulding, choose a parting direction and explain controls for fill, shrinkage, draft and inspection."
  },
  "EML-E2-D10-L05": {
    systemModel: "Additive manufacturing builds geometry in layers, coupling material, orientation, support, thermal history, anisotropy, surface and post-processing.",
    failurePattern: "A printable-looking model can distort, delaminate or lose critical accuracy when orientation and support place weak layers or rough surfaces on functional features.",
    visualExplanation: "The same part is shown in alternative build orientations with layer direction, support volume, thermal concentration, surface quality and post-processing access.",
    applicationTask: "Orient a functional bracket for additive manufacture, justify supports and layer direction and define post-processing and inspection for critical interfaces."
  },
  "EML-E2-D10-L06": {
    systemModel: "Design for manufacture and assembly reduces operations, handling, ambiguity and tolerance sensitivity while preserving function, service and verification.",
    failurePattern: "Part consolidation or fastener reduction can backfire when it blocks maintenance, forces complex tooling or couples unrelated tolerances into one expensive component.",
    visualExplanation: "An assembly sequence compares original and revised designs through part count, handling direction, tool access, locating features and tolerance chains.",
    applicationTask: "Review a multi-part mount, remove one unnecessary operation or ambiguity and verify that assembly access, serviceability and functional tolerances remain acceptable."
  },
  "EML-E2-D10-L07": {
    systemModel: "Quality evidence compares manufactured output with specification, while lifecycle analysis extends the boundary to material, energy, maintenance, repair, reuse and end of life.",
    failurePattern: "A low scrap rate can conceal measurement incapability or shift environmental burden into energy use, replacement frequency or unrecoverable material.",
    visualExplanation: "A lifecycle loop connects process inputs, measured quality, in-service maintenance, repair, reuse and disposal, with evidence and uncertainty at each stage.",
    applicationTask: "Define a quality check and lifecycle comparison for two production routes, including measurement capability, expected maintenance and recoverable material."
  },
  "EML-E2-D11-L01": {
    systemModel: "Electrical charge moves under potential difference through resistive paths, producing current and transferring energy at a power rate set by circuit conditions.",
    failurePattern: "Confusing voltage with current or applying a component's resistance outside its thermal range can misstate both operating point and dissipated power.",
    visualExplanation: "A source and resistor circuit aligns charge flow, voltage drop, current direction, resistance and power transfer with a common passive sign convention.",
    applicationTask: "Analyse a low-voltage load at two supply values, calculate current and power and check the result against component and source ratings."
  },
  "EML-E2-D11-L02": {
    systemModel: "Kirchhoff current law conserves charge at nodes and Kirchhoff voltage law conserves energy around loops under one consistent branch-direction convention.",
    failurePattern: "Changing sign conventions mid-solution or merging distinct nodes produces equations that solve numerically but do not satisfy the original network.",
    visualExplanation: "A branched circuit labels node currents and loop voltage polarities, then places each conservation equation beside the path from which it was formed.",
    applicationTask: "Write and solve node or loop equations for a two-loop network, then substitute the branch results back into every conservation balance."
  },
  "EML-E2-D11-L03": {
    systemModel: "Capacitors and inductors store electric and magnetic energy, causing AC voltage-current magnitude and phase to vary with frequency through complex impedance.",
    failurePattern: "Using DC resistance alone can miss resonance, phase shift, transient current or a reactive component rating exceeded at the operating frequency.",
    visualExplanation: "Frequency plots connect capacitor and inductor impedance, phasor angle, stored energy exchange and the resulting circuit response across frequency.",
    applicationTask: "Analyse a simple RC or RLC response at selected frequencies, predict phase and magnitude trends and verify one point independently."
  },
  "EML-E2-D11-L04": {
    systemModel: "Diodes provide directional conduction and transistors control current through a smaller input, enabling rectification, switching and amplification within finite device regions.",
    failurePattern: "An ideal switch model can hide forward drop, leakage, switching loss, drive limits or unsafe voltage and current stress.",
    visualExplanation: "Device characteristic curves are linked to a rectifier and transistor switch, with cutoff, active, saturation and rated-limit regions distinguished.",
    applicationTask: "Design or inspect a transistor-driven load with protection, calculate its operating points and test whether drive, dissipation and transient limits are respected."
  },
  "EML-E2-D11-L05": {
    systemModel: "An operational amplifier uses high open-loop gain with feedback to establish a bounded closed-loop relation when supply, bandwidth, input and output limits permit.",
    failurePattern: "Applying ideal virtual-short rules during saturation, common-mode violation or insufficient bandwidth can predict an output the device cannot produce.",
    visualExplanation: "A feedback amplifier diagram links input difference, open-loop response, feedback network, closed-loop gain and clipped or bandwidth-limited output regions.",
    applicationTask: "Analyse a sensor-conditioning amplifier, predict gain and output range and check supply, common-mode, loading and bandwidth constraints."
  },
  "EML-E2-D11-L06": {
    systemModel: "Combinational logic maps current inputs directly to outputs, while sequential logic stores state and changes it under clock, reset and timing conditions.",
    failurePattern: "A truth table alone cannot protect a sequential circuit from missing reset behaviour, invalid states, setup violations or asynchronous input changes.",
    visualExplanation: "A logic network and state register share a timing diagram that marks input transitions, clock edges, propagation delay, reset and resulting outputs.",
    applicationTask: "Specify a small interlock with combinational guards and remembered state, then test reset, invalid input combinations and timing near a clock edge."
  },
  "EML-E2-D11-L07": {
    systemModel: "Power sources, storage, converters and drives route energy through PCB current paths, protection devices and thermal paths from supply to load and fault return.",
    failurePattern: "A nominally adequate supply can fail through battery sag, switch loss, poor return layout, inadequate fault clearing or accumulated component heat.",
    visualExplanation: "An energy and fault-path map follows battery, regulator, switching stage, motor load, ground return, protection and heat flow across the PCB.",
    applicationTask: "Review a motor-power channel at startup and fault, estimate source and device stress and identify the protection, grounding and thermal evidence required."
  },
  "EML-E2-D12-L01": {
    systemModel: "A sensor converts a measurand through a physical transduction mechanism whose sensitivity, range, bandwidth, loading and environmental response limit the observation.",
    failurePattern: "A sensor with the right nominal range can still distort the system through loading, cross-sensitivity, saturation, slow response or an unsuitable mounting condition.",
    visualExplanation: "A transduction diagram links physical input, sensing element, transfer characteristic, cross-sensitive variables, dynamic response and electrical output.",
    applicationTask: "Compare two sensor principles for one measurand, identify their dominant limits and design a test for loading or environmental cross-sensitivity."
  },
  "EML-E2-D12-L02": {
    systemModel: "An instrumentation chain maps a measurand through transducer, conditioning, conversion and calibration into an engineering value with propagated uncertainty.",
    failurePattern: "A calibrated final number can be misleading when an intermediate stage clips, changes reference, drifts or uses coefficients from different conditions.",
    visualExplanation: "A signal chain carries units, gain, offset, range and uncertainty through every conversion from physical quantity to stored engineering value.",
    applicationTask: "Trace one measurement channel end to end, calculate its calibration mapping and identify which stage dominates residual error or uncertainty."
  },
  "EML-E2-D12-L03": {
    systemModel: "Signal conditioning protects, shifts, scales, filters or linearises a sensor output so the converter receives informative values inside its electrical limits.",
    failurePattern: "Excess gain can clip peaks, poor bias can waste converter range and an unsuitable filter can remove the event the measurement was intended to capture.",
    visualExplanation: "Input and conditioned waveforms pass through protection, offset, gain and filter blocks, with headroom and bandwidth shown against converter limits.",
    applicationTask: "Design a conditioning path for a bounded sensor signal, allocate gain and offset and verify clipping margin, noise response and required bandwidth."
  },
  "EML-E2-D12-L04": {
    systemModel: "An ADC quantises a sampled analogue range into codes and a DAC reconstructs commanded levels, with reference, resolution, sampling and settling setting achievable fidelity.",
    failurePattern: "Counting nominal bits as accuracy ignores reference error, missing codes, quantisation, aliasing and settling before the next sample or output use.",
    visualExplanation: "A continuous input crosses quantisation thresholds into discrete codes, then a staircase DAC output approaches each commanded level within a settling envelope.",
    applicationTask: "Map several voltages to ADC codes and back through a DAC model, then evaluate quantisation, endpoint and settling effects on the intended decision."
  },
  "EML-E2-D12-L05": {
    systemModel: "Grounding defines reference and return paths, shielding intercepts coupled fields and electromagnetic compatibility controls both emissions and susceptibility through current geometry.",
    failurePattern: "Adding a shield without a return-path strategy can create loops or leave high-frequency currents crossing sensitive references and corrupt measurements.",
    visualExplanation: "A cable and enclosure cross-section traces wanted signal current, return current, electric and magnetic coupling paths, shield termination and chassis reference.",
    applicationTask: "Inspect a noisy sensor installation, sketch its current-return and coupling paths and propose one grounding or shielding change with a measurable verification."
  },
  "EML-E2-D12-L06": {
    systemModel: "A multimeter measures selected scalar quantities, an oscilloscope resolves voltage over time and a logic analyser reconstructs digital timing and protocol states.",
    failurePattern: "An instrument can alter or misrepresent the circuit through probe loading, bandwidth, reference connection, trigger setup or an unsuitable sampling rate.",
    visualExplanation: "Three instrument views compare scalar reading, analogue waveform and decoded digital timing, with probe impedance and connection points marked on the circuit.",
    applicationTask: "Choose an instrument and probe setup for a power rail, PWM signal and serial bus, then state the loading and timing limits of each observation."
  },
  "EML-E2-D12-L07": {
    systemModel: "A data-acquisition system coordinates sensing range, conditioning, sampling, timestamps, calibration, quality flags and storage so downstream analysis can trust provenance.",
    failurePattern: "Clean stored samples can hide clock drift, dropped data, stale calibration, channel mismatch or clipping when acquisition metadata and fault flags are absent.",
    visualExplanation: "A logger timeline aligns multiple channels with trigger, sample clock, calibration version, quality flags, storage batches and detected gaps.",
    applicationTask: "Specify a calibrated sensor logger, exercise nominal and injected-fault inputs and retain raw samples, timestamps, metadata and channel-quality evidence."
  },
  "EML-E2-D13-L01": {
    systemModel: "A microcontroller integrates a processor, addressable memory, buses and peripherals whose control and status registers connect firmware instructions to hardware state.",
    failurePattern: "Writing a register with the wrong width, reserved-bit value or clock state can silently misconfigure a peripheral or disturb unrelated hardware.",
    visualExplanation: "A memory map connects processor load and store operations through a bus to peripheral registers, with individual control, status and reserved bits labelled.",
    applicationTask: "Trace a documented peripheral setup from clock enable through register fields to an observable pin or flag, checking every mask and reset value."
  },
  "EML-E2-D13-L02": {
    systemModel: "GPIO couples software state to electrical pins through direction, output driver, input threshold, pull network and reset configuration.",
    failurePattern: "A pin configured by software can still damage hardware or enter an unsafe state when voltage level, current limit, contention, floating input or reset behaviour is ignored.",
    visualExplanation: "A GPIO cell shows input buffer, output driver, pull resistor, register bits, external load and the electrical state during reset and active operation.",
    applicationTask: "Design a safe digital interface for a switch and actuator command, calculate current where needed and test startup, bounce, disconnect and conflicting-drive cases."
  },
  "EML-E2-D13-L03": {
    systemModel: "Interrupts respond to asynchronous events, timers count clock intervals and PWM encodes command through duty cycle, all under bounded latency and priority.",
    failurePattern: "Long interrupt work, uncleared flags or unsuitable timer resolution can miss events, jitter PWM edges or starve lower-priority processing.",
    visualExplanation: "A timing lane aligns hardware event, interrupt request, service latency, timer count, PWM edges and return to foreground execution.",
    applicationTask: "Configure or model a periodic PWM update, measure interrupt latency and verify duty, frequency and missed-event behaviour under a competing event."
  },
  "EML-E2-D13-L04": {
    systemModel: "ADC and DAC peripherals exchange analogue levels with digital codes, while DMA moves sample blocks between peripherals and memory under explicit buffer ownership.",
    failurePattern: "A DMA transfer can expose partial or overwritten data when completion, alignment, cache visibility or buffer handoff is assumed rather than signalled.",
    visualExplanation: "A sample path connects analogue input, ADC, DMA controller, alternating memory buffers, processing task and DAC output with ownership states.",
    applicationTask: "Specify a double-buffered acquisition cycle, identify every ownership transition and test overrun, incomplete transfer and endpoint-code cases."
  },
  "EML-E2-D13-L05": {
    systemModel: "Embedded C and C++ express hardware behaviour through fixed-width values, volatile access, bounded storage, object lifetime and explicit error paths.",
    failurePattern: "Integer overflow, undefined shift, unchecked buffer access or dynamic lifetime error can change firmware behaviour only at boundary inputs or optimisation levels.",
    visualExplanation: "A firmware data path annotates types, widths, storage duration, volatile register boundaries and checks before values reach hardware.",
    applicationTask: "Review a small embedded calculation and register update, test numeric and buffer boundaries and replace any implementation-defined or unchecked operation."
  },
  "EML-E2-D13-L06": {
    systemModel: "Real-time software is correct only when tasks meet deadlines, and an RTOS coordinates priorities, blocking, synchronisation and shared resources to make timing analysable.",
    failurePattern: "A low-priority task holding a shared resource can delay a critical task, while inconsistent lock order can deadlock an otherwise correct functional design.",
    visualExplanation: "A scheduling chart shows releases, execution, blocking, pre-emption, mutex ownership, deadline and a priority-inversion interval.",
    applicationTask: "Analyse a three-task schedule with one shared resource, identify worst blocking and test a synchronisation strategy against deadlines and deadlock."
  },
  "EML-E2-D13-L07": {
    systemModel: "Field firmware moves through reset, boot selection, power modes, update validation and runtime diagnostics, while hardware-in-the-loop equipment supplies controlled interfaces.",
    failurePattern: "An interrupted update, unsafe boot output or uninstrumented low-power transition can leave a device unrecoverable or active in an unintended state.",
    visualExplanation: "A lifecycle state diagram connects reset, bootloader, verified image, application, sleep, wake, fault recovery, debug trace and hardware-in-the-loop stimulus.",
    applicationTask: "Define a safe firmware update and recovery sequence, then design a hardware-in-the-loop test for power loss, invalid image and reset-state outputs."
  },
  "EML-E2-D14-L01": {
    systemModel: "Industrial I/O translates field voltage or current into isolated controller states, while relays and contactors switch actuator energy with defined de-energised behaviour.",
    failurePattern: "A logical off command may not create a safe physical state when contacts weld, leakage sustains a load or input common and isolation are wired incorrectly.",
    visualExplanation: "A field wiring diagram traces sensor current through isolation to controller input and follows output energy through relay, contactor, actuator and protective return.",
    applicationTask: "Specify one sensor and motor-starter channel, verify electrical conventions and test open circuit, welded contact and loss-of-control-power responses."
  },
  "EML-E2-D14-L02": {
    systemModel: "A PLC repeatedly samples inputs, executes ordered logic and updates outputs, using ladder logic for relay-style conditions and structured text for explicit algorithms.",
    failurePattern: "Assuming statements act continuously can hide one-scan delays, latched states or output conflicts created by multiple writes during the scan.",
    visualExplanation: "A scan-cycle timeline aligns input image, rung or statement execution, internal state changes, output image and physical output update.",
    applicationTask: "Implement or trace a start-stop interlock in ladder and structured text, then test scan order, reset, contradictory inputs and retained state."
  },
  "EML-E2-D14-L03": {
    systemModel: "Sequential automation defines named states, guarded transitions, timeouts, entry actions and recovery, while events trigger only authorised changes.",
    failurePattern: "A normal-only sequence can hang or jump unpredictably when an event arrives twice, arrives late or occurs during reset or fault recovery.",
    visualExplanation: "A guarded state chart includes nominal production, timeout, fault, manual reset and recovery paths with event acceptance shown per state.",
    applicationTask: "Model a pick-and-place sequence, enumerate unexpected event timing and prove every reachable state has a safe timeout or recovery transition."
  },
  "EML-E2-D14-L04": {
    systemModel: "SCADA gathers distributed state, an HMI presents authorised interaction, interlocks constrain operation and alarms direct timely response to abnormal conditions.",
    failurePattern: "An alarm flood, stale display or bypassed interlock can make operators act on incomplete state even when each field signal is individually valid.",
    visualExplanation: "A supervisory path links field value and quality through controller, interlock and alarm logic to HMI indication, acknowledgement and operator action.",
    applicationTask: "Design an abnormal-condition scenario, verify interlock behaviour and create a prioritised alarm response that exposes stale data and bypass status."
  },
  "EML-E2-D14-L05": {
    systemModel: "UART serialises point-to-point bytes, SPI clocks full-duplex peripheral transfers, I2C addresses shared-bus devices and CAN arbitrates robust multi-node frames.",
    failurePattern: "Matching connectors or nominal bit rates do not ensure communication when voltage levels, clock phase, addressing, termination or error recovery differ.",
    visualExplanation: "Four bus timing and topology panels compare wires, framing, clock ownership, addressing, arbitration, termination and fault detection.",
    applicationTask: "Select a bus for several sensors and one actuator controller, justify electrical and timing choices and diagnose an injected framing or termination fault."
  },
  "EML-E2-D14-L06": {
    systemModel: "Modbus exchanges addressed data items, MQTT publishes topic messages through a broker and OPC UA exposes typed information models with quality and security context.",
    failurePattern: "Successful transport can still carry the wrong engineering meaning when register scaling, topic semantics, timestamps, quality or authorisation are unspecified.",
    visualExplanation: "A protocol comparison maps physical value to Modbus register, MQTT payload and OPC UA node while retaining type, unit, quality, timestamp and access control.",
    applicationTask: "Represent one motor-temperature value in all three protocols, define its semantics and test stale, malformed and unauthorised update handling."
  },
  "EML-E2-D14-L07": {
    systemModel: "Ethernet frames and TCP/IP endpoints move network traffic, DDS distributes typed real-time data and commissioning verifies the complete architecture under operational conditions.",
    failurePattern: "A bench connection can fail in service through addressing conflict, latency, packet loss, incompatible DDS policy or an untested network recovery path.",
    visualExplanation: "A commissioned network map overlays physical links, addresses, transport sessions, DDS participants, timing budgets, monitoring and fault-isolation points.",
    applicationTask: "Plan end-to-end commissioning for a controller and robot network, measure timing and exercise link loss, restart and incompatible-policy scenarios."
  },
  "EML-E2-D15-L01": {
    systemModel: "A signal carries variation of a physical quantity, and a system transforms that information according to causality, memory, linearity, time dependence and finite limits.",
    failurePattern: "Calling a transformation linear or memoryless from one trace can overlook saturation, hysteresis, delay or dependence on prior input.",
    visualExplanation: "An input waveform passes through contrasting static, dynamic, linear and saturating systems, with each output revealing the defining property.",
    applicationTask: "Classify a measured or simulated sensor-processing block for causality, memory and linearity using discriminating input pairs and retained outputs."
  },
  "EML-E2-D15-L02": {
    systemModel: "Continuous-time signals exist at every instant, discrete-time sequences exist at sample indices and digital signals additionally quantise amplitude into finite representations.",
    failurePattern: "Treating a sampled sequence as the original continuous waveform hides timing between samples, while treating digital codes as exact values hides quantisation.",
    visualExplanation: "One physical waveform is shown as a continuous curve, sampled stems and quantised digital codes aligned on a common time axis.",
    applicationTask: "Convert a bounded analogue waveform into sampled and quantised representations, then identify which timing and amplitude information each step removes."
  },
  "EML-E2-D15-L03": {
    systemModel: "Sampling records a continuous signal at intervals, reconstruction estimates values between samples and aliasing makes distinct frequencies share the same discrete sequence.",
    failurePattern: "A smooth reconstructed plot can represent the wrong frequency when sample rate, input bandwidth or anti-alias filtering is not controlled.",
    visualExplanation: "Two different sinusoids pass through identical sample points, beside spectra that fold above the sampling boundary into a lower apparent frequency.",
    applicationTask: "Sample a known sinusoid at several rates, predict and observe alias frequencies and choose an anti-alias condition for the intended bandwidth."
  },
  "EML-E2-D15-L04": {
    systemModel: "A filter shapes signal magnitude and phase across frequency while also creating transient behaviour determined by order, coefficients and implementation.",
    failurePattern: "A filter that suppresses visible noise can delay or distort the event of interest, become unstable numerically or attenuate required bandwidth.",
    visualExplanation: "Time-domain pulse responses sit beside magnitude and phase curves for low-pass, high-pass and finite digital implementations.",
    applicationTask: "Compare two filters on a noisy event signal, quantify attenuation and delay and select the option that preserves the decision-relevant feature."
  },
  "EML-E2-D15-L05": {
    systemModel: "Fourier analysis represents a finite signal as weighted frequency components, exposing periodic structure, bandwidth, harmonics and the effects of observation windows.",
    failurePattern: "A spectral peak can be misread when leakage, record length, amplitude scaling or nonstationary behaviour is ignored.",
    visualExplanation: "A finite time record and its windowed alternatives map to spectra with labelled resolution, main lobes, leakage and harmonic components.",
    applicationTask: "Compute or inspect spectra for a vibration record under two windows, identify a stable component and explain which features are artefacts of the record."
  },
  "EML-E2-D15-L06": {
    systemModel: "A transfer function relates input to output under linear dynamic assumptions, a block diagram exposes interconnection and state space represents internal evolution.",
    failurePattern: "Algebraically equivalent input-output models can hide uncontrollable or unobservable internal behaviour, and block reduction can lose signal meaning when connections are misread.",
    visualExplanation: "A dynamic plant is represented in parallel by differential equation, transfer block and state variables, with common input and output highlighted.",
    applicationTask: "Convert a simple first-order model among differential, transfer and state-space forms and verify the same step response and physical units."
  },
  "EML-E2-D15-L07": {
    systemModel: "System identification estimates model parameters from designed excitation and measured response, with noise and acquisition choices determining what dynamics are observable.",
    failurePattern: "A fitted model can reproduce training data yet be nonphysical or unidentifiable when excitation lacks bandwidth, sensors saturate or noise is correlated with input.",
    visualExplanation: "An excitation passes through unknown plant and acquisition chain to a parameter fit, residual analysis and independent validation record.",
    applicationTask: "Design an excitation for a first-order plant, fit a parameter from noisy data and validate residuals on a separate input without reusing the fit record."
  },
  "EML-E2-D16-L01": {
    systemModel: "A physical dynamic model selects states, inputs, parameters, conservation laws and constitutive relations to describe how a plant evolves under stated simplifications.",
    failurePattern: "A model can fit one trajectory while its omitted storage, nonlinear loss or parameter dependence makes predictions fail under a changed input.",
    visualExplanation: "A physical boundary maps energy storage and flow to state variables and differential equations, with omitted effects listed outside the model boundary.",
    applicationTask: "Derive a low-order thermal or motor model, justify each state and simplification and test its prediction under a second operating condition."
  },
  "EML-E2-D16-L02": {
    systemModel: "Feedback compares measured output with reference, transforms error into actuator command and shapes rise, overshoot, settling and steady-state error through the closed loop.",
    failurePattern: "Improving one transient metric can increase actuator demand, overshoot or noise sensitivity, and an attractive nominal response may hide a persistent offset.",
    visualExplanation: "A closed-loop block diagram is aligned with a response plot marking reference, error, rise, overshoot, settling, steady-state offset and control effort.",
    applicationTask: "Compare two feedback gains on the same plant, measure transient and steady-state criteria and reject any case that violates actuator limits."
  },
  "EML-E2-D16-L03": {
    systemModel: "Closed-loop stability describes whether deviations remain bounded or decay for a stated model and operating region, rather than whether one simulation appears calm.",
    failurePattern: "A short response can conceal slow divergence, marginal oscillation or instability triggered by delay, saturation or parameter change.",
    visualExplanation: "Several trajectories from different initial conditions and parameters show convergent, sustained and divergent behaviour beside pole or energy interpretations.",
    applicationTask: "Challenge a feedback model with changed initial state, gain and delay, then classify stability evidence without generalising beyond the tested boundary."
  },
  "EML-E2-D16-L04": {
    systemModel: "A PID controller combines proportional response to present error, integral response to accumulated error and derivative response to error trend.",
    failurePattern: "Increasing gains without considering noise, saturation and interaction can create oscillation, derivative spikes or integral windup.",
    visualExplanation: "Separate proportional, integral and derivative contributions are plotted against error and summed into a bounded actuator command during a reference change.",
    applicationTask: "Tune a PID-controlled plant from a baseline, change one term at a time and compare tracking, disturbance rejection, noise and effort."
  },
  "EML-E2-D16-L05": {
    systemModel: "Frequency response describes closed-loop gain and phase versus sinusoidal frequency, supporting bandwidth, resonance and robustness reasoning under model uncertainty.",
    failurePattern: "High bandwidth can amplify noise or erode phase margin, while a nominally stable model may become fragile when unmodelled delay is introduced.",
    visualExplanation: "Magnitude and phase curves mark crossover, resonance, bandwidth and stability margins, with an uncertainty envelope approaching the critical boundary.",
    applicationTask: "Compare two controller frequency responses, identify bandwidth and margin changes and predict a disturbance or noise frequency that exposes the trade-off."
  },
  "EML-E2-D16-L06": {
    systemModel: "Digital control samples state, estimates unmeasured variables and computes motor-drive commands through finite timing, quantisation and switched actuation.",
    failurePattern: "A continuous design can degrade when sample delay, estimator mismatch, quantisation or drive saturation changes the effective loop dynamics.",
    visualExplanation: "A sampled control loop aligns sensor conversion, estimator update, controller calculation, PWM drive and motor response on a discrete timeline.",
    applicationTask: "Choose a control sample interval, simulate or inspect one estimator-drive cycle and test delayed measurement, quantised feedback and actuator saturation."
  },
  "EML-E2-D16-L07": {
    systemModel: "Practical control uses identified plant behaviour while managing saturation, measurement noise and integral state so recovery remains bounded after constraints are hit.",
    failurePattern: "An integrator can continue accumulating during saturation, producing delayed recovery and overshoot even after the commanded reference becomes reachable.",
    visualExplanation: "A saturated actuator plot is paired with unconstrained and anti-windup integral states, showing their different recovery paths after the limit clears.",
    applicationTask: "Identify a simple plant response, drive the controller into saturation and compare recovery with and without an explicit anti-windup mechanism."
  },
} as const satisfies AcademyLessonTeachingProfileRegistry;

export default academyLessonTeachingProfilesE2;
