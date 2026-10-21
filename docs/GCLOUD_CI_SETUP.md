# Google Cloud CI setup — step by step (project → Cloud Build → scans)

This guide takes you from **zero GCP** to a working **Cloud Build** pipeline that runs on GitHub PRs, with optional **Cycode / FOSSA / Sonar**.

**Time:** ~30–60 minutes (plus waiting for vendor accounts if you don’t have Cycode/FOSSA/Sonar yet).

**You need:**
- A Google account (personal is fine for learning; use Ford GCP if your team gives you a project)
- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed (optional but recommended)
- This repo pushed to GitHub: `mounishmars/fordfacilitybooking`
- Branch with `cloudbuild.yaml` merged or available on the default branch / PR branch

---

## Step 0 — Install / login to gcloud (CLI)

Skip if you only want the Console UI.

```bash
# macOS (Homebrew)
brew install --cask google-cloud-sdk

gcloud init
# or:
gcloud auth login
gcloud auth application-default login
```

Confirm:

```bash
gcloud auth list
gcloud version
```

---

## Step 1 — Create a GCP project

### Option A — Console (easiest)

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Top bar → project picker → **New Project**.
3. Fill in:
   - **Project name:** e.g. `ford-facility-booking`
   - **Project ID:** note this (e.g. `ford-facility-booking-123456`) — unique, hard to change later
   - **Organization / Billing:** use your org if Ford provides one; personal projects need a billing account linked (Cloud Build free tier exists but billing is usually required to enable APIs)
4. Click **Create**.
5. Select that project in the top picker.

### Option B — CLI

```bash
# List billing accounts (need one linked)
gcloud billing accounts list

export PROJECT_ID="ford-facility-booking-$RANDOM"   # pick a unique id
export BILLING_ACCOUNT="XXXXXX-XXXXXX-XXXXXX"     # from list above

gcloud projects create "$PROJECT_ID" --name="Ford Facility Booking"
gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
gcloud config set project "$PROJECT_ID"
```

Verify:

```bash
gcloud config get-value project
```

---

## Step 2 — Enable Cloud Build + Secret Manager APIs

### Console

1. Go to **APIs & Services** → **Library**.
2. Search and **Enable**:
   - **Cloud Build API**
   - **Secret Manager API**
3. (Optional but useful) **Cloud Resource Manager API**, **IAM API** — often already on.

### CLI

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com
```

Wait until commands finish with no errors.

---

## Step 3 — Grant Cloud Build a service account (permissions)

Cloud Build uses a default service account:

```text
PROJECT_NUMBER@cloudbuild.gserviceaccount.com
```

### Find project number

**Console:** **IAM & Admin** → **Settings** → Project number  

**CLI:**

```bash
gcloud projects describe "$(gcloud config get-value project)" --format='value(projectNumber)'
```

### Grant roles (CLI)

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Enough to run builds and read secrets (add more later for deploy)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/logging.logWriter"
```

**Console alternative:** **IAM & Admin** → **IAM** → find the Cloud Build SA → **Edit** → add:
- Cloud Build Service Account / Builder (often present)
- **Secret Manager Secret Accessor**
- **Logs Writer**

---

## Step 4 — Connect the GitHub repository to Cloud Build

### Console (recommended first time)

1. Open **Cloud Build** → **Triggers**  
   Direct link pattern: `https://console.cloud.google.com/cloud-build/triggers?project=YOUR_PROJECT_ID`
2. If prompted, choose region (e.g. `us-central1` or `global` for triggers UI).
3. Click **Connect Repository** (or **Create Trigger** → connect).
4. Source: **GitHub (Cloud Build GitHub App)**.
5. Authenticate with GitHub as **mounishmars**.
6. Select repository: **`mounishmars/fordfacilitybooking`**.
7. Confirm installation of the **Google Cloud Build** GitHub App on that repo (or your account).
8. Finish connection.

You should see the repo listed under connected repositories.

### Notes

- Use the **same GitHub user** that owns the repo (`mounishmars`).
- If the app isn’t installed: GitHub → **Settings** → **Applications** → **Google Cloud Build** → configure → grant access to `fordfacilitybooking`.

---

## Step 5 — Create a build-only trigger (no secrets yet)

Do this first so PRs get a green/red **build** without Cycode/FOSSA/Sonar.

### Console

1. **Cloud Build** → **Triggers** → **Create Trigger**.
2. Settings:

