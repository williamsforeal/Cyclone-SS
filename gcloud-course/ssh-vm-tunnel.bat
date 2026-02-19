@echo off
REM ════════════════════════════════════════════════════════════
REM  SSH INTO GCE VM WITH IAP TUNNEL + PORT FORWARDING
REM  Connects to "my-first-vm" and forwards local:9000 → VM:80
REM  Access your VM's web server at http://localhost:9000
REM ════════════════════════════════════════════════════════════

REM ── Set the active GCP project ─────────────────────────────
REM  All subsequent gcloud commands will target this project.
gcloud config set project gen-lang-client-0234791928

REM ── SSH into the VM with IAP tunnel and port forwarding ────
REM  --zone:               VM location in GCP
REM  --tunnel-through-iap: Routes SSH through Identity-Aware Proxy
REM                        (no public IP or firewall rules needed)
REM  -L 9000:localhost:80: Forwards local port 9000 to port 80
REM                        on the VM (access via http://localhost:9000)
gcloud compute ssh my-first-vm ^
  --zone=us-central1-a ^
  --tunnel-through-iap ^
  -- -L 9000:localhost:80

REM ── Keep the window open after SSH session ends ────────────
REM  Prevents the terminal from closing so you can see any errors.
echo.
echo SSH session ended.
pause
