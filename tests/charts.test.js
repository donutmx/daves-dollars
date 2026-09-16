import test from 'node:test';
import assert from 'node:assert/strict';
import {paymentChart,homeComparison,contributionParts,contributionChart} from '../dist/charts.js';
import {HOME_DEFAULTS} from '../dist/model.js';

test('payment composition includes every ownership category and handles no costs',()=>{
 const html=paymentChart({pi:1000,tax:200,insurance:100,pmi:25,hoa:50,maintenance:150,utilities:200,total:1725});
 for(const label of ['principal & interest','Property tax','Home insurance','Mortgage insurance','HOA dues','Maintenance reserve','Utilities'])assert.ok(html.includes(label));
 const widths=[...html.matchAll(/width:([\d.]+)%/g)].map(m=>Number(m[1]));
 assert.ok(Math.abs(widths.reduce((a,b)=>a+b,0)-100)<1e-9);
 assert.ok(paymentChart({total:0}).includes('No monthly costs entered'));
});

test('comparison is read only and distinguishes monthly room from cash',()=>{
 const h={...HOME_DEFAULTS,homePrice:100000,downPaymentPct:100,closingCostPct:0,cashReserve:0,availableCash:50000};
 const before=structuredClone(h),html=homeComparison(h);
 assert.deepEqual(h,before);
 assert.ok(html.includes('$90,000'));assert.ok(html.includes('$110,000'));
 assert.ok(html.includes('$40,000'));assert.ok(html.includes('$60,000'));
 assert.ok(html.includes('Upfront cash shortfall'));
 assert.ok(homeComparison({...h,homePrice:0}).includes('above $0'));
});

test('signed attribution reconciles personal and employer additions, losses and withdrawals',()=>{
 const p={start:{total:100},end:{total:140,added:50,employerAdded:20,paid:30,interest:10,withdrawn:40}};
 const parts=contributionParts(p);
 assert.equal(parts.find(([label])=>label==='Growth / depreciation')[1],-10);
 assert.equal(parts.reduce((total,[,v])=>total+v,0),140);
 assert.equal(parts.find(([label])=>label==='Withdrawals')[1],-40);
});

test('projection renders losses, zero and extreme totals with readable table and finite geometry',()=>{
 for(const value of [0,-1000,1e42]){
  const p={start:{total:0},end:{year:1,total:value,real:value,added:0},points:[{year:0,total:0,real:0},{year:1,total:value,real:value}]};
  const html=contributionChart(p,35);
  assert.ok(!/NaN|Infinity/.test(html));assert.ok(html.includes('Year-by-year values'));
  assert.ok(html.includes('Today’s purchasing power'));
  assert.ok(html.includes('Age 36'));
 }
});
