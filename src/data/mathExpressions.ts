export interface ReviewedMathExpression {
  readonly id: string;
  readonly plainText: string;
  readonly tex: string;
  readonly screenReaderText: string;
}

function reviewed(
  id: string,
  plainText: string,
  tex: string,
  screenReaderText: string
): ReviewedMathExpression {
  return Object.freeze({ id, plainText, tex, screenReaderText });
}

function equation(
  id: string,
  plainText: string,
  tex: string,
  wording = `Equation: ${plainText}`
): ReviewedMathExpression {
  return reviewed(id, plainText, tex, wording);
}

function substitution(id: string, plainText: string, tex: string): ReviewedMathExpression {
  return reviewed(id, plainText, tex, `Worked substitution: ${plainText}`);
}

function dimensionalCheck(id: string, plainText: string, tex: string): ReviewedMathExpression {
  return reviewed(id, plainText, tex, `Dimensional check: ${plainText}`);
}

export const calculatorMathExpressions = Object.freeze({
  "beam-bending": equation(
    "calculator:beam-bending",
    "Mmax = PL/4, delta = PL^3/(48EI), I = bh^3/12",
    String.raw`\begin{aligned}M_{\max}&=\frac{PL}{4},&\delta&=\frac{PL^3}{48EI},&I&=\frac{bh^3}{12}\end{aligned}`,
    "Maximum moment equals P L over 4; deflection equals P L cubed over 48 E I; second moment of area equals b h cubed over 12."
  ),
  "shaft-torsion": equation(
    "calculator:shaft-torsion",
    "J = pi(do^4-di^4)/32, tau = T(do/2)/J, phi = TL/(JG)",
    String.raw`\begin{aligned}J&=\frac{\pi(d_o^4-d_i^4)}{32},&\tau&=\frac{T(d_o/2)}{J},&\phi&=\frac{TL}{JG}\end{aligned}`,
    "Polar second moment J equals pi times outer diameter to the fourth minus inner diameter to the fourth, over 32; shear stress tau equals torque times outer radius over J; twist phi equals T L over J G."
  ),
  "drive-sizing": equation(
    "calculator:drive-sizing",
    "F = ma + Crr mg cos(theta) + mg sin(theta), T = Fr/(G eta)",
    String.raw`\begin{aligned}F&=ma+C_{\mathrm{rr}}mg\cos\theta+mg\sin\theta,&T&=\frac{Fr}{G\eta}\end{aligned}`,
    "Tractive force equals m a plus rolling resistance coefficient times m g cosine theta plus m g sine theta; motor torque equals force times radius over gear ratio times efficiency."
  ),
  "pneumatic-cylinder": equation(
    "calculator:pneumatic-cylinder",
    "Fextend = p pi D^2/4, Fretract = p pi(D^2-d^2)/4",
    String.raw`\begin{aligned}F_{\mathrm{extend}}&=\frac{p\pi D^2}{4},&F_{\mathrm{retract}}&=\frac{p\pi(D^2-d^2)}{4}\end{aligned}`,
    "Extension force equals pressure times pi D squared over 4; retraction force equals pressure times pi times D squared minus d squared, over 4."
  ),
  "three-phase-power": equation(
    "calculator:three-phase-power",
    "S = sqrt(3)VLLI, P = S PF, Q = S sqrt(1-PF^2)",
    String.raw`\begin{aligned}S&=\sqrt{3}\,V_{\mathrm{LL}}I,&P&=S\,\mathrm{PF},&Q&=S\sqrt{1-\mathrm{PF}^2}\end{aligned}`,
    "Apparent power equals square root of 3 times line-to-line voltage times current; real power equals apparent power times power factor; reactive power equals apparent power times square root of 1 minus power factor squared."
  ),
  "conductor-drop": equation(
    "calculator:conductor-drop",
    "rhoT = rho20[1+alpha(T-20)], R = rhoT L/A, Vdrop = 2IR or sqrt(3)IR",
    String.raw`\begin{aligned}\rho_T&=\rho_{20}\!\left[1+\alpha(T-20)\right],&R&=\frac{\rho_TL}{A},&V_{\mathrm{drop}}&=2IR\ \text{or}\ \sqrt{3}\,IR\end{aligned}`,
    "Resistivity at temperature T equals resistivity at 20 degrees times 1 plus alpha times T minus 20; resistance equals resistivity times length over area; voltage drop equals 2 I R or square root of 3 I R."
  ),
  "linear-scaling": equation(
    "calculator:linear-scaling",
    "EU = EUmin + (signal-smin)(EUmax-EUmin)/(smax-smin)",
    String.raw`\mathrm{EU}=\mathrm{EU}_{\min}+\frac{(\mathrm{signal}-s_{\min})(\mathrm{EU}_{\max}-\mathrm{EU}_{\min})}{s_{\max}-s_{\min}}`,
    "Engineering unit value equals the minimum engineering value plus signal minus minimum signal, times engineering span, divided by signal span."
  ),
  "pipe-flow": equation(
    "calculator:pipe-flow",
    "Re = rho v D/mu, dp = f(L/D)rho v^2/2",
    String.raw`\begin{aligned}\mathrm{Re}&=\frac{\rho vD}{\mu},&\Delta p&=f\frac{L}{D}\frac{\rho v^2}{2}\end{aligned}`,
    "Reynolds number equals density times velocity times diameter over dynamic viscosity; pressure drop equals friction factor times length over diameter times density velocity squared over 2."
  ),
  "thermal-expansion": equation(
    "calculator:thermal-expansion",
    "deltaL = alpha L deltaT",
    String.raw`\Delta L=\alpha L\Delta T`,
    "Change in length equals thermal expansion coefficient times initial length times temperature change."
  ),
  "heat-conduction": equation(
    "calculator:heat-conduction",
    "Q = k A deltaT / L",
    String.raw`Q=\frac{kA\Delta T}{L}`,
    "Heat-transfer rate equals thermal conductivity times area times temperature difference over wall thickness."
  ),
  machining: equation(
    "calculator:machining",
    "rpm = 1000Vc/(piD), feed = rpm z fz",
    String.raw`\begin{aligned}\mathrm{rpm}&=\frac{1000V_c}{\pi D},&\mathrm{feed}&=\mathrm{rpm}\,z f_z\end{aligned}`,
    "Spindle speed in revolutions per minute equals 1000 times cutting speed over pi times cutter diameter; feed rate equals spindle speed times tooth count times feed per tooth."
  ),
  "robot-arm": equation(
    "calculator:robot-arm",
    "c2 = (x^2+y^2-L1^2-L2^2)/(2L1L2)",
    String.raw`c_2=\frac{x^2+y^2-L_1^2-L_2^2}{2L_1L_2}`,
    "Cosine of joint 2 equals x squared plus y squared minus link 1 squared minus link 2 squared, divided by 2 times link 1 times link 2."
  )
} satisfies Record<string, ReviewedMathExpression>);

