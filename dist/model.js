import {TAX_FIELDS,wageTax2026,requiredWageIncome} from './tax.js';
import {COACH_DEFAULTS,validateCoachSettings} from './coach-settings.js';
export const PLANNING_DEFAULTS={useBudgetSavings:false,employerMatchMonthly:0,incomeGrowthPct:0,contributionGrowthPct:0,incomeChangeAge:65,incomeChangeAnnual:0,incomeChangeEnabled:false,inflationAdjustedWithdrawals:false};
export const BUDGET_DEFAULTS={currentHousing:1487,annualFields:[],housing:'current'};
export function validateBudget(b){if(b&&b.housing===undefined)b.housing='current';if(!b||!['current','proposed'].includes(b.housing)||!Number.isFinite(b.currentHousing)||b.currentHousing<0||b.currentHousing>1e9||!Array.isArray(b.annualFields)||b.annualFields.some(k=>![...Object.values(GROUPS).flat(),'otherDebtPayment'].includes(k))||new Set(b.annualFields).size!==b.annualFields.length)throw new Error('The saved budget settings are invalid.');return b;}
// Framework-independent financial math. Rates are percentages, money is USD.
export const SCHEMA_VERSION = 1;
export const HOME_DEFAULTS = {
 age:35, householdGrossAnnual:83730, homePrice:431400, availableCash:100000,
 downPaymentPct:19, closingCostPct:3, cashReserve:15000, monthlyBuffer:500,
 loanTermYears:30, interestRate:6.76, propertyTaxRate:1.2, homeInsurance:150,
 hoa:0, utilities:400, maintenancePct:1, pmiRate:.7,
 groceries:800,gas:300,daycare:0,eatingOut:400,travel:400,petExpenses:100,
 onlineShopping:200,subscriptions:100,phoneInternet:150,personalCare:100,gifts:100,misc:200,
 car1Payment:450,car1Insurance:120,car2Payment:0,car2Insurance:120,carMaintenance:100,
 healthInsurance:500,dentalVision:50,healthOOP:100,lifeInsurance:50,disabilityInsurance:0,
 rothIRA:583,taxableInvestments:0,emergencyFund:200,college529:0,pre401k:0,
 otherDebtPayment:0,incomeTaxRate:17.35,payrollTaxRate:7.65,...TAX_FIELDS
};
export const STRESS_DEFAULTS={enabled:false,rateAdj:1,lifestylePct:15,healthcarePct:20,propTaxBump:0};
export const GROUPS={
 lifestyle:['groceries','gas','daycare','eatingOut','travel','petExpenses','onlineShopping','subscriptions','phoneInternet','personalCare','gifts','misc'],
 vehicles:['car1Payment','car1Insurance','car2Payment','car2Insurance','carMaintenance'],
 healthcare:['healthInsurance','dentalVision','healthOOP'],protection:['lifeInsurance','disabilityInsurance'],
 savings:['rothIRA','taxableInvestments','emergencyFund','college529']
};
export const ASSET_GROUPS=['cash','investments','property','vehicles','belongings','other'];
export const sum=(values)=>values.reduce((a,b)=>a+b,0);
export const rowTotal=rows=>sum(rows.map(r=>r.value));
export const accountTypeFor=id=>({'401k':'retirement',roth:'roth',brokerage:'brokerage',hsa:'hsa','529':'529',checking:'cash',emergency:'cash',savings:'cash'}[id]??'other');
const asset=(id,name,rate=0)=>({id,name,value:0,rate,monthly:0,accountType:accountTypeFor(id),allowGeneralWithdrawals:!['hsa','529'].includes(accountTypeFor(id))});
const debt=(id,name,rate)=>({id,name,value:0,rate,payment:0});
export function newState(){return {version:SCHEMA_VERSION,planning:{...PLANNING_DEFAULTS},mode:'backward',worthView:'today',coachSettings:{...COACH_DEFAULTS},provenance:{home:{},budget:{}},budget:{...BUDGET_DEFAULTS,annualFields:[]},home:{...HOME_DEFAULTS},stress:{...STRESS_DEFAULTS},worth:{
 years:30,inflation:2.5,stopAge:65,withdrawalAge:65,withdrawalMonthly:0,
 cash:[asset('checking','Checking / everyday cash'),asset('emergency','Emergency fund',3),asset('savings','Other savings / CDs',3)],
 investments:[asset('401k','401(k) / 403(b) / traditional IRA',6),asset('roth','Roth IRA / Roth 401(k)',6),asset('brokerage','Taxable brokerage',6),asset('hsa','Health savings account (HSA)',4),asset('529','College savings / 529',6)],
 property:[asset('home','Home / real estate',3)],vehicles:[asset('car1','Vehicle 1',10),asset('car2','Vehicle 2',10)],
 belongings:[asset('items1','Computers, furniture, jewelry…',20)],other:[asset('other1','Business ownership / other assets')],
 debts:[debt('mortgage','Mortgage / home equity loan',6.5),debt('auto','Auto loans',7),debt('student','Student loans',5),debt('credit','Credit cards',22),debt('debtOther','Other debts',0)]
}}}
export function homeLimits(key){
 if(key==='taxMode'||key==='wageEarners')return [0,1];if(key==='filingStatus')return [0,2];if(key==='secondEarnerPct')return [0,100];if(key==='stateTaxRate')return [0,20];
 if(key==='age')return [18,100]; if(key==='loanTermYears')return [1,50];
 if(key==='downPaymentPct')return [0,100];
 if(['incomeTaxRate','payrollTaxRate'].includes(key))return [0,60];
 if(['interestRate','propertyTaxRate','maintenancePct','closingCostPct','pmiRate'].includes(key))return [0,40];
 return [0,1e9];
}
export function validateHome(h){const errors=[];
 for(const k of ['taxMode','filingStatus','wageEarners'])if(!Number.isInteger(h[k]))errors.push(`${k}: choose an available option.`);
 if(!Number.isInteger(h.age))errors.push('age: enter a whole number.');
 for(const k of Object.keys(HOME_DEFAULTS)){const [lo,hi]=homeLimits(k);if(typeof h[k]!=='number'||!Number.isFinite(h[k])||h[k]<lo||h[k]>hi)errors.push(`${k}: enter a number from ${lo} to ${hi}.`)}
 if(h.taxMode!==1&&h.incomeTaxRate+h.payrollTaxRate>=95)errors.push('Combined tax rates must be below 95%.');
 if(h.pre401k>h.householdGrossAnnual/12)errors.push('Pre-tax monthly contributions cannot exceed monthly gross income.');
 return errors;
}
export function applyStress(h,s){const f={...h};if(!s.enabled)return f;
 f.interestRate=Math.max(0,h.interestRate+s.rateAdj);f.propertyTaxRate=Math.max(0,h.propertyTaxRate+s.propTaxBump);
 for(const k of [...GROUPS.lifestyle,'utilities','car1Insurance','car2Insurance'])f[k]*=1+s.lifestylePct/100;
 for(const k of GROUPS.healthcare)f[k]*=1+s.healthcarePct/100;
 return f;
}
export function paymentFactor(annualRate,years){if(!Number.isFinite(years)||years<=0)throw new RangeError('Loan term must be positive.');
 const n=years*12,r=annualRate/1200;if(r===0)return 1/n;return r/(-Math.expm1(-n*Math.log1p(r)));
}
export function monthlyPayment(principal,annualRate,years){return principal<=0?0:principal*paymentFactor(annualRate,years)}
export function housing(h,price){const down=price*h.downPaymentPct/100,loan=price-down;
 const pi=monthlyPayment(loan,h.interestRate,h.loanTermYears),tax=price*h.propertyTaxRate/1200,
 pmi=h.downPaymentPct<20?loan*h.pmiRate/1200:0,maintenance=price*h.maintenancePct/1200;
 return {price,down,loan,pi,tax,pmi,maintenance,insurance:h.homeInsurance,hoa:h.hoa,utilities:h.utilities,
 total:pi+tax+pmi+maintenance+h.homeInsurance+h.hoa+h.utilities,
 closing:price*h.closingCostPct/100,cashRequired:down+price*h.closingCostPct/100+h.cashReserve};
}
export function cashflow(h){const gross=h.householdGrossAnnual/12,taxDetail=h.taxMode===1?wageTax2026(h):null,
 incomeTax=taxDetail?(taxDetail.federal+taxDetail.state)/12:Math.max(0,gross-h.pre401k)*h.incomeTaxRate/100,payrollTax=taxDetail?(taxDetail.socialSecurity+taxDetail.medicare)/12:gross*h.payrollTaxRate/100,
 taxes=incomeTax+payrollTax,takeHome=gross-h.pre401k-taxes;
 const groups=Object.fromEntries(Object.entries(GROUPS).map(([k,keys])=>[k,sum(keys.map(key=>h[key]))]));
 const nonHousing=sum(Object.values(groups))+h.otherDebtPayment;
 return {gross,incomeTax,payrollTax,taxes,taxDetail,takeHome,groups,nonHousing,housingBudget:takeHome-nonHousing-h.monthlyBuffer};
}
export function affordability(h){const flow=cashflow(h),unit=housing(h,1),fixed=h.homeInsurance+h.hoa+h.utilities;
 const coefficient=unit.total-fixed;let budgetLimit=flow.housingBudget<fixed?0:coefficient>1e-12?Math.max(0,(flow.housingBudget-fixed)/coefficient):null;
 const cashFraction=(h.downPaymentPct+h.closingCostPct)/100;
 const spendable=Math.max(0,h.availableCash-h.cashReserve);
 const cashLimit=h.availableCash<h.cashReserve?0:cashFraction>0?spendable/cashFraction:null;
 const maxHome=budgetLimit===null?cashLimit:cashLimit===null?budgetLimit:Math.min(budgetLimit,cashLimit);
 const limitedBy=maxHome===null?'unbounded':cashLimit!==null&&(budgetLimit===null||cashLimit<budgetLimit)?'cash':'budget';
 const maximum=housing(h,maxHome??0),target=housing(h,h.homePrice);
 const bufferAtTarget=flow.takeHome-flow.nonHousing-target.total;
 const dti=flow.gross>0?(target.pi+target.tax+target.insurance+target.hoa+target.pmi+h.car1Payment+h.car2Payment+h.otherDebtPayment)/flow.gross*100:null;
 return {...flow,maxHome,budgetLimit,cashLimit,limitedBy,maximum,target,bufferAtTarget,cashGap:Math.max(0,target.cashRequired-h.availableCash),dti};
}
export function requiredIncome(h){const home=housing(h,h.homePrice),flow=cashflow(h),spending=home.total+flow.nonHousing+h.monthlyBuffer;
 if(h.taxMode===1){const annual=requiredWageIncome(h,spending),taxDetail=wageTax2026(h,annual);return {gross:annual/12,annual,taxes:taxDetail.total/12,taxDetail,home,groups:flow.groups,spending,nonHousing:flow.nonHousing};}
 const denominator=1-(h.incomeTaxRate+h.payrollTaxRate)/100;
 const gross=(spending+h.pre401k*(1-h.incomeTaxRate/100))/denominator;
 const taxes=Math.max(0,gross-h.pre401k)*h.incomeTaxRate/100+gross*h.payrollTaxRate/100;
 return {gross,annual:gross*12,taxes,home,groups:flow.groups,spending,nonHousing:flow.nonHousing};
}
export function netWorth(w){const groups=Object.fromEntries(ASSET_GROUPS.map(k=>[k,rowTotal(w[k])]));const assets=sum(Object.values(groups)),liabilities=rowTotal(w.debts);
 return {groups,assets,liabilities,total:assets-liabilities,liquid:groups.cash+groups.investments};
}
export function projectionYears(currentAge,targetAge){
 if(!Number.isInteger(currentAge)||currentAge<18||currentAge>100||!Number.isInteger(targetAge)||targetAge<=currentAge||targetAge>120||targetAge-currentAge>100)throw new RangeError('Choose a future age, no later than 120 and within 100 years.');
 return targetAge-currentAge;
}
export function debtAfterMonths(balance,apr,payment,months){let b=balance;for(let m=0;m<months;m++)b=Math.max(0,b*(1+apr/1200)-payment);return b;}
// Geometric annual total returns translated to equivalent monthly rates. End-month cash flows.
export function projectWorth(w,age){
 const assets=ASSET_GROUPS.flatMap(group=>w[group].map(r=>({...r,group,rate:group==='vehicles'||group==='belongings'?-r.rate:r.rate})));
 const debts=w.debts.map(r=>({...r}));const start=netWorth(w);let added=0,employerAdded=0,withdrawn=0,unfunded=0,interest=0,paid=0;
 const snapshot=year=>{const totalAssets=sum(assets.map(r=>r.value)),liabilities=sum(debts.map(r=>r.value));return {year,assets:totalAssets,liabilities,total:totalAssets-liabilities,real:(totalAssets-liabilities)/Math.pow(1+w.inflation/100,year),added,employerAdded,withdrawn,unfunded,interest,paid,growth:totalAssets-start.assets-added-employerAdded+withdrawn}};
 const points=[snapshot(0)];
 const contributionMonths=Math.max(0,Math.round((w.stopAge-age)*12));
 const withdrawalStart=Math.max(0,Math.round((w.withdrawalAge-age)*12));
 for(let month=0;month<w.years*12;month++){
  for(const r of assets){r.value*=Math.pow(1+r.rate/100,1/12);if((r.group==='cash'||r.group==='investments')&&month<contributionMonths){const contribution=r.monthly*Math.pow(1+(w.contributionGrowthPct??0)/100,Math.floor(month/12));r.value+=contribution;added+=contribution;if(r.group==='investments'&&r.id==='401k'){const match=w.employerMatchMonthly??0;r.value+=match;employerAdded+=match}}}
  if(month>=withdrawalStart){let request=w.withdrawalMonthly*(w.inflationAdjustedWithdrawals?Math.pow(1+w.inflation/100,month/12):1);for(const group of ['cash','investments'])for(const r of assets.filter(r=>r.group===group&&(r.allowGeneralWithdrawals??!['hsa','529'].includes(r.accountType??accountTypeFor(r.id))))){const taken=Math.min(r.value,request);r.value-=taken;request-=taken;withdrawn+=taken}unfunded+=request;}
  for(const r of debts){const charge=r.value*r.rate/1200;interest+=charge;r.value+=charge;const payment=Math.min(r.value,r.payment);r.value-=payment;paid+=payment;}
  if((month+1)%12===0)points.push(snapshot((month+1)/12));
 }
 return {start,points,end:points.at(-1),assets,debts,negativeAmortization:w.debts.filter(r=>r.value>0&&r.payment<=r.value*r.rate/1200).map(r=>r.name)};
}
export const BENCHMARKS=[{max:34,label:'Under 35',worth:39000,income:60500},{max:44,label:'35–44',worth:135600,income:85900},{max:54,label:'45–54',worth:247200,income:91900},{max:64,label:'55–64',worth:364500,income:81900},{max:74,label:'65–74',worth:409900,income:60900},{max:100,label:'75+',worth:335600,income:49100}];
export const benchmark=age=>BENCHMARKS.find(b=>age<=b.max)??BENCHMARKS.at(-1);
const finite=(v,lo,hi)=>typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi;
export function validateState(s){
 if(!s||s.version!==SCHEMA_VERSION||!['backward','forward','worth','budget'].includes(s.mode)||!['today','future'].includes(s.worthView))throw new Error('This saved scenario uses an unsupported format.');
 if(s.planning===undefined)s.planning={...PLANNING_DEFAULTS};
 const plan=s.planning;if(!plan||typeof plan!=='object'||Array.isArray(plan))throw new Error('The planning settings are invalid.');
 for(const [key,value]of Object.entries(PLANNING_DEFAULTS))if(plan[key]===undefined)plan[key]=value;
 for(const key of ['useBudgetSavings','incomeChangeEnabled','inflationAdjustedWithdrawals'])if(typeof plan[key]!=='boolean')throw new Error('The planning selection is invalid.');
 for(const [key,lo,hi]of [['employerMatchMonthly',0,1e9],['incomeGrowthPct',-99,100],['contributionGrowthPct',-99,100],['incomeChangeAge',18,120],['incomeChangeAnnual',0,1e9]])if(!finite(plan[key],lo,hi))throw new Error('The future income or contribution settings are invalid.');
 if(!Number.isInteger(plan.incomeChangeAge))throw new Error('Choose a whole age for the income change.');
 if(s.home)for(const [k,v]of Object.entries(TAX_FIELDS))if(s.home[k]===undefined)s.home[k]=v;
 if(s.coachSettings===undefined)s.coachSettings={...COACH_DEFAULTS};else validateCoachSettings(s.coachSettings);
 if(!s.home||validateHome(s.home).length)throw new Error('The saved household inputs are invalid.');
 if(!s.stress||typeof s.stress.enabled!=='boolean'||!finite(s.stress.rateAdj,-20,20)||!finite(s.stress.propTaxBump,-20,20)||!finite(s.stress.lifestylePct,-90,200)||!finite(s.stress.healthcarePct,-90,200))throw new Error('The stress-test settings are invalid.');
 if(s.budget===undefined)s.budget={...BUDGET_DEFAULTS,annualFields:[]};else validateBudget(s.budget);
 if(s.provenance===undefined)s.provenance={home:Object.fromEntries(Object.keys(HOME_DEFAULTS).map(k=>[k,'saved'])),budget:{currentHousing:'saved'}};
 for(const scope of ['home','budget']){const p=s.provenance?.[scope];if(!p||typeof p!=='object'||Array.isArray(p)||Object.entries(p).some(([k,v])=>!(scope==='home'?Object.hasOwn(HOME_DEFAULTS,k):k==='currentHousing')||!['entered','imported','saved'].includes(v)))throw new Error('The saved input labels are invalid.');}
 const w=s.worth;if(!w||!Number.isInteger(w.years)||!finite(w.years,1,100)||!finite(w.inflation,0,30)||!finite(w.stopAge,18,120)||!finite(w.withdrawalAge,18,120)||!finite(w.withdrawalMonthly,0,1e9))throw new Error('The projection settings are invalid.');
 projectionYears(s.home.age,s.home.age+w.years);
 for(const key of [...ASSET_GROUPS,'debts']){if(!Array.isArray(w[key])||w[key].length>50)throw new Error('Invalid account list.');const ids=new Set();for(const r of w[key]){
  if(key!=='debts'&&r){if(r.accountType===undefined)r.accountType=accountTypeFor(r.id);if(r.allowGeneralWithdrawals===undefined)r.allowGeneralWithdrawals=!['hsa','529'].includes(r.accountType);if(!['cash','retirement','roth','brokerage','hsa','529','other'].includes(r.accountType)||typeof r.allowGeneralWithdrawals!=='boolean')throw new Error('The saved account type or withdrawal setting is invalid.');}
  const dep=key==='vehicles'||key==='belongings';
  if(!r||typeof r.id!=='string'||!/^[\w-]{1,80}$/.test(r.id)||ids.has(r.id)||typeof r.name!=='string'||r.name.length>100||!finite(r.value,0,1e12)||!finite(r.rate,dep||key==='debts'?0:-99,dep?100:key==='debts'?60:100)||!finite(key==='debts'?r.payment:r.monthly,0,1e9))throw new Error('A saved balance, rate or account name is invalid.');ids.add(r.id);
 }}
 return s;
}
