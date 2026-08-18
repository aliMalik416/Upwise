/* ==========================================================================
   Upwise Calculation Engine & Chart Rendering
   ========================================================================== */

const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(Number(n) || 0);
const money2 = n => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
const num = id => Number($(id)?.value) || 0;

let activeDebtChart = null;
let activeEduChart = null;

function result(id, html, cls = "") {
  const e = $(id);
  if (!e) return;
  e.className = "result show " + cls;
  e.innerHTML = html;
}

function nav() {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll("nav a").forEach(a => {
    if (a.dataset.page === page) a.classList.add("active");
  });
}

// -------------------------------------------------------------
// 1. Finance Calculators & Chart Visualizations
// -------------------------------------------------------------
function afford() {
  const item = $("item")?.value || "This purchase";
  const cost = num("cost");
  const p = JSON.parse(localStorage.getItem("upwise_profile") || "{}");

  const surplus = ((Number(p.income) || 0) / 12) - (Number(p.essentials) || 0);
  if (cost <= 0) return result("affordResult", "<p>Please enter a valid price.</p>");

  let score = "good";
  let msg = "";

  if (surplus <= 0) {
    score = "tight";
    msg = `Your monthly essentials equal or exceed income. Purchasing ${item} (${money(cost)}) increases deficit pressure.`;
  } else if (cost <= surplus * 0.5) {
    score = "good";
    msg = `${item} (${money(cost)}) uses less than half of your single-month free cash flow (${money(surplus)}).`;
  } else if (cost <= surplus) {
    score = "watch";
    msg = `${item} fits within one month's surplus (${money(surplus)}), but depletes your extra cash buffer.`;
  } else {
    score = "tight";
    msg = `${item} exceeds your monthly surplus (${money(surplus)}). Requires ~${(cost / surplus).toFixed(1)} months of complete savings.`;
  }

  result("affordResult", `<span class="kicker">Affordability Analysis</span><div class="big">${money(cost)}</div><p>${msg}</p>`, score);
}

function debt() {
  const balance = num("balance");
  const rate = num("rate") / 100 / 12;
  const payment = num("payment");
  const extra = num("extra");

  if (balance <= 0 || payment <= 0) return result("debtResult", "<p>Please enter valid balance and payment amounts.</p>");

  if (payment <= balance * rate) {
    return result("debtResult", `<p class="tight">Payment does not cover monthly interest (${money(balance * rate)}). Balance will continue growing.</p>`, "tight");
  }

  // Calculate Payoff Timelines
  function calc(pmt) {
    let b = balance, months = 0, interest = 0;
    while (b > 0 && months < 360) {
      let i = b * rate;
      interest += i;
      b = b + i - pmt;
      months++;
    }
    return { months, interest };
  }

  const base = calc(payment);
  const acc = calc(payment + extra);

  result("debtResult", `
    <span class="kicker">Payoff Timeline</span>
    <p>Standard pace: <b>${base.months} months</b> (${(base.months/12).toFixed(1)} yrs) | Total interest: <b>${money(base.interest)}</b></p>
    ${extra > 0 ? `<p class="good">Accelerated pace (+${money(extra)}/mo): <b>${acc.months} months</b> | Saves <b>${money(base.interest - acc.interest)}</b>!</p>` : ""}
    <div class="chart-container"><canvas id="debtChartCanvas"></canvas></div>
  `);

  renderDebtChart(balance, rate, payment, extra);
}

function renderDebtChart(balance, rate, payment, extra) {
  const ctx = document.getElementById("debtChartCanvas")?.getContext("2d");
  if (!ctx) return;
  if (activeDebtChart) activeDebtChart.destroy();

  const labels = [];
  const baseData = [];
  const accData = [];

  let b1 = balance, b2 = balance, m = 0;
  while ((b1 > 0 || b2 > 0) && m <= 120) {
    labels.push(`Mo ${m}`);
    baseData.push(Math.max(0, b1));
    accData.push(Math.max(0, b2));

    if (b1 > 0) b1 = b1 + (b1 * rate) - payment;
    if (b2 > 0) b2 = b2 + (b2 * rate) - (payment + extra);
    m++;
  }

  activeDebtChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        { label: "Standard Payoff", data: baseData, borderColor: "#d99b26", tension: 0.3, fill: false },
        { label: "Accelerated (+Extra)", data: accData, borderColor: "#2b4c3f", tension: 0.3, fill: true, backgroundColor: "rgba(43, 76, 63, 0.08)" }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }
  });
}

function goal() {
  const current = num("saved");
  const target = num("target");
  const months = num("months") || 12;
  const monthly = num("contribution");

  const req = (target - current) / months;
  if (req <= 0) return result("goalResult", "<div class=\"big\">Goal Met!</div><p>Current balance exceeds target.</p>", "good");

  result("goalResult", `
    <span class="kicker">Savings Plan</span>
    <p>Required target contribution: <b>${money(req)}/month</b> for ${months} months.</p>
    ${monthly > 0 ? `<p>Your current pace (${money(monthly)}/mo) puts you on track to reach <b>${money(current + (monthly * months))}</b>.</p>` : ""}
  `);
}

