import {validateState,validateHome} from './model.js';
export const DRAFT_KEY='daves-dollars:draft:v1';
// Recovery permits unfinished cross-field combinations, but never malformed data.
// Only the two cross-field rules are relaxed; saved/exported plans stay strict.
export function recoverState(value){
 const state=structuredClone(value),home=state.home;
 if(!home)throw Error('Missing draft household.');
 const errors=validateHome(home).filter(e=>!e.startsWith('Combined tax rates')&&!e.startsWith('Pre-tax monthly contributions'));
 if(errors.length)throw Error('Malformed draft household.');
 state.home={...home,pre401k:Math.min(home.pre401k,home.householdGrossAnnual/12)};
 if(state.home.incomeTaxRate+state.home.payrollTaxRate>=95)state.home.incomeTaxRate=0;
 validateState(state);state.home=home;return state;
}
export function decodeBackup(text){
 if(text.length>2000000)throw Error('Choose a plan smaller than 2 MB.');
 const data=JSON.parse(text);
 if(data?.format!=='daves-dollars-plan'||data.version!==1)throw Error('This is not a supported Dave’s Dollars plan.');
 return {state:validateState(data.state),name:typeof data.name==='string'?data.name.slice(0,60):''};
}
export function encodeBackup(state,name){return JSON.stringify({format:'daves-dollars-plan',version:1,name,state:validateState(structuredClone(state))},null,2)}
export function bindPersistence({getState,setState,render,getInvalid,notice,issues,dialog}){
 let timer,failed=false;
 const save=()=>{clearTimeout(timer);try{
  const drafts=[...getInvalid()].map(id=>({id,value:document.getElementById(id)?.value??''}));
  localStorage.setItem(DRAFT_KEY,JSON.stringify({state:getState(),drafts,name:document.getElementById('scenario-name').value,open:[...document.querySelectorAll('details[id][open]')].map(el=>el.id)}));
 }catch{if(!failed)notice('Automatic recovery could not be saved. Export a plan backup to keep valid entries.');failed=true;}};
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(save,250)};
 for(const event of ['input','change','click'])document.addEventListener(event,schedule);
 window.addEventListener('pagehide',save);
 const restore=()=>{try{const text=localStorage.getItem(DRAFT_KEY);if(!text)return;const data=JSON.parse(text);setState(recoverState(data.state));render();document.getElementById('scenario-name').value=typeof data.name==='string'?data.name.slice(0,60):'';
  for(const id of Array.isArray(data.open)?data.open:[]){const el=document.getElementById(id);if(el?.tagName==='DETAILS')el.open=true;}
  for(const draft of Array.isArray(data.drafts)?data.drafts:[]){const el=document.getElementById(draft.id);if(!el||typeof draft.value!=='string')continue;el.value=draft.value;el.dispatchEvent(new Event('input',{bubbles:true}));for(let parent=el.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;}
  notice('Recovered your latest local draft.');
 }catch{notice('The previous draft could not be recovered. Named saved scenarios are still available.');}};
 document.querySelector('.scenario-actions').insertAdjacentHTML('beforeend','<button class="btn" id="export-plan">Export plan</button><label class="btn" for="import-plan">Import plan</label><input class="sr-only" id="import-plan" type="file" accept=".json,application/json">');
 document.getElementById('export-plan').onclick=()=>{if(issues().length){notice('Correct highlighted inputs before exporting. Your unfinished draft is recovered locally.');return;}try{const text=encodeBackup(getState(),document.getElementById('scenario-name').value),url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='daves-dollars-plan.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){notice(e.message)}};
 document.getElementById('import-plan').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(issues().length){notice('Correct highlighted inputs before importing a plan.');return;}try{if(file.size>2000000)throw Error('Choose a plan smaller than 2 MB.');const plan=decodeBackup(await file.text());dialog('Import this plan?','<p>This replaces the displayed worksheet, including all balances and assumptions. Your named saved scenarios remain available.</p><div class="dialog-actions"><button class="btn" data-close>Cancel</button><button class="btn dark" id="apply-plan">Replace worksheet</button></div>',d=>{document.getElementById('apply-plan').onclick=()=>{if(issues().length){notice('Correct highlighted inputs before importing.');return;}setState(plan.state);document.getElementById('scenario-name').value=plan.name;d.close();render();save();notice('Plan imported locally.');}})}catch(e){notice(e.message)}};
 return {restore,save};
}
