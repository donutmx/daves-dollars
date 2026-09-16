import {validateState} from './model.js';
import {diagnose} from './diagnosis.js';
import {validateCoachSettings} from './coach-settings.js';
import {coachView,comparisonTable,escapeHTML as esc} from './release-view.js';
import {formatMoneyInputs,formatAmount,numericInputValue,validNumericInput} from './numbers.js';
import {ownershipFromQuotes} from './ownership-inputs.js';
import {markEntered} from './presentation.js';

export function bindReleaseUI({getState,budgetUI,render,issues,dialog,notice,readScenarios}){
 const $=s=>document.querySelector(s);
 let animationTimer;
 function closeCoach(){
  clearInterval(animationTimer);const sprite=$('#dave-sprite');sprite.classList.remove('angry');sprite.style.backgroundPosition='0% 0%';
 }
 function animate(mood){
  closeCoach();const sprites=[$('#dave-sprite'),$('.diagnosis-sprite')].filter(Boolean);
  if(mood==='angry'){sprites.forEach(el=>{el.classList.add('angry');el.style.backgroundPosition='center'});return;}
  const frames=mood==='happy'?[3,4,3,4,5]:mood==='concerned'?[0,1,2,1]:[0];let i=0;
  const show=n=>sprites.forEach(el=>el.style.backgroundPosition=`${(n%3)*50}% ${n>=3?100:0}%`);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){show(frames.at(-1));return;}
  show(frames[0]);animationTimer=setInterval(()=>{if(++i>=frames.length){clearInterval(animationTimer);return;}show(frames[i]);},240);
 }
 function blocked(){if(!issues().length)return false;notice('Correct the highlighted inputs before continuing.');return true;}
 function refresh(focusId){
  const open=[...document.querySelectorAll('details[open][id]')].map(el=>el.id);render();
  open.forEach(id=>{const el=document.getElementById(id);if(el)el.open=true;});if(focusId)document.getElementById(focusId)?.focus();
 }
 function goTo(action){
  if(blocked())return;const state=getState();state.mode=action.mode;
  if(action.future)state.worthView='future';render();
  const target=document.getElementById(action.field||action.section);if(!target)return;
  for(let p=target;p;p=p.parentElement)if(p instanceof HTMLDetailsElement)p.open=true;
  const focus=target.matches('input,select,button')?target:target.querySelector('input,select')||target.querySelector('button');
  focus?.focus({preventScroll:true});target.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 function askDave(){
  if(blocked())return;let c=diagnose(getState(),budgetUI);
  dialog('Ask Dave',coachView(c,getState().coachSettings),d=>{
   d.classList.add('diagnosis-modal');animate(c.mood);d.addEventListener('close',closeCoach,{once:true});
   d.addEventListener('click',e=>{
    const action=e.target.closest('[data-diagnosis-action]');
    if(action){const next=c.findings[Number(action.dataset.diagnosisAction)].action;d.addEventListener('close',()=>goTo(next),{once:true});d.close();return;}
    if(e.target.id!=='apply-coach-settings')return;
    try{
     const settings={ramsey:$('#coach-ramsey').checked,carPaymentPct:numericInputValue($('#coach-car')),emergencyMonths:numericInputValue($('#coach-emergency'))};
     validateCoachSettings(settings);getState().coachSettings=settings;c=diagnose(getState(),budgetUI);
     d.querySelector('.modal-body').innerHTML=coachView(c,settings);animate(c.mood);
     d.querySelector('.diagnosis-quote').tabIndex=-1;d.querySelector('.diagnosis-quote').focus();
    }catch(error){$('#coach-setting-error').textContent=error.message;}
   });
  });
 }
 function compare(){
  if(blocked())return;
  try{
   const plans=[{name:'Current inputs (unsaved)',state:validateState(structuredClone(getState()))},...readScenarios().map(p=>({...p,state:validateState(structuredClone(p.state))}))];
   if(plans.length<2){dialog('Compare scenarios','<p>Save at least one named plan first. You can then compare two saved plans, or a saved plan against your current inputs.</p>');return;}
   const picker=(side,index)=>`<label class="field" for="compare-${side}">Plan ${side.toUpperCase()}<select id="compare-${side}" class="planning-select">${plans.map((p,i)=>`<option value="${i}" ${i===index?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>`;
   dialog('Compare your plans',`<div class="fields">${picker('a',plans.length>2?1:0)}${picker('b',plans.length>2?2:1)}</div><div id="comparison-results"></div>`,d=>{
    d.classList.add('comparison-modal');const update=()=>{$('#comparison-results').innerHTML=comparisonTable(plans[Number($('#compare-a').value)].state,plans[Number($('#compare-b').value)].state);};
    $('#compare-a').onchange=update;$('#compare-b').onchange=update;update();
   });
  }catch(error){notice(error.message);}
 }
 function quotes(){
  if(blocked())return;const h=getState().home;
  const input=(id,label,value)=>`<label class="field" for="quote-${id}">${label}<div class="input-wrap"><span>$</span><input type="number" id="quote-${id}" min="0" max="1000000000000" step="any" value="${value}"></div></label>`;
  dialog('Use your local ownership estimates',`<p>Use an annual property-tax estimate for this home <strong>after your purchase</strong> and your insurer’s annual premium, including any separate coverage. Current values below come from your existing assumptions.</p><div class="fields">${input('tax','Property tax / year',h.homePrice*h.propertyTaxRate/100)}${input('insurance','Insurance premium / year',h.homeInsurance*12)}</div><p class="inline-note">The tax amount will be converted to a rate at your target price of $${formatAmount(h.homePrice)}. If that price changes, estimated taxes scale with it. Insurance stays a fixed monthly amount until you edit it. Old-owner exemptions and assessments may not carry over.</p><p id="quote-preview" role="status"></p><button class="btn dark" id="apply-quotes">Apply to my home plan</button><p><a href="https://www.consumerfinance.gov/owning-a-home/loan-estimate/" target="_blank" rel="noopener noreferrer">CFPB · understanding local taxes and insurance ↗</a></p>`,d=>{
   formatMoneyInputs(d);
   const result=()=>ownershipFromQuotes(getState().home,numericInputValue($('#quote-tax')),numericInputValue($('#quote-insurance')));
   const preview=()=>{try{const v=result();$('#quote-preview').textContent=`Property-tax rate: ${formatAmount(v.propertyTaxRate)}% · Insurance: $${formatAmount(v.homeInsurance)}/month`;$('#apply-quotes').disabled=false;}catch(error){$('#quote-preview').textContent=error.message;$('#apply-quotes').disabled=true;}};
   d.addEventListener('input',preview);preview();
   $('#apply-quotes').onclick=()=>{try{const v=result();Object.assign(getState().home,v);for(const key of Object.keys(v))markEntered(getState(),'home',key);d.addEventListener('close',()=>refresh('h-propertyTaxRate'),{once:true});d.close();notice('Your annual estimates are applied across the calculators.');}catch(error){$('#quote-preview').textContent=error.message;}};
  });
 }
 // Keep focus/selection intact; normalize only after editing finishes.
 document.addEventListener('focusout',e=>{const el=e.target;if(el.matches?.('input[data-money]')){const v=numericInputValue(el);if(validNumericInput(el,v))el.value=formatAmount(v);}});
 document.addEventListener('change',e=>{const el=e.target;if(!el.matches('[data-tax-select]'))return;const state=getState();if(blocked()){el.value=state.home[el.dataset.taxSelect];return;}state.home[el.dataset.taxSelect]=Number(el.value);markEntered(state,'home',el.dataset.taxSelect);refresh(el.id);});
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.id==='compare-scenarios')compare();else if(b.id==='ownership-quotes')quotes();
  else if(b.dataset.budgetCategory!==undefined){const i=Number(b.dataset.budgetCategory);goTo(i===0&&budgetUI.housing==='proposed'?{mode:'backward',section:'section-02'}:{mode:'budget',section:`section-0${i+2}`});}
 });
 return {askDave,closeCoach};
}