export const masteryEquationMathExpressions = Object.freeze({
  "EML-E0-D01": equation(
    "mastery:EML-E0-D01:equation",
    "t_cycle = t_recall + t_lesson + t_build + t_close",
    String.raw`t_{\mathrm{cycle}}=t_{\mathrm{recall}}+t_{\mathrm{lesson}}+t_{\mathrm{build}}+t_{\mathrm{close}}`
  ),
  "EML-E0-D02": equation(
    "mastery:EML-E0-D02:equation",
    "e = x_measured - x_reference",
    String.raw`e=x_{\mathrm{measured}}-x_{\mathrm{reference}}`
  ),
  "EML-E0-D03": equation(
    "mastery:EML-E0-D03:equation",
    "|v| = sqrt(v_x^2 + v_y^2)",
    String.raw`\lVert\mathbf{v}\rVert=\sqrt{v_x^2+v_y^2}`
  ),
  "EML-E1-D04": equation(
    "mastery:EML-E1-D04:equation",
    "x_mean = (1/n) sum(x_i)",
    String.raw`x_{\mathrm{mean}}=\frac{1}{n}\sum x_i`
  ),
  "EML-E1-D05": equation(
    "mastery:EML-E1-D05:equation",
    "E_k = 0.5 m v^2",
    String.raw`E_k=\frac{1}{2}mv^2`
  ),
  "EML-E1-D06": equation(
    "mastery:EML-E1-D06:equation",
    "t_saved = t_manual - t_reproduced",
    String.raw`t_{\mathrm{saved}}=t_{\mathrm{manual}}-t_{\mathrm{reproduced}}`
  ),
  "EML-E1-D07": equation(
    "mastery:EML-E1-D07:equation",
    "B = n_samples x n_channels x bytes_per_sample",
    String.raw`B=n_{\mathrm{samples}}\times n_{\mathrm{channels}}\times\mathrm{bytes}_{\mathrm{per\,sample}}`
  ),
  "EML-E1-D08": equation(
    "mastery:EML-E1-D08:equation",
    "T = x_upper - x_lower",
    String.raw`T=x_{\mathrm{upper}}-x_{\mathrm{lower}}`
  ),
  "EML-E2-D09": equation(
    "mastery:EML-E2-D09:equation",
    "sigma = F / A",
    String.raw`\sigma=\frac{F}{A}`
  ),
  "EML-E2-D10": equation(
    "mastery:EML-E2-D10:equation",
    "Y = n_pass / n_total",
    String.raw`Y=\frac{n_{\mathrm{pass}}}{n_{\mathrm{total}}}`
  ),
  "EML-E2-D11": equation(
    "mastery:EML-E2-D11:equation",
    "I = V / R",
    String.raw`I=\frac{V}{R}`
  ),
  "EML-E2-D12": equation(
    "mastery:EML-E2-D12:equation",
    "S = delta_y / delta_x",
    String.raw`S=\frac{\Delta y}{\Delta x}`
  ),
  "EML-E2-D13": equation(
    "mastery:EML-E2-D13:equation",
    "T = 1 / f",
    String.raw`T=\frac{1}{f}`
  ),
  "EML-E2-D14": equation(
    "mastery:EML-E2-D14:equation",
    "t_tx = N_bits / R_bit",
    String.raw`t_{\mathrm{tx}}=\frac{N_{\mathrm{bits}}}{R_{\mathrm{bit}}}`
  ),
  "EML-E2-D15": equation(
    "mastery:EML-E2-D15:equation",
    "f_s > 2 f_max",
    String.raw`f_s>2f_{\max}`
  ),
  "EML-E2-D16": equation(
    "mastery:EML-E2-D16:equation",
    "u_P = K_p e",
    String.raw`u_P=K_p e`
  ),
  "EML-E3-D17": equation(
    "mastery:EML-E3-D17:equation",
    "v_wheel = r omega",
    String.raw`v_{\mathrm{wheel}}=r\omega`
  ),
  "EML-E3-D18": equation(
    "mastery:EML-E3-D18:equation",
    "L = t_receive - t_source",
    String.raw`L=t_{\mathrm{receive}}-t_{\mathrm{source}}`
  ),
  "EML-E3-D19": equation(
    "mastery:EML-E3-D19:equation",
    "var(a + b) = var(a) + var(b), for independent a and b",
    String.raw`\operatorname{var}(a+b)=\operatorname{var}(a)+\operatorname{var}(b),\quad a\perp b`
  ),
  "EML-E3-D20": equation(
    "mastery:EML-E3-D20:equation",
    "R_success = n_success / n_attempt",
    String.raw`R_{\mathrm{success}}=\frac{n_{\mathrm{success}}}{n_{\mathrm{attempt}}}`
  ),
  "EML-E3-D21": equation(
    "mastery:EML-E3-D21:equation",
    "u = f_x X / Z",
    String.raw`u=\frac{f_xX}{Z}`
  ),
  "EML-E3-D22": equation(
    "mastery:EML-E3-D22:equation",
    "precision = TP / (TP + FP)",
    String.raw`\mathrm{precision}=\frac{\mathrm{TP}}{\mathrm{TP}+\mathrm{FP}}`
  ),
  "EML-E3-D23": equation(
    "mastery:EML-E3-D23:equation",
    "L_total = L_capture + L_inference + L_action",
    String.raw`L_{\mathrm{total}}=L_{\mathrm{capture}}+L_{\mathrm{inference}}+L_{\mathrm{action}}`
  ),
  "EML-E4-D24": equation(
    "mastery:EML-E4-D24:equation",
    "RPN = S x O x D",
    String.raw`\mathrm{RPN}=S\times O\times D`
  ),
  "EML-E4-D25": equation(
    "mastery:EML-E4-D25:equation",
    "CV = EV - AC",
    String.raw`\mathrm{CV}=\mathrm{EV}-\mathrm{AC}`
  )
} satisfies Record<string, ReviewedMathExpression>);

