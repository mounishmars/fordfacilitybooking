# CI/CD setup — branch workflow + Cycode / Sonar / FOSSA

## Target workflow (no direct pushes to `main`)

```text
feature/*  →  Pull Request into main  →  CI checks green  →  merge to main
```

1. Create a branch: `git checkout -b feature/my-change`
2. Push branch and open a PR into `main`
3. GitHub Actions runs **Build** (+ optional Cycode / FOSSA / Sonar)
4. Merge only when required checks pass

Do **not** push commits straight to `main`.

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

CLI (classic protection example):

```bash
gh api -X PUT repos/mounishmars/fordfacilitybooking/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -f required_status_checks='{"strict":true,"contexts":["Build"]}' \
  -F enforce_admins=true \
  -F required_pull_request_reviews='{"required_approving_review_count":0}' \
  -F restrictions= \
  -F allow_force_pushes=false \
  -F allow_deletions=false
```

(Adjust review count / contexts as your org requires.)

---

## 2. GitHub Actions secrets & variables

Repo → **Settings** → **Secrets and variables** → **Actions**

### Secrets

| Secret | Used by | Where to get it |
|--------|---------|-----------------|
| `CYCODE_CLIENT_ID` | Cycode | Cycode → Service accounts / API credentials |
| `CYCODE_CLIENT_SECRET` | Cycode | Same |
| `FOSSA_API_KEY` | FOSSA | FOSSA → Settings → Integrations → API Tokens |
| `SONAR_TOKEN` | Sonar | SonarCloud/SonarQube → My Account → Security → Generate token |
| `SONAR_HOST_URL` | SonarQube **Server** only | e.g. `https://sonarqube.your-company.com` (omit for SonarCloud) |

### Variables (toggle scans on)

| Variable | Value | Effect |
|----------|-------|--------|
| `ENABLE_CYCODE` | `true` | Runs Cycode job |
| `ENABLE_FOSSA` | `true` | Runs FOSSA job |
| `ENABLE_SONAR` | `true` | Runs Sonar job |

Until you set a variable to `true`, that scan is **skipped** so PRs still pass on **Build** alone while you finish vendor setup.

---

## 3. Cycode setup

1. Sign up / use org account: [https://app.cycode.com](https://app.cycode.com) (or your Ford-managed Cycode URL).
2. Create a **CLI / service account** → copy **Client ID** + **Client Secret**.
3. Add GitHub secrets `CYCODE_CLIENT_ID`, `CYCODE_CLIENT_SECRET`.
4. Set variable `ENABLE_CYCODE=true`.
5. Open a test PR — job **Cycode scan** should run SAST + SCA + secrets.

Docs: [cycode-cli](https://github.com/cycodehq/cycode-cli)

---

## 4. FOSSA setup

1. Sign up: [https://app.fossa.com](https://app.fossa.com) (or Ford FOSSA).
2. Create an **API token** (Push-only is fine for public repos).
3. Add GitHub secret `FOSSA_API_KEY`.
4. Set variable `ENABLE_FOSSA=true`.
5. Optional: add `.fossa.yml` later to tune policies / ignored deps.
6. First PR uploads a dependency inventory; with `run-tests: true` the job fails on policy violations.

Docs: [FOSSA GitHub Actions](https://docs.fossa.com/docs/integrations/github-actions)

---

## 5. SonarQube / SonarCloud setup

### Option A — SonarCloud (SaaS, easiest)

1. Go to [https://sonarcloud.io](https://sonarcloud.io) → import GitHub repo `mounishmars/fordfacilitybooking`.
2. Note **organization** key and **project key**.
3. Edit root `sonar-project.properties`:
   ```properties
   sonar.projectKey=...
   sonar.organization=...
   ```
4. Generate token → GitHub secret `SONAR_TOKEN`.
5. Do **not** set `SONAR_HOST_URL`.
6. Set variable `ENABLE_SONAR=true`.

### Option B — SonarQube Server (on‑prem / Ford)

1. Create project in your SonarQube UI.
2. Generate project/analysis token → `SONAR_TOKEN`.
3. Set secret `SONAR_HOST_URL` to your server base URL.
4. Update `sonar-project.properties` (`sonar.projectKey=...`; no `sonar.organization` needed).
5. Set `ENABLE_SONAR=true`.

Action used: `SonarSource/sonarqube-scan-action` (works with Cloud + Server).

---

## 6. Recommended rollout order

1. Merge this CI PR (Build always on).
2. Enable **branch protection** requiring **Build**.
3. Add Cycode secrets → `ENABLE_CYCODE=true` → require that check.
4. Add FOSSA → `ENABLE_FOSSA=true` → require check.
5. Add Sonar → `ENABLE_SONAR=true` → require check / quality gate.

---

## 7. Day-to-day commands

```bash
git checkout main
git pull
git checkout -b feature/short-description
# ... commit ...
git push -u origin HEAD
gh pr create --base main --fill
# wait for CI → merge via GitHub UI (squash or merge commit)
```
