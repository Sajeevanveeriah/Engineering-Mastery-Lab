# RC Filter Study — Requirements

| Id | Requirement | Verification |
|---|---|---|
| REQ-001 | The low-pass filter cutoff frequency shall be 1.6 kHz ± 10%. | ngspice AC sweep of `circuits/rc-lowpass.cir` (`sim-ac-lowpass`): magnitude at fc within 3 dB of passband. |
| REQ-002 | The divider output shall be 3.33 V ± 1% with a 5 V supply. | ngspice operating point of `circuits/voltage-divider.cir` (`sim-op-divider`). |
| REQ-003 | RLC step ringing shall settle within 20 ms. | ngspice transient of `circuits/rlc-series.cir` (`sim-tran-rlc`). |
