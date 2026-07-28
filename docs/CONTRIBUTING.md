# CONTRIBUTING.md — Developer Workflow & Git Rules

## Git Branching Strategy
- `main`: Stable production branch. Only pull requests passing CI/CD and review get merged.
- `develop`: Primary integration branch for active development.
- `feature/<feature-name>`: Branch created for new features (e.g., `feature/resource-search`).
- `fix/<bug-name>`: Branch created for bug fixes (e.g., `fix/jwt-expiration-handler`).

---

## Commit Message Convention
Follow Conventional Commits format:
- `feat(resources): add multi-faceted filtering for class, subject, and chapter`
- `fix(auth): fix refresh token revocation handling in user_sessions`
- `docs(api): update API_SPEC.md with new endpoint response schemas`
- `style(ui): apply Apple minimalist design tokens to navigation bar`

---

## PR Verification Protocol
Before creating a Pull Request, verify:
1. `npm run build` succeeds cleanly in `frontend/`.
2. `pytest` passes 100% in `backend/`.
3. Strict compliance with `AGENTS.md` 11-step feature development protocol.