export const masterySubstitutionMathExpressions = Object.freeze({
  "EML-E0-D01": substitution(
    "mastery:EML-E0-D01:substitution",
    "4 x 25 min",
    String.raw`4\times25\,\mathrm{min}`
  ),
  "EML-E0-D02": substitution(
    "mastery:EML-E0-D02:substitution",
    "10.02 mm - 10.00 mm",
    String.raw`10.02\,\mathrm{mm}-10.00\,\mathrm{mm}`
  ),
  "EML-E0-D03": substitution(
    "mastery:EML-E0-D03:substitution",
    "sqrt((3 m/s)^2 + (4 m/s)^2)",
    String.raw`\sqrt{\left(3\,\mathrm{m\,s^{-1}}\right)^2+\left(4\,\mathrm{m\,s^{-1}}\right)^2}`
  ),
  "EML-E1-D04": substitution(
    "mastery:EML-E1-D04:substitution",
    "(2 + 4 + 6) s / 3",
    String.raw`\frac{(2+4+6)\,\mathrm{s}}{3}`
  ),
  "EML-E1-D05": substitution(
    "mastery:EML-E1-D05:substitution",
    "0.5 x 2 kg x (3 m/s)^2",
    String.raw`\frac{1}{2}\times2\,\mathrm{kg}\times\left(3\,\mathrm{m\,s^{-1}}\right)^2`
  ),
  "EML-E1-D06": substitution(
    "mastery:EML-E1-D06:substitution",
    "420 s - 75 s",
    String.raw`420\,\mathrm{s}-75\,\mathrm{s}`
  ),
  "EML-E1-D07": substitution(
    "mastery:EML-E1-D07:substitution",
    "100 x 8 x 4 B",
    String.raw`100\times8\times4\,\mathrm{B}`
  ),
  "EML-E1-D08": substitution(
    "mastery:EML-E1-D08:substitution",
    "20.1 mm - 19.9 mm",
    String.raw`20.1\,\mathrm{mm}-19.9\,\mathrm{mm}`
  ),
  "EML-E2-D09": substitution(
    "mastery:EML-E2-D09:substitution",
    "1200 N / 0.0002 m^2",
    String.raw`\frac{1200\,\mathrm{N}}{0.0002\,\mathrm{m}^2}`
  ),
  "EML-E2-D10": substitution(
    "mastery:EML-E2-D10:substitution",
    "92 / 100",
    String.raw`\frac{92}{100}`
  ),
  "EML-E2-D11": substitution(
    "mastery:EML-E2-D11:substitution",
    "12 V / 6 ohm",
    String.raw`\frac{12\,\mathrm{V}}{6\,\Omega}`
  ),
  "EML-E2-D12": substitution(
    "mastery:EML-E2-D12:substitution",
    "4 V / 2 kPa",
    String.raw`\frac{4\,\mathrm{V}}{2\,\mathrm{kPa}}`
  ),
  "EML-E2-D13": substitution(
    "mastery:EML-E2-D13:substitution",
    "1 / 1000 Hz",
    String.raw`\frac{1}{1000\,\mathrm{Hz}}`
  ),
  "EML-E2-D14": substitution(
    "mastery:EML-E2-D14:substitution",
    "80 bit / 500000 bit/s",
    String.raw`\frac{80\,\mathrm{bit}}{500000\,\mathrm{bit\,s^{-1}}}`
  ),
  "EML-E2-D15": substitution(
    "mastery:EML-E2-D15:substitution",
    "2 x 120 Hz",
    String.raw`2\times120\,\mathrm{Hz}`
  ),
  "EML-E2-D16": substitution(
    "mastery:EML-E2-D16:substitution",
    "2.5 command/rad x 0.4 rad",
    String.raw`2.5\,\mathrm{command\,rad^{-1}}\times0.4\,\mathrm{rad}`
  ),
  "EML-E3-D17": substitution(
    "mastery:EML-E3-D17:substitution",
    "0.05 m x 10 rad/s",
    String.raw`0.05\,\mathrm{m}\times10\,\mathrm{rad\,s^{-1}}`
  ),
  "EML-E3-D18": substitution(
    "mastery:EML-E3-D18:substitution",
    "max(0.012, 0.018, 0.015) s",
    String.raw`\max(0.012,0.018,0.015)\,\mathrm{s}`
  ),
  "EML-E3-D19": substitution(
    "mastery:EML-E3-D19:substitution",
    "0.04 m^2 + 0.09 m^2",
    String.raw`0.04\,\mathrm{m}^2+0.09\,\mathrm{m}^2`
  ),
  "EML-E3-D20": substitution(
    "mastery:EML-E3-D20:substitution",
    "18 / 20",
    String.raw`\frac{18}{20}`
  ),
  "EML-E3-D21": substitution(
    "mastery:EML-E3-D21:substitution",
    "800 px x 0.2 m / 2 m",
    String.raw`\frac{800\,\mathrm{px}\times0.2\,\mathrm{m}}{2\,\mathrm{m}}`
  ),
  "EML-E3-D22": substitution(
    "mastery:EML-E3-D22:substitution",
    "80 / 100",
    String.raw`\frac{80}{100}`
  ),
  "EML-E3-D23": substitution(
    "mastery:EML-E3-D23:substitution",
    "0.012 s + 0.028 s + 0.010 s",
    String.raw`0.012\,\mathrm{s}+0.028\,\mathrm{s}+0.010\,\mathrm{s}`
  ),
  "EML-E4-D24": substitution(
    "mastery:EML-E4-D24:substitution",
    "4 x 3 x 2",
    String.raw`4\times3\times2`
  ),
  "EML-E4-D25": substitution(
    "mastery:EML-E4-D25:substitution",
    "AUD 9500 - AUD 10000",
    String.raw`\mathrm{AUD}\ 9500-\mathrm{AUD}\ 10000`
  )
} satisfies Record<string, ReviewedMathExpression>);

export const masteryDimensionalCheckMathExpressions = Object.freeze({
  "EML-E0-D01": dimensionalCheck(
    "mastery:EML-E0-D01:dimensions",
    "s = s + s + s + s",
    String.raw`\mathrm{s}=\mathrm{s}+\mathrm{s}+\mathrm{s}+\mathrm{s}`
  ),
  "EML-E0-D02": dimensionalCheck(
    "mastery:EML-E0-D02:dimensions",
    "m = m - m",
    String.raw`\mathrm{m}=\mathrm{m}-\mathrm{m}`
  ),
  "EML-E0-D03": dimensionalCheck(
    "mastery:EML-E0-D03:dimensions",
    "m/s = sqrt((m/s)^2 + (m/s)^2)",
    String.raw`\mathrm{m\,s^{-1}}=\sqrt{\left(\mathrm{m\,s^{-1}}\right)^2+\left(\mathrm{m\,s^{-1}}\right)^2}`
  ),
  "EML-E1-D04": dimensionalCheck(
    "mastery:EML-E1-D04:dimensions",
    "unit(x) = (1/1) x unit(x)",
    String.raw`\operatorname{unit}(x)=\frac{1}{1}\times\operatorname{unit}(x)`
  ),
  "EML-E1-D05": dimensionalCheck(
    "mastery:EML-E1-D05:dimensions",
    "J = kg x (m/s)^2 = kg m^2/s^2",
    String.raw`\mathrm{J}=\mathrm{kg}\times\left(\mathrm{m\,s^{-1}}\right)^2=\mathrm{kg\,m^2\,s^{-2}}`
  ),
  "EML-E1-D06": dimensionalCheck(
    "mastery:EML-E1-D06:dimensions",
    "s = s - s",
    String.raw`\mathrm{s}=\mathrm{s}-\mathrm{s}`
  ),
  "EML-E1-D07": dimensionalCheck(
    "mastery:EML-E1-D07:dimensions",
    "B = 1 x 1 x B",
    String.raw`\mathrm{B}=1\times1\times\mathrm{B}`
  ),
  "EML-E1-D08": dimensionalCheck(
    "mastery:EML-E1-D08:dimensions",
    "m = m - m",
    String.raw`\mathrm{m}=\mathrm{m}-\mathrm{m}`
  ),
  "EML-E2-D09": dimensionalCheck(
    "mastery:EML-E2-D09:dimensions",
    "Pa = N/m^2",
    String.raw`\mathrm{Pa}=\frac{\mathrm{N}}{\mathrm{m}^2}`
  ),
  "EML-E2-D10": dimensionalCheck(
    "mastery:EML-E2-D10:dimensions",
    "1 = 1/1",
    String.raw`1=\frac{1}{1}`
  ),
  "EML-E2-D11": dimensionalCheck(
    "mastery:EML-E2-D11:dimensions",
    "A = V/ohm",
    String.raw`\mathrm{A}=\frac{\mathrm{V}}{\Omega}`
  ),
  "EML-E2-D12": dimensionalCheck(
    "mastery:EML-E2-D12:dimensions",
    "V/Pa = V/Pa",
    String.raw`\mathrm{V\,Pa^{-1}}=\mathrm{V\,Pa^{-1}}`
  ),
  "EML-E2-D13": dimensionalCheck(
    "mastery:EML-E2-D13:dimensions",
    "s = 1/(1/s)",
    String.raw`\mathrm{s}=\frac{1}{\mathrm{s}^{-1}}`
  ),
  "EML-E2-D14": dimensionalCheck(
    "mastery:EML-E2-D14:dimensions",
    "s = bit/(bit/s)",
    String.raw`\mathrm{s}=\frac{\mathrm{bit}}{\mathrm{bit\,s^{-1}}}`
  ),
  "EML-E2-D15": dimensionalCheck(
    "mastery:EML-E2-D15:dimensions",
    "Hz > 1 x Hz",
    String.raw`\mathrm{Hz}>1\times\mathrm{Hz}`
  ),
  "EML-E2-D16": dimensionalCheck(
    "mastery:EML-E2-D16:dimensions",
    "command = (command/error-unit) x error-unit",
    String.raw`\mathrm{command}=\frac{\mathrm{command}}{\mathrm{error\ unit}}\times\mathrm{error\ unit}`
  ),
  "EML-E3-D17": dimensionalCheck(
    "mastery:EML-E3-D17:dimensions",
    "m/s = m x rad/s, with rad dimensionless",
    String.raw`\mathrm{m\,s^{-1}}=\mathrm{m}\times\mathrm{rad\,s^{-1}},\quad\mathrm{rad}\equiv1`
  ),
  "EML-E3-D18": dimensionalCheck(
    "mastery:EML-E3-D18:dimensions",
    "s = s - s",
    String.raw`\mathrm{s}=\mathrm{s}-\mathrm{s}`
  ),
  "EML-E3-D19": dimensionalCheck(
    "mastery:EML-E3-D19:dimensions",
    "m^2 = m^2 + m^2",
    String.raw`\mathrm{m}^2=\mathrm{m}^2+\mathrm{m}^2`
  ),
  "EML-E3-D20": dimensionalCheck(
    "mastery:EML-E3-D20:dimensions",
    "1 = 1/1",
    String.raw`1=\frac{1}{1}`
  ),
  "EML-E3-D21": dimensionalCheck(
    "mastery:EML-E3-D21:dimensions",
    "px = px x m/m",
    String.raw`\mathrm{px}=\mathrm{px}\times\frac{\mathrm{m}}{\mathrm{m}}`
  ),
  "EML-E3-D22": dimensionalCheck(
    "mastery:EML-E3-D22:dimensions",
    "dimensionless = count/count",
    String.raw`\text{dimensionless}=\frac{\text{count}}{\text{count}}`
  ),
  "EML-E3-D23": dimensionalCheck(
    "mastery:EML-E3-D23:dimensions",
    "s = s + s + s",
    String.raw`\mathrm{s}=\mathrm{s}+\mathrm{s}+\mathrm{s}`
  ),
  "EML-E4-D24": dimensionalCheck(
    "mastery:EML-E4-D24:dimensions",
    "1 = 1 x 1 x 1",
    String.raw`1=1\times1\times1`
  ),
  "EML-E4-D25": dimensionalCheck(
    "mastery:EML-E4-D25:dimensions",
    "AUD = AUD - AUD",
    String.raw`\mathrm{AUD}=\mathrm{AUD}-\mathrm{AUD}`
  )
} satisfies Record<string, ReviewedMathExpression>);

