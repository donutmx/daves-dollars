// Shared monthly cash flow. The Budget view reads the same home fields.
import {cashflow,housing,GROUPS,validateHome,BUDGET_DEFAULTS} from './model.js';

export {BUDGET_DEFAULTS} from './model.js';
export const ESSENTIAL_KEYS=['groceries','gas','daycare','phoneInternet','car1Insurance','car2Insurance','carMaintenance','healthInsurance','dentalVision','healthOOP','lifeInsurance','disabilityInsurance'];
export const FLEXIBLE_KEYS=['eatingOut','travel','petExpenses','onlineShopping','subscriptions','personalCare','gifts','misc'];
export const DEBT_KEYS=['car1Payment','car2Payment','otherDebtPayment'];
export const ANNUAL_ELIGIBLE=[...ESSENTIAL_KEYS,...FLEXIBLE_KEYS,...DEBT_KEYS,...GROUPS.savings];
const total=(h,keys)=>keys.reduce((n,k)=>n+h[k],0);
export function budgetSummary(home,budget=BUDGET_DEFAULTS){
 const flow=cashflow(home),essential=total(home,ESSENTIAL_KEYS),flexible=total(home,FLEXIBLE_KEYS),debt=total(home,DEBT_KEYS),savings=total(home,GROUPS.savings);
 const spending=essential+flexible+debt+savings,proposedHousing=housing(home,home.homePrice).total;
 return {gross:flow.gross,taxes:flow.taxes,retirement:home.pre401k,takeHome:flow.takeHome,essential,flexible,debt,savings,currentHousing:budget.currentHousing,proposedHousing,currentRemaining:flow.takeHome-spending-budget.currentHousing,proposedRemaining:flow.takeHome-spending-proposedHousing,spending};
}

// Bounded RFC-style CSV parser: quotes, commas and line breaks in quoted cells.
export function parseCSV(text){
 if(typeof text!=='string'||text.length>2_000_000)throw new Error('Choose a CSV smaller than 2 MB.');
 const rows=[];let row=[],cell='',quoted=false,closed=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++}else{quoted=false;closed=true}}else cell+=c;continue}
  if(c==='"'){if(cell||closed)throw new Error('Invalid CSV quoting.');quoted=true;continue}
  if(c===','||c==='\n'||c==='\r'){row.push(cell.trim());cell='';closed=false;if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(Boolean))rows.push(row);row=[];if(rows.length>2001)throw new Error('Use at most 2,000 data rows.')}continue}
  if(closed&&!/\s/.test(c))throw new Error('Unexpected text after a quoted CSV value.');cell+=c;
 }
 if(quoted)throw new Error('A CSV quote was not closed.');row.push(cell.trim());if(row.some(Boolean))rows.push(row);
 if(rows.length>2001)throw new Error('Use at most 2,000 data rows.');return rows;
}
export const IMPORT_KEYS=['householdGrossAnnual','currentHousing',...ANNUAL_ELIGIBLE,'pre401k'];
export function reviewSummary(text,home){
 const rows=parseCSV(text.replace(/^\uFEFF/,''));if(!rows.length)throw new Error('This file is empty.');
 const headers=rows.shift().map(s=>s.toLowerCase());const idx=Object.fromEntries(['field','amount','period'].map(k=>[k,headers.indexOf(k)]));
 if(Object.values(idx).some(i=>i<0)||new Set(headers).size!==headers.length)throw new Error('Use the summary template with field, amount, period columns. Bank transaction files need categorization first.');
 const updates=[],seen=new Set();for(const [i,r]of rows.entries()){
  const key=r[idx.field],period=r[idx.period]?.toLowerCase(),raw=r[idx.amount];
  if(r.length!==headers.length||!IMPORT_KEYS.includes(key)||seen.has(key))throw new Error(`Row ${i+2}: unknown or duplicate field. Use each template field once.`);
  if(!['monthly','annual'].includes(period)||!/^\d+(?:\.\d+)?$/.test(raw))throw new Error(`Row ${i+2}: use a positive number (or 0) without currency symbols and monthly or annual.`);
  let value=Number(raw);value=key==='householdGrossAnnual'?(period==='monthly'?value*12:value):(period==='annual'?value/12:value);
  if(!Number.isFinite(value)||value>1e9)throw new Error(`Row ${i+2}: amount is too large.`);
  seen.add(key);updates.push({key,value,period,before:key==='currentHousing'?null:home[key]});
 }
 if(!updates.length)throw new Error('Add at least one summary row.');const next={...home,...Object.fromEntries(updates.filter(x=>x.key!=='currentHousing').map(x=>[x.key,x.value]))};
 if(validateHome(next).length)throw new Error('These amounts would produce an invalid household plan. Check income and retirement contributions.');return updates;
}
