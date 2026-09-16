import test from 'node:test';
import assert from 'node:assert/strict';
import {targetFit,budgetAllocation,inputOrigin,markEntered} from '../dist/presentation.js';
import {newState,validateState} from '../dist/model.js';
test('target meter distinguishes deficit, missing cushion, exact fit and separate cash shortfall',()=>{
 const a={bufferAtTarget:-100,cashGap:10000};
 assert.equal(targetFit(a,500,200000).kind,'over');
 assert.equal(targetFit(a,500,200000).monthlyGap,600);
 assert.equal(targetFit({...a,bufferAtTarget:0},500,200000).kind,'tight');
 assert.equal(targetFit({...a,bufferAtTarget:500},500,200000).kind,'fits');
 assert.equal(targetFit({...a,bufferAtTarget:500},500,200000).cashGap,10000);
 assert.equal(targetFit({...a,bufferAtTarget:0},0,200000).kind,'fits');
 assert.equal(targetFit(a,500,0).position,null);
});
test('budget chart uses one housing allocation and represents deficits outside the ring',()=>{
 const b={takeHome:5200,currentHousing:1500,proposedHousing:2100,essential:1500,flexible:350,debt:400,savings:600};
 assert.equal(budgetAllocation(b).remaining,850);
 assert.equal(budgetAllocation(b,'proposed').remaining,250);
 assert.equal(budgetAllocation(b,'proposed').categories[0].value,2100);
 const over=budgetAllocation({...b,takeHome:1000});assert.equal(over.remaining,-3350);assert.equal(over.ring.length,5);assert.equal(over.scale,4350);
 const zero=budgetAllocation(Object.fromEntries(Object.keys(b).map(k=>[k,0])));assert.equal(zero.scale,1);assert.equal(zero.total,0);
});
test('provenance preserves deliberate input equal to default and treats old saved values honestly',()=>{
 const s=newState();assert.equal(inputOrigin(s,'home','groceries'),'example');
 markEntered(s,'home','groceries');assert.equal(inputOrigin(validateState(structuredClone(s)),'home','groceries'),'entered');
 delete s.provenance;validateState(s);assert.equal(inputOrigin(s,'home','groceries'),'saved');
 s.provenance.home.groceries='untrusted';assert.throws(()=>validateState(s));
});
