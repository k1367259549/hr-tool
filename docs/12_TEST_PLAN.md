# 12_TEST_PLAN.md

Version: V1.0  
System: HR Daily AI

---

# 1. Purpose

This document defines the testing strategy for HR Daily AI V1.

V1 is a minimal viable system, so testing is intentionally lightweight but strictly structured.

Goal is not full coverage, but:

- system correctness
- deployment stability
- AI output validity
- core workflow integrity

---

# 2. Testing Philosophy

- No over-engineering
- Focus on critical paths
- Prefer manual + lightweight automated checks
- Ensure system is runnable end-to-end

---

# 3. Test Scope

## Included

- Core API correctness
- Database operations
- AI output validation
- Docker deployment
- Full workflow integration

---

## Excluded

- Full unit test coverage
- UI snapshot testing
- Performance benchmarking suite
- Load testing
- Security penetration testing

---

# 4. Critical User Flows (Must Pass)

## 4.1 Daily Log Flow

```text
Create Log -> Save -> Retrieve -> Update -> Delete
```

Validation rules:

- Data must persist correctly
- Date uniqueness enforced
- Numeric fields stored correctly
- Numeric fields must be greater than or equal to 0

## 4.2 AI Review Flow

```text
Log -> AI Review -> Parsed JSON -> Stored Review -> Retrieval
```

Validation rules:

- AI returns valid JSON
- Schema matches requirement
- Score between 0-100
- No missing fields
- rawOutput and parsedOutput are stored

## 4.3 Planner Flow

```text
Log + Review -> AI -> Plan -> Stored -> Retrieved
```

Validation rules:

- schedule is structured
- priorityTasks are structured
- goals, risks, and expectedOutcomes are present
- priority field is LOW, MEDIUM, or HIGH
- no over-scheduling
- output is actionable
- rawOutput and parsedOutput are stored

## 4.4 Knowledge Flow

```text
Create Knowledge -> Store -> Query -> Filter -> Delete
```

Validation rules:

- Tags stored correctly
- Type enum enforced
- Content persists properly
- AI-generated knowledge stores parsedOutput

---

# 5. API Testing

## 5.1 Required Checks

All APIs MUST:

- return correct JSON format
- handle invalid input gracefully
- not expose internal errors
- avoid direct Prisma usage in route handlers
- call Service Layer for business logic

## 5.2 Example Test Cases

Create Log:

```http
POST /api/log
```

Request:

```json
{
  "date": "2026-01-01",
  "resumeCount": 10
}
```

Expected:

- success = true
- data returned includes id

AI Review Generation:

```http
POST /api/review/generate
```

Request:

```json
{
  "date": "2026-01-01"
}
```

Expected:

- AI response parsed
- Stored in DailyReview
- score valid (0-100)
- trace fields stored

---

# 6. Database Testing

## 6.1 Required Checks

- Prisma schema migrations run successfully
- Relationships correctly enforced
- Unique constraints working
- Required AI trace fields stored for AI-generated records

## 6.2 Test Cases

- Insert RecruitLog duplicate date -> must fail
- Insert DailyReview without logId -> must fail
- Query relations -> must return correct linked data
- Insert DailyPlan with invalid priority -> must fail

---

# 7. AI Testing

## 7.1 AI Output Validation

All AI outputs MUST be tested for:

- valid JSON
- schema compliance
- field completeness
- no markdown or prose outside JSON
- traceability fields stored after persistence

## 7.2 AI Test Cases

Review Test:

Input:

- Normal RecruitLog data

Expected:

- summary generated
- score numeric
- strengths, weaknesses, and suggestions are arrays
- no hallucinated metrics

Planner Test:

Expected:

- schedule structured by morning, afternoon, or evening
- priorityTasks present
- goals, risks, and expectedOutcomes present
- no unrealistic workload
- priority values valid

Knowledge Test:

Expected:

- items array returned
- type values valid
- tags are arrays
- no duplicate knowledge items

---

# 8. Docker Testing

## 8.1 Required Test

Run from repository root:

```bash
docker compose -f docker/docker-compose.yml up --build
```

## 8.2 Validation

- App starts successfully
- DB connects successfully
- API endpoints reachable
- AI requests function correctly when `OPENAI_API_KEY` is configured

---

# 9. Integration Testing

## 9.1 Full System Flow Test

```text
Log Creation
  ↓
AI Review
  ↓
Planner Generation
  ↓
Knowledge Extraction
  ↓
Dashboard Display
```

## 9.2 Success Criteria

- No manual intervention required after Docker startup
- No system crash
- All modules functional end-to-end
- AI failure does not corrupt existing data

---

# 10. Error Handling Tests

## 10.1 AI Failure Simulation

Expected:

- retry once where applicable
- fallback response if failed again
- system does not crash
- partial AI results are not saved as valid parsedOutput

## 10.2 Invalid Input

Expected:

- validation error returned
- no DB corruption
- no AI call triggered

---

# 11. Performance Smoke Test

Targets:

- API response (non-AI): < 300ms
- AI response: < 10s target
- Page load: < 2s

---

# 12. Manual Testing Checklist

Before release:

- [ ] Docker starts successfully
- [ ] Log CRUD works
- [ ] AI Review generates correctly
- [ ] Planner generates correctly
- [ ] Knowledge base functions correctly
- [ ] Dashboard loads correctly
- [ ] Lint check passes
- [ ] Type check passes
- [ ] Build passes

---

# 13. CI Integration (Minimal)

CI MUST verify:

```bash
npm run build
npm run lint
npm run typecheck
```

---

# 14. Out of Scope (V1)

- Automated E2E test suite
- Cypress / Playwright
- Load testing (k6, JMeter)
- Security testing automation
- AI evaluation benchmarking system

---

# 15. Summary

This test plan ensures:

- core system correctness
- AI reliability validation
- deployment stability
- minimal but effective quality assurance for V1
