import { Link } from "react-router";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";

const moreSections = [
  {
    title: "Your Academy",
    links: [
      ["/settings", "Settings and appearance"],
      ["/learn/bookmarks", "Bookmarks"],
      ["/learn/roadmap", "Legacy E0-E4 coverage map"],
      ["/learn/reboot", "Legacy S001-S110 sequence"],
      ["/learn/resources", "Source library"],
      ["/learn/diagnostics", "Curriculum diagnostics"]
    ]
  },
  {
    title: "Engineering tools",
    links: [
      ["/tools", "Tools catalogue"],
      ["/tools/engineering", "Engineering workspace"],
      ["/tools/cad", "CAD Studio"],
      ["/tools/workbench", "Desktop workbench"],
      ["/tools/diagnostics", "Desktop diagnostics"]
    ]
  },
  {
    title: "Evidence and product",
    links: [
      ["/portfolio", "Portfolio evidence"],
      ["/tools/progress", "Detailed progress analysis"],
      ["/pricing", "Pricing and hosted capability status"],
      ["/about", "About Engineering Mastery Lab"]
    ]
  }
] as const;

export function MorePage() {
  return (
    <section className="page more-page">
      <PageHeader
        eyebrow="Secondary destinations"
        title="More"
        description="Open settings, references, advanced tools, diagnostics and detailed evidence without interrupting the next lesson."
      />
      <div className="more-page__sections">
        {moreSections.map((section) => (
          <section key={section.title} aria-labelledby={`more-${section.title.replace(/\W+/g, "-").toLowerCase()}`}>
            <h2 id={`more-${section.title.replace(/\W+/g, "-").toLowerCase()}`}>
              {section.title}
            </h2>
            <div className="simple-link-list">
              {section.links.map(([route, label]) => (
                <Link to={route} key={route}>
                  <span><strong>{label}</strong></span>
                  <Icon name="arrow-right" size={16} />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
