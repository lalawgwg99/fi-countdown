# FI Countdown — Financial Independence New Tab

A Chrome extension (Manifest V3) that replaces the new-tab page with a daily
reminder of how far you are from financial independence.

- Big number: **years to FI**, computed with the 4% rule (FI target = annual spending × 25)
- Progress ring: % of the FI target already saved
- One-line insight: "Save $200/mo more and reach FI X years sooner"
- Settings stored locally with `chrome.storage` — no account, no server, nothing leaves the browser
- Free v1. Pro features ("Compare scenarios", "Export PDF") are stubbed as
  **"Pro · Coming soon"** so free users know the boundary from day one

## Try it locally

1. Open `chrome://extensions`, enable Developer mode
2. "Load unpacked" → select this folder
3. Open a new tab

## Before publishing to the Chrome Web Store

1. In `newtab.js`, fill in `REVIEW_URL` (your store listing URL, enables the ★ rating nudge)
   and `SUBSCRIBE_URL` (your newsletter signup URL, enables email capture).
   Leave them empty and both stay in a graceful "coming soon" state.
2. In `privacy-policy.html`, replace `hello@example.com` with a real contact address,
   host the file somewhere public (e.g. GitHub Pages), and paste that URL as the
   privacy policy in the store listing.
3. Take 5 screenshots (1280×800) of the new-tab page for the listing.

Suggested store title (keyword-first for Chrome Web Store SEO):

> **FI Countdown — Financial Independence New Tab**

## Verify the math

```bash
node --check newtab.js && python3 - <<'EOF'
import math
def years(P, A, r, T):
    if P >= T: return 0
    if A <= 0: return float('inf')
    if r <= 0: return (T - P) / A
    return math.log((T*r + A) / (P*r + A)) / math.log(1 + r)
# 100k assets, $2k/mo savings, 5% real return, $1M target -> ~19.2 years
print(round(years(100000, 24000, 0.05, 1000000), 2))
# +$200/mo -> sooner
print(round(years(100000, 26400, 0.05, 1000000), 2))
EOF
```

## Pricing plan (from research)

- v1 free, grow installs
- Paid: one-time **$29–49** lifetime (not subscription) via ExtensionPay/Paddle
