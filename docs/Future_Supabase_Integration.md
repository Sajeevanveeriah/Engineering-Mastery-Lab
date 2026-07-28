# Future hosted-provider integration

## Status

Engineering Mastery Lab is local-first and backend-free. Hosted identity,
synchronisation, collaboration, cohorts, educator analytics and billing are
unavailable. The Phase 5 modules in `src/lib/ecosystem/` are bounded local
reference contracts and synthetic fixtures. They do not contact Supabase,
Vercel or another network provider.

Supabase and Vercel are possible implementation choices, not architectural
requirements. Selecting or connecting any provider requires separate authority,
a threat model, privacy review, dependency review, current API verification and
fresh acceptance tests.

## Provider-neutral boundary

A hosted implementation should satisfy the existing capability contracts
without moving provider code into engineering calculations, project schemas,
evidence validation or the Tauri command boundary.

Required provider areas:

- identity and session lifecycle;
- synchronisation and explicit conflict resolution;
- collaboration with bounded project ownership;
- curated content packs;
- cohorts, assignments and evidence review;
- privacy-safe educator aggregates;
- entitlement and billing state; and
- optional, consent-aware product events.

Local export, local use and offline recovery must remain available even when a
hosted provider is unavailable.

## Hosted security and privacy design

### Authentication and authorisation

- Define supported sign-in methods, account recovery, multi-factor
  authentication and session revocation.
- Enforce authorisation server-side for every object and operation. Client
  route guards are not an access-control boundary.
- Model learner, educator, reviewer, organisation administrator and support
  roles explicitly. Default to no access and grant the least privilege needed.
- Reauthorise consequential operations such as organisation changes, bulk
  export, deletion, billing administration and support impersonation.

### Tenant separation and ownership

- Give every hosted record an immutable tenant or organisation identifier and
  an explicit owner.
- Enforce tenant separation in database policy, object storage policy,
  background jobs, exports, logs, backups and support tools.
- Prevent identifiers supplied by the browser from selecting another tenant.
- Define how personal projects move into or out of an organisation and who owns
  copies, evidence and review records after membership changes.

### Retention, deletion and export

- Publish retention periods for active accounts, deleted accounts, tombstones,
  audit records, backups, support records and billing records.
- Define deletion propagation through primary storage, indexes, object storage,
  analytics and backups, including the maximum completion time.
- Provide a complete, machine-readable user export with schema and version
  metadata.
- Keep local project bundles and Project Packs portable. A provider-specific
  export must not be the only recovery route.

### Conflict semantics

- Preserve version vectors, operation identifiers, tombstones and explicit
  conflict records where practical.
- Do not silently resolve concurrent engineering or evidence changes with
  last-write-wins.
- Require an explicit strategy for keep-current, accept-incoming, merge or
  deletion conflicts, and retain the chosen resolution as an auditable event.
- Make retries idempotent and reject operation-identifier reuse with different
  content.

### Audit and consent

- Record bounded security and administrative events separately from product
  telemetry.
- Restrict audit access, define retention and avoid storing project content or
  unnecessary personal data in logs.
- Keep product events off until the learner has received a clear purpose and
  consent choice where required.
- Support consent withdrawal without blocking core local learning.
- Never treat audit or event delivery as proof that an engineering result is
  correct.

### Incident response

- Define vulnerability intake, severity classification, on-call ownership,
  containment, evidence preservation, recovery and notification procedures.
- Maintain provider, dependency and secret inventories with rotation and
  revocation paths.
- Test a tenant-isolation incident, credential compromise, data corruption,
  object-storage exposure and unavailable-provider scenario.
- Record post-incident corrective actions and rerun affected acceptance gates.

### Backup and recovery

- Define recovery point and recovery time objectives before production use.
- Encrypt backups, separate their authority from production credentials and
  test restoration into an isolated environment.
- Verify record counts, hashes, tenant separation, tombstones and conflict
  history after restore.
- Retain local export and Project Pack recovery paths for users when the hosted
  service is unavailable.

## Supabase candidate mapping

If Supabase is selected after review:

- Supabase Auth can implement identity and session establishment.
- PostgreSQL tables can store versioned record envelopes, operation receipts,
  conflict records, cohorts, assignments and evidence reviews.
- Row-level security must enforce both tenant membership and object ownership
  for every operation.
- Storage buckets must use matching tenant and object policies. A signed URL is
  transport convenience, not authorisation by itself.
- Service-role credentials must remain server-side and must not be placed in
  Vite client configuration.
- The publishable browser key is not a secret and therefore cannot replace
  row-level security, authorisation or rate limits.
- Database functions, webhooks and background jobs need the same tenant and
  idempotency checks as interactive requests.

If Vercel is selected for hosting, server-side functions may mediate operations
that require secrets or privileged provider calls. Static GitHub Pages support
should remain available for the local-only build.

## Staged implementation

1. Finalise hosted data classification, ownership, retention, deletion, export,
   conflict, audit, consent, incident and recovery decisions.
2. Implement identity and server-enforced tenant authorisation behind disabled
   provider composition.
3. Implement a versioned remote record store and operation-receipt boundary.
4. Add deterministic two-device sync and conflict tests using isolated test
   tenants.
5. Add collaboration, cohorts and educator review only after role and privacy
   controls pass.
6. Add billing only after entitlement, refund, cancellation, tax, support and
   account-state semantics are complete.
7. Enable a hosted provider only after privacy, threat, accessibility,
   migration, rollback, backup-restore and incident-response evidence passes.

## Acceptance gates

- Cross-tenant reads, writes, exports and object URLs fail at the server.
- Expired, revoked and downgraded sessions lose access immediately.
- Concurrent edits create deterministic, visible conflict records.
- Retried operations are idempotent and mismatched operation reuse fails.
- Deletion and restoration preserve documented tombstone semantics.
- A user export can reconstruct all user-owned records without provider-only
  hidden state.
- Backup restoration reconciles records, operations and tenants.
- Real cohort aggregates are suppressed below the approved privacy threshold,
  with a separate re-identification review.
- Consent-disabled accounts emit no optional product events.
- Local-only mode remains fully usable during provider outage.
- No browser bundle contains provider service credentials.
- The exact deployed provider configuration, policies and migrations receive a
  fresh security and privacy review.
