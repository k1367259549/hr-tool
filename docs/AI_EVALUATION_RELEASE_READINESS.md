# AI Evaluation Release Readiness

This runbook records the release baseline for the formal AI evaluation workflow.
It is intentionally limited to recruiter-controlled decision support.

## Functional Baseline

```text
Quick Screening
-> Detailed Analysis V2
-> Human Review
-> selectedRunId reference binding
-> Criterion-Level AI Reference
-> Manual Evaluation Review
```

- Quick Screening uses the Rule-Based Provider and persists a canonical result.
- Detailed Analysis uses the OpenAI-compatible Provider and requires the
  `detailed-screening.v2` result contract.
- A recruiter explicitly chooses `ACCEPTED_AS_REFERENCE`, `NEEDS_REVISION`, or
  `REJECTED`; `selectedRunId` means only the current human-selected reference.
- Criterion references require exact key matching:
  `criterion.key === criterionAssessment.criterionKey`.
- Legacy V1 Detailed Results need a rerun before they can show criterion-level
  references. Invalid historical results show a controlled compatibility notice.
- AI output is advisory. It does not auto-hire, auto-reject, move Pipeline, or
  overwrite manual criterion assessments, evidence notes, or overall notes.

## Local Startup

1. Start PostgreSQL using the project Docker setup when it is not already running.
2. Configure local backend-only relay values in `.env`; never commit this file.
3. Start HR Tool on port `3002`:

   ```powershell
   npm run dev -- -p 3002
   ```

4. Open `http://localhost:3002/feishu/evaluations`.

The recruiting website uses port `3001`. Do not reuse that port for HR Tool while
both applications are running.

## Provider Configuration

```env
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://your-relay.example.com/v1
AI_API_KEY=local-secret-only
AI_MODEL=your_model_name
AI_ENDPOINT_MODE=responses
```

Supported endpoint modes are `chat-completions` and `responses`. The application
normalizes the final endpoint path, so a Base URL may include `/v1`. Configure a
mode supported by the selected relay and model; the application never performs a
silent endpoint fallback.

## Release Checks

Run the targeted, non-network release gate first:

```powershell
npm run validate:ai-evaluation
```

Then run the complete project gate:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
git diff --check
```

`validate:ai-evaluation` runs only existing Vitest contracts, services, API, and
UI tests. It does not read a real API key, call a relay, write the database, or
modify local data.

## Manual Acceptance

1. Create or select an Evaluation with a parsed Resume, confirmed Job Profile,
   and published Template Version.
2. Run Quick Screening and verify its result persists after refresh.
3. Start Detailed Analysis only when the Quick recommendation allows it.
4. Verify a successful Detailed Run contains `detailed-screening.v2` and all
   Template criterion keys in Template order.
5. Use Human Review to accept a Detailed Run as reference and verify
   `selectedRunId`, reviewer, time, and note after refresh.
6. Verify every criterion shows only its exact-key AI reference. Confirm AI data
   has not populated manual assessments, evidence notes, or overall notes.
7. Edit and save manual evaluation content, then review and reopen according to
   the existing lifecycle.
8. Check the Detail page at `390 x 844` and desktop width. Navigation may scroll
   internally, but the page must not horizontally overflow.

## Failure Handling

- Quick Screening remains available when the AI Provider is unavailable.
- A failed Detailed Analysis is persisted as a failed Run and remains visible in
  history; retry does not overwrite a prior successful Run.
- `model_not_found`, `protocol_not_supported`, HTTP 404, empty Responses output,
  timeout, and schema validation failures are controlled diagnostics. Do not log
  API keys, authorization headers, prompts, resumes, job descriptions, or raw
  Provider responses while investigating them.
