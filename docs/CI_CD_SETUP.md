# CI/CD setup — prefer Google Cloud Build (+ Cycode / Sonar / FOSSA)

**Optional GCloud walkthrough (if you get a free/Ford sandbox later):**  
[GCLOUD_CI_SETUP.md](./GCLOUD_CI_SETUP.md)

## Recommendation

| Option | Use when |
|--------|----------|
| **GitHub Actions (default)** | Personal repo, no GCP billing — use this |
| Google Cloud Build | Office/Ford GCP project with billing already covered |

**Cycode / Sonar / FOSSA** are separate products. You call them from GitHub Actions jobs (same idea as Cloud Build steps).

Recommended flow:

```text
feature branch → PR into main → GitHub Actions CI → checks green → merge
```

Do **not** push directly to `main`.

---

## 1. Protect `main` on GitHub

Repo → **Settings** → **Branches** → **Add branch ruleset** (or classic branch protection):

| Setting | Value |
|---------|--------|
| Branch | `main` |
| Restrict direct pushes | On |
| Require a pull request | On |
| Require status checks | On |
| Required check (start with) | `Build` |
| Later also require | `Cycode scan`, `FOSSA license scan`, `SonarQube / SonarCloud` |

---

## 2. GitHub Actions secrets & variables

Repo → **Settings** → **Secrets and variables** → **Actions**

### Secrets

| Secret | Used by | Where to get it |
|--------|---------|-----------------|
| `CYCODE_CLIENT_ID` | Cycode | Cycode → Service accounts / API credentials |
| `CYCODE_CLIENT_SECRET` | Cycode | Same |
| `FOSSA_API_KEY` | FOSSA | FOSSA → Settings → Integrations → API Tokens |
| `SONAR_TOKEN` | Sonar | SonarCloud/SonarQube → Generate token |
| `SONAR_HOST_URL` | SonarQube **Server** only | e.g. `https://sonarqube.your-company.com` (omit for SonarCloud) |

### Variables (toggle scans on)

| Variable | Value | Effect |
|----------|-------|--------|
| `ENABLE_CYCODE` | `true` | Runs Cycode job |
| `ENABLE_FOSSA` | `true` | Runs FOSSA job |
| `ENABLE_SONAR` | `true` | Runs Sonar job |

Until a variable is `true`, that scan is **skipped**. **Build** always runs (no paid GCP needed).

---

## 3. Cycode / FOSSA / Sonar accounts

### Cycode
1. [app.cycode.com](https://app.cycode.com)
2. Create CLI client id/secret → GitHub secrets
3. Variable `ENABLE_CYCODE=true`

### FOSSA
1. [app.fossa.com](https://app.fossa.com) → API token → `FOSSA_API_KEY`
2. `ENABLE_FOSSA=true`

### SonarCloud (free for public repos) or SonarQube
1. [sonarcloud.io](https://sonarcloud.io) → import repo
2. Edit `sonar-project.properties` (`projectKey` + `organization`)
3. Token → `SONAR_TOKEN`
4. `ENABLE_SONAR=true`

---

## 4. Rollout order

1. Merge the CI PR — confirm **Build** is green
2. Protect `main` requiring **Build**
3. Add vendor secrets → set `ENABLE_*=true` → require those checks

---

## 5. Day-to-day

```bash
git checkout main && git pull
git checkout -b feature/short-description
# commit...
git push -u origin HEAD
gh pr create --base main
# Wait for Actions → merge when green
```
