import {projectPlan,PLANNING_DEFAULTS} from './planning.js';
import {validateState,applyStress,affordability,requiredIncome,netWorth} from './model.js';
import {budgetSummary} from './budget.js';
export function scenarioMetrics(input){
 const state=validateState(structuredClone(input)),h=applyStress(state.home,state.stress),a=affordability(h),b=budgetSummary(state.home,state.budget),p=projectPlan(state);
 return {homeBudget:a.maxHome,requiredIncome:requiredIncome(h).annual,targetPrice:h.homePrice,cashGap:a.cashGap,currentRemaining:b.currentRemaining,proposedRemaining:b.proposedRemaining,netWorth:netWorth(state.worth).total,futureWorth:p.end.total,futureReal:p.end.real,targetAge:state.home.age+state.worth.years,years:state.worth.years,stress:state.stress.enabled,taxMode:h.taxMode,unfunded:p.end.unfunded};
}
export function changedAssumptions(left,right){
 const changes=[];
 for(const k of Object.keys(left.home))if(left.home[k]!==right.home[k])changes.push({key:k,left:left.home[k],right:right.home[k]});
 if(left.budget.currentHousing!==right.budget.currentHousing)changes.push({key:'currentHousing',left:left.budget.currentHousing,right:right.budget.currentHousing});
 if((left.budget.housing??'current')!==(right.budget.housing??'current'))changes.push({key:'Budget housing',left:left.budget.housing??'current',right:right.budget.housing??'current'});
 for(const k of Object.keys(PLANNING_DEFAULTS)){const a=left.planning?.[k]??PLANNING_DEFAULTS[k],b=right.planning?.[k]??PLANNING_DEFAULTS[k];if(a!==b)changes.push({key:`Planning: ${k}`,left:a,right:b});}
 for(const k of Object.keys(left.stress))if(left.stress[k]!==right.stress[k])changes.push({key:`Stress: ${k}`,left:left.stress[k],right:right.stress[k]});
 for(const k of ['years','inflation','stopAge','withdrawalAge','withdrawalMonthly'])if(left.worth[k]!==right.worth[k])changes.push({key:`Forecast: ${k}`,left:left.worth[k],right:right.worth[k]});
 for(const group of ['cash','investments','property','vehicles','belongings','other','debts']){
  const a=new Map(left.worth[group].map(r=>[r.id,r])),b=new Map(right.worth[group].map(r=>[r.id,r]));
  for(const id of new Set([...a.keys(),...b.keys()]))for(const key of ['name','value','rate',group==='debts'?'payment':'monthly',...(group==='debts'?[]:['accountType','allowGeneralWithdrawals'])])if(a.get(id)?.[key]!==b.get(id)?.[key])changes.push({key:`${group} · ${a.get(id)?.name||b.get(id).name} · ${key}`,left:a.get(id)?.[key],right:b.get(id)?.[key]});
 }
 return changes;
}
