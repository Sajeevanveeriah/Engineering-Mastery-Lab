import { PageHeader } from "../components/PageHeader";
import occtExceptionUrl from "../../docs/licenses/OCCT-7.6-Open-CASCADE-Exception-1.0.txt?url&no-inline";
import occtLgplUrl from "../../docs/licenses/OCCT-7.6-LGPL-2.1.txt?url&no-inline";
import replicadLicenceUrl from "../../docs/licenses/replicad-0.23.1-MIT.txt?url&no-inline";
import replicadOcctLicenceUrl from "../../docs/licenses/replicad-opencascadejs-0.23.0-MIT.txt?url&no-inline";
import sourceRegisterUrl from "../../docs/Source-Register.md?url&no-inline";
import thirdPartyLicencesUrl from "../../docs/Third-Party-Licences.md?url&no-inline";

export function About() {
  return (
    <section className="page narrow-page">
      <PageHeader eyebrow="Product and trust" title="About Engineering Mastery Lab" description="Build, simulate, and prove real engineering capability through structured local learning." />
      <section className="prose">
        <h2>Product purpose</h2>
        <p>Engineering Mastery Lab combines guided laboratories, practical project briefs, tools, and learner-generated evidence. Project Workbench remains an advanced desktop tool inside the product.</p>
        <h2>Current runtime</h2>
        <p>The same React and TypeScript application runs as a static GitHub Pages web application and in a Tauri desktop shell. Local progress does not require an account.</p>
        <h2>Engineering boundary</h2>
        <p>Simulations, calculations, references, completion records, and evidence exports are educational. They do not establish accreditation, standards compliance, professional licensure, or certified engineering validity.</p>
        <h2>Open-source licence</h2>
        <p>The repository is licensed under MIT. The licence permits reuse, modification, distribution, and commercial use subject to its terms. This is a product statement, not legal advice.</p>
        <h2>Exact CAD third-party notice</h2>
        <p>The local exact-CAD worker uses Replicad 0.23.1 and its OpenCascade.js wrapper 0.23.0 under MIT. The selected WebAssembly payload identifies Open CASCADE Technology 7.6, distributed under LGPL 2.1 with the Open CASCADE Exception 1.0. The source register records the reviewed source revisions and the practical replacement and relinking route.</p>
        <ul>
          <li><a href={replicadLicenceUrl} download="replicad-0.23.1-MIT.txt">Replicad 0.23.1 MIT licence</a></li>
          <li><a href={replicadOcctLicenceUrl} download="replicad-opencascadejs-0.23.0-MIT.txt">Replicad OpenCascade.js 0.23.0 MIT licence</a></li>
          <li><a href={occtLgplUrl} download="OCCT-7.6-LGPL-2.1.txt">OCCT 7.6 LGPL 2.1 licence</a></li>
          <li><a href={occtExceptionUrl} download="OCCT-7.6-Open-CASCADE-Exception-1.0.txt">Open CASCADE Exception 1.0</a></li>
          <li><a href={thirdPartyLicencesUrl} download="Third-Party-Licences.md">Third-party licence notice and distribution boundary</a></li>
          <li><a href={sourceRegisterUrl} download="Source-Register.md">Source register and replacement instructions</a></li>
        </ul>
      </section>
    </section>
  );
}
