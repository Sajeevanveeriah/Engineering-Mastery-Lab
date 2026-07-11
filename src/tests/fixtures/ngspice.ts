// Captured/representative ngspice outputs used as test fixtures so the
// adapter is verifiable on machines without ngspice installed.

export const VERSION_OUTPUT = `******
** ngspice-44 : Circuit level simulation program
** Compiled with GNU C compiler
** Please get your ngspice manual from https://ngspice.sourceforge.io/docs.html
******
`;

/** wrdata output: tran, wr_vecnames + wr_singlescale, one vector. */
export const TRAN_WRDATA = `time v(out)
 0.000000e+00  0.000000e+00
 1.000000e-04  9.516258e-01
 2.000000e-04  1.812692e+00
 3.000000e-04  2.591818e+00
 4.000000e-04  3.296800e+00
 5.000000e-04  3.934693e+00
`;

/** wrdata output: ac, magnitude and phase columns. */
export const AC_WRDATA = `frequency mag(v(out)) ph(v(out))
 1.000000e+01  9.999951e-01 -3.141553e-03
 1.000000e+02  9.995086e-01 -3.138034e-02
 1.000000e+03  9.534626e-01 -3.046314e-01
 1.000000e+04  1.572639e-01 -1.412911e+00
 1.000000e+05  1.591541e-02 -1.554875e+00
`;

/** wrdata output without a header line (wr_vecnames unset). */
export const DC_WRDATA_NO_HEADER = ` 0.000000e+00  0.000000e+00
 1.000000e+00  6.666667e-01
 2.000000e+00  1.333333e+00
 3.000000e+00  2.000000e+00
`;

export const MALFORMED_WRDATA = `time v(out)
 0.000000e+00  0.000000e+00
 1.000000e-04  not-a-number
`;

/** stdout of an operating-point run with `print all`. */
export const OP_STDOUT = `
Note: No compatibility mode selected!

Circuit: * voltage divider

Doing analysis at TEMP = 27.000000 and TNOM = 27.000000

No. of Data Rows : 1
v(in) = 5.000000e+00
v(out) = 3.333333e+00
v1#branch = -1.666667e-03

ngspice-44 done
`;

/** stderr of a run that failed on a bad netlist. */
export const ERROR_STDERR = `Error: unknown subckt: xu1 in out opamp
Error: there aren't any circuits loaded.
`;
