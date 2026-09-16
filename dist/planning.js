import {PLANNING_DEFAULTS,projectWorth,cashflow,housing} from './model.js';
import {budgetSummary} from './budget.js';
export {PLANNING_DEFAULTS} from './model.js';
export const BUDGET_LINKS=[['cash','emergency','emergencyFund'],['investments','401k','pre401k'],['investments','roth','rothIRA'],['investments','brokerage','taxableInvestments'],['investments','529','college529']];
const settings=state=>({...PLANNING_DEFAULTS,...state.planning});
export function effectiveWorth(state){
 const w=structuredClone(state.worth),p=settings(state);
 if(p.useBudgetSavings)for(const [group,id,key]of BUDGET_LINKS){const row=w[group].find(r=>r.id===id);if(row)row.monthly=state.home[key];}
 return Object.assign(w,{employerMatchMonthly:p.employerMatchMonthly,contributionGrowthPct:p.contributionGrowthPct,inflationAdjustedWithdrawals:p.inflationAdjustedWithdrawals});
}
// Income growth changes the funding check only. It never invents contributions.
export function incomeAtYear(state,year){
 const p=settings(state),changeYear=Math.max(0,p.incomeChangeAge-state.home.age);
 return p.incomeChangeEnabled&&year>=changeYear?p.incomeChangeAnnual*Math.pow(1+p.incomeGrowthPct/100,year-changeYear):state.home.householdGrossAnnual*Math.pow(1+p.incomeGrowthPct/100,year);
}
export function fundingSummary(state,year=0,projectedDebts=null){
 const p=settings(state),w=effectiveWorth(state),active=state.home.age+year<w.stopAge,factor=active?Math.pow(1+p.contributionGrowthPct/100,year):0;
 const plannedContributions=[...w.cash,...w.investments].reduce((s,r)=>s+r.monthly*factor,0),retirement=(w.investments.find(r=>r.id==='401k')?.monthly??0)*factor;
 const income=incomeAtYear(state,year),h={...state.home,householdGrossAnnual:income,pre401k:Math.min(retirement,income/12)},b=budgetSummary(h,state.budget),flow=cashflow(h);
 const proposed=state.budget?.housing==='proposed',housingCost=proposed?b.proposedHousing:b.currentHousing;
 const debts=projectedDebts??w.debts;
 const payment=r=>r.value>0?Math.min(r.payment,r.value*(1+r.rate/1200)):0;
 const debtPayments=debts.reduce((s,r)=>s+payment(r),0),mortgagePayment=debts.filter(r=>r.id==='mortgage').reduce((s,r)=>s+payment(r),0);
 // Budget already reserves consumer debt and housing. Reconcile overlapping rows,
 // retain unlisted Budget payments, and do not charge the mortgage twice.
 const budgetMortgage=proposed?housing(h,h.homePrice).pi:housingCost;
 const reconciledDebt=Math.max(b.debt,debtPayments-mortgagePayment)+Math.max(0,mortgagePayment-budgetMortgage);
 const availableForPlan=flow.takeHome+h.pre401k-b.essential-b.flexible-housingCost-reconciledDebt;
 const remaining=availableForPlan-plannedContributions;
 const budgetContributions=state.home.pre401k+b.savings,warnings=[];
 if(remaining<-.01)warnings.push('Planned contributions and debt payments exceed the income left after the selected Budget expenses. This forecast assumes outside funding; it does not automatically reduce contributions.');
 if(retirement>income/12)warnings.push('Planned pre-tax retirement contributions exceed modeled gross income. The tax deduction is capped at income for this funding illustration.');
 if(p.useBudgetSavings)for(const [group,id,key]of BUDGET_LINKS)if(state.home[key]>0&&!w[group].some(r=>r.id===id))warnings.push(`The Budget contribution for ${key} has no matching account and is not included in this forecast.`);
 if(p.employerMatchMonthly>0&&!w.investments.some(r=>r.id==='401k'))warnings.push('Employer match has no retirement account destination and is not included.');
 if(!p.useBudgetSavings&&Math.abs(plannedContributions-budgetContributions)>.01)warnings.push('Manual forecast contributions differ from Budget savings. The funding check uses the forecast contributions instead of deducting both.');
 if(mortgagePayment>0)warnings.push(proposed?'The forecast mortgage and proposed housing payment are treated as overlapping obligations; the larger mortgage payment is reserved. A new home purchase or replacement loan is not simulated.':'Current housing is assumed to include this mortgage payment. Only a mortgage payment exceeding total current housing adds a funding cost. If you pay rent plus a separate property loan, include both in current housing.');
 return {year,income,plannedContributions,employerMatch:active&&w.investments.some(r=>r.id==='401k')?p.employerMatchMonthly:0,budgetContributions,debtPayments,budgetDebtPayments:b.debt,availableForPlan,remaining,shortfall:Math.max(0,-remaining),warnings,housing:proposed?'proposed':'current'};
}
export function projectPlan(state){
 const w=effectiveWorth(state),projection=projectWorth(w,state.home.age);
 // Debt balances at each checkpoint keep the funding check from assuming payments
 // continue on a paid-off forecast loan. Unmapped Budget obligations remain reserved.
 let debts=w.debts.map(r=>({...r}));const fundingPoints=[];
 for(let year=0;year<=w.years;year++){
  fundingPoints.push(fundingSummary(state,year,debts));
  for(let month=0;month<12;month++)for(const d of debts)d.value=Math.max(0,d.value*(1+d.rate/1200)-d.payment);
 }
 return {...projection,funding:fundingPoints[0],fundingPoints,firstFundingShortfall:fundingPoints.find(f=>f.shortfall>.01)??null};
}
