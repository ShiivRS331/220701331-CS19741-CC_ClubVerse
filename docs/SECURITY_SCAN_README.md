This folder contains instructions to run the security scans (CodeQL + OWASP ZAP) for the ClubVerse project.

1) CodeQL (SAST)
- The GitHub Action workflow is at `.github/workflows/codeql-analysis.yml`.
- It will run on pushes and PRs to `main` and upload SARIF results to the Security tab in GitHub.

2) OWASP ZAP Baseline (DAST)
- The GitHub Action workflow is at `.github/workflows/owasp-zap-baseline.yml`.
- It requires the public client URL to be set as a repository secret `CLIENT_PUBLIC_URL`.
- Trigger it manually (workflow_dispatch) or on push to `main`.

3) Add secrets in GitHub
- Go to your repo Settings → Secrets → Actions
- Add `CLIENT_PUBLIC_URL` with the value `https://clubverse.livelymoss-d77e8dd3.westus2.azurecontainerapps.io` (your frontend public URL)

4) Running locally
- CodeQL: install the CodeQL CLI and run analysis locally, or rely on the GitHub Action.
- ZAP: you can run ZAP locally against your public client URL.

5) Expected outputs
- CodeQL: SARIF file uploaded to GitHub security.
- ZAP: HTML report uploaded as an artifact named `zap-report`.
