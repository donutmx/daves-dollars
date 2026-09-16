import {housing,cashflow} from './model.js';

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dollars=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const compact=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:1});
const money=n=>escape(Math.abs(n)>=1e12?Number(n).toExponential(2)+' USD':dollars.format(n));
const axisMoney=n=>escape(Math.abs(n)>=1e15?Number(n).toExponential(1):compact.format(n));
const percent=(v,total)=>total>0?Math.min(100,Math.max(0,v/total*100)):0;
const colors=['#147d70','#6fa997','#a2bf8f','#d5aa64','#8d91b6','#ce8874','#77a6bb'];

/** Initial monthly ownership allocation; the text legend is the accessible equivalent. */
export function paymentChart(cost){
 const rows=[['Mortgage principal & interest',cost.pi],['Property tax',cost.tax],['Home insurance',cost.insurance],['Mortgage insurance',cost.pmi],['HOA dues',cost.hoa],['Maintenance reserve',cost.maintenance],['Utilities',cost.utilities]].filter(([,v])=>v>0);
 return `<div class="dd-chart payment-chart"><p class="dd-chart-title">Your monthly ownership costs</p><div class="dd-payment-track" aria-hidden="true">${rows.map(([label,v],i)=>`<span style="width:${percent(v,cost.total)}%;background:${colors[i]}"></span>`).join('')}</div><ul class="dd-chart-legend">${rows.map(([label,v],i)=>`<li><span><i style="background:${colors[i]}" aria-hidden="true"></i>${label}</span><strong>${money(v)}</strong></li>`).join('')}</ul>${rows.length?'':'<p>No monthly costs entered.</p>'}<p class="dd-chart-note">Initial monthly estimate. Maintenance is money set aside, not a lender payment. Mortgage insurance may change later.</p></div>`;
}

/** Three hypothetical prices, keeping every other household assumption unchanged. */
export function homeComparison(home){
 const flow=cashflow(home),base=home.homePrice;
 if(base<=0)return '<p class="dd-chart-note">Enter a desired home price above $0 to compare nearby prices.</p>';
 const options=[['10% less',base*.9],['Your desired home',base],['10% more',base*1.1]];
 return `<div class="dd-chart dd-home-comparison"><p class="dd-chart-note">The same income, spending, down-payment percentage, loan terms, and ownership assumptions at three prices. These are examples, not listings or loan approvals.</p><div class="dd-home-options">${options.map(([label,price])=>{
  const cost=housing(home,price),left=flow.takeHome-flow.nonHousing-cost.total,gap=Math.max(0,cost.cashRequired-home.availableCash),shortfall=Math.max(0,home.monthlyBuffer-left);
  return `<section class="dd-home-option"><h3>${label}</h3><p class="dd-home-price">${money(price)}</p><dl><div><dt>All-in ownership / month</dt><dd>${money(cost.total)}</dd></div><div><dt>Money remaining / month</dt><dd class="${left<0?'dd-negative':''}">${money(left)}</dd></div><div><dt>Cash needed, including reserve</dt><dd>${money(cost.cashRequired)}</dd></div><div><dt>Upfront cash shortfall</dt><dd>${money(gap)}</dd></div></dl><p class="dd-chart-note">${shortfall>0?`${money(shortfall)} / month short of your chosen buffer.`:'Meets your chosen monthly buffer.'} ${gap>0?'More upfront cash is also needed.':'Entered cash covers closing and your reserve.'}</p></section>`;
 }).join('')}</div><p class="dd-chart-note">Money remaining already subtracts your savings contributions and debt payments. Reserve cash is included in cash needed but remains yours after closing. Comparisons do not change your plan.</p></div>`;
}

/** Signed attribution reconciles exactly to nominal net worth, even with withdrawals or losses. */
export function contributionParts(projection){
 const e=projection.end,start=projection.start.total,added=e.added??0,employer=e.employerAdded??0,withdrawn=e.withdrawn??0,debt=(e.paid??0)-(e.interest??0);
 const growth=e.total-start-added-employer+withdrawn-debt;
 return [['Starting net worth',start],['Your additions',added],['Employer additions',employer],['Growth / depreciation',growth],['Debt reduction, net of interest',debt],['Withdrawals',-withdrawn]];
}

export function contributionChart(projection,age){
 const points=projection.points;if(!points.length)return '';
 const low=Math.min(0,...points.map(p=>p.total)),high=Math.max(0,...points.map(p=>p.total)),span=high-low||1;
 const last=points.at(-1),maxYear=last.year||1,x=p=>52+p.year/maxYear*446,y=v=>140-(v-low)/span*118;
 const path=points.map((p,i)=>`${i?'L':'M'}${x(p).toFixed(2)},${y(p.total).toFixed(2)}`).join(' ');
 const parts=contributionParts(projection),max=Math.max(1,...parts.map(([,v])=>Math.abs(v)));
 return `<div class="dd-chart dd-contribution-chart"><p class="dd-chart-title">Your projected path</p><svg viewBox="0 0 520 177" aria-hidden="true" focusable="false"><line x1="52" x2="498" y1="${y(0)}" y2="${y(0)}" stroke="currentColor" opacity=".25"/><path d="${path}" fill="none" stroke="#72e1c8" stroke-width="3"/><text x="3" y="20">${axisMoney(high)}</text><text x="3" y="143">${axisMoney(low)}</text><text x="52" y="168">Age ${age}</text><text x="498" y="168" text-anchor="end">Age ${age+last.year}</text></svg><p class="dd-chart-note">Nominal net worth: ${money(projection.start.total)} today → ${money(last.total)} at age ${age+last.year}. Hypothetical returns, not a prediction.</p><details class="dd-chart-details"><summary>What builds this total?</summary><ul class="dd-attribution">${parts.map(([label,v])=>`<li><div><span>${label}</span><strong>${v>0?'+':''}${money(v)}</strong></div><div class="dd-signed-track" aria-hidden="true"><span class="${v<0?'dd-loss':'dd-gain'}" style="width:${Math.abs(v)/max*50}%;${v<0?'right':'left'}:50%"></span></div></li>`).join('')}</ul><p class="dd-chart-note">These signed amounts add up to ${money(last.total)}. Growth includes investment gains or losses and changes in property and belongings. Debt reduction assumes payments are funded separately; withdrawals reduce assets. All chart amounts are future dollars, before potential withdrawal taxes.</p><details><summary>Year-by-year values</summary><div class="dd-data-table" tabindex="0" role="region" aria-label="Scrollable projection figures"><table><thead><tr><th scope="col">Age</th><th scope="col">Net worth</th><th scope="col">Today’s purchasing power</th></tr></thead><tbody>${points.map(p=>`<tr><th scope="row">${age+p.year}</th><td>${money(p.total)}</td><td>${money(p.real)}</td></tr>`).join('')}</tbody></table></div></details></details></div>`;
}
