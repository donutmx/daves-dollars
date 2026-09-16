// View models only. Financial calculations remain in model.js and budget.js.
export function targetFit(a, buffer, targetPrice) {
 if(targetPrice<=0)return {kind:'unset',position:null,label:'Enter a target home price',monthlyGap:0,cashGap:a.cashGap};
 const monthlyGap=Math.max(0,buffer-a.bufferAtTarget);
 if(a.bufferAtTarget<-.01)return {kind:'over',position:16,label:'Target exceeds your monthly plan',monthlyGap,cashGap:a.cashGap};
 if(monthlyGap>.01)return {kind:'tight',position:50,label:'Target leaves less than your chosen buffer',monthlyGap,cashGap:a.cashGap};
 return {kind:'fits',position:84,label:'Target preserves your chosen buffer',monthlyGap:0,cashGap:a.cashGap};
}
export function budgetAllocation(b, housing='current') {
 const proposed=housing==='proposed';
 const categories=[{name:proposed?'Proposed ownership':'Current housing',value:proposed?b.proposedHousing:b.currentHousing},
 {name:'Everyday essentials',value:b.essential},{name:'Flexible spending',value:b.flexible},
 {name:'Debt payments',value:b.debt},{name:'After-tax savings',value:b.savings}];
 const total=categories.reduce((s,c)=>s+c.value,0),remaining=b.takeHome-total;
 return {categories,total,remaining,scale:Math.max(1,total,b.takeHome),ring:[...categories,...(remaining>0?[{name:'Money remaining',value:remaining}]:[])]};
}
export function inputOrigin(state, scope, key) {return state.provenance?.[scope]?.[key]||'example';}
export function markEntered(state, scope, key, origin='entered') {state.provenance[scope][key]=origin;}
