# Release Process

## Versioning

Trusyn AI follows Semantic Versioning:
- MAJOR for breaking changes
- MINOR for backward-compatible features
- PATCH for backward-compatible fixes

## Branch flow

- `develop` receives integration work
- `release/*` is cut from `develop`
- `main` receives release-ready merges

## Release checklist

1. Confirm CI is green on release branch.
2. Confirm changelog updates are complete.
3. Validate docs and API contract notes.
4. Create tag (e.g., `v0.1.0`).
5. Publish GitHub release notes.
6. Merge release branch to `main` and `develop`.

## Release artifacts

- `CHANGELOG.md` entry
- release notes file (`RELEASE_NOTES_vX.Y.Z.md`)
- screenshots/architecture updates where needed