| Field | Value |
|--------|--------|
| Name | `pr-build-only` |
| Event | **Pull request** |
| Source | `mounishmars/fordfacilitybooking` |
| Base branch | `^main$` (regex) or `main` |
| Comment control | Optional (require `/gcbrun` if you want manual) |
| Configuration | **Cloud Build configuration file** |
| Location | Repository |
| Cloud Build config file | `cloudbuild.build-only.yaml` |

3. **Create**.

### Test it

1. Open or update a PR into `main` (e.g. PR #1).
2. GCP Console → **Cloud Build** → **History** — you should see a build start.
3. On the GitHub PR → **Checks** — Cloud Build status appears after the GitHub App posts it.

### Manual submit (without PR)

From your laptop in the repo root:

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud builds submit --config=cloudbuild.build-only.yaml
```

---

## Step 6 — Create Secret Manager secrets (Cycode / FOSSA / Sonar)

Get tokens from each vendor first (see Step 8). Then store them in GCP.

### CLI (recommended)

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Create secrets — replace YOUR_* with real values
printf '%s' 'YOUR_CYCODE_CLIENT_ID'     | gcloud secrets create CYCODE_CLIENT_ID --data-file=-
printf '%s' 'YOUR_CYCODE_CLIENT_SECRET' | gcloud secrets create CYCODE_CLIENT_SECRET --data-file=-
printf '%s' 'YOUR_FOSSA_API_KEY'        | gcloud secrets create FOSSA_API_KEY --data-file=-
printf '%s' 'YOUR_SONAR_TOKEN'          | gcloud secrets create SONAR_TOKEN --data-file=-

# If secret already exists, add a new version instead:
# printf '%s' 'NEW_VALUE' | gcloud secrets versions add CYCODE_CLIENT_ID --data-file=-

# Allow Cloud Build to read each secret
for S in CYCODE_CLIENT_ID CYCODE_CLIENT_SECRET FOSSA_API_KEY SONAR_TOKEN; do
  gcloud secrets add-iam-policy-binding "$S" \
    --member="serviceAccount:${CB_SA}" \
    --role="roles/secretmanager.secretAccessor"
done
```

### Console

1. **Security** → **Secret Manager** → **Create Secret**.
2. Create four secrets with these **exact names** (must match `cloudbuild.yaml`):

| Secret name | Value |
|-------------|--------|
| `CYCODE_CLIENT_ID` | from Cycode |
| `CYCODE_CLIENT_SECRET` | from Cycode |
| `FOSSA_API_KEY` | from FOSSA |
| `SONAR_TOKEN` | from SonarCloud/SonarQube |

3. For each secret → **Permissions** → **Grant access** → principal = Cloud Build SA → role **Secret Manager Secret Accessor**.

**Important:** `cloudbuild.yaml` lists these under `availableSecrets`. If a secret name is missing, the **full** config build fails at start. Use `cloudbuild.build-only.yaml` until all four exist.

---

## Step 7 — Create the full PR trigger (`cloudbuild.yaml`)

### Console

1. **Triggers** → **Create Trigger** (or edit the previous one).
2. Settings:

| Field | Value |
|--------|--------|
| Name | `pr-ci-full` |
| Event | **Pull request** |
| Base branch | `main` |
| Config file | `cloudbuild.yaml` |

3. Open **Advanced** → **Substitution variables** → add:

| Variable | Initial value | Meaning |
|----------|---------------|---------|
| `_ENABLE_CYCODE` | `false` | flip to `true` when ready |
| `_ENABLE_FOSSA` | `false` | flip to `true` when ready |
| `_ENABLE_SONAR` | `false` | flip to `true` when ready |
| `_SONAR_HOST_URL` | `https://sonarcloud.io` | or your SonarQube Server URL |
| `_NODE_VERSION` | `20` | Node image tag |

4. **Create**.

5. (Optional) Disable or delete `pr-build-only` so you don’t run two builds per PR.

### Enable scans one by one

Edit the trigger → set `_ENABLE_CYCODE=true` → save → push an empty commit / re-run trigger on a PR → confirm Cycode step in build logs.  
Then enable FOSSA, then Sonar.

---

## Step 8 — Get Cycode / FOSSA / Sonar tokens

### 8.1 Cycode

1. Open [https://app.cycode.com](https://app.cycode.com) (or your company Cycode URL).
2. Sign in / create account.
3. Go to **Service accounts** / **API credentials** / **CLI** (label varies).
4. Create credentials → copy **Client ID** and **Client Secret**.
5. Put them in Secret Manager (`CYCODE_CLIENT_ID`, `CYCODE_CLIENT_SECRET`).
6. Set trigger `_ENABLE_CYCODE=true`.

What Cloud Build runs (from `cloudbuild.yaml`):

```bash
pip install cycode
cycode scan --severity-threshold HIGH -t sast path ./
cycode scan --severity-threshold HIGH -t sca path ./
cycode scan --severity-threshold HIGH -t secret path ./
```

### 8.2 FOSSA

1. Open [https://app.fossa.com](https://app.fossa.com).
2. **Settings** → **Integrations** / **API** → create **API token**.
3. Store as secret `FOSSA_API_KEY`.
4. Set `_ENABLE_FOSSA=true`.

Cloud Build runs: `fossa analyze` then `fossa test` (fails on policy violations).

### 8.3 SonarCloud (SaaS) or SonarQube Server

**SonarCloud**

1. [https://sonarcloud.io](https://sonarcloud.io) → Log in with GitHub.
2. Import `mounishmars/fordfacilitybooking` (or create project manually).
3. Copy **organization** key and **project key**.
4. Edit repo file `sonar-project.properties`:

```properties
sonar.projectKey=YOUR_PROJECT_KEY
sonar.organization=YOUR_ORG_KEY
sonar.projectName=Ford Facility Booking
```

5. **My Account** → **Security** → Generate token → Secret Manager `SONAR_TOKEN`.
6. Trigger: `_SONAR_HOST_URL=https://sonarcloud.io`, `_ENABLE_SONAR=true`.

**SonarQube Server (on‑prem / Ford)**

1. Create project in your SonarQube UI.
2. Generate analysis token → `SONAR_TOKEN`.
3. Set `_SONAR_HOST_URL=https://sonarqube.your-company.com` (no trailing path usually).
4. Set `sonar.projectKey` in `sonar-project.properties` (no `sonar.organization`).
5. `_ENABLE_SONAR=true`.

Commit any `sonar-project.properties` changes on a feature branch via PR.

---

## Step 9 — Protect GitHub `main` (no direct push)

1. GitHub → repo → **Settings** → **Branches** → **Add branch ruleset** / protection rule.
2. Branch name: `main`.
3. Enable:
   - Require a pull request before merging
   - Require status checks to pass
   - Block force pushes
4. After Cloud Build has posted at least one check, select the Cloud Build check as required (name appears under status checks — often like `cloudbuild/...` or the trigger name).
5. Until Cloud Build is connected, you may temporarily require GitHub Actions **Build**.

---

## Step 10 — End-to-end verification checklist

| # | Action | Pass? |
|---|--------|--------|
| 1 | `gcloud config get-value project` shows your project | ☐ |
| 2 | Cloud Build + Secret Manager APIs enabled | ☐ |
| 3 | GitHub repo connected in Cloud Build | ☐ |
| 4 | `gcloud builds submit --config=cloudbuild.build-only.yaml` succeeds | ☐ |
| 5 | PR shows Cloud Build check | ☐ |
| 6 | Four secrets exist + Cloud Build SA can access | ☐ |
| 7 | Trigger uses `cloudbuild.yaml` | ☐ |
| 8 | `_ENABLE_CYCODE=true` → Cycode step green in logs | ☐ |
| 9 | `_ENABLE_FOSSA=true` → FOSSA step green | ☐ |
| 10 | `_ENABLE_SONAR=true` → Sonar step green | ☐ |
| 11 | `main` protected; merge only via PR | ☐ |

---

## Common errors

| Error | Fix |
|-------|-----|
| Billing must be enabled | Link a billing account to the project |
| Permission denied on secrets | Grant `roles/secretmanager.secretAccessor` to Cloud Build SA |
| Secret not found / FAILED_PRECONDITION | Create secrets with **exact** names before using `cloudbuild.yaml` |
| GitHub not connected | Reinstall Cloud Build GitHub App; use `mounishmars` account |
| Sonar organization missing | Set `sonar.organization` in `sonar-project.properties` for SonarCloud |
| Two builds per PR | Disable duplicate triggers |
| Cycode/FOSSA fail auth | Re-check secret values (no newline typos — use `printf '%s'`) |

---

## Quick command cheat sheet

```bash
gcloud config set project YOUR_PROJECT_ID

# Build only
gcloud builds submit --config=cloudbuild.build-only.yaml

# Full config (needs secrets)
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_ENABLE_CYCODE=true,_ENABLE_FOSSA=false,_ENABLE_SONAR=false

# Watch builds
gcloud builds list --limit=5
```

---

## What you are *not* doing in GCloud

- GCloud does **not** replace Cycode, FOSSA, or Sonar — it only **hosts the pipeline**.
- You still create vendor accounts and put their tokens in **Secret Manager**.
- Deploy (Cloud Run / GKE) is a **later** Cloud Build stage — not required for CI scans.
