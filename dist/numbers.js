const grouped=new Intl.NumberFormat('en-US',{maximumFractionDigits:10,useGrouping:true});
export const formatAmount=n=>grouped.format(n);
export function parseAmount(text){
 const s=String(text).trim().replace(/^\$\s*/, '');
 if(!s||!/^[-+]?(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?|\.\d+)$/.test(s))return null;
 const n=Number(s.replaceAll(',',''));return Number.isFinite(n)?n:null;
}
export function formatMoneyInputs(root=document){
 root.querySelectorAll('input[type=number]').forEach(el=>{
  const wrap=el.closest('.input-wrap');if(!wrap||wrap.firstElementChild?.textContent!=='$')return;
  el.dataset.money='true';el.dataset.minimum=el.min;el.dataset.maximum=el.max;el.type='text';el.inputMode='decimal';
  el.value=formatAmount(Number(el.value));
 });
}
export function numericInputValue(el){return el.dataset.money?parseAmount(el.value):el.value.trim()===''?null:Number(el.value);}
export function validNumericInput(el,v){const min=Number(el.dataset.minimum??el.min),max=Number(el.dataset.maximum??el.max);return v!==null&&Number.isFinite(v)&&v>=min&&v<=max&&(el.dataset.money||el.validity.valid);}