const masteryVariableDefinitions = {
  t_cycle: [String.raw`t_{\mathrm{cycle}}`, "total learning-cycle duration"],
  t_recall: [String.raw`t_{\mathrm{recall}}`, "retrieval duration"],
  t_lesson: [String.raw`t_{\mathrm{lesson}}`, "micro-lesson duration"],
  t_build: [String.raw`t_{\mathrm{build}}`, "build or test duration"],
  t_close: [String.raw`t_{\mathrm{close}}`, "evidence-close duration"],
  e: ["e", "signed error"],
  x_measured: [String.raw`x_{\mathrm{measured}}`, "measured value"],
  x_reference: [String.raw`x_{\mathrm{reference}}`, "reference value"],
  "|v|": [String.raw`\lVert\mathbf{v}\rVert`, "vector magnitude"],
  v_x: [String.raw`v_x`, "x-axis vector component"],
  v_y: [String.raw`v_y`, "y-axis vector component"],
  x_mean: [String.raw`x_{\mathrm{mean}}`, "arithmetic mean"],
  x_i: [String.raw`x_i`, "sample value i"],
  n: ["n", "count"],
  E_k: [String.raw`E_k`, "kinetic energy"],
  m: ["m", "mass"],
  v: ["v", "speed or linear velocity"],
  t_saved: [String.raw`t_{\mathrm{saved}}`, "time saved"],
  t_manual: [String.raw`t_{\mathrm{manual}}`, "manual duration"],
  t_reproduced: [String.raw`t_{\mathrm{reproduced}}`, "reproduced duration"],
  B: ["B", "payload size or matrix B, as defined"],
  n_samples: [String.raw`n_{\mathrm{samples}}`, "sample count"],
  n_channels: [String.raw`n_{\mathrm{channels}}`, "channel count"],
  bytes_per_sample: [String.raw`b_{\mathrm{sample}}`, "bytes per sample"],
  T: ["T", "period, torque or tolerance span, as defined"],
  x_upper: [String.raw`x_{\mathrm{upper}}`, "upper limit"],
  x_lower: [String.raw`x_{\mathrm{lower}}`, "lower limit"],
  sigma: [String.raw`\sigma`, "normal stress sigma"],
  F: ["F", "force"],
  A: ["A", "area or matrix A, as defined"],
  Y: ["Y", "first-pass yield"],
  n_pass: [String.raw`n_{\mathrm{pass}}`, "first-pass count"],
  n_total: [String.raw`n_{\mathrm{total}}`, "total count"],
  I: ["I", "current or rotational inertia, as defined"],
  V: ["V", "potential difference"],
  R: ["R", "resistance or risk score, as defined"],
  S: ["S", "sensitivity or score, as defined"],
  delta_y: [String.raw`\Delta y`, "change in output"],
  delta_x: [String.raw`\Delta x`, "change in input"],
  f: ["f", "frequency"],
  t_tx: [String.raw`t_{\mathrm{tx}}`, "transmission time"],
  N_bits: [String.raw`N_{\mathrm{bits}}`, "transmitted bit count"],
  R_bit: [String.raw`R_{\mathrm{bit}}`, "bit rate"],
  f_s: [String.raw`f_s`, "sample frequency"],
  f_max: [String.raw`f_{\max}`, "highest retained frequency"],
  u_P: [String.raw`u_P`, "proportional controller contribution"],
  K_p: [String.raw`K_p`, "proportional gain"],
  v_wheel: [String.raw`v_{\mathrm{wheel}}`, "wheel tangential speed"],
  r: ["r", "radius or reference, as defined"],
  omega: [String.raw`\omega`, "angular speed omega"],
  L: ["L", "latency, length or wheel separation, as defined"],
  t_receive: [String.raw`t_{\mathrm{receive}}`, "receiver timestamp"],
  t_source: [String.raw`t_{\mathrm{source}}`, "source timestamp"],
  "var(a + b)": [String.raw`\operatorname{var}(a+b)`, "variance of a plus b"],
  "var(a)": [String.raw`\operatorname{var}(a)`, "variance of a"],
  "var(b)": [String.raw`\operatorname{var}(b)`, "variance of b"],
  R_success: [String.raw`R_{\mathrm{success}}`, "mission success ratio"],
  n_success: [String.raw`n_{\mathrm{success}}`, "successful mission count"],
  n_attempt: [String.raw`n_{\mathrm{attempt}}`, "valid attempt count"],
  u: ["u", "controller output or image coordinate, as defined"],
  f_x: [String.raw`f_x`, "horizontal focal length"],
  X: ["X", "horizontal camera-frame coordinate"],
  Z: ["Z", "camera depth"],
  TP: [String.raw`\mathrm{TP}`, "true-positive count"],
  FP: [String.raw`\mathrm{FP}`, "false-positive count"],
  precision: [String.raw`\mathrm{precision}`, "precision"],
  L_total: [String.raw`L_{\mathrm{total}}`, "total latency"],
  L_capture: [String.raw`L_{\mathrm{capture}}`, "capture latency"],
  L_inference: [String.raw`L_{\mathrm{inference}}`, "inference latency"],
  L_action: [String.raw`L_{\mathrm{action}}`, "action latency"],
  RPN: [String.raw`\mathrm{RPN}`, "risk-priority number"],
  O: ["O", "occurrence rank"],
  D: ["D", "detection rank or diameter, as defined"],
  CV: [String.raw`\mathrm{CV}`, "cost variance"],
  EV: [String.raw`\mathrm{EV}`, "earned value"],
  AC: [String.raw`\mathrm{AC}`, "actual cost"]
} as const;

