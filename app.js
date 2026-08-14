const API_URL = "http://localhost:3000/api";
const USER_ID = "demo-user-123"; // Replace with dynamically authenticated User ID in production

const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(Number(n) || 0);
const money2 = n => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
const num = id => Number($(id)?.value) || 0;

// Fetch profile from backend database API
async function get() {
  try {
    const res = await fetch(`${API_URL}/profile/${USER_ID}`);
    return await res.json();
  } catch {
    return {};
  }
}

// Save profile to backend API
async function save(p) {
  p.userId = USER_ID;
  await fetch(`${API_URL}/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p)
  });
}

function result(id, html, cls = "") {
  const e = $(id);
  if (!e) return;
  e.className = "result show " + cls;
  e.innerHTML = html;
}

function status(p) {
  const income = Number(p.income) || 0,
        fixed = (Number(p.essentials) || 0) + (Number(p.debt_payment || p.debtPayment) || 0),
        flex = income - fixed,
        run = p.essentials ? ((Number(p.savings) || 0) / Number(p.essentials)) : 0;
  return { income, fixed, flex, run };
}

async function renderSnapshot() {
  const p = await get(), s = status(p);
  if (!$("snapshot")) return;
  let cls = s.flex < 0 ? "bad" : s.flex < 300 ? "tight" : s.run < 1 ? "watch" : "";
  $("snapshot").className = "status " + cls;
  $("snapshot").innerHTML = `<strong>${s.flex < 0 ? "Let's make a plan." : s.flex < 300 ? "Things are a little tight." : s.run < 3 ? "You've got some room to build." : "You've got breathing room."}</strong><p>Flexible cash after essentials and debt: <b>${money(s.flex)}/month</b>. Savings runway: <b>${s.run.toFixed(1)} months</b>.</p>`;
}

function nav() {
  let page = document.body.dataset.page;
  document.querySelectorAll("nav a").forEach(a => a.classList.toggle("active", a.dataset.page === page));
}

async function fillProfile() {
  const p = await get();
  ["province","household","income","essentials","groceryBudget","savings","debt","debtPayment","occupation","educationLevel","targetIncome","studyTolerance","workStyle","interest"].forEach(id => {
    const dbKey = id.replace(/([A-Z])/g, "_$1").toLowerCase();
    if ($(id) && (p[id] !== undefined || p[dbKey] !== undefined)) {
      $(id).value = p[id] !== undefined ? p[id] : p[dbKey];
    }
  });
  renderSnapshot();
}

async function payday() {
  const cash = num("cash"), days = Math.max(1, num("days")), bills = num("bills"), buffer = num("buffer"), avail = cash - bills - buffer, d = avail / days;
  result("paydayResult", `<span class="kicker">Daily ceiling</span><div class="big">${money2(Math.max(0, d))}</div><p>${avail < 0 ? "Your bills and protected buffer exceed the cash entered." : `You have ${money2(avail)} available across ${days} days.`}</p><div class="bar"><i style="width:${Math.min(100, Math.max(0, d / 50 * 100))}%"></i></div><b>Recommendation:</b> ${avail < 0 ? "Move or reduce a bill before payday." : "Treat this as a ceiling, not a spending target."}`, avail < 0 ? "bad" : d < 10 ? "tight" : d < 25 ? "watch" : "");
}

async function basket() {
  const now = num("basketNow"),
        ref = num("basketRef"),
        days = Math.max(1, num("basketDays")),
        chg = ref ? ((now - ref) / ref * 100) : 0,
        monthly = now / days * 30.4375;
        
  const p = await get();
  const budget = Number(p.grocery_budget || p.groceryBudget) || 0;
  
  // Live benchmark details from backend
  let statCanData = { reference_period: "Recent", region: "Canada", source_name: "Statistics Canada" };
  try {
    const res = await fetch(`${API_URL}/data/groceries`);
    const stats = await res.json();
    if (stats.length > 0) statCanData = stats[0];
  } catch (e) {}

  result("basketResult", `
    <span class="kicker">Basket change</span>
    <div class="big">${chg >= 0 ? "+" : ""}${chg.toFixed(1)}%</div>
    <p>${money2(now)} for ${days} days ≈ <b>${money2(monthly)}/month</b> at this pace.</p>
    ${budget ? `<p>Your profile budget is ${money(budget)} — this pace is ${monthly > budget ? "above" : "below"} it by ${money(Math.abs(monthly - budget))}.</p>` : ""}
    <blockquote style="margin-top:10px; font-size:0.85em; opacity:0.8;">
      <b>Live Data Layer:</b> Regional benchmark [${statCanData.region}] — Reference: ${statCanData.reference_period} (${statCanData.source_name}).
    </blockquote>
  `, chg > 10 ? "tight" : chg > 4 ? "watch" : "");
}

async function init() {
  nav();
  await fillProfile();
  const f = $("profileForm");
  if (f) {
    f.addEventListener("submit", async e => {
      e.preventDefault();
      let p = {};
      ["province","household","income","essentials","groceryBudget","savings","debt","debtPayment","occupation","educationLevel","targetIncome","studyTolerance","workStyle","interest"].forEach(id => {
        let el = $(id);
        p[id] = el.type === "number" ? Number(el.value) || 0 : el.value;
      });
      await save(p);
      await renderSnapshot();
      location.href = "finance.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
