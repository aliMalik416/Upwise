const KEY="upwise.profile.v1";
const SOURCES=[
 {name:"Financial Consumer Agency of Canada",topic:"Emergency funds & budgeting",url:"https://www.canada.ca/en/financial-consumer-agency/services/savings-investments/setting-up-emergency-funds.html",note:"FCAC says to start with a realistic amount and ideally work toward 3–6 months of regular expenses."},
 {name:"Bank of Canada",topic:"Household financial stability",url:"https://www.bankofcanada.ca/publications/financial-stability-report/financial-stability-report-2026/households/",note:"The 2026 Financial Stability Report says household debt remains elevated and financial pressure differs across households."},
 {name:"Statistics Canada",topic:"Food Price Data Hub",url:"https://www.statcan.gc.ca/en/topics-start/food-price",note:"Official food-price resources include average retail prices and food-price indicators."},
 {name:"Job Bank Canada",topic:"Career planning & labour market",url:"https://www.jobbank.gc.ca/career-planning",note:"Occupation information includes wages, education requirements, skills and outlooks."},
 {name:"Statistics Canada",topic:"Graduate earnings by field of study",url:"https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3710028701",note:"Current longitudinal tables report median employment income 2, 5 and 10 years after graduation by qualification and field."}
];

const CAREERS=[
 {name:"Data / Business Analyst",interest:["Technology","Business"],style:["Analytical","Structured","Independent"],study:["1–2 years","2–4 years","As long as it takes"],income:70000,fit:"Analytical work, business context and measurable problem-solving."},
 {name:"Project Coordinator / Project Manager",interest:["Business","Technology","Public service"],style:["Structured","People-focused","Flexible"],study:["Up to 1 year","1–2 years","2–4 years"],income:65000,fit:"Planning, communication, coordination and keeping work moving."},
 {name:"Skilled Trades / Technician",interest:["Trades"],style:["Hands-on","Independent","Structured"],study:["Up to 1 year","1–2 years","2–4 years"],income:65000,fit:"Practical work, visible outputs and technical skill-building."},
 {name:"Health Services",interest:["Health"],style:["People-focused","Structured"],study:["1–2 years","2–4 years","As long as it takes"],income:60000,fit:"People-centered work with structured training and strong service demand."},
 {name:"Teacher / Education Support",interest:["Education"],style:["People-focused","Structured"],study:["2–4 years","As long as it takes"],income:60000,fit:"Teaching, communication and helping people learn."},
 {name:"Public Service / Policy",interest:["Public service","Business"],style:["Structured","Analytical","People-focused"],study:["1–2 years","2–4 years","As long as it takes"],income:65000,fit:"Structured organizations, analysis and public-facing outcomes."},
 {name:"Creative / Communications",interest:["Creative","Business"],style:["Flexible","People-focused","Independent"],study:["Not really","Up to 1 year","1–2 years"],income:55000,fit:"Writing, visual communication, storytelling and flexible project work."},
 {name:"Science / Lab / Technical",interest:["Science","Health"],style:["Analytical","Structured","Independent"],study:["2–4 years","As long as it takes"],income:65000,fit:"Evidence-based work, technical environments and structured problem solving."}
];

