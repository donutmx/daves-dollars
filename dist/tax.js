// 2026 W-2 wage planning, not a tax return. Sources: IRS Publication 505 (2026),
// IRS Topic 560 and SSA 2026 COLA fact sheet. Checked September 12, 2026.
export const TAX_FIELDS={taxMode:0,filingStatus:1,wageEarners:0,secondEarnerPct:50,stateTaxRate:0};
export const TAX_SCHEDULES=[
 {name:'Single',deduction:16100,bands:[12400,50400,105700,201775,256225,640600],medicareThreshold:200000},
 {name:'Married filing jointly',deduction:32200,bands:[24800,100800,211400,403550,512450,768700],medicareThreshold:250000},
 {name:'Head of household',deduction:24150,bands:[17700,67450,105700,201750,256200,640600],medicareThreshold:200000}
];
export function progressiveTax(taxable,bands){let tax=0,lower=0;const rates=[.1,.12,.22,.24,.32,.35,.37];for(let i=0;i<rates.length;i++){const upper=bands[i]??Infinity;tax+=Math.max(0,Math.min(taxable,upper)-lower)*rates[i];lower=upper;}return tax;}
export function wageTax2026(h,annual=h.householdGrossAnnual){
 const schedule=TAX_SCHEDULES[h.filingStatus??1],retirement=Math.min(annual,h.pre401k*12),incomeAfterRetirement=Math.max(0,annual-retirement);
 const taxable=Math.max(0,incomeAfterRetirement-schedule.deduction),federal=progressiveTax(taxable,schedule.bands);
 const share=h.filingStatus===1&&h.wageEarners===1?h.secondEarnerPct/100:0;
 const socialSecurity=(Math.min(184500,annual*(1-share))+Math.min(184500,annual*share))*.062;
 const medicare=annual*.0145+Math.max(0,annual-schedule.medicareThreshold)*.009;
 const state=incomeAfterRetirement*(h.stateTaxRate??0)/100;
 return {federal,state,socialSecurity,medicare,taxable,deduction:schedule.deduction,total:federal+state+socialSecurity+medicare,retirement};
}
export function takeHomeAtAnnual(h,annual){const t=wageTax2026(h,annual);return (annual-t.retirement-t.total)/12;}
export function requiredWageIncome(h,monthlyNeed){
 let lo=h.pre401k*12,hi=Math.max(lo+1,monthlyNeed*24,10000);
 while(takeHomeAtAnnual(h,hi)<monthlyNeed&&hi<1e13)hi*=2;
 if(takeHomeAtAnnual(h,hi)<monthlyNeed)throw new RangeError('Income requirement exceeds the supported planning range.');
 for(let i=0;i<90;i++){const mid=(lo+hi)/2;if(takeHomeAtAnnual(h,mid)<monthlyNeed)lo=mid;else hi=mid;}
 return hi;
}
