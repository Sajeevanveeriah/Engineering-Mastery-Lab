import { useState } from "react";
import { FocusDialog } from "../components/FocusDialog";
import { PageHeader } from "../components/PageHeader";
import { entitlementIds, plans } from "../data/commercial";
import { localBillingProvider } from "../lib/providers";

const entitlementLabels: Record<typeof entitlementIds[number], string> = {
  "starter-learning": "Starter learning",
  "full-learning-catalogue": "Full learning catalogue",
  "advanced-project-templates": "Advanced project templates",
  "cloud-sync": "Cloud sync",
  "enhanced-portfolio-exports": "Enhanced portfolio exports",
  "assessment-completion-records": "Assessment and completion records",
  "ai-tutor": "Optional AI tutor",
  "team-cohort-dashboard": "Team cohort dashboard"
};

export function Pricing() {
  const [dialog, setDialog] = useState(false);
  return (
    <section className="page pricing-page">
      <PageHeader eyebrow="Future hosted offerings" title="Plans for a hosted service" description="The current self-hosted open-source preview does not collect payment. Hosted billing, identity, and cloud sync are intentionally not connected." />
      <div className="pricing-grid">{plans.map((plan) => <article className={`pricing-card${plan.id === "pro" ? " pricing-card--featured" : ""}`} key={plan.id}><p className="eyebrow">{plan.id === "free" ? "Current path" : "Future option"}</p><h2>{plan.name}</h2><p>{plan.audience}</p><strong>{plan.futurePrice}</strong><ul>{entitlementIds.map((entitlement) => <li key={entitlement} className={plan.entitlements.includes(entitlement) ? "included" : ""}>{plan.entitlements.includes(entitlement) ? "Included" : "Not planned at this tier"}: {entitlementLabels[entitlement]}</li>)}</ul><button className={plan.id === "pro" ? "primary" : ""} type="button" aria-haspopup="dialog" onClick={() => setDialog(true)}>Hosted availability</button></article>)}</div>
      <section className="pricing-open-source"><h2>Open-source preview boundary</h2><p>All existing repository functionality remains available in this local build through the open-source-preview entitlement provider. The plan comparison is forward-looking product metadata only and does not lock current features.</p></section>
      {dialog && (
        <FocusDialog
          backdropClassName="palette-backdrop"
          dialogClassName="availability-dialog"
          labelledBy="availability-title"
          describedBy="availability-description"
          closeOnBackdrop
          onClose={() => setDialog(false)}
        >
          <h2 id="availability-title" tabIndex={-1} data-dialog-initial-focus>Hosted billing is not active</h2>
          <div id="availability-description">
            <p>{localBillingProvider.explanation}</p>
            <p>No form is submitted and no external request is made from this page.</p>
          </div>
          <button className="primary" type="button" onClick={() => setDialog(false)}>Close</button>
        </FocusDialog>
      )}
    </section>
  );
}