function profile(){
  try{return JSON.parse(localStorage.getItem(KEY))||{};}catch(e){return {}}
}
function saveProfile(p){localStorage.setItem(KEY,JSON.stringify(p));}
function num(id){return Number(document.getElementById(id)?.value)||0}
function money(n){return new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD",maximumFractionDigits:0}).format(n||0)}
function money2(n){return new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD",minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0)}
function clamp(n,a=0,b=100){return Math.max(a,Math.min(b,n))}
function setResult(id,html,status=""){const el=document.getElementById(id);el.className="result show "+status;el.innerHTML=html}
function statusClass(x){return x>=75?"":x>=50?"watch":x>=25?"tight":"alert"}
function monthsOfRunway(p){const essential=p.essentials||0; return essential?((p.savings||0)/essential):0}

function hydrate(){
  const p=profile();
  const ids=["province","household","income","essentials","groceryBudget","savings","debt","debtPayment","occupation","educationLevel","targetIncome","studyTolerance","workStyle","interest"];
  ids.forEach(id=>{const el=document.getElementById(id); if(el && p[id]!==undefined) el.value=p[id]});
  const ci=document.getElementById("careerInterest"); if(ci&&p.interest)ci.value=p.interest;
  const cs=document.getElementById("careerStyle"); if(cs&&p.workStyle)cs.value=p.workStyle;
  const csi=document.getElementById("careerStudy"); if(csi&&p.studyTolerance)csi.value=p.studyTolerance;
  const inc=document.getElementById("careerIncome"); if(inc&&p.targetIncome)inc.value=p.targetIncome;
  renderProfile(); renderFinance(); renderGroceries(); renderSources();
}
function renderProfile(){
  const p=profile(), run=monthsOfRunway(p), flex=(p.income||0)-(p.essentials||0)-(p.debtPayment||0);
  const status=flex>=500&&run>=3?"Doing alright":flex>=200&&run>=1?"You've got some room":flex>=0?"A little tight":"Let's make a plan";
  document.getElementById("profileSnapshot").innerHTML=`<span class="kicker">Your snapshot</span><h2>${status}</h2>
  <p>Based on the numbers you've shared so far.</p>
  <div class="metric-grid" style="margin-top:18px"><div class="metric"><span class="label">Take-home</span><div class="value">${money(p.income)}</div></div>
  <div class="metric"><span class="label">Flex after essentials + debt</span><div class="value">${money(flex)}</div></div>
  <div class="metric"><span class="label">Savings runway</span><div class="value">${run.toFixed(1)} mo</div></div>
  <div class="metric"><span class="label">Debt</span><div class="value">${money(p.debt)}</div></div></div>
  <div class="bar"><i style="width:${clamp(run/6*100)}%"></i></div>
  <p class="micro">Emergency-fund context: FCAC suggests ideally working toward 3–6 months of regular expenses, while also encouraging realistic small starts.</p>`;
}
function renderFinance(){
  const p=profile(), income=p.income||0, essential=p.essentials||0, debtPay=p.debtPayment||0, flex=income-essential-debtPay, run=monthsOfRunway(p);
  const score=clamp((flex/(Math.max(income,1))*100)*0.6 + (clamp(run/6*100))*0.4);
  const cls=score>=70?"":score>=50?"watch":score>=30?"tight":"alert";
  document.getElementById("financeStatus").className="status-card "+cls;
  document.getElementById("financeStatus").innerHTML=`<div class="status-title">${score>=70?"You've got some breathing room.":score>=50?"You're in a watch zone.":score>=30?"Things are a little tight.":"Let's make a plan."}</div><p class="status-sub">This is an Upwise snapshot, not a financial-health diagnosis. It combines cash-flow flexibility and savings runway.</p>`;
  document.getElementById("financeMetrics").innerHTML=[
    ["Monthly take-home",money(income)],["Essential + debt",money(essential+debtPay)],["Flexible room",money(flex)],["Savings runway",run.toFixed(1)+" mo"]
  ].map(x=>`<div class="metric"><span class="label">${x[0]}</span><div class="value">${x[1]}</div></div>`).join("");
}
function renderGroceries(){
  const p=profile(), budget=p.groceryBudget||0;
  document.getElementById("groceryStatus").className="status-card";
  document.getElementById("groceryStatus").innerHTML=`<div class="status-title">${budget?`Your grocery budget is ${money(budget)}/month.`:"Set a grocery budget in Start Here."}</div><p class="status-sub">We'll connect grocery spending to your cash-flow and goals so a grocery change has a visible life impact.</p>`;
  document.getElementById("groceryMetrics").innerHTML=[
    ["Monthly budget",money(budget)],["Household",p.household||1],["Budget / person",budget?money(budget/(p.household||1)):"—"],["Possible annual cut","$900"]
  ].map(x=>`<div class="metric"><span class="label">${x[0]}</span><div class="value">${x[1]}</div></div>`).join("");
  drawGroceryChart();
}
function renderSources(){
  document.getElementById("sourceList").innerHTML=SOURCES.map(s=>`<article class="source-item"><span class="kicker">${s.name}</span><h3>${s.topic}</h3><p>${s.note}</p><a target="_blank" href="${s.url}">Open source →</a></article>`).join("");
}
function payday(){
  const cash=num("payCash"),days=Math.max(1,num("payDays")),bills=num("payBills"),buffer=num("payBuffer"),available=cash-bills-buffer,daily=available/days;
  const cls=available<0?"alert":daily<10?"tight":daily<25?"watch":"";
  setResult("paydayResult",`<div class="kicker">Safe ceiling</div><div class="big">${money2(Math.max(0,daily))}/day</div><p>${available<0?"Your planned bills + buffer exceed the cash you entered.":"You have "+money2(Math.max(0,available))+" available after bills and your protected buffer."}</p><div class="bar"><i style="width:${clamp(daily/50*100)}%"></i></div><div class="next"><strong>Next move:</strong> ${available<0?"Look for a bill that can move, shrink or wait.":`Treat ${money2(Math.max(0,daily))} as a ceiling, not a target.`}</div>`,cls);
}
function afford(){
  const price=num("purchase"),pay=num("purchasePayment"),savings=num("purchaseSavings"),goal=num("protectedGoal"),remaining=Math.max(0,savings-price),goalGap=Math.max(0,goal-remaining);
  const ratio=goal?savings/goal:1, cls=remaining<0?"alert":goalGap>0?"tight":ratio<1?"watch":"";
  setResult("affordResult",`<div class="kicker">Reality check</div><div class="big">${remaining>=0?money(remaining):money(remaining)}</div><p>${remaining<0?"The purchase is larger than the savings you entered.":goalGap>0?`Buying it would leave you ${money(goalGap)} below the goal you said you wanted to protect.`:"The purchase doesn't break the protected savings target."}</p><div class="next"><strong>Opportunity cost:</strong> If ${money(price)} stayed invested/saved instead, its future value could be meaningful. This prototype does not assume an investment return; it keeps that comparison explicit.</div>`,cls);
}
function payoff(balance,apr,payment){
  let bal=balance, months=0, interest=0, rate=apr/100/12;
  if(balance<=0)return {months:0,interest:0};
  if(payment<=balance*rate)return {months:Infinity,interest:Infinity};
  while(bal>0&&months<1200){let i=bal*rate;interest+=i;bal=bal+i-payment;months++;}
  return {months,interest};
}
function debtCalc(){
  const b=num("debtBalance"),apr=num("debtApr"),p=num("currentPayment"),extra=num("extraPayment"),a=payoff(b,apr,p),n=payoff(b,apr,p+extra);
  const valid=Number.isFinite(a.months)&&Number.isFinite(n.months);
  const saved=valid?Math.max(0,a.interest-n.interest):0, monthsSaved=valid?Math.max(0,a.months-n.months):0;
  setResult("debtResult",`<div class="kicker">Scenario</div><div class="big">${valid?monthsSaved+" months":"Payment too low"}</div><p>${valid?`Adding ${money(extra)}/month could shorten the modeled payoff by about ${monthsSaved} months and reduce modeled interest by about ${money(saved)}.`:"At this APR, the payment entered does not cover enough monthly interest to amortize the balance."}</p><div class="next"><strong>Method:</strong> monthly amortization using the APR you entered. Actual lender calculations can differ.</div>`,valid&&monthsSaved>0?"watch":"alert");
}
function goalCalc(){
  const saved=num("goalSaved"),target=num("goalTarget"),months=Math.max(1,num("goalMonths")),contrib=num("goalContribution"),remaining=Math.max(0,target-saved),needed=remaining/months,projected=saved+contrib*months,pct=target?clamp(saved/target*100):0;
  const cls=pct>=75?"":pct>=40?"watch":pct>0?"tight":"alert";
  setResult("goalResult",`<div class="kicker">${pct.toFixed(0)}% there</div><div class="big">${money(remaining)} left</div><p>${remaining?`You need about ${money2(needed)}/month to reach the goal in ${months} months.`:"Goal complete."}</p><div class="bar"><i style="width:${pct}%"></i></div><p>At ${money2(contrib)}/month, the simple projection is ${money(projected)} after ${months} months.</p><div class="next"><strong>Milestone:</strong> ${pct<25?"25%":pct<50?"50%":pct<75?"75%":"100%"} is the next useful checkpoint.</div>`,cls);
}
function basketCalc(){
  const now=num("basketNow"),then=num("basketThen"),hh=Math.max(1,num("basketHousehold")),days=Math.max(1,num("basketDays")),change=then?((now-then)/then*100):0,monthly=now/days*30.4375, budget=profile().groceryBudget||0;
  const cls=change>10?"tight":change>4?"watch":"";
  setResult("basketResult",`<div class="kicker">Basket change</div><div class="big">${change>=0?"+":""}${change.toFixed(1)}%</div><p>Your basket is ${money2(now)} for ${days} days, or roughly ${money2(monthly)}/month at the same pace.</p>${budget?`<p>Your profile budget is ${money(budget)}/month, so this pace is ${monthly>budget?"above":"below"} it by about ${money(Math.abs(monthly-budget))}.</p>`:""}<div class="next"><strong>Evidence note:</strong> This comparison uses the reference price you entered. It does not claim to be a national price index.</div>`,cls);
}
function dealCalc(){
  const sale=num("salePrice"),regular=num("regularPrice"),su=num("saleUnits"),ru=num("regularUnits"),discount=regular?((regular-sale)/regular*100):0, saleUnit=sale/su, regUnit=regular/ru;
  const real=regUnit?saleUnit/regUnit:1;
  setResult("dealResult",`<div class="kicker">Discount</div><div class="big">${discount.toFixed(0)}% off</div><p>Sale unit price: ${money2(saleUnit)} · Regular unit price: ${money2(regUnit)}.</p><div class="bar"><i style="width:${clamp(discount)}%"></i></div><div class="next"><strong>Plain-English take:</strong> ${discount>=25?"That is a meaningful headline discount, but check whether the package size and your actual need make it worthwhile.":"The headline discount is modest. Compare unit price and whether you would buy it at full price."}</div>`,discount>=25?"":"watch");
}
function careerCalc(){
  const interest=document.getElementById("careerInterest").value,style=document.getElementById("careerStyle").value,study=document.getElementById("careerStudy").value,target=num("careerIncome")||70000;
  const ranked=CAREERS.map(c=>{
    let s=45;
    if(c.interest.includes(interest))s+=22;
    if(c.style.includes(style))s+=18;
    if(c.study.includes(study))s+=10;
    if(target<=c.income)s+=5; else s-=Math.min(15,(target-c.income)/5000);
    return {...c,score:clamp(Math.round(s))};
  }).sort((a,b)=>b.score-a.score).slice(0,4);
  document.getElementById("careerResults").innerHTML=ranked.map((c,i)=>`<article class="career-card ${c.score<60?"watch":""}"><div style="display:flex;justify-content:space-between;gap:15px"><div><span class="kicker">Possible path ${i+1}</span><h2>${c.name}</h2></div><div class="score">${c.score}%</div></div><p>${c.fit}</p><div class="scorebar"><i style="width:${c.score}%"></i></div><p class="micro">Model inputs: interest, work style, study tolerance and target income. This is a fit comparison—not a prediction.</p></article>`).join("");
}
function educationCalc(){
  const current=num("eduCurrentIncome"),after=num("eduAfterIncome"),cost=num("eduCost")+num("eduOtherCost"),years=num("eduYears"),studyIncome=num("eduStudyIncome"),lost=Math.max(0,current*years-studyIncome*years),total=cost+lost,delta=after-current,payback=delta>0?total/delta:Infinity;
  setResult("educationResult",`<article class="career-card ${payback>5||!Number.isFinite(payback)?"watch":""}"><span class="kicker">Scenario result</span><h2>${Number.isFinite(payback)?payback.toFixed(1)+" years":"No simple payback"}</h2><p>Simple modeled payback period from an estimated ${money(current)} income to ${money(after)} income is ${Number.isFinite(payback)?payback.toFixed(1)+" years":"not reached with these inputs"}.</p><div class="metric-grid"><div class="metric"><span class="label">Direct cost</span><div class="value">${money(cost)}</div></div><div class="metric"><span class="label">Estimated income gap</span><div class="value">${money(lost)}</div></div><div class="metric"><span class="label">Total transition cost</span><div class="value">${money(total)}</div></div><div class="metric"><span class="label">Annual income delta</span><div class="value">${money(delta)}</div></div></div><div class="next"><strong>Important:</strong> this is a scenario calculator. Actual tuition, aid, taxes, employment probability, wage growth and time-to-employment can materially change the result.</div></article>`);
  drawEducationChart(current,after,years);
}
function worthCalc(){
  const price=num("worthPrice"),life=Math.max(1,num("worthLife")),hours=num("worthHours"),use=document.getElementById("worthUse").value,costPerMonth=price/life;
  const cls=use==="Rarely"?"tight":use==="Maybe"?"watch":"";
  setResult("worthResult",`<div class="kicker">Tradeoff</div><div class="big">${money2(costPerMonth)}/month</div><p>Spread over ${life} months, the purchase costs about ${money2(costPerMonth)}/month of useful life${hours?` and about ${money2(price/Math.max(1,hours))} per hour of work used to fund it`:""}.</p><div class="next"><strong>Plain-English take:</strong> ${use==="Yes"?"If you'll genuinely use it often, the cost-per-use can become more reasonable.":use==="Maybe"?"The decision is less obvious—consider waiting 48 hours or testing a cheaper version.":"Rare use makes the effective cost higher. This is a good candidate for waiting, renting or buying used."}</div>`,cls);
}
function drawGroceryChart(){
  const c=document.getElementById("groceryChart"); if(!c)return; const ctx=c.getContext("2d"),dpr=devicePixelRatio||1,w=c.clientWidth,h=220;c.width=w*dpr;c.height=h*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
  const vals=[.82,.88,.91,.86,1.02,.97,1.08], budget=profile().groceryBudget||600;const max=Math.max(...vals)*budget*1.1,min=0;
  ctx.strokeStyle="#DDD3BE";ctx.lineWidth=1;for(let i=0;i<4;i++){let y=30+i*48;ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(w-20,y);ctx.stroke()}
  ctx.strokeStyle="#566B4C";ctx.lineWidth=3;ctx.beginPath();vals.forEach((v,i)=>{let x=50+i*(w-85)/(vals.length-1),y=190-(v*budget/max*150);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();
  ctx.fillStyle="#655E52";ctx.font="12px Work Sans";["6m ago","5m","4m","3m","2m","1m","Now"].forEach((t,i)=>ctx.fillText(t,38+i*(w-85)/(vals.length-1),210));
}
function drawEducationChart(current,after,years){
  const c=document.getElementById("educationChart");if(!c)return;const ctx=c.getContext("2d"),dpr=devicePixelRatio||1,w=c.clientWidth,h=220;c.width=w*dpr;c.height=h*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
  const pts=10, max=Math.max(current,after)*1.2;ctx.strokeStyle="#DDD3BE";for(let i=0;i<4;i++){let y=25+i*48;ctx.beginPath();ctx.moveTo(35,y);ctx.lineTo(w-15,y);ctx.stroke()}
  ctx.strokeStyle="#566B4C";ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<pts;i++){let x=45+i*(w-75)/(pts-1),t=i/(pts-1)*10;let val=t<=years?current:current+(after-current)*Math.min(1,(t-years)/3);let y=185-(val/max*150);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
  ctx.fillStyle="#655E52";ctx.font="12px Work Sans";ctx.fillText("Now",40,208);ctx.fillText("Study",w/2-20,208);ctx.fillText("Year 10",w-65,208);
}
function findTool(q){
  q=q.toLowerCase();
  if(/grocery|groceries|food|basket|deal|sale/.test(q))location.hash="#groceries";
  else if(/career|job|work|salary|occupation/.test(q))location.hash="#career";
  else if(/school|education|college|university|degree|study/.test(q))location.hash="#education";
  else if(/debt|payday|budget|save|savings|income|afford|money|rent/.test(q))location.hash="#finance";
  else location.hash="#start";
}
function route(){
  let id=location.hash.slice(1)||"home"; if(id==="sources")id="sources";
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));
  if(!document.getElementById(id))document.getElementById("home").classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
}
document.addEventListener("DOMContentLoaded",()=>{
  hydrate();
  window.addEventListener("hashchange",route);
  route();
  document.getElementById("finder").addEventListener("submit",e=>{e.preventDefault();findTool(document.getElementById("finderInput").value)});
  document.getElementById("profileForm").addEventListener("submit",e=>{
    e.preventDefault();const p={};["province","household","income","essentials","groceryBudget","savings","debt","debtPayment","occupation","educationLevel","targetIncome","studyTolerance","workStyle","interest"].forEach(id=>{const el=document.getElementById(id);p[id]=el.type==="number"?Number(el.value)||0:el.value});saveProfile(p);hydrate();location.hash="#finance";
  });
  document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>{
    const a=b.dataset.action;
    if(a==="reset"){localStorage.removeItem(KEY);location.reload()}
    if(a==="payday")payday();if(a==="afford")afford();if(a==="debt")debtCalc();if(a==="goal")goalCalc();if(a==="basket")basketCalc();if(a==="deal")dealCalc();if(a==="career")careerCalc();if(a==="education")educationCalc();if(a==="worth")worthCalc();
  }));
  window.addEventListener("resize",()=>{drawGroceryChart();});
});
