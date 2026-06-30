# Release Checklist

Use this checklist before creating a V1 release tag.

- [ ] Version number checked
- [ ] Docker build succeeds
- [ ] Database migration succeeds
- [ ] Core pages tested
- [ ] AI Review tested
- [ ] Planner tested
- [ ] Knowledge tested
- [ ] Markdown export tested
- [ ] No secrets committed
- [ ] README updated
- [ ] Git tag created

## Required Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
docker compose build
```
