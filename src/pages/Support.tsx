import { PageHeader } from "../components/PageHeader";
import { isTauri } from "../lib/platform/tauriBridge";

const PAYPAL_SUPPORT_URL = "https://paypal.me/SajeevanVeeriah95";

export function Support() {
  const desktopRuntime = isTauri();

  return (
    <section className="page narrow-page">
      <PageHeader
        eyebrow="Voluntary contribution"
        title="Support Engineering Mastery Lab"
      />
      <div className="prose">
        <p>
          Engineering Mastery Lab remains free to use locally. If it has been
          useful and you would like to support its maintenance and continued
          development, you can make an optional one-off contribution through
          PayPal.
        </p>
        <p>
          Support is entirely voluntary. It does not purchase access, services,
          features, priority support, certificates, assessment or accreditation.
          The application works the same whether or not you contribute.
        </p>
        <p>
          This is not a charitable donation, and no deductible-gift receipt is
          issued. Payment is completed on PayPal. Engineering Mastery Lab does
          not process or store your PayPal payment credentials.
        </p>
        <section aria-labelledby="paypal-support-heading">
          <h2 id="paypal-support-heading">Support via PayPal</h2>
          {desktopRuntime ? (
            <>
              <p>Open this address in your normal browser:</p>
              <p><code>{PAYPAL_SUPPORT_URL}</code></p>
            </>
          ) : (
            <>
              <a
                className="btn primary"
                href={PAYPAL_SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                aria-describedby="paypal-support-note"
              >
                Support via PayPal
              </a>
              <p id="paypal-support-note" className="small muted">
                Opens PayPal in a new tab.
              </p>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
