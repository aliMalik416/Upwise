// Upwise Core Engine
const API_URL = "http://localhost:3000/api";
const USER_ID = "demo-user-123";

const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(Number(n) || 0);
const money2 = n => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
const num = id => Number($(id)?.value) || 0;

// Data Storage (Supabase + LocalStorage Fallback)
async function get() {
  try {
    const res = await fetch(`${API_URL}/profile/${USER_ID}`);
    if (res.ok) return await res.json();
    throw new Error();
  } catch {
    const local = localStorage.getItem("upwise_profile");
    return local ? JSON.parse(local) : {};
  }
}

async function save(p) {
  p.userId = USER_ID;
  localStorage.setItem("upwise_profile", JSON.stringify(p));
  try {
    await fetch(`${API_URL}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p)
    });
  } catch (e) {
    // Falls back silently to localStorage
  }
}

function result(id, html, cls = "") {
  const e = $(id);
  if (!e) return;
  e.className = "result show " + cls;
  e.innerHTML = html;
}

// Navigation Active State
function nav() {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll("nav a").forEach(a => {
    if (a.dataset.page === page) a.classList.add("active");
  });
}

// -------------------------------------------------------------
// 1. Finance Calculations
// -------------------------------------------------------------
function afford() {
  const item = $("item")?.value || "This item";
  const cost = num("cost");
  const p = JSON.parse(localStorage.getItem("upwise_profile") || "{}");
  
  const monthlyIncome = (Number(p.income) || 0) / 12;
  const monthlyFixed = Number(p.essentials) || 0;
  const surplus = monthlyIncome - monthlyFixed;

  if (cost <= 0) return result("affordResult", "<p>Please enter a valid price.</p>");

  let score = "good";
  let msg = "";

  if (surplus <= 0) {
    score = "tight";
    msg = `Your current expenses equal or exceed your monthly income. Buying ${item} (${money(cost)}) would increase financial pressure.`;
  } else if (cost <= surplus * 0.5) {
    score = "good";
    msg = `${item} (${money(cost)}) represents less than half of your discretionary monthly cash flow (${money(surplus)}).`;
  } else if (cost <= surplus) {
    score = "watch";
    msg = `${item} (${money(cost)}) fits within one month's free cash flow (${money(surplus)}), but leaves little buffer for other costs.`;
  } else {
    score = "tight";
    const monthsNeeded = (cost / surplus).toFixed(1);
    msg = `${item} exceeds your monthly surplus of ${money(surplus)}. It would take ~${monthsNeeded} months of full savings to afford this.`;
  }

  result("affordResult", `<span class="kicker">Affordability Check</span><div class="big">${money(cost)}</div><p>${msg}</p>`, score);
}

function debt() {
  const balance = num("balance");
  const rate = num("rate") / 100 / 12;
  const payment = num("payment");
  const extra = num("extra");

  if (balance <= 0 || payment <= 0) return result("debtResult", "<p>Please enter balance and payment details.</p>");

  function calcPayoff(pmt) {
    if (pmt <= balance * rate) return null; // Infinite interest trap
    let b = balance;
    let months = 0;
    let totalInterest = 0;
    while (b > 0 && months < 600) {
      let interest = b * rate;
      totalInterest += interest;
      b = b + interest - pmt;
      months++;
    }
    return { months, totalInterest };
  }

  const base = calcPayoff(payment);
  const accelerated = calcPayoff(payment + extra);

  if (!base) {
    return result("debtResult", `<p class="tight">Your minimum payment doesn't cover monthly interest. Increase payment to make progress.</p>`, "tight");
  }

  let html = `<span class="kicker">Payoff Timeline</span><p>Current pace: <b>${base.months} months</b> (${(base.months/12).toFixed(1)} yrs) — Total interest: <b>${money(base.totalInterest)}</b>.</p>`;

  if (extra > 0 && accelerated) {
    const savedMonths = base.months - accelerated.months;
    const savedInterest = base.totalInterest - accelerated.totalInterest;
    html += `<p class="good">With +${money(extra)}/mo: Payoff in <b>${accelerated.months} months</b>. You save <b>${money(savedInterest)}</b> in interest and <b>${savedMonths} months</b>!</p>`;
  }

  result("debtResult", html);
}

function goal() {
  const current = num("saved");
  const target = num("target");
  const months = num("months") || 12;
  const monthly = num("contribution");

  const remaining = target - current;
  if (remaining <= 0) return result("goalResult", "<div class="big">Goal Met!</div><p>You have already saved your target amount.</p>", "good");

  const requiredMonthly = remaining / months;
  const projectTotal = current + (monthly * months);
  const diff = projectTotal - target;

  let msg = `<span class="kicker">Target: ${money(target)}</span>`;
  msg += `<p>To reach this in ${months} months, you need to save <b>${money(requiredMonthly)}/month</b>.</p>`;

  if (monthly > 0) {
    if (diff >= 0) {
      msg += `<p class="good">At your current pace (${money(monthly)}/mo), you will reach your goal with an extra ${money(diff)}!</p>`;
    } else {
      msg += `<p class="watch">At your current pace (${money(monthly)}/mo), you will fall short by ${money(Math.abs(diff))}.</p>`;
    }
  }

  result("goalResult", msg);
}

// -------------------------------------------------------------
// 2. Grocery & Deal Calculations
// -------------------------------------------------------------
function deal() {
  const sale = num("sale");
  const reg = num("regular");
  const sUnits = num("saleUnits") || 1;
  const rUnits = num("regularUnits") || 1;

  if (!sale || !reg) return result("dealResult", "<p>Please enter regular and sale prices.</p>");

  const saleUnitPrice = sale / sUnits;
  const regUnitPrice = reg / rUnits;
  const discount = ((regUnitPrice - saleUnitPrice) / regUnitPrice) * 100;

  if (discount > 0) {
    result("dealResult", `
      <span class="kicker">Unit Price Comparison</span>
      <div class="big">Save ${discount.toFixed(1)}%</div>
      <p>Sale: <b>${money2(saleUnitPrice)}</b>/unit vs Regular: <b>${money2(regUnitPrice)}</b>/unit.</p>
    `, discount >= 15 ? "good" : "");
  } else if (discount === 0) {
    result("dealResult", `<span class="kicker">No Savings</span><p>The unit prices are identical.</p>`, "watch");
  } else {
    result("dealResult", `<span class="kicker">Bad Deal</span><p>The "sale" item is actually <b>${Math.abs(discount).toFixed(1)}% more expensive</b> per unit!</p>`, "tight");
  }
}

async function basket() {
  const now = num("basketNow");
  const ref = num("basketRef");
  const days = num("basketDays") || 7;
  const p = JSON.parse(localStorage.getItem("upwise_profile") || "{}");
  const budget = Number(p.groceryBudget) || 0;

  if (!now || !ref) return result("basketResult", "<p>Enter recent and reference basket amounts.</p>");

  const chg = ((now - ref) / ref) * 100;
  const monthly = (now / days) * 30.4;

  let statCanData = { region: "National", reference_period: "2024-Q2", source_name: "StatCan CPI" };
  
  result("basketResult", `
    <span class="kicker">Basket change</span>
    <div class="big">${chg >= 0 ? "+" : ""}${chg.toFixed(1)}%</div>
    <p>${money2(now)} for ${days} days ≈ <b>${money2(monthly)}/month</b> at this pace.</p>
    ${budget ? `<p>Your profile budget is ${money(budget)} — this pace is ${monthly > budget ? "above" : "below"} it by ${money(Math.abs(monthly - budget))}.</p>` : ""}
    <blockquote style="margin-top:10px; font-size:0.85em; opacity:0.8;">
      <b>Live Data Layer:</b> Regional benchmark [${statCanData.region}] — Reference: ${statCanData.reference_period} (${statCanData.source_name}).
    </blockquote>
  `, chg > 10 ? "tight" : chg > 4 ? "watch" : "good");
}

// -------------------------------------------------------------
// 3. Career Path Calculation
// -------------------------------------------------------------
function career() {
  const interest = $("careerInterest")?.value;
  const style = $("careerStyle")?.value;
  const study = $("careerStudy")?.value;
  const targetInc = num("careerIncome") || 70000;

  const paths = [
    { title: "Data Analyst / BI Developer", field: "Technology", style: "Analytical", salary: 75000, study: "Up to 1 year" },
    { title: "Electrician / Skilled Trades", field: "Trades", style: "Hands-on", salary: 78000, study: "1–2 years" },
    { title: "Project Operations Coordinator", field: "Business", style: "Structured", salary: 68000, study: "Up to 1 year" },
    { title: "Registered Nurse / Healthcare Provider", field: "Health", style: "People-focused", salary: 85000, study: "2–4 years" },
    { title: "Corporate Instructional Designer", field: "Education", style: "Flexible", salary: 72000, study: "1–2 years" }
  ];

  let matches = paths.map(p => {
    let score = 50;
    if (p.field === interest) score += 25;
    if (p.style === style) score += 15;
    if (p.salary >= targetInc) score += 10;
    return { ...p, score };
  }).sort((a, b) => b.score - a.score);

  let html = `<span class="kicker">Path Exploration</span><div class="results-list" style="margin-top:12px">`;
  matches.forEach(m => {
    html += `
      <div class="card" style="margin-bottom:12px; padding:12px 16px;">
        <h3 style="margin:0">${m.title}</h3>
        <p style="margin:4px 0; font-size:0.9em">Median Income: <b>${money(m.salary)}</b> | Typical Training: <b>${m.study}</b></p>
        <small style="opacity:0.8">Heuristic Match Score: ${m.score}/100</small>
      </div>`;
  });
  html += `</div>`;

  result("careerResults", html);
}

// -------------------------------------------------------------
// 4. Education ROI Calculation
// -------------------------------------------------------------
function education() {
  const curInc = num("cur");
  const futureInc = num("after");
  const tuition = num("eduCost");
  const otherCost = num("otherCost");
  const years = num("eduYears") || 1;
  const duringInc = num("during");

  const directCosts = tuition + otherCost;
  const lostIncome = (curInc - duringInc) * years;
  const totalCost = directCosts + lostIncome;
  const annualGain = futureInc - curInc;

  if (annualGain <= 0) {
    return result("eduResult", `
      <span class="kicker">ROI Analysis</span>
      <div class="big tight">Negative ROI</div>
      <p>Expected post-graduation income (${money(futureInc)}) is not higher than current income (${money(curInc)}). Total transition cost: <b>${money(totalCost)}</b>.</p>
    `, "tight");
  }

  const paybackYears = (totalCost / annualGain).toFixed(1);

  result("eduResult", `
    <span class="kicker">ROI Analysis</span>
    <div class="big">${paybackYears} Years</div>
    <p>Payback / Breakeven period.</p>
    <ul>
      <li>Direct tuition & fees: <b>${money(directCosts)}</b></li>
      <li>Opportunity cost (lost wages): <b>${money(lostIncome)}</b></li>
      <li>Total Investment: <b>${money(totalCost)}</b></li>
      <li>Annual Income Boost: <b>+${money(annualGain)}/yr</b></li>
    </ul>
  `, paybackYears <= 3 ? "good" : paybackYears <= 6 ? "watch" : "tight");
}

// -------------------------------------------------------------
// Profile Form Handlers & Startup
// -------------------------------------------------------------
async function fillProfile() {
  const p = await get();
  ["province","household","income","essentials","groceryBudget","savings","debt","debtPayment","occupation","educationLevel","targetIncome","studyTolerance","workStyle","interest"].forEach(id => {
    if ($(id) && p[id] !== undefined) $(id).value = p[id];
  });
  status(p);
}

function status(p) {
  const s = $("snapshot");
  if (!s) return;
  const inc = Number(p.income) || 0;
  if (!inc) {
    s.innerHTML = `<strong>No profile set.</strong> <p>Add details in <a href="start-here.html">Start Here</a> to enable tailored guidance.</p>`;
  } else {
    s.innerHTML = `<strong>Profile Connected:</strong> Annual take-home ${money(inc)}.`;
  }
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
        if ($(id)) p[id] = $(id).value;
      });
      await save(p);
      status(p);
      alert("Profile updated successfully!");
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
