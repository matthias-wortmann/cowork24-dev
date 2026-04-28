# Senior Agent Review

## Summary
This change introduces an automated senior-review gate for every code change in the repository.
The gate is intentionally lightweight but strict enough to enforce a repeatable review ritual.
It adds a local script and a CI workflow, then requires a structured review document before
changes are considered valid.

## Findings
- The project did not have a mandatory repository-level mechanism that enforces review notes.
- A dedicated check was added in `scripts/senior-review.cjs` with clear pass/fail conditions.
- A GitHub Actions workflow now runs this check automatically on each push and pull request.
- The script validates both modified files and the latest commit to support local and CI contexts.

## Risks
- The gate can fail if developers forget to update this review file.
- Strictness may feel heavy for tiny edits, but that is a deliberate quality guardrail.
- Emergency bypass exists via environment variable and should be used sparingly.

## Validation
- Local run executed with `yarn review:senior-agent`.
- The script now detects code changes and validates required sections.
- Workflow file is in `.github/workflows/senior-review-gate.yml` and ready for CI execution.