export const masteryVariableMathExpressions = Object.freeze(
  Object.fromEntries(
    Object.entries(masteryVariableDefinitions).map(
      ([plainText, [tex, spoken]]) => [
        plainText,
        reviewed(
          `mastery-variable:${plainText}`,
          plainText,
          tex,
          `Variable ${spoken}.`
        )
      ]
    )
  ) as Record<keyof typeof masteryVariableDefinitions, ReviewedMathExpression>
);

const engineeringUnitDefinitions = {
  "1": ["1", "dimensionless"],
  "1/s": [String.raw`\mathrm{s}^{-1}`, "per second"],
  A: [String.raw`\mathrm{A}`, "amperes"],
  AUD: [String.raw`\mathrm{AUD}`, "Australian dollars"],
  B: [String.raw`\mathrm{B}`, "bytes"],
  bit: [String.raw`\mathrm{bit}`, "bits"],
  "bit/s": [String.raw`\mathrm{bit\,s^{-1}}`, "bits per second"],
  byte: [String.raw`\mathrm{byte}`, "bytes"],
  C: [String.raw`\mathrm{C}`, "coulombs"],
  F: [String.raw`\mathrm{F}`, "farads"],
  Hz: [String.raw`\mathrm{Hz}`, "hertz"],
  J: [String.raw`\mathrm{J}`, "joules"],
  K: [String.raw`\mathrm{K}`, "kelvin"],
  kg: [String.raw`\mathrm{kg}`, "kilograms"],
  "kg m^2": [String.raw`\mathrm{kg\,m^2}`, "kilogram metres squared"],
  m: [String.raw`\mathrm{m}`, "metres"],
  "m/rad": [String.raw`\mathrm{m\,rad^{-1}}`, "metres per radian"],
  "m/s": [String.raw`\mathrm{m\,s^{-1}}`, "metres per second"],
  "m/s^2": [String.raw`\mathrm{m\,s^{-2}}`, "metres per second squared"],
  "m^2": [String.raw`\mathrm{m^2}`, "square metres"],
  "m^4": [String.raw`\mathrm{m^4}`, "metres to the fourth power"],
  min: [String.raw`\mathrm{min}`, "minutes"],
  mm: [String.raw`\mathrm{mm}`, "millimetres"],
  N: [String.raw`\mathrm{N}`, "newtons"],
  "N m": [String.raw`\mathrm{N\,m}`, "newton metres"],
  "N m^2/C^2": [
    String.raw`\mathrm{N\,m^2\,C^{-2}}`,
    "newton metres squared per coulomb squared"
  ],
  "N/m": [String.raw`\mathrm{N\,m^{-1}}`, "newtons per metre"],
  ohm: [String.raw`\Omega`, "ohms"],
  Pa: [String.raw`\mathrm{Pa}`, "pascals"],
  px: [String.raw`\mathrm{px}`, "pixels"],
  "r/min": [String.raw`\mathrm{r\,min^{-1}}`, "revolutions per minute"],
  rad: [String.raw`\mathrm{rad}`, "radians"],
  "rad/s": [String.raw`\mathrm{rad\,s^{-1}}`, "radians per second"],
  "rad/s^2": [
    String.raw`\mathrm{rad\,s^{-2}}`,
    "radians per second squared"
  ],
  "rev/min": [String.raw`\mathrm{rev\,min^{-1}}`, "revolutions per minute"],
  s: [String.raw`\mathrm{s}`, "seconds"],
  V: [String.raw`\mathrm{V}`, "volts"],
  "V/kPa": [String.raw`\mathrm{V\,kPa^{-1}}`, "volts per kilopascal"],
  "V/Pa": [String.raw`\mathrm{V\,Pa^{-1}}`, "volts per pascal"],
  W: [String.raw`\mathrm{W}`, "watts"],
  "W/(m K)": [
    String.raw`\mathrm{W\,(m\,K)^{-1}}`,
    "watts per metre kelvin"
  ]
} as const;

export const engineeringUnitMathExpressions = Object.freeze(
  Object.fromEntries(
    Object.entries(engineeringUnitDefinitions).map(
      ([plainText, [tex, spoken]]) => [
        plainText,
        reviewed(
          `engineering-unit:${plainText}`,
          plainText,
          tex,
          `SI unit ${spoken}.`
        )
      ]
    )
  ) as Record<keyof typeof engineeringUnitDefinitions, ReviewedMathExpression>
);

export const flagshipMathExpressions = Object.freeze({
  "controls-first-order-step": equation(
    "flagship:controls-first-order-step",
    "y(t) = K*u0*(1 - exp(-t/tau))",
    String.raw`y(t)=Ku_0\left(1-e^{-t/\tau}\right)`
  ),
  "controls-second-order-model": equation(
    "flagship:controls-second-order-model",
    "y'' + 2*zeta*wn*y' + wn^2*y = K*wn^2*u",
    String.raw`\ddot{y}+2\zeta w_n\dot{y}+w_n^2y=Kw_n^2u`
  ),
  "controls-pid": equation(
    "flagship:controls-pid",
    "u = Kp*e + Ki*integral(e dt) + Kd*de/dt",
    String.raw`u=K_p e+K_i\int e\,\mathrm{d}t+K_d\frac{\mathrm{d}e}{\mathrm{d}t}`
  ),
  "controls-second-order-poles": equation(
    "flagship:controls-second-order-poles",
    "s = -zeta*wn +/- wn*sqrt(zeta^2 - 1)",
    String.raw`s=-\zeta w_n\pm w_n\sqrt{\zeta^2-1}`
  ),
  "robotics-differential-drive": equation(
    "flagship:robotics-differential-drive",
    "v = (vr + vl)/2; omega = (vr - vl)/b",
    String.raw`\begin{aligned}v&=\frac{v_r+v_l}{2},&\omega&=\frac{v_r-v_l}{b}\end{aligned}`
  ),
  "robotics-scalar-covariance-update": equation(
    "flagship:robotics-scalar-covariance-update",
    "Pp = P + Q; K = Pp/(Pp + R); x = xp + K*(z - xp); P = (1 - K)*Pp",
    String.raw`\begin{aligned}P_p&=P+Q,&K&=\frac{P_p}{P_p+R},&x&=x_p+K(z-x_p),&P&=(1-K)P_p\end{aligned}`
  ),
  "embedded-nyquist": equation(
    "flagship:embedded-nyquist",
    "fs > 2*fmax",
    String.raw`f_s>2f_{\max}`
  ),
  "embedded-adc-lsb": equation(
    "flagship:embedded-adc-lsb",
    "LSB = Vref/(2^N)",
    String.raw`\mathrm{LSB}=\frac{V_{\mathrm{ref}}}{2^N}`
  ),
  "embedded-utilisation": equation(
    "flagship:embedded-utilisation",
    "U = sum(WCETi/Ti)",
    String.raw`U=\sum_i\frac{\mathrm{WCET}_i}{T_i}`
  ),
  "embedded-interface-power": equation(
    "flagship:embedded-interface-power",
    "P = V*I; Vloaded = Vhigh*Rin/(Rsource + Rin)",
    String.raw`\begin{aligned}P&=VI,&V_{\mathrm{loaded}}&=V_{\mathrm{high}}\frac{R_{\mathrm{in}}}{R_{\mathrm{source}}+R_{\mathrm{in}}}\end{aligned}`
  ),
  "mechanical-rotational-load": equation(
    "flagship:mechanical-rotational-load",
    "Trequired = Tload + J*alpha; omega = 2*pi*rpm/60; P = Trequired*omega",
    String.raw`\begin{aligned}T_{\mathrm{required}}&=T_{\mathrm{load}}+J\alpha,&\omega&=\frac{2\pi\,\mathrm{rpm}}{60},&P&=T_{\mathrm{required}}\omega\end{aligned}`
  ),
  "mechanical-axial-stress": equation(
    "flagship:mechanical-axial-stress",
    "sigma = F/A",
    String.raw`\sigma=\frac{F}{A}`
  ),
  "mechanical-cantilever": equation(
    "flagship:mechanical-cantilever",
    "delta = F*L^3/(3*E*I)",
    String.raw`\delta=\frac{FL^3}{3EI}`
  ),
  "ml-mse": equation(
    "flagship:ml-mse",
    "MSE = sum((yi - yhat_i)^2)/n",
    String.raw`\mathrm{MSE}=\frac{1}{n}\sum_i\left(y_i-\hat{y}_i\right)^2`
  ),
  "ml-precision-recall": equation(
    "flagship:ml-precision-recall",
    "precision = TP/(TP + FP); recall = TP/(TP + FN)",
    String.raw`\begin{aligned}\mathrm{precision}&=\frac{\mathrm{TP}}{\mathrm{TP}+\mathrm{FP}},&\mathrm{recall}&=\frac{\mathrm{TP}}{\mathrm{TP}+\mathrm{FN}}\end{aligned}`
  )
} satisfies Record<string, ReviewedMathExpression>);

