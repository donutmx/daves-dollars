import test from 'node:test';
import assert from 'node:assert/strict';
import {newState} from '../dist/model.js';
import {encodeBackup,decodeBackup,recoverState} from '../dist/persistence.js';
test('plan backup preserves modeling, housing and account metadata',()=>{
 const state=newState();state.budget.housing='proposed';state.planning.employerMatchMonthly=250;state.worth.investments[3].name='Renamed health account';
 const restored=decodeBackup(encodeBackup(state,'Example'));
 assert.equal(restored.state.budget.housing,'proposed');assert.equal(restored.state.planning.employerMatchMonthly,250);assert.equal(restored.state.worth.investments[3].allowGeneralWithdrawals,false);
});
test('recovery retains unfinished cross-field combinations while exports remain strict',()=>{
 const state=newState();state.home.pre401k=10000;state.home.incomeTaxRate=60;state.home.payrollTaxRate=40;state.home.groceries=777;
 const recovered=recoverState(state);assert.equal(recovered.home.pre401k,10000);assert.equal(recovered.home.payrollTaxRate,40);assert.equal(recovered.home.groceries,777);assert.throws(()=>encodeBackup(recovered,'Unfinished'));
 state.home.groceries=-1;assert.throws(()=>recoverState(state));
});
test('plan import rejects malformed, unsupported, oversized and invalid financial values',()=>{
 for(const text of ['{','{}',JSON.stringify({format:'daves-dollars-plan',version:2}),' '.repeat(2000001)])assert.throws(()=>decodeBackup(text));
 const state=newState();state.home.householdGrossAnnual=-1;assert.throws(()=>encodeBackup(state,'Invalid'));
});
