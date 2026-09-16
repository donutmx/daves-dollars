import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateState,validateHome,HOME_DEFAULTS,cashflow,affordability,requiredIncome,projectWorth} from '../dist/model.js';
import {TAX_FIELDS,TAX_SCHEDULES,wageTax2026,progressiveTax} from '../dist/tax.js';
import {parseAmount,formatAmount} from '../dist/numbers.js';
import {scenarioMetrics,changedAssumptions} from '../dist/comparison.js';
import {diagnose} from '../dist/diagnosis.js';
import {validateCoachSettings} from '../dist/coach-settings.js';
import {ownershipFromQuotes} from '../dist/ownership-inputs.js';
import {comparisonTable,coachView} from '../dist/release-view.js';
const near=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
function lean(){const s=newState();for(const k of Object.keys(s.home))s.home[k]=0;Object.assign(s.home,{age:35,loanTermYears:30,householdGrossAnnual:120000,homePrice:300000,availableCash:120000,downPaymentPct:20,interestRate:6,monthlyBuffer:500});s.coachSettings.ramsey=false;s.provenance.home.householdGrossAnnual='entered';return s;}

test('2026 federal taxes agree with independent calculations for all three filing statuses',()=>{
 const h={...HOME_DEFAULTS,taxMode:1,householdGrossAnnual:100000,pre401k:0,stateTaxRate:0};
 for(const [status,federal]of [[0,13170],[1,7640],[2,9588]]){const t=wageTax2026({...h,filingStatus:status});near(t.federal,federal);near(t.socialSecurity,6200);near(t.medicare,1450);near(cashflow({...h,filingStatus:status}).takeHome,(100000-federal-7650)/12);}
});
test('2026 schedules are continuous at each bracket and have the correct head-of-household cutoffs',()=>{
 assert.deepEqual(TAX_SCHEDULES[2].bands,[17700,67450,105700,201750,256200,640600]);
 for(const s of TAX_SCHEDULES)for(const cutoff of s.bands){const lo=progressiveTax(cutoff-.01,s.bands),hi=progressiveTax(cutoff+.01,s.bands);assert.ok(hi>lo&&hi-lo<.008);}
 near(progressiveTax(0,TAX_SCHEDULES[0].bands),0);
});
test('Social Security cap applies per earner, while Additional Medicare uses joint wages',()=>{
 const h={...HOME_DEFAULTS,taxMode:1,householdGrossAnnual:400000,filingStatus:1,wageEarners:1,secondEarnerPct:50};
 const t=wageTax2026(h);near(t.socialSecurity,22878);near(t.medicare,7150);
 near(wageTax2026({...h,wageEarners:0}).socialSecurity,11439);
 near(wageTax2026({...h,filingStatus:0,householdGrossAnnual:200000}).medicare,2900);
 near(wageTax2026({...h,filingStatus:0,householdGrossAnnual:200100}).medicare,2902.35);
 near(wageTax2026({...h,secondEarnerPct:0}).socialSecurity,11439);
});
test('pretax retirement reduces ordinary taxes, but not wage payroll taxes',()=>{
 const a=wageTax2026({...HOME_DEFAULTS,taxMode:1,householdGrossAnnual:100000,pre401k:0,stateTaxRate:5,filingStatus:0});
 const b=wageTax2026({...HOME_DEFAULTS,taxMode:1,householdGrossAnnual:100000,pre401k:1000,stateTaxRate:5,filingStatus:0});
 near(a.federal-b.federal,2640);near(a.state-b.state,600);near(a.socialSecurity,b.socialSecurity);near(a.medicare,b.medicare);
});
test('reverse income solves both tax modes across filing statuses, retirement, earners and spending',()=>{
 for(const taxMode of [0,1])for(const filingStatus of [0,1,2])for(const wageEarners of [0,1])for(const price of [100000,500000,2500000]){
  const h={...HOME_DEFAULTS,taxMode,filingStatus,wageEarners,homePrice:price,pre401k:700,stateTaxRate:5};
  const r=requiredIncome(h),a=affordability({...h,householdGrossAnnual:r.annual});near(a.bufferAtTarget,h.monthlyBuffer,1e-5);
 }
});
test('saved v1 scenarios migrate tax and coach settings without resetting personalized amounts',()=>{
 const s=newState();for(const key of Object.keys(TAX_FIELDS))delete s.home[key];delete s.coachSettings;s.home.groceries=1234.56;
 const next=validateState(s);near(next.home.groceries,1234.56);assert.equal(next.home.taxMode,0);assert.equal(next.coachSettings.ramsey,true);
 assert.ok(validateHome({...next.home,taxMode:1.1}).length);assert.throws(()=>validateCoachSettings({ramsey:false,carPaymentPct:0,emergencyMonths:3}));
 assert.equal(validateHome({...next.home,taxMode:1,incomeTaxRate:60,payrollTaxRate:60}).length,0);
});
test('money entry accepts precise grouped amounts and rejects ambiguous or unfinished strings',()=>{
 for(const [text,value]of [['$ 83,730.25',83730.25],['1234.',1234],['.50',.5],['0',0],['-2.5',-2.5],['1,000,000',1000000]])assert.equal(parseAmount(text),value);
 for(const bad of ['',' ','.','-','12,34','1,23,456','1e5','Infinity','NaN','<img>','1 200','12abc'])assert.equal(parseAmount(bad),null,bad);
 assert.equal(formatAmount(1234567.89123),'1,234,567.89123');
});
test('annual ownership quotes calibrate to target price and convert premium to monthly precisely',()=>{
 const simple=ownershipFromQuotes({homePrice:400000},7200,2400);near(simple.propertyTaxRate,1.8);near(simple.homeInsurance,200);
 const q=ownershipFromQuotes({homePrice:300000},4321.99,1234.56);near(300000*q.propertyTaxRate/100,4321.99);near(q.homeInsurance*12,1234.56);
 for(const args of [[{homePrice:0},100,100],[{homePrice:400000},null,100],[{homePrice:400000},100,-1],[{homePrice:1},100,100]])assert.throws(()=>ownershipFromQuotes(...args));
});
test('comparison is nonmutating and exposes forecast, stress and account differences',()=>{
 const a=lean(),b=structuredClone(a);b.home.groceries=500;b.worth.years=40;b.stress.enabled=true;b.worth.cash[0].value=1000;
 const before=JSON.stringify([a,b]),metrics=scenarioMetrics(b),changes=changedAssumptions(a,b),html=comparisonTable(a,b);
 assert.equal(JSON.stringify([a,b]),before);assert.equal(metrics.netWorth,1000);assert.ok(changes.some(x=>x.key==='groceries'));assert.ok(changes.some(x=>x.key==='Forecast: years'));assert.ok(changes.some(x=>x.key.includes('Checking')));assert.match(html,/Different forecast horizons/);
 const old=structuredClone(a);delete old.coachSettings;delete old.home.taxMode;scenarioMetrics(old);assert.equal(old.home.taxMode,undefined);
});
test('comparison handles unlimited home budgets and escapes user-supplied account names',()=>{
 const a=lean();Object.assign(a.home,{downPaymentPct:100,closingCostPct:0});const b=structuredClone(a);b.worth.cash[0].name='<img src=x onerror=alert(1)>';
 const html=comparisonTable(a,b);assert.ok(!html.includes('<img'));assert.match(html,/&lt;img/);
 a.home.downPaymentPct=0;a.home.interestRate=0;a.home.loanTermYears=30;assert.ok(Number.isFinite(scenarioMetrics(a).homeBudget));
});
test('Dave does not judge untouched examples, empty worth or a missing home target',()=>{
 assert.equal(diagnose(newState()).mood,'neutral');const s=lean();s.mode='worth';assert.equal(diagnose(s).mood,'neutral');s.mode='backward';s.home.homePrice=0;assert.equal(diagnose(s).mood,'neutral');
 const ageOnly=newState();ageOnly.provenance.home.age='entered';assert.equal(diagnose(ageOnly).example,true);
});
test('Dave is positive for a funded plan and reacts angrily to heavy car payments with an exact threshold',()=>{
 const s=lean();assert.equal(diagnose(s).mood,'happy');s.home.car1Payment=1800;const c=diagnose(s);assert.equal(c.mood,'angry');const f=c.findings.find(x=>x.id==='car-payments');assert.match(f.detail,/18.0%/);assert.match(f.detail,/\$1,500/);assert.equal(f.action.section,'section-05');
 const before=affordability(s.home).maxHome;s.coachSettings.carPaymentPct=25;assert.equal(diagnose(s).mood,'happy');near(affordability(s.home).maxHome,before);
});
test('Dave prioritizes financial constraints over optional Ramsey preferences',()=>{
 const s=lean();s.home.availableCash=0;s.home.groceries=15000;s.coachSettings.ramsey=true;const c=diagnose(s);
 assert.equal(c.mood,'angry');assert.equal(c.findings[0].severity,3);assert.ok(c.findings.find(x=>x.id==='cash-gap'));assert.ok(c.findings.find(x=>x.id==='ramsey-home'));
 const main=affordability(s.home);s.coachSettings.ramsey=false;assert.deepEqual(affordability(s.home),main);assert.ok(!diagnose(s).findings.some(x=>x.rule==='Ramsey preference'));
});
test('Dave uses the selected Budget housing mode and does not duplicate rent',()=>{
 const s=lean();s.mode='budget';s.budget.currentHousing=1000;s.home.homePrice=3000000;
 assert.equal(diagnose(s,{housing:'current'}).mood,'happy');const c=diagnose(s,{housing:'proposed'});assert.equal(c.mood,'angry');assert.ok(c.findings.some(x=>x.id==='shortfall'));
});
test('Dave checks debt-payment assumptions, negative worth and forecast withdrawal funding',()=>{
 const s=lean();s.mode='worth';s.worth.debts[3].value=10000;let c=diagnose(s);assert.equal(c.mood,'concerned');assert.match(c.findings.find(x=>x.id==='growing-debt').detail,/unfinished entries/);
 s.worthView='future';s.worth.cash[0].value=500;s.worth.withdrawalAge=35;s.worth.withdrawalMonthly=1000;c=diagnose(s);assert.equal(c.mood,'angry');assert.equal(c.findings[0].id,'unfunded');assert.equal(c.findings.find(x=>x.id==='growing-debt').action.section,'section-07');
 assert.ok(projectWorth(s.worth,s.home.age).end.unfunded>0);
});
test('Dave explains mixed data and guards setting bounds; findings escape account names',()=>{
 const s=lean();s.mode='worth';s.worthView='future';s.worth.debts[0].value=10000;s.worth.debts[0].name='<script>alert(1)</script>';
 const c=diagnose(s),html=coachView(c,s.coachSettings);assert.ok(!html.includes('<script>'));assert.match(html,/&lt;script&gt;/);
 for(const settings of [{ramsey:true,carPaymentPct:51,emergencyMonths:3},{ramsey:'true',carPaymentPct:15,emergencyMonths:3},{ramsey:true,carPaymentPct:15,emergencyMonths:NaN}])assert.throws(()=>validateCoachSettings(settings));
});
test('a zero-start forecast still diagnoses unfunded withdrawals and permits planned saving',()=>{
 const s=newState();s.mode='worth';s.worthView='future';s.worth.years=1;s.worth.withdrawalAge=35;s.worth.withdrawalMonthly=1000;
 near(projectWorth(s.worth,35).end.unfunded,12000);let c=diagnose(s);assert.equal(c.mood,'angry');assert.equal(c.findings[0].id,'unfunded');
 s.worth.withdrawalMonthly=0;s.worth.investments[0].monthly=1000;c=diagnose(s);assert.ok(c.intro.includes('forecast'));assert.ok(projectWorth(s.worth,35).end.total>12000);
});
test('Dave does not flag floating-point dust as a monthly shortfall or missed buffer',()=>{
 for(const price of [123456,234567,345678,456789,567890]){
  const s=lean();Object.assign(s.home,{homePrice:price,availableCash:1000000,interestRate:6.76,incomeTaxRate:17.35,payrollTaxRate:7.65});
  s.home.householdGrossAnnual=requiredIncome(s.home).annual-.000001;
  assert.ok(!diagnose(s).findings.some(f=>['shortfall','thin-buffer'].includes(f.id)),String(price));
 }
});