export const moduleMathExpressions = Object.freeze({
  "pid:0": equation(
    "module:pid:controller",
    "e = setpoint - process variable; u = Kp*e + Ki*integral(e dt) + Kd*de/dt",
    String.raw`\begin{aligned}e&=r-y,&u&=K_p e+K_i\int e\,\mathrm{d}t+K_d\frac{\mathrm{d}e}{\mathrm{d}t}\end{aligned}`,
    "Error e equals setpoint r minus process variable y. Controller output u equals proportional gain times error, plus integral gain times accumulated error, plus derivative gain times the error rate."
  ),
  "pid:2": equation(
    "module:pid:plant-models",
    "tau*dy/dt + y = u; y'' + 2*zeta*wn*y' + wn^2*y = K*wn^2*u",
    String.raw`\begin{aligned}\tau\frac{\mathrm{d}y}{\mathrm{d}t}+y&=u,\\\ddot{y}+2\zeta\omega_n\dot{y}+\omega_n^2y&=K\omega_n^2u\end{aligned}`,
    "A first-order plant satisfies tau times output rate plus output equals input. A standard second-order plant relates output acceleration, damping, natural frequency and input."
  ),
  "electrical:0": equation(
    "module:electrical:resistive-interface",
    "V = I*R; P = V*I; Vout = Vin*R2/(R1 + R2)",
    String.raw`\begin{aligned}V&=IR,&P&=VI,&V_{\mathrm{out}}&=V_{\mathrm{in}}\frac{R_2}{R_1+R_2}\end{aligned}`,
    "Voltage equals current times resistance. Power equals voltage times current. Divider output equals input voltage times R two over R one plus R two."
  ),
  "electrical:1": equation(
    "module:electrical:rc-response",
    "v(t) = Vs*(1 - exp(-t/(R*C))); tau = R*C; fc = 1/(2*pi*R*C)",
    String.raw`\begin{aligned}v_C(t)&=V_s\left(1-e^{-t/(RC)}\right),&\tau&=RC,&f_c&=\frac{1}{2\pi RC}\end{aligned}`,
    "Capacitor voltage equals supply voltage times one minus exponential negative time over R C. Time constant tau equals R C. Cutoff frequency equals one over two pi R C."
  ),
  "electrical:2": equation(
    "module:electrical:rlc-damping",
    "omega0 = 1/sqrt(L*C); zeta = R*sqrt(C/L)/2",
    String.raw`\begin{aligned}\omega_0&=\frac{1}{\sqrt{LC}},&\zeta&=\frac{R}{2}\sqrt{\frac{C}{L}}\end{aligned}`,
    "For a series RLC circuit, undamped angular frequency equals one over square root of inductance times capacitance. Damping ratio equals resistance over two times square root of capacitance over inductance."
  ),
  "electrical:3": equation(
    "module:electrical:adc-resolution",
    "LSB = Vref/(2^N)",
    String.raw`\mathrm{LSB}=\frac{V_{\mathrm{ref}}}{2^N}`,
    "ADC least significant bit voltage equals reference voltage divided by two to the power N."
  ),
  "embedded:2": equation(
    "module:embedded:latency",
    "tworst,poll = Tpoll + thandler; tworst,interrupt = tentry + thandler",
    String.raw`\begin{aligned}t_{\mathrm{worst,poll}}&=T_{\mathrm{poll}}+t_{\mathrm{handler}},&t_{\mathrm{worst,interrupt}}&=t_{\mathrm{entry}}+t_{\mathrm{handler}}\end{aligned}`,
    "Worst-case polling latency equals polling period plus handler time. Worst-case interrupt latency equals interrupt entry overhead plus handler time."
  ),
  "plc:0": equation(
    "module:plc:seal-in-logic",
    "Motor = (Start OR Running) AND NOT Stop AND InterlocksHealthy",
    String.raw`\mathrm{Motor}=(\mathrm{Start}\lor\mathrm{Running})\land\lnot\mathrm{Stop}\land\mathrm{InterlocksHealthy}`,
    "Motor command is true when start or running is true, stop is false, and every interlock is healthy."
  ),
  "robotics:0": equation(
    "module:robotics:differential-drive",
    "v = (vR + vL)/2; omega = (vR - vL)/L",
    String.raw`\begin{aligned}v&=\frac{v_R+v_L}{2},&\omega&=\frac{v_R-v_L}{L}\end{aligned}`,
    "Robot linear velocity equals the average of right and left wheel velocities. Angular velocity equals their difference divided by wheelbase."
  ),
  "ml:0": equation(
    "module:ml:regression",
    "yhat = m*x + b; MSE = sum((yi - yhat_i)^2)/n; R2 = 1 - SSres/SStot",
    String.raw`\begin{aligned}\hat{y}&=mx+b,&\mathrm{MSE}&=\frac{1}{n}\sum_i(y_i-\hat{y}_i)^2,&R^2&=1-\frac{\mathrm{SS}_{\mathrm{res}}}{\mathrm{SS}_{\mathrm{tot}}}\end{aligned}`,
    "Predicted y equals slope times x plus intercept. Mean squared error is the average squared residual. R squared equals one minus residual sum of squares over total sum of squares."
  ),
  "ml:2": equation(
    "module:ml:classification",
    "precision = TP/(TP + FP); recall = TP/(TP + FN)",
    String.raw`\begin{aligned}\mathrm{precision}&=\frac{\mathrm{TP}}{\mathrm{TP}+\mathrm{FP}},&\mathrm{recall}&=\frac{\mathrm{TP}}{\mathrm{TP}+\mathrm{FN}}\end{aligned}`,
    "Precision equals true positives over true positives plus false positives. Recall equals true positives over true positives plus false negatives."
  ),
  "ml:3": equation(
    "module:ml:z-score",
    "z = (x - mean)/standard deviation",
    String.raw`z=\frac{x-\mu}{\sigma}`,
    "Z score equals observation x minus mean mu, divided by standard deviation sigma."
  ),
  "mechanical:0": equation(
    "module:mechanical:gear-ratio",
    "N = Zout/Zin; omegaOut = omegaIn/N; Tout = N*Tin; P = T*omega",
    String.raw`\begin{aligned}N&=\frac{Z_{\mathrm{out}}}{Z_{\mathrm{in}}},&\omega_{\mathrm{out}}&=\frac{\omega_{\mathrm{in}}}{N},&T_{\mathrm{out}}&=NT_{\mathrm{in}},&P&=T\omega\end{aligned}`,
    "Gear ratio N equals output teeth over input teeth. Ideal output speed equals input speed divided by N. Ideal output torque equals N times input torque. Power equals torque times angular speed."
  ),
  "mechanical:1": equation(
    "module:mechanical:rotational-power",
    "omega = 2*pi*rpm/60; P = T*omega",
    String.raw`\begin{aligned}\omega&=\frac{2\pi\,\mathrm{rpm}}{60},&P&=T\omega\end{aligned}`,
    "Angular speed equals two pi times revolutions per minute over sixty. Mechanical power equals torque times angular speed."
  ),
  "mechanical:2": equation(
    "module:mechanical:second-order",
    "m*x'' + c*x' + k*x = 0; wn = sqrt(k/m); zeta = c/(2*sqrt(k*m)); ccritical = 2*sqrt(k*m)",
    String.raw`\begin{aligned}m\ddot{x}+c\dot{x}+kx&=0,&\omega_n&=\sqrt{\frac{k}{m}},&\zeta&=\frac{c}{2\sqrt{km}},&c_{\mathrm{critical}}&=2\sqrt{km}\end{aligned}`,
    "The spring-mass-damper equation is mass times acceleration plus damping times velocity plus stiffness times displacement equals zero. Natural angular frequency equals square root of stiffness over mass. Damping ratio equals damping over two times square root of stiffness times mass. Critical damping coefficient equals two times square root of stiffness times mass."
  ),
  "practice:1": equation(
    "module:practice:risk-priority-number",
    "RPN = S*O*D",
    String.raw`\mathrm{RPN}=S\,O\,D`,
    "Risk priority number equals severity times occurrence times detection."
  )
} satisfies Record<string, ReviewedMathExpression>);

