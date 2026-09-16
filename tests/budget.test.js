import test from 'node:test';
import assert from 'node:assert/strict';
import {HOME_DEFAULTS,newState,validateState,affordability} from '../dist/model.js';
import {budgetSummary,reviewSummary,parseCSV} from '../dist/budget.js';
import {HELP,FIELD_HELP} from '../dist/content.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<.001,`${a} != ${b}`);
const base=()=>({...Object.fromEntries(Object.keys(HOME_DEFAULTS).map(k=>[k,0])),age:35,loanTermYears:30,householdGrossAnnual:120000,homePrice:120000,interestRate:0,downPaymentPct:0,pre401k:1000,incomeTaxRate:20,payrollTaxRate:7.65,groceries:500,healthInsurance:200,rothIRA:300});
test('budget deducts retirement and insurance once, replacing rent with proposed housing',()=>{
 const h=base(),b=budgetSummary(h,{currentHousing:1500});
 near(b.takeHome,6435);near(b.essential,700);near(b.currentRemaining,3935);near(b.proposedHousing,120000/360);near(b.proposedRemaining,5101.6666666667);
 near(b.proposedRemaining,affordability(h).bufferAtTarget);
 near(b.proposedRemaining-b.currentRemaining,1500-120000/360);
});
test('each shared expense affects both budgets once',()=>{
 const h=base(),b=budgetSummary(h,{currentHousing:1500}),next=budgetSummary({...h,groceries:620},{currentHousing:1500});near(b.currentRemaining-next.currentRemaining,120);near(b.proposedRemaining-next.proposedRemaining,120);
});
test('older saved scenarios retain their inputs and acquire budget defaults',()=>{
 const s=newState();delete s.budget;s.home.householdGrossAnnual=234567;validateState(s);assert.equal(s.home.householdGrossAnnual,234567);assert.equal(s.budget.currentHousing,1487);s.mode='budget';validateState(s);s.budget.annualFields=['unknown'];assert.throws(()=>validateState(s));
});
test('CSV review normalizes annual spending and monthly income without mutating the plan',()=>{
 const h=base(),before=structuredClone(h),r=reviewSummary('field,amount,period\r\nhouseholdGrossAnnual,9000,monthly\r\ntravel,2400,annual\r\ncurrentHousing,1600,monthly',h);assert.deepEqual(r.map(x=>x.value),[108000,200,1600]);assert.deepEqual(h,before);
});
test('CSV rejects duplicates, negatives, unknown fields, wrong periods and invalid contributions',()=>{
 for(const text of ['groceries,10,monthly\ngroceries,20,monthly','groceries,-1,monthly','__proto__,1,monthly','groceries,10,weekly','pre401k,999999,monthly','groceries,,monthly'])assert.throws(()=>reviewSummary('field,amount,period\n'+text,base()));
 assert.throws(()=>parseCSV('"unclosed'));assert.deepEqual(parseCSV('a,b\n"hello, world","one""two"'),[['a','b'],['hello, world','one"two']]);
});
test('every household input has explanatory help and income starts at the verified median',()=>{
 assert.equal(HOME_DEFAULTS.householdGrossAnnual,83730);for(const key of Object.keys(HOME_DEFAULTS))assert.ok(HELP[FIELD_HELP[key]]?.[1]?.length>30,key);
});
