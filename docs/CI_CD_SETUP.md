# CI/CD setup — prefer Google Cloud Build (+ Cycode / Sonar / FOSSA)

## Recommendation

| Option | Use when |
|--------|----------|
| **Google Cloud Build (preferred here)** | You want the same pattern as office Ford GCP pipelines |
| GitHub Actions (optional fallback) | Quick PR checks with zero GCP project |

**Cycode / Sonar / FOSSA are not GCloud products.** They are scanners you call from **Cloud Build steps** (same idea as calling them from GitHub Actions). GCloud runs and tracks the pipeline; those tools do the scans.

Recommended flow:

```text
feature branch → PR into main → Cloud Build trigger runs → checks green → merge
```

Do **not** push directly to `main`.

---

## What I think you should do

For this project: **use Cloud Build as the primary CI** so you practice the office model. Keep GitHub Actions only until Cloud Build triggers are wired; then you can disable the Actions workflow.

You still need accounts/tokens for Cycode, FOSSA, and Sonar — GCP does not replace those.

---

## A. One-time GCP setup

1. Create or pick a GCP project (personal or Ford sandbox).
2. Enable APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com secretmanager.googleapis.com
   ```
3. Connect GitHub to Cloud Build:
   - Console → **Cloud Build** → **Triggers** → **Connect repository** → GitHub (`mounishmars/fordfacilitybooking`)
4. Create a trigger:
   - Event: **Pull request** (and optionally push to `main`)
   - Config: `cloudbuild.yaml` (or `cloudbuild.build-only.yaml` at first)
   - Substitution variables:
     - `_ENABLE_CYCODE=false` (flip to `true` later)
     - `_ENABLE_FOSSA=false`
     - `_ENABLE_SONAR=false`
     - `_SONAR_HOST_URL=https://sonarcloud.io`

### Manual test (no trigger yet)

```bash
gcloud config set project YOUR_PROJECT_ID

# Build only (no secrets needed)
gcloud builds submit --config=cloudbuild.build-only.yaml
```

---

## B. Store Cycode / FOSSA / Sonar credentials in Secret Manager

```bash
PROJECT_ID=$(gcloud config get-value project)
SA="$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')@cloudbuild.gserviceaccount.com"

# Create secrets (paste real values when prompted / via --data-file)
echo -n "YOUR_CYCODE_CLIENT_ID"     | gcloud secrets create CYCODE_CLIENT_ID --data-file=-
echo -n "YOUR_CYCODE_CLIENT_SECRET" | gcloud secrets create CYCODE_CLIENT_SECRET --data-file=-
echo -n "YOUR_FOSSA_API_KEY"        | gcloud secrets create FOSSA_API_KEY --data-file=-
echo -n "YOUR_SONAR_TOKEN"          | gcloud secrets create SONAR_TOKEN --data-file=-

# Allow Cloud Build to read them
for S in CYCODE_CLIENT_ID CYCODE_CLIENT_SECRET FOSSA_API_KEY SONAR_TOKEN; do
  gcloud secrets add-iam-policy-binding "$S" \
    --member="serviceAccount:${SA}" \
    --role="roles/secretmanager.secretAccessor"
done
```

Then point the trigger at **`cloudbuild.yaml`** and set `_ENABLE_*=true` one by one.

---

## C. How Cloud Build calls each scanner

Defined in [`cloudbuild.yaml`](../cloudbuild.yaml):

| Step | What it runs |
|------|----------------|
| `npm-ci` / `build-*` | Same monorepo builds as local |
| `cycode-scan` | `pip install cycode` then `cycode scan` (SAST, SCA, secrets) |
| `fossa-scan` | Install FOSSA CLI → `fossa analyze` → `fossa test` |
| `sonar-scan` | Official `sonar-scanner` image using `sonar-project.properties` |

Secrets are injected via `availableSecrets` → `secretEnv` (not plain env vars in the YAML).

---

## D. Vendor account setup (same as office)

### Cycode
1. [app.cycode.com](https://app.cycode.com) (or Ford Cycode URL)
2. Create CLI client id/secret → Secret Manager as above
3. Trigger: `_ENABLE_CYCODE=true`

### FOSSA
1. [app.fossa.com](https://app.fossa.com) → API token
2. Secret: `FOSSA_API_KEY`
3. `_ENABLE_FOSSA=true`

### SonarCloud or SonarQube
1. Create project; set `sonar.projectKey` / `sonar.organization` in `sonar-project.properties`
2. Secret: `SONAR_TOKEN`
3. `_SONAR_HOST_URL=https://sonarcloud.io` **or** your SonarQube Server URL
4. `_ENABLE_SONAR=true`

---

## E. Protect `main` + require Cloud Build check

1. GitHub → branch protection on `main`: require PR, no direct push.
2. After Cloud Build GitHub app posts status checks, require the Cloud Build check name (shown on the PR).
3. Until Cloud Build is connected, you can temporarily require GitHub Actions **Build**.

---

## F. GitHub Actions (optional / temporary)

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) mirrors the same scans for people without GCP yet.

To prefer GCloud only later:
- Disable Actions: repo **Settings → Actions → Disable**, or delete/rename the workflow file.

---

## G. Day-to-day

```bash
git checkout main && git pull
git checkout -b feature/short-description
# commit...
git push -u origin HEAD
gh pr create --base main
# Watch Cloud Build in GCP Console → Cloud Build → History
# Merge when the trigger is green
```
