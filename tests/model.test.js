import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateHome,validateState,monthlyPayment,cashflow,housing,affordability,requiredIncome,applyStress,netWorth,projectWorth,benchmark,ASSET_GROUPS,HOME_DEFAULTS,projectionYears} from '../dist/model.js';
import {diagnose as coach} from '../dist/diagnosis.js';
import {HELP,FIELD_HELP,LABELS,SOURCES} from '../dist/content.js';
const near=(a,b,tolerance=.005)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
const cleanWorth=()=>{const w=newState().worth;for(const g of ASSET_GROUPS)w[g]=[];w.debts=[];w.stopAge=120;w.withdrawalAge=120;w.inflation=0;w.years=1;return w};
const asset=(value,rate=0,monthly=0)=>({id:'test',name:'Test',value,rate,monthly});

test('default plan is valid, backward first, with two vehicles and one belonging',()=>{
 const s=newState();assert.equal(validateState(s),s);assert.equal(s.mode,'backward');assert.equal(s.worth.vehicles.length,2);assert.equal(s.worth.belongings.length,1);
});
test('standard mortgage agrees with a known independent example',()=>near(monthlyPayment(300000,6,30),1798.651575458));
test('zero-interest and cash purchases do not divide by zero',()=>{near(monthlyPayment(120000,0,10),1000);near(monthlyPayment(0,6,30),0);const h={...HOME_DEFAULTS,downPaymentPct:100};assert.equal(housing(h,300000).loan,0);assert.equal(housing(h,300000).pi,0)});
test('PMI applies below 20 percent and stops at 20 percent',()=>{const h={...HOME_DEFAULTS,downPaymentPct:10,pmiRate:1.2};near(housing(h,100000).pmi,90);assert.equal(housing({...h,downPaymentPct:20},100000).pmi,0)});
test('retirement lowers modeled income tax but does not lower payroll tax',()=>{
 const a=cashflow({...HOME_DEFAULTS,householdGrossAnnual:120000,pre401k:0,incomeTaxRate:20,payrollTaxRate:7.65});
 const b=cashflow({...HOME_DEFAULTS,householdGrossAnnual:120000,pre401k:1000,incomeTaxRate:20,payrollTaxRate:7.65});
 near(b.payrollTax,765);near(a.incomeTax-b.incomeTax,200);near(a.takeHome-b.takeHome,800);
});
test('cash cap includes closing costs and preserves cash reserve',()=>{
 const a=affordability({...HOME_DEFAULTS,householdGrossAnnual:1000000,availableCash:100000,downPaymentPct:20,closingCostPct:3,cashReserve:15000});
 near(a.maxHome,85000/.23);near(a.maximum.cashRequired,100000);assert.equal(a.limitedBy,'cash');
});
test('target cash shortfall uses desired price instead of a capped affordable price',()=>{
 const h={...HOME_DEFAULTS,homePrice:500000,downPaymentPct:20,availableCash:100000,cashReserve:15000,closingCostPct:3};const a=affordability(h);near(a.cashGap,30000);assert.ok(a.maxHome<h.homePrice);
});
test('insufficient income and insufficient reserve produce a zero home budget',()=>{
 assert.equal(affordability({...HOME_DEFAULTS,householdGrossAnnual:0}).maxHome,0);
 assert.equal(affordability({...HOME_DEFAULTS,availableCash:5000,cashReserve:15000}).maxHome,0);
});
test('reverse income solves the same monthly budget equation across varied plans',()=>{
 for(const rate of [0,.01,3,6.75,20])for(const down of [0,10,20,100]){
  const h={...HOME_DEFAULTS,interestRate:rate,downPaymentPct:down,pre401k:1500,homePrice:400000,availableCash:1e8};
  const r=requiredIncome(h),f=cashflow({...h,householdGrossAnnual:r.annual});
  near(f.takeHome-f.nonHousing-r.home.total,h.monthlyBuffer);
 }
});
test('monthly-budget boundary is feasible and a higher price exceeds it',()=>{
 const h={...HOME_DEFAULTS,availableCash:1e8,householdGrossAnnual:200000};const a=affordability(h);assert.equal(a.limitedBy,'budget');
 near(housing(h,a.maxHome).total,a.housingBudget);assert.ok(housing(h,a.maxHome+100).total>a.housingBudget);
});
test('a cash purchase with no variable ownership costs is still cash-constrained',()=>{
 const h={...HOME_DEFAULTS,downPaymentPct:0,closingCostPct:0,cashReserve:0,loanTermYears:30,householdGrossAnnual:1000000};
 // A fully cash-funded purchase is cash-constrained; no-cost mathematical housing needs a zero loan factor.
 const cash=affordability({...h,downPaymentPct:100,availableCash:400000,propertyTaxRate:0,maintenancePct:0});
 near(cash.maxHome,400000);assert.equal(cash.budgetLimit,null);
});
test('stress changes all applicable results without mutating the base plan',()=>{
 const s=newState();s.home.interestRate=6.75;s.home.groceries=800;s.home.healthInsurance=500;const original=structuredClone(s.home);s.stress.enabled=true;
 const h=applyStress(s.home,s.stress);assert.deepEqual(s.home,original);near(h.interestRate,7.75);near(h.groceries,920);near(h.healthInsurance,600);assert.ok(requiredIncome(h).annual>requiredIncome(original).annual);
});
test('net worth subtracts loans once from full asset values and supports negative equity',()=>{
 const w=cleanWorth();w.property=[asset(300000)];w.vehicles=[asset(20000,10)];w.cash=[asset(5000)];w.debts=[{...asset(350000),payment:0}];
 const n=netWorth(w);near(n.assets,325000);near(n.liabilities,350000);near(n.total,-25000);
});
test('compound growth agrees with the annual formula at 1, 10, and 100 years',()=>{
 for(const years of [1,10,100]){const w=cleanWorth();w.years=years;w.investments=[asset(10000,6)];near(projectWorth(w,18).end.total,10000*1.06**years,.001)}
});
test('end-month additions match the ordinary-annuity formula',()=>{
 const w=cleanWorth();w.years=10;w.investments=[asset(10000,6,100)];const r=1.06**(1/12)-1;
 near(projectWorth(w,20).end.total,10000*(1+r)**120+100*((1+r)**120-1)/r);
});
test('zero return contributions stop at selected age',()=>{
 const w=cleanWorth();w.years=10;w.stopAge=22;w.cash=[asset(1000,0,100)];near(projectWorth(w,20).end.total,3400);
});
test('vehicle and belonging depreciation compound and cannot fall below zero',()=>{
 const w=cleanWorth();w.years=3;w.vehicles=[asset(20000,10)];w.belongings=[asset(1000,100)];const p=projectWorth(w,30);
 near(p.end.total,20000*.9**3);assert.equal(p.assets.find(x=>x.group==='belongings').value,0);
});
test('loan payments stop at zero, unpaid interest grows, and principal is not an asset',()=>{
 const w=cleanWorth();w.debts=[{id:'a',name:'Payoff',value:1000,rate:0,payment:200},{id:'b',name:'Growing',value:1000,rate:12,payment:0}];
 const p=projectWorth(w,30);assert.equal(p.debts[0].value,0);near(p.debts[1].value,1000*1.01**12);near(p.end.paid,1000);assert.deepEqual(p.negativeAmortization,['Growing']);
});
test('withdrawals drain cash then investments and report unfunded spending',()=>{
 const w=cleanWorth();w.withdrawalAge=30;w.withdrawalMonthly=100;w.cash=[asset(200)];w.investments=[asset(300)];w.property=[asset(100000)];
 const p=projectWorth(w,30);near(p.end.withdrawn,500);near(p.end.unfunded,700);near(p.end.total,100000);
});
test('inflation adjusts nominal figures without changing balances',()=>{
 const w=cleanWorth();w.cash=[asset(1000)];w.inflation=10;w.years=2;const p=projectWorth(w,30);near(p.end.total,1000);near(p.end.real,1000/1.1**2);
});
test('projection leaves source rows untouched',()=>{const s=newState();s.worth.investments[0].value=10000;const before=structuredClone(s.worth);projectWorth(s.worth,35);assert.deepEqual(s.worth,before)});
test('invalid tax rates, nonfinite inputs and malformed saved accounts are rejected',()=>{
 assert.ok(validateHome({...HOME_DEFAULTS,incomeTaxRate:60,payrollTaxRate:40}).length);
 assert.ok(validateHome({...HOME_DEFAULTS,interestRate:NaN}).length);
 for(const edit of [s=>s.worth.years=101,s=>s.worth.years=1.5,s=>s.worth.vehicles[0].rate=-5,s=>s.worth.cash[0].id='"><script>',s=>s.worth.cash[0].value=Infinity,s=>s.version=99]){const s=newState();edit(s);assert.throws(()=>validateState(s))}
});
test('coach reactions are based on plan constraints, with honest empty-state handling',()=>{
 const s=newState();assert.equal(coach(s).mood,'neutral');s.home.availableCash=500000;s.home.householdGrossAnnual=1000000;s.provenance.home.householdGrossAnnual='entered';s.coachSettings.ramsey=false;assert.equal(coach(s).mood,'happy');s.mode='worth';assert.equal(coach(s).mood,'neutral');s.worth.debts[0].value=10000;assert.equal(coach(s).mood,'concerned');
});
test('historical benchmark boundaries select the intended age group',()=>{assert.equal(benchmark(34).worth,39000);assert.equal(benchmark(35).worth,135600);assert.equal(benchmark(100).worth,335600)});
test('age-based projections default to age 65 and reject backward or implausible ages',()=>{
 const s=newState();assert.equal(s.home.age+s.worth.years,65);assert.equal(projectionYears(40,65),25);assert.equal(projectionYears(20,120),100);
 for(const [current,target]of [[40,40],[40,39],[40,121],[18,119],[35,65.5]])assert.throws(()=>projectionYears(current,target));
});
test('every home input and field-help reference has defined copy and sources',()=>{
 for(const key of Object.keys(HOME_DEFAULTS))assert.ok(LABELS[key],key);
 for(const key of Object.values(FIELD_HELP))assert.ok(HELP[key],key);
 for(const [key,value]of Object.entries(HELP)){assert.equal(typeof value[1],'string',key);if(value[2])assert.ok(SOURCES[value[2]],key)}
});
