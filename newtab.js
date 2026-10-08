/* FI Countdown — new tab page.
 * Fill these two in after publishing:
 *   REVIEW_URL    -> your Chrome Web Store listing URL (enables the rating nudge)
 *   SUBSCRIBE_URL -> your newsletter signup URL, e.g. Substack (enables email capture)
 * Leave empty ("") and the related UI stays in a graceful "coming soon" state.
 */
const REVIEW_URL = "";
const SUBSCRIBE_URL = "";

const DEFAULTS = {
  assets: 100000,       // invested assets, USD
  annualSpending: 40000, // annual spending, USD
  realReturn: 5,        // expected real return, % per year
  monthlySaving: 2000,  // monthly savings, USD
  opens: 0,             // new-tab open counter (rating nudge)
  ratedDismissed: false,
  subscribed: false,
};

const RING_C = 2 * Math.PI * 84;

const $ = (id) => document.getElementById(id);

function fmtMoney(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/* Years to reach target given principal P, annual savings A, real return r. */
function yearsToFI(P, annualSave, r, target) {
  if (P >= target) return 0;
  if (annualSave <= 0) return Infinity;
  if (r <= 0) return (target - P) / annualSave;
  const ratio = (target * r + annualSave) / (P * r + annualSave);
  if (ratio <= 1) return 0;
  return Math.log(ratio) / Math.log(1 + r);
}

function render(s) {
  const target = s.annualSpending * 25; // 4% rule
  const r = s.realReturn / 100;
  const annualSave = s.monthlySaving * 12;
  const years = yearsToFI(s.assets, annualSave, r, target);
  const pct = Math.min(100, (s.assets / target) * 100);

  const ringFg = $("ringFg");
  ringFg.style.strokeDasharray = String(RING_C);
  ringFg.style.strokeDashoffset = String(RING_C * (1 - pct / 100));

  const big = $("yearsBig");
  const label = $("yearsLabel");
  if (!isFinite(years)) {
    big.textContent = "—";
    label.textContent = "not on track at this pace";
  } else if (years <= 0) {
    big.textContent = "0";
    label.textContent = "you're financially independent";
  } else {
    big.textContent = years.toFixed(1);
    label.textContent = years === 1 ? "year to FI" : "years to FI";
  }

  $("progressPct").textContent = pct.toFixed(1) + "%";
  $("statTarget").textContent = fmtMoney(target);
  $("statAssets").textContent = fmtMoney(s.assets);
  $("statSaving").textContent = fmtMoney(s.monthlySaving);

  // Insight: what does an extra $200/mo buy?
  const insight = $("insight");
  if (isFinite(years) && years > 0) {
    const sooner = yearsToFI(s.assets, annualSave + 200 * 12, r, target);
    if (isFinite(sooner) && sooner < years - 0.05) {
      insight.textContent =
        "Tip: save $200/mo more and reach FI " + (years - sooner).toFixed(1) + " years sooner.";
    } else {
      insight.textContent = "";
    }
  } else {
    insight.textContent = "";
  }

  // Prefill settings form
  $("inAssets").value = s.assets;
  $("inSpending").value = s.annualSpending;
  $("inReturn").value = s.realReturn;
  $("inSaving").value = s.monthlySaving;
}

function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { t.hidden = true; }, 2600);
}

function maybeShowRateNudge(s) {
  const nudge = $("rateNudge");
  if (!REVIEW_URL || s.opens < 5 || s.ratedDismissed) {
    nudge.hidden = true;
    return;
  }
  nudge.hidden = false;
  $("rateLink").href = REVIEW_URL;
}

async function init() {
  const stored = await chrome.storage.local.get(DEFAULTS);
  const s = Object.assign({}, DEFAULTS, stored);

  s.opens = (s.opens || 0) + 1;
  await chrome.storage.local.set({ opens: s.opens });

  render(s);
  maybeShowRateNudge(s);

  $("settingsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const next = {
      assets: Math.max(0, Number($("inAssets").value) || 0),
      annualSpending: Math.max(1, Number($("inSpending").value) || 0),
      realReturn: Math.min(20, Math.max(0, Number($("inReturn").value) || 0)),
      monthlySaving: Math.max(0, Number($("inSaving").value) || 0),
    };
    await chrome.storage.local.set(next);
    Object.assign(s, next);
    render(s);
    showToast("Saved.");
  });

  const proMsg = () => showToast("Pro is coming soon — free for early users.");
  $("proScenarios").addEventListener("click", proMsg);
  $("proExport").addEventListener("click", proMsg);

  $("rateDismiss").addEventListener("click", async () => {
    $("rateNudge").hidden = true;
    await chrome.storage.local.set({ ratedDismissed: true });
  });

  $("subscribeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("subEmail").value.trim();
    if (!email) return;
    const note = $("subNote");
    if (SUBSCRIBE_URL) {
      window.open(SUBSCRIBE_URL, "_blank", "noopener");
      note.textContent = "Thanks! Opening the signup page…";
    } else {
      // No newsletter wired up yet: keep the address locally so nothing is lost.
      const list = (await chrome.storage.local.get({ emailList: [] })).emailList;
      if (!list.includes(email)) {
        list.push(email);
        await chrome.storage.local.set({ emailList: list });
      }
      note.textContent = "You're on the list — we'll notify you here when Pro launches.";
    }
    note.hidden = false;
    await chrome.storage.local.set({ subscribed: true });
  });
}

document.addEventListener("DOMContentLoaded", init);