export const labMathExpressions = Object.freeze({
  "pid-first-order": equation(
    "lab:pid:first-order",
    "tau*dy/dt + y = u",
    String.raw`\tau\frac{\mathrm{d}y}{\mathrm{d}t}+y=u`,
    "First-order plant: tau times output rate plus output equals input."
  ),
  "pid-second-order": equation(
    "lab:pid:second-order",
    "y'' + 2*zeta*wn*y' + wn^2*y = K*wn^2*u",
    String.raw`\ddot{y}+2\zeta\omega_n\dot{y}+\omega_n^2y=K\omega_n^2u`,
    "Second-order plant: output acceleration plus two zeta omega n times output rate plus omega n squared times output equals steady-state gain times omega n squared times input."
  ),
  "electrical-ohm": equation(
    "lab:electrical:ohm",
    "I = V/R; P = V*I",
    String.raw`\begin{aligned}I&=\frac{V}{R},&P&=VI\end{aligned}`,
    "Current equals voltage over resistance. Power equals voltage times current."
  ),
  "electrical-rc-charge": equation(
    "lab:electrical:rc-charge",
    "tau = R*C; vC(t) = Vs*(1 - exp(-t/tau))",
    String.raw`\begin{aligned}\tau&=RC,&v_C(t)&=V_s\left(1-e^{-t/\tau}\right)\end{aligned}`,
    "Time constant tau equals resistance times capacitance. Capacitor voltage equals supply voltage times one minus exponential negative time over tau."
  ),
  "electrical-rc-filter": equation(
    "lab:electrical:rc-filter",
    "fc = 1/(2*pi*R*C); gain = 1/sqrt(1 + (f/fc)^2)",
    String.raw`\begin{aligned}f_c&=\frac{1}{2\pi RC},&|H(f)|&=\frac{1}{\sqrt{1+(f/f_c)^2}}\end{aligned}`,
    "RC cutoff frequency equals one over two pi R C. Low-pass gain magnitude equals one over square root of one plus frequency over cutoff frequency squared."
  ),
  "electrical-rlc": equation(
    "lab:electrical:rlc",
    "omega0 = 1/sqrt(L*C); zeta = R*sqrt(C/L)/2",
    String.raw`\begin{aligned}\omega_0&=\frac{1}{\sqrt{LC}},&\zeta&=\frac{R}{2}\sqrt{\frac{C}{L}}\end{aligned}`,
    "Undamped angular frequency equals one over square root of inductance times capacitance. Series RLC damping ratio equals resistance over two times square root of capacitance over inductance."
  ),
  "electrical-divider-adc": equation(
    "lab:electrical:divider-adc",
    "Vout = Vin*R2/(R1 + R2); LSB = Vref/(2^N)",
    String.raw`\begin{aligned}V_{\mathrm{out}}&=V_{\mathrm{in}}\frac{R_2}{R_1+R_2},&\mathrm{LSB}&=\frac{V_{\mathrm{ref}}}{2^N}\end{aligned}`,
    "Divider output equals input voltage times R two over R one plus R two. ADC least significant bit voltage equals reference voltage over two to the power N."
  ),
  "ml-regression": equation(
    "lab:ml:regression",
    "y = 2.5*x + 20",
    String.raw`y=2.5x+20`,
    "Synthetic motor temperature y equals 2.5 times load current x plus 20 degrees Celsius."
  ),
  "ml-classification": equation(
    "lab:ml:classification",
    "precision = TP/(TP + FP); recall = TP/(TP + FN)",
    String.raw`\begin{aligned}\mathrm{precision}&=\frac{\mathrm{TP}}{\mathrm{TP}+\mathrm{FP}},&\mathrm{recall}&=\frac{\mathrm{TP}}{\mathrm{TP}+\mathrm{FN}}\end{aligned}`,
    "Precision equals true positives over predicted positives. Recall equals true positives over actual positives."
  ),
  "ml-z-score": equation(
    "lab:ml:z-score",
    "z = (x - mean)/standard deviation",
    String.raw`z=\frac{x-\mu}{\sigma}`,
    "Z score equals observation minus mean divided by standard deviation."
  ),
  "embedded-latency": equation(
    "lab:embedded:latency",
    "tworst,poll = Tpoll + thandler; tworst,interrupt = tentry + thandler",
    String.raw`\begin{aligned}t_{\mathrm{worst,poll}}&=T_{\mathrm{poll}}+t_{\mathrm{handler}},&t_{\mathrm{worst,interrupt}}&=t_{\mathrm{entry}}+t_{\mathrm{handler}}\end{aligned}`,
    "Worst-case polling latency equals poll period plus handler time. Worst-case interrupt latency equals entry overhead plus handler time."
  ),
  "robotics-differential-drive": equation(
    "lab:robotics:differential-drive",
    "v = (vR + vL)/2; omega = (vR - vL)/L",
    String.raw`\begin{aligned}v&=\frac{v_R+v_L}{2},&\omega&=\frac{v_R-v_L}{L}\end{aligned}`,
    "Linear velocity equals the average wheel velocity. Angular velocity equals right minus left wheel velocity divided by wheelbase."
  ),
  "mechanical-gear": equation(
    "lab:mechanical:gear",
    "N = Zout/Zin; omegaOut = omegaIn/N; Tout = N*Tin",
    String.raw`\begin{aligned}N&=\frac{Z_{\mathrm{out}}}{Z_{\mathrm{in}}},&\omega_{\mathrm{out}}&=\frac{\omega_{\mathrm{in}}}{N},&T_{\mathrm{out}}&=NT_{\mathrm{in}}\end{aligned}`,
    "Gear ratio equals output teeth over input teeth. Ideal output speed is divided by ratio and ideal output torque is multiplied by ratio."
  ),
  "mechanical-smd": equation(
    "lab:mechanical:smd",
    "m*x'' + c*x' + k*x = 0; fn = sqrt(k/m)/(2*pi); zeta = c/(2*sqrt(k*m))",
    String.raw`\begin{aligned}m\ddot{x}+c\dot{x}+kx&=0,&f_n&=\frac{1}{2\pi}\sqrt{\frac{k}{m}},&\zeta&=\frac{c}{2\sqrt{km}}\end{aligned}`,
    "Spring-mass-damper free response equals zero. Natural frequency equals square root of stiffness over mass divided by two pi. Damping ratio equals damping over two square root of stiffness times mass."
  ),
  "mechanical-vibration": equation(
    "lab:mechanical:vibration",
    "fn = sqrt(k/m)/(2*pi)",
    String.raw`f_n=\frac{1}{2\pi}\sqrt{\frac{k}{m}}`,
    "Natural frequency equals square root of stiffness over mass divided by two pi."
  ),
  "practice-rpn": equation(
    "lab:practice:risk-priority-number",
    "RPN = S*O*D",
    String.raw`\mathrm{RPN}=S\,O\,D`,
    "Risk priority number equals severity times occurrence times detection."
  )
} satisfies Record<string, ReviewedMathExpression>);

