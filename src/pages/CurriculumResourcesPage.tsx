import { useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { rebootResources, resourceRevalidations } from "../data/rebootCurriculum";

export function CurriculumResourcesPage() {
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState("All");
  const tracks = [...new Set(rebootResources.map((resource) => resource.track))].sort();
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("en-AU");
    return rebootResources.filter((resource) =>
      (track === "All" || resource.track === track)
      && (!term || `${resource.id} ${resource.name} ${resource.provider} ${resource.exactUse} ${resource.track}`
        .toLocaleLowerCase("en-AU")
        .includes(term))
    );
  }, [query, track]);

  return (
    <section className="page resource-page">
      <PageHeader
        eyebrow="Authoritative workbook inventory"
        title="Curriculum resources"
        description="All 64 source resources retain original provenance and the 26 July 2026 workbook link-check result. New validation dates are separate. Links open only after a learner action."
      />
      <div className="learning-boundary" role="note"><strong>Access boundary.</strong> A listed paid or external resource is not a claim of access. Community sources remain labelled and official references are preferred for version-sensitive decisions.</div>
      <div className="catalogue-filters">
        <label><span>Search resources</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, provider, topic or exact use" /></label>
        <label><span>Track</span><select value={track} onChange={(event) => setTrack(event.target.value)}><option>All</option>{tracks.map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>
      <p role="status">{visible.length} of 64 resources shown.</p>
      <div className="resource-list resource-list--catalogue">
        {visible.map((resource) => {
          const revalidation = resourceRevalidations.find((item) => item.resourceId === resource.id);
          return (
            <article key={resource.id}>
              <div><span className="badge">{resource.id}</span><span className="status-badge">{resource.authority}</span></div>
              <h2>{resource.name}</h2>
              <p>{resource.exactUse}</p>
              <dl className="definition-grid">
                <div><dt>Track</dt><dd>{resource.track}</dd></div>
                <div><dt>Provider</dt><dd>{resource.provider}</dd></div>
                <div><dt>Type</dt><dd>{resource.type}</dd></div>
                <div><dt>Suggested slice</dt><dd>{resource.suggestedSliceMinutes} min</dd></div>
                <div><dt>Workbook check</dt><dd>{resource.linkCheckResult}, {resource.linkCheckDate}</dd></div>
                <div><dt>New validation</dt><dd>{revalidation ? `${revalidation.result} Checked ${revalidation.checkedAt}.` : "Not revalidated in this implementation run."}</dd></div>
              </dl>
              <a className="btn" href={resource.originalUrl} target="_blank" rel="noopener noreferrer">Open external resource</a>
            </article>
          );
        })}
      </div>
      {visible.length === 0 && <div className="empty-state"><strong>No resource matches</strong><p>Clear or broaden the current search and track filter.</p><button type="button" onClick={() => { setQuery(""); setTrack("All"); }}>Clear filters</button></div>}
    </section>
  );
}

