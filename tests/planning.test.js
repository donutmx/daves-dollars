import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateState,projectWorth,netWorth,monthlyPayment} from '../dist/model.js';
import {projectPlan,effectiveWorth,fundingSummary,incomeAtYear} from '../dist/planning.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1e-6,Math.abs(b)*1e-10),`${a} != ${b}`);
function lean(){const s=newState();for(const key of Object.keys(s.home))if(!['age','loanTermYears'].includes(key))s.home[key]=0;s.home.householdGrossAnnual=120000;s.budget.currentHousing=1000;for(const g of ['cash','investments','property','vehicles','belongings','other','debts'])for(const r of s.worth[g])r.rate=0;s.worth.years=2;return s;}
test('migration preserves manual money and housing defaults, restricted types survive renaming',()=>{
 const s=newState();delete s.planning;delete s.budget.housing;const r=s.worth.investments.find(r=>r.id==='529');delete r.accountType;delete r.allowGeneralWithdrawals;r.name='My vacation?';r.monthly=123;
 validateState(s);assert.equal(s.planning.useBudgetSavings,false);assert.equal(s.budget.housing,'current');assert.equal(r.accountType,'529');assert.equal(r.allowGeneralWithdrawals,false);assert.equal(r.monthly,123);
 s.budget.housing='proposed';validateState(s);assert.equal(s.budget.housing,'proposed');
 s.planning.incomeGrowthPct=Infinity;assert.throws(()=>validateState(s));
});
test('Budget linking replaces matching savings and never mutates manual inputs',()=>{
 const s=lean();s.home.pre401k=500;s.home.rothIRA=200;s.home.emergencyFund=100;s.home.college529=50;s.home.taxableInvestments=150;s.planning.useBudgetSavings=true;s.worth.investments[0].monthly=999;
 const w=effectiveWorth(s);near(w.investments[0].monthly,500);near(projectPlan(s).end.added,24000);assert.equal(s.worth.investments[0].monthly,999);
 const f=fundingSummary(s);near(f.plannedContributions,1000);near(f.remaining,8000);
});
test('employer match is an addition, never household spending, and stops at contribution age',()=>{
 const s=lean();s.worth.investments[0].monthly=100;s.planning.employerMatchMonthly=200;s.worth.stopAge=36;
 const p=projectPlan(s);near(p.end.added,1200);near(p.end.employerAdded,2400);near(p.end.total,3600);near(p.funding.remaining,8900);near(p.fundingPoints[1].employerMatch,0);
});
test('annual income and contribution growth are independent with explicit future income replacement',()=>{
 const s=lean();s.worth.investments[0].monthly=100;s.planning.incomeGrowthPct=10;s.planning.contributionGrowthPct=5;
 near(projectPlan(s).end.added,2460);near(incomeAtYear(s,1),132000);
 Object.assign(s.planning,{incomeChangeEnabled:true,incomeChangeAge:36,incomeChangeAnnual:24000});near(incomeAtYear(s,1),24000);near(incomeAtYear(s,2),26400);
});
test('restricted accounts stay in net worth but cannot fund general withdrawals by default',()=>{
 const s=lean(),r=s.worth.investments.find(r=>r.id==='529');r.value=12000;r.name='Renamed account';s.worth.years=1;s.worth.withdrawalAge=35;s.worth.withdrawalMonthly=1000;
 near(netWorth(s.worth).total,12000);near(projectPlan(s).end.unfunded,12000);near(projectPlan(s).end.total,12000);
 r.allowGeneralWithdrawals=true;near(projectPlan(s).end.unfunded,0);near(projectPlan(s).end.total,0);
});
test('inflation adjusted withdrawals grow from today and retain exact nominal/real distinction',()=>{
 const s=lean();s.worth.cash[0].value=100000;s.worth.inflation=12;s.worth.years=1;s.worth.withdrawalAge=35;s.worth.withdrawalMonthly=1000;s.planning.inflationAdjustedWithdrawals=true;
 const requested=Array.from({length:12},(_,m)=>1000*1.12**(m/12)).reduce((a,b)=>a+b,0),p=projectPlan(s);
 near(p.end.withdrawn,requested);near(p.end.real,p.end.total/1.12);
});
test('funding detects unfunded saving without double charging Budget deductions',()=>{
 const s=lean();s.home.householdGrossAnnual=0;s.worth.investments[2].monthly=1000;near(projectPlan(s).end.added,24000);assert.ok(fundingSummary(s).shortfall>=1000);
 s.home.householdGrossAnnual=120000;s.home.car1Payment=500;s.worth.debts[1].value=50000;s.worth.debts[1].payment=500;near(fundingSummary(s).remaining,7500);
 s.worth.debts[1].payment=700;near(fundingSummary(s).remaining,7300);
});
test('missing linked destinations and match destination are explicitly reported',()=>{
 const s=lean();s.planning.useBudgetSavings=true;s.home.pre401k=500;s.planning.employerMatchMonthly=100;s.worth.investments=[];
 const p=projectPlan(s);near(p.end.added,0);near(p.end.employerAdded,0);assert.equal(p.funding.warnings.length,2);
});
test('forecast chart ledger reconciles growth, additions, employer money, debt and withdrawals',()=>{
 const s=lean();s.worth.cash[0].value=10000;s.worth.cash[0].rate=-10;s.worth.investments[0].monthly=100;s.planning.employerMatchMonthly=200;s.worth.debts[0].value=5000;s.worth.debts[0].payment=100;s.worth.debts[0].rate=6;s.worth.withdrawalAge=35;s.worth.withdrawalMonthly=50;
 const p=projectPlan(s);for(const r of p.points)near(r.total,p.start.total+r.added+r.employerAdded+r.growth+r.paid-r.interest-r.withdrawn);
});
test('contractual note rate amortizes a mortgage, fee-inclusive APR is not substituted',()=>{
 const s=lean();s.worth.years=30;Object.assign(s.worth.debts[0],{value:300000,rate:6,payment:monthlyPayment(300000,6,30)});near(projectWorth(s.worth,35).end.liabilities,0);
});

test('current housing already includes its mortgage payment',()=>{
 const s=lean();s.worth.debts[0].value=50000;s.worth.debts[0].payment=700;near(fundingSummary(s).remaining,9000);
 s.worth.debts[0].payment=1200;near(fundingSummary(s).remaining,8800);
});