export function buildEmbeddedByteMathExpression(
  byte: number
): ReviewedMathExpression {
  if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
    throw new RangeError("Embedded data byte must be an integer from 0 to 255.");
  }
  const hex = byte.toString(16).padStart(2, "0").toUpperCase();
  const binary = byte.toString(2).padStart(8, "0");
  return reviewed(
    `lab:embedded:byte-value:${byte}`,
    `byte = 0x${hex} = 0b${binary}`,
    String.raw`\mathrm{byte}=\mathtt{0x${hex}}=\mathtt{0b${binary}}`,
    `Data byte ${byte} is hexadecimal ${hex} and binary ${binary}.`
  );
}

const flagshipVariableDefinitions = {
  y: ["y", "output y"],
  K: ["K", "gain K"],
  u0: ["u_0", "step input u zero"],
  t: ["t", "time t"],
  tau: ["\\tau", "time constant tau"],
  "y'": ["\\dot{y}", "first time derivative of y"],
  "y''": ["\\ddot{y}", "second time derivative of y"],
  u: ["u", "input or controller output u"],
  zeta: ["\\zeta", "damping ratio zeta"],
  wn: ["\\omega_n", "natural angular frequency omega n"],
  e: ["e", "error e"],
  Kp: ["K_p", "proportional gain K p"],
  Ki: ["K_i", "integral gain K i"],
  Kd: ["K_d", "derivative gain K d"],
  s: ["s", "continuous-time pole s"],
  v: ["v", "linear velocity v"],
  omega: ["\\omega", "angular velocity omega"],
  vl: ["v_l", "left wheel velocity v l"],
  vr: ["v_r", "right wheel velocity v r"],
  b: ["b", "wheelbase b"],
  P: ["P", "power or covariance P, as defined in this equation"],
  Pp: ["P_p", "predicted covariance P p"],
  Q: ["Q", "process covariance Q"],
  R: ["R", "measurement covariance or resistance R, as defined in this equation"],
  x: ["x", "state x"],
  xp: ["x_p", "predicted state x p"],
  z: ["z", "measurement z"],
  fs: ["f_s", "sample frequency f s"],
  fmax: ["f_{\\max}", "maximum signal frequency"],
  LSB: ["\\mathrm{LSB}", "least significant bit voltage"],
  Vref: ["V_{\\mathrm{ref}}", "reference voltage"],
  N: ["N", "resolution or ratio N, as defined in this equation"],
  U: ["U", "processor utilisation U"],
  WCET: ["\\mathrm{WCET}", "worst-case execution time"],
  T: ["T", "period or torque T, as defined in this equation"],
  V: ["V", "voltage V"],
  I: ["I", "current or second moment I, as defined in this equation"],
  Vhigh: ["V_{\\mathrm{high}}", "unloaded high-level voltage"],
  Vloaded: ["V_{\\mathrm{loaded}}", "loaded high-level voltage"],
  Rsource: ["R_{\\mathrm{source}}", "source resistance"],
  Rin: ["R_{\\mathrm{in}}", "input resistance"],
  Trequired: ["T_{\\mathrm{required}}", "required torque"],
  Tload: ["T_{\\mathrm{load}}", "load torque"],
  J: ["J", "rotational inertia J"],
  alpha: ["\\alpha", "angular acceleration alpha"],
  rpm: ["\\mathrm{rpm}", "revolutions per minute"],
  sigma: ["\\sigma", "normal stress sigma"],
  F: ["F", "force F"],
  A: ["A", "area A"],
  delta: ["\\delta", "deflection delta"],
  L: ["L", "length L"],
  E: ["E", "elastic modulus E"],
  yhat: ["\\hat{y}", "predicted target y hat"],
  n: ["n", "sample count n"],
  TP: ["\\mathrm{TP}", "true-positive count"],
  FP: ["\\mathrm{FP}", "false-positive count"],
  FN: ["\\mathrm{FN}", "false-negative count"]
} as const;

export const flagshipVariableMathExpressions = Object.freeze(
  Object.fromEntries(
    Object.entries(flagshipVariableDefinitions).map(
      ([plainText, [tex, screenReaderText]]) => [
        plainText,
        reviewed(
          `flagship-variable:${plainText}`,
          plainText,
          tex,
          `Variable ${screenReaderText}.`
        )
      ]
    )
  ) as Record<keyof typeof flagshipVariableDefinitions, ReviewedMathExpression>
);

export const workspaceMathExpressions = Object.freeze({
  "motor-sizing-power": equation(
    "workspace:motor-sizing-power",
    "omega = 2*pi*rpm/60; P = torque*omega",
    String.raw`\begin{aligned}\omega&=\frac{2\pi\,\mathrm{rpm}}{60},&P&=T\omega\end{aligned}`,
    "Angular speed equals two pi times revolutions per minute over sixty. Mechanical power equals torque times angular speed."
  )
} satisfies Record<string, ReviewedMathExpression>);

export const allReviewedMathExpressions = Object.freeze([
  ...Object.values(calculatorMathExpressions),
  ...Object.values(masteryEquationMathExpressions),
  ...Object.values(masterySubstitutionMathExpressions),
  ...Object.values(masteryDimensionalCheckMathExpressions),
  ...Object.values(masteryVariableMathExpressions),
  ...Object.values(engineeringUnitMathExpressions),
  ...Object.values(flagshipMathExpressions),
  ...Object.values(moduleMathExpressions),
  ...Object.values(labMathExpressions),
  ...Object.values(flagshipVariableMathExpressions),
  ...Object.values(workspaceMathExpressions)
]);
