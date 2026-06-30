# Release Checklist

Use this checklist before creating a V1 release tag.

- [x] Version number checked
- [x] Docker build succeeds
- [x] Database migration succeeds
- [x] Core pages tested
- [x] AI Review tested
- [x] Planner tested
- [x] Knowledge tested
- [x] Markdown export tested
- [x] No secrets committed
- [x] README updated
- [x] Git tag created

## Required Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
docker compose build
```