// -------------------------------------------------------------
// 2. Groceries & Unit Deals
// -------------------------------------------------------------
function deal() {
  const sale = num("sale"), reg = num("regular");
  const sU = num("saleUnits") || 1, rU = num("regularUnits") || 1;

  if (!sale || !reg) return result("dealResult", "<p>Please enter prices to compare.</p>");

  const sUnit = sale / sU, rUnit = reg / rU;
  const discount = ((rUnit - sUnit) / rUnit) * 100;

  result("dealResult", `
    <span class="kicker">Unit Price Result</span>
    <div class="big">${discount > 0 ? "Save " + discount.toFixed(1) + "%" : "No Savings"}</div>
    <p>Sale: <b>${money2(sUnit)}</b>/unit vs Regular: <b>${money2(rUnit)}</b>/unit.</p>
  `, discount >= 15 ? "good" : discount < 0 ? "tight" : "watch");
}

async function basket() {
  const now = num("basketNow"), ref = num("basketRef"), days = num("basketDays") || 7;
  if (!now || !ref) return result("basketResult", "<p>Enter basket figures.</p>");

  const chg = ((now - ref) / ref) * 100;
  result("basketResult", `
    <span class="kicker">Pace Analysis</span>
    <div class="big">${chg >= 0 ? "+" : ""}${chg.toFixed(1)}%</div>
    <p>${money2(now)} for ${days} days ≈ <b>${money2((now / days) * 30.4)}/month</b>.</p>
  `, chg > 10 ? "tight" : "good");
}

// -------------------------------------------------------------
// 3. Career & Education ROI
// -------------------------------------------------------------
function career() {
  const interest = $("careerInterest")?.value;
  const style = $("careerStyle")?.value;
  const targetInc = num("careerIncome") || 70000;

  const paths = [
    { title: "Data Analyst / BI Developer", field: "Technology", style: "Analytical", salary: 75000 },
    { title: "Electrician / Skilled Trades", field: "Trades", style: "Hands-on", salary: 78000 },
    { title: "Project Coordinator", field: "Business", style: "Structured", salary: 68000 },
    { title: "Healthcare Practitioner", field: "Health", style: "People-focused", salary: 85000 }
  ];

  let matches = paths.map(p => {
    let score = 50;
    if (p.field === interest) score += 25;
    if (p.style === style) score += 15;
    if (p.salary >= targetInc) score += 10;
    return { ...p, score };
  }).sort((a, b) => b.score - a.score);

  let html = `<span class="kicker">Matches</span><div style="margin-top:12px">`;
  matches.forEach(m => {
    html += `<div class="card" style="margin-bottom:10px; padding:16px;">
      <h3 style="margin:0">${m.title}</h3>
      <p style="font-size:0.9em; margin:4px 0;">Median Salary: <b>${money(m.salary)}</b> | Match Score: <b>${m.score}/100</b></p>
    </div>`;
  });
  result("careerResults", html + `</div>`);
}

function education() {
  const curInc = num("cur"), futureInc = num("after");
  const tuition = num("eduCost"), other = num("otherCost");
  const years = num("eduYears") || 1, during = num("during");

  const totalCost = (tuition + other) + ((curInc - during) * years);
  const annualGain = futureInc - curInc;

  if (annualGain <= 0) return result("eduResult", `<div class="big tight">Negative ROI</div><p>Future income doesn't exceed current earning level.</p>`, "tight");

  const paybackYears = (totalCost / annualGain).toFixed(1);

  result("eduResult", `
    <span class="kicker">Breakeven Analysis</span>
    <div class="big">${paybackYears} Years</div>
    <p>Total Transition Investment: <b>${money(totalCost)}</b> | Annual Income Boost: <b>+${money(annualGain)}/yr</b></p>
  `, paybackYears <= 3 ? "good" : "watch");
}

// -------------------------------------------------------------
// Initialization
// -------------------------------------------------------------
async function init() {
  nav();
  const p = await loadUserProfile();

  ["province","household","income","essentials","groceryBudget","savings","debt","debtPayment","occupation","educationLevel","targetIncome","studyTolerance","workStyle","interest"].forEach(id => {
    if ($(id) && p[id] !== undefined) $(id).value = p[id];
  });

  $("profileForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    let p = {};
    ["province","household","income","essentials","groceryBudget","savings","debt","debtPayment","occupation","educationLevel","targetIncome","studyTolerance","workStyle","interest"].forEach(id => {
      if ($(id)) p[id] = $(id).value;
    });
    await saveUserProfile(p);
    alert("Profile saved successfully!");
  });
}

document.addEventListener("DOMContentLoaded", init);
