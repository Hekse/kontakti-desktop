import {tr,locale,localize} from './ajo-i18n.js?v=1.2.3';
import {categories as CATEGORIES,tripValues,expenseValues,batchIds,withTripDetails,tripDetails} from './ajo-form.js?v=1.2.3';
import {readSettings} from './ajo-settings.js?v=1.2.3';
const BUCKET='expense-receipts', MAX_IMAGE=5*1024*1024;

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const money=n=>Number(n||0).toLocaleString(locale(),{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
const decimal=v=>Number(String(v).trim().replace(',','.'));
const formatKm=n=>Number(n||0).toLocaleString(locale(),{maximumFractionDigits:2});
const must=(result,label)=>{if(result.error)throw new Error(`${label}: ${result.error.message}`);return result.data};

export function validateReceipt(file,bytes){
  if(!file||file.size<1||file.size>MAX_IMAGE)throw Error(tr('Kuittikuvan sallittu koko on 1–5 Mt.'));
  const b=new Uint8Array(bytes);
  const jpg=b.length>3&&b[0]===255&&b[1]===216&&b[2]===255;
  const png=b.length>8&&[137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n);
  const webp=b.length>12&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';
  const ext=jpg?'jpg':png?'png':webp?'webp':null;
  const mime=jpg?'image/jpeg':png?'image/png':webp?'image/webp':null;
  if(!ext||file.type!==mime)throw Error(tr('Valitse JPEG-, PNG- tai WebP-kuva.'));
  return {ext,mime};
}
export const pendingId=(key,fingerprint)=>{
  let stored=null;try{stored=JSON.parse(sessionStorage.getItem(key)||'null')}catch{}
  if(stored?.fingerprint===fingerprint&&stored.id)return stored.id;
  const id=crypto.randomUUID();sessionStorage.setItem(key,JSON.stringify({fingerprint,id}));return id;
};

export function createAjoKulut({sb,getWorkspace,getUser,getCustomers}){
  let root=null,loadedAt=0,trips=[],links=[],expenses=[],receipts=[],tripCustomers=new Set(),savingTrip=false,settingsKey='',savedPlaces=[],batchLocked=false,draftRestored=false,editingExpense=null;
  const q=id=>root?.querySelector('#'+id);
  const customer=id=>getCustomers().find(c=>c.id===id);
  const status=(id,message,error=false)=>{const el=q(id);if(el){el.textContent=tr(message);el.classList.toggle('error',error)}};
  const page=async(table,workspace,deleted=false)=>{
    const all=[],seen=new Set();let from=0;
    for(;;){let query=sb.from(table).select('*').eq('workspace_id',workspace);query=table==='kontakti_trip_customers'?query.order('trip_id',{ascending:true}).order('customer_id',{ascending:true}):query.order('id',{ascending:true});query=query.range(from,from+499);if(deleted)query=query.is('deleted_at',null);const rows=must(await query,table)||[];let added=0;for(const row of rows){const key=row.id||`${row.trip_id}:${row.customer_id}`;if(!seen.has(key)){seen.add(key);all.push(row);added++}}if(!rows.length||!added)return all;from+=rows.length;}
  };
  function markup(){
    root.innerHTML=`<div class="ajo-head"><h2>${tr("Ajo ja kulut")}</h2></div>
    <section class="ajo-panel"><div class="ajo-title"><span></span><button type="button" class="ajo-small" id="ajoClear">${tr("Tyhjennä")}</button></div><form id="ajoTripForm">
      <fieldset id="ajoFields"><div class="ajo-field"><label for="ajoTripDate">${tr("Päivämäärä")}</label><input id="ajoTripDate" type="date" required></div>
      <div class="ajo-field"><label for="ajoVehicle">${tr("Ajoneuvo")}</label><select id="ajoVehicle" required></select><p>${tr("Ajoneuvoja ja omia paikkoja hallitaan Asetuksissa → Ajot & Kulut.")}</p></div><div class="ajo-row"><div class="ajo-field"><label for="ajoStartAt">${tr("Lähtöajankohta")}</label><input id="ajoStartAt" type="datetime-local" required></div><div class="ajo-field"><label for="ajoEndAt">${tr("Paluuajankohta")}</label><input id="ajoEndAt" type="datetime-local" required></div></div><div class="ajo-field"><label for="ajoStart">${tr("Lähtöpaikka")}</label><div class="ajo-place"><input id="ajoStart" list="ajoPlaces" maxlength="120" required></div></div>
      <div id="ajoDestinations"></div><datalist id="ajoPlaces"></datalist>
      <button class="ajo-btn" type="button" id="ajoAddTarget">${tr("+ Lisää kohde")}</button>
      <div class="ajo-field"><label for="ajoPurpose">${tr("Ajon tarkoitus")}</label><input id="ajoPurpose" maxlength="300" required></div>
      <div class="ajo-row"><div class="ajo-field"><label for="ajoKm">${tr("Kilometrit")}</label><input id="ajoKm" inputmode="decimal" required></div><div class="ajo-field"><label for="ajoRate">€/km</label><input id="ajoRate" inputmode="decimal" required></div></div>
      <div id="ajoDraftExpenses"></div><button class="ajo-btn" type="button" id="ajoAddExpense">${tr("+ Lisää kulu")}</button>
      <button class="ajo-btn" type="button" id="ajoAddReceipt">${tr("Lisää kuitti raporttiin")}</button><p>${tr("Kuitin voi lisätä myös ilman kulusummaa. Lähtöpaikat ja omat kohteet muistetaan tällä selaimella.")}</p>
      <div class="ajo-field"><label for="ajoTripNotes">${tr("Muistiinpano (valinnainen)")}</label><textarea id="ajoTripNotes" maxlength="1600"></textarea></div></fieldset>
      <div class="ajo-total" id="ajoCalc" aria-live="polite"></div>
      <button class="ajo-btn primary" type="submit" id="ajoTripSave">${tr("Tallenna ajo ja kulut")}</button><div class="ajo-message" id="ajoTripStatus" role="status"></div>
    </form></section><details class="ajo-panel"><summary>${tr("Koonti ja raportti")}</summary>
    <section class="ajo-panel"><div class="ajo-row"><div class="ajo-field"><label for="ajoFrom">${tr("Alku")}</label><input id="ajoFrom" type="date"></div><div class="ajo-field"><label for="ajoTo">${tr("Loppu")}</label><input id="ajoTo" type="date"></div></div>
      <div class="ajo-presets" id="ajoPresets"><button type="button" data-period="week">${tr("Tämä viikko")}</button><button type="button" data-period="prevweek">${tr("Edellinen viikko")}</button><button type="button" data-period="month">${tr("Tämä kuukausi")}</button><button type="button" data-period="prevmonth">${tr("Edellinen kuukausi")}</button><button type="button" data-period="ytd">YTD</button></div>
      <div class="ajo-stat-grid" id="ajoStats"></div><h3>${tr("Ajot")}</h3><div id="ajoTripList"></div><h3>${tr("Kulut")}</h3><div id="ajoExpenseList"></div>
      <button class="ajo-btn" type="button" id="ajoPrintBtn">${tr("Tulosta / tallenna PDF")}</button><div id="ajoPrint"></div>
    </section></details>`;
    root.insertAdjacentHTML('beforeend',`<dialog id="ajoExpenseDialog" class="ajo-dialog"><form id="ajoExpenseEditor"><h3 id="ajoExpenseTitle">${tr("Lisää kulu")}</h3><div class="ajo-field"><label for="ajoEditCategory">${tr("Kululaji")}</label><select id="ajoEditCategory"><option value="">${tr("Valitse kululaji")}</option>${Object.entries(CATEGORIES).map(([k,v])=>`<option value="${k}">${tr(v)}</option>`).join('')}</select></div><div class="ajo-field"><label for="ajoEditNotes">${tr("Kuvaus (valinnainen)")}</label><input id="ajoEditNotes" maxlength="2000"></div><div class="ajo-field"><label for="ajoEditAmount">${tr("Summa €")}</label><input id="ajoEditAmount" inputmode="decimal" required></div><p id="ajoEditError" role="alert"></p><div class="ajo-row"><button type="button" class="ajo-btn" id="ajoEditCancel">${tr("Peruuta")}</button><button class="ajo-btn primary" type="submit">${tr("Tallenna")}</button></div></form></dialog>`);
    q('ajoExpenseDialog').setAttribute('aria-labelledby','ajoExpenseTitle');
    q('ajoEditCancel').onclick=()=>q('ajoExpenseDialog').close();
    q('ajoExpenseEditor').onsubmit=e=>{e.preventDefault();try{const data=expenseValues([{category:q('ajoEditCategory').value,amount:q('ajoEditAmount').value||(editingExpense?.dataset.receiptOnly==='1'?'0':''),notes:q('ajoEditNotes').value}])[0];const row=editingExpense||addExpense();row.querySelector('select').value=data.category;row.querySelector('[data-amount]').value=String(data.amount);row.querySelector('[data-notes]').value=data.notes||'';updateExpenseSummary(row);calc();rememberDraft();q('ajoExpenseDialog').close()}catch(error){q('ajoEditError').textContent=error.message}};
    q('ajoTripDate').value=today();period('month');
    q('ajoTripForm').addEventListener('submit',saveTrip);q('ajoStartAt').addEventListener('change',()=>{if(q('ajoStartAt').value)q('ajoTripDate').value=q('ajoStartAt').value.slice(0,10)});
    q('ajoKm').addEventListener('input',calc);q('ajoRate').addEventListener('input',calc);
    q('ajoAddTarget').addEventListener('click',()=>addTarget());
    q('ajoAddExpense').addEventListener('click',()=>openExpense());
    q('ajoAddReceipt').addEventListener('click',()=>{let row=[...q('ajoDraftExpenses').children].find(r=>!r.querySelector('input[type=file]').files.length);if(!row)row=addExpense(true);row.querySelector('input[type=file]').click()});
    q('ajoClear').addEventListener('click',()=>{if(batchLocked){status('ajoTripStatus',tr('Tallennus on kesken. Yritä sama tallennus uudelleen.'),true);return}if(confirm(tr('Tyhjennetäänkö kirjaus?')))resetDraft()});
    q('ajoFrom').addEventListener('change',renderReport);q('ajoTo').addEventListener('change',renderReport);
    q('ajoPresets').addEventListener('click',e=>{const b=e.target.closest('[data-period]');if(b)period(b.dataset.period)});
    q('ajoPrintBtn').addEventListener('click',printReport);
    root.addEventListener('click',async e=>{
      const edit=e.target.closest('[data-edit-expense]');if(edit){openExpense(edit.closest('.ajo-expense'));return}
      const remove=e.target.closest('[data-remove-row]');if(remove){const row=remove.closest('.ajo-expense,.ajo-destination');if(row?.classList.contains('ajo-destination')&&q('ajoDestinations').children.length===1)return;row?.remove();calc();rememberDraft()}
      const receipt=e.target.closest('[data-ajo-receipt]');if(receipt)viewReceipt(receipt.dataset.ajoReceipt);
    });
    addTarget();calc();renderReport();localize(root);q('ajoFields').disabled=true;root.addEventListener('input',rememberDraft);root.addEventListener('change',rememberDraft);
  }
  function addTarget(value=''){
    const id='ajoTarget'+crypto.randomUUID(),row=document.createElement('div');row.className='ajo-destination ajo-field';
    row.innerHTML=`<label for="${id}">${tr("Kohde")}</label><div class="ajo-place"><input id="${id}" list="ajoPlaces" maxlength="120" required><button type="button" class="ajo-small" data-remove-row>${tr("Poista")}</button></div>`;
    row.querySelector('input').value=value;q('ajoDestinations').append(row);rememberDraft();localize(row);return row;
  }
  function addExpense(receiptOnly=false){
    const id=crypto.randomUUID(),row=document.createElement('div');row.className='ajo-expense';row.dataset.receiptOnly=receiptOnly?'1':'0';
    row.innerHTML=`<div class="ajo-title"><span class="ajo-expense-summary">${receiptOnly?tr('Kuitti raporttiin'):tr('Kulu')}</span><button class="ajo-small" type="button" data-remove-row>${tr("Poista")}</button></div>
    <div hidden><div class="ajo-field"><label for="category-${id}">${tr("Kululaji")}</label><select id="category-${id}">${Object.entries(CATEGORIES).map(([k,v])=>`<option value="${k}">${tr(v)}</option>`).join('')}</select></div>
    <div class="ajo-field"><label for="amount-${id}">${tr('Summa €')}${receiptOnly?tr(' (valinnainen)'):''}</label><input id="amount-${id}" data-amount inputmode="decimal" ></div>
    <div class="ajo-field"><label for="notes-${id}">${tr("Kuvaus (valinnainen)")}</label><input id="notes-${id}" data-notes maxlength="2000"></div></div><button class="ajo-small" type="button" data-edit-expense>${tr("Muokkaa kulua")}</button>
    <label class="ajo-btn ajo-upload">${tr("Lisää kuitti raporttiin")}<input type="file" accept="image/jpeg,image/png,image/webp" aria-label="${tr('Kuittikuva')}" hidden></label><div class="ajo-preview"></div>`;
    if(receiptOnly)row.querySelector('select').value='other';
    row.querySelector('[data-amount]').addEventListener('input',()=>{calc();updateExpenseSummary(row)});
    row.querySelector('input[type=file]').addEventListener('change',()=>{const f=row.querySelector('input[type=file]').files[0];if(f)row.dataset.receiptName='';row.querySelector('.ajo-preview').textContent=f?f.name:'';calc()});
    q('ajoDraftExpenses').append(row);updateExpenseSummary(row);calc();rememberDraft();localize(row);return row;
  }
  function openExpense(row=null){if(batchLocked)return;editingExpense=row;q('ajoExpenseEditor').reset();q('ajoEditError').textContent='';q('ajoExpenseTitle').textContent=row?tr('Muokkaa kulua'):tr('Lisää kulu');q('ajoEditAmount').required=!row||row.dataset.receiptOnly!=='1';if(row){q('ajoEditCategory').value=row.querySelector('select').value;q('ajoEditAmount').value=row.querySelector('[data-amount]').value;q('ajoEditNotes').value=row.querySelector('[data-notes]').value}q('ajoExpenseDialog').showModal()}
  function updateExpenseSummary(row){const amount=row.querySelector('[data-amount]').value,notes=row.querySelector('[data-notes]').value;row.querySelector('.ajo-expense-summary').textContent=[row.dataset.receiptOnly==='1'&&!amount?tr('Kuitti raporttiin'):tr(CATEGORIES[row.querySelector('select').value]),amount?money(decimal(amount)):'',notes].filter(Boolean).join(' · ')}
  function renderPlaces(){const customers=getCustomers().filter(c=>!c.deleted_at);const values=[...new Set([...savedPlaces,...customers.map(c=>[c.name,c.address,c.city].filter(Boolean).join(', '))])];q('ajoPlaces').innerHTML=values.map(v=>`<option value="${escapeHtml(v)}"></option>`).join('')}
  function calc(){if(!q('ajoCalc'))return;const km=decimal(q('ajoKm').value),rate=decimal(q('ajoRate').value);const cost=[...root.querySelectorAll('[data-amount]')].reduce((n,e)=>n+(Number.isFinite(decimal(e.value))?decimal(e.value):0),0),comp=Number.isFinite(km)&&Number.isFinite(rate)?Math.round(km*rate*100)/100:0;q('ajoCalc').innerHTML=`<div>${tr("Kilometrit")} <strong>${formatKm(Number.isFinite(km)?km:0)} km</strong></div><div>${tr("Km-korvaus")} <strong>${money(comp)}</strong></div><div>${tr("Kulut")} <strong>${money(cost)}</strong></div><div>${tr("Yhteensä")} <strong>${money(comp+cost)}</strong></div>`}
  function resetDraft(){q('ajoTripForm').reset();q('ajoTripDate').value=today();q('ajoDestinations').replaceChildren();q('ajoDraftExpenses').replaceChildren();addTarget();batchLocked=false;sessionStorage.removeItem(settingsKey+':draft');q('ajoFields').disabled=false;for(const control of q('ajoFields').querySelectorAll('input,select,textarea,button'))control.disabled=false;q('ajoClear').disabled=false;try{q('ajoRate').value=JSON.parse(localStorage.getItem(settingsKey)||'{}').rate||''}catch{}renderTripOptions();calc()}
  function rememberDraft(){if(!settingsKey||!draftRestored)return;try{sessionStorage.setItem(settingsKey+':draft',JSON.stringify({date:q('ajoTripDate').value,start:q('ajoStart').value,targets:[...q('ajoDestinations').querySelectorAll('input')].map(e=>e.value),purpose:q('ajoPurpose').value,km:q('ajoKm').value,rate:q('ajoRate').value,notes:q('ajoTripNotes').value,vehicle:q('ajoVehicle').value,startAt:q('ajoStartAt').value,endAt:q('ajoEndAt').value,customers:[...tripCustomers],locked:batchLocked,expenses:[...q('ajoDraftExpenses').children].map(row=>({category:row.querySelector('select').value,amount:row.querySelector('[data-amount]').value,notes:row.querySelector('[data-notes]').value,receiptOnly:row.dataset.receiptOnly==='1',receiptName:row.querySelector('input[type=file]').files[0]?.name||row.dataset.receiptName||''}))}))}catch{status('ajoTripStatus',tr('Luonnosta ei voitu säilyttää. Pidä näkymä avoinna.'),true)}}
  function restoreDraft(){try{const d=JSON.parse(sessionStorage.getItem(settingsKey+':draft')||'null');if(!d)return;for(const [id,key] of [['ajoTripDate','date'],['ajoStart','start'],['ajoPurpose','purpose'],['ajoKm','km'],['ajoRate','rate'],['ajoTripNotes','notes'],['ajoVehicle','vehicle'],['ajoStartAt','startAt'],['ajoEndAt','endAt']])q(id).value=d[key]||'';q('ajoDestinations').replaceChildren();(d.targets?.length?d.targets:['']).forEach(addTarget);for(const expense of d.expenses||[]){const row=addExpense(expense.receiptOnly);row.querySelector('select').value=expense.category;row.querySelector('[data-amount]').value=expense.amount;row.querySelector('[data-notes]').value=expense.notes;updateExpenseSummary(row);row.dataset.receiptName=expense.receiptName||'';row.querySelector('.ajo-preview').textContent=expense.receiptName?tr('Valitse kuva uudelleen: ')+expense.receiptName:'';}tripCustomers=new Set(d.customers||[]);batchLocked=!!d.locked;calc();status('ajoTripStatus',batchLocked?tr('Keskeneräinen tallennus palautettu. Valitse mahdolliset kuitit uudelleen ja jatka tallennusta.'):tr('Luonnos palautettu.'))}catch{status('ajoTripStatus',tr('Luonnoksen palautus epäonnistui.'),true)}}
  function lockDraft(){if(!batchLocked)return;for(const control of q('ajoFields').querySelectorAll('input,select,textarea,button'))control.disabled=control.type!=='file';q('ajoClear').disabled=true;}
  const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  function period(which){const d=new Date(),y=d.getFullYear(),m=d.getMonth();let a,b;
    if(which==='ytd'){a=new Date(y,0,1);b=d}
    else if(which==='month'){a=new Date(y,m,1);b=d}
    else if(which==='prevmonth'){a=new Date(y,m-1,1);b=new Date(y,m,0)}
    else{const monday=new Date(y,m,d.getDate()-((d.getDay()+6)%7)+(which==='prevweek'?-7:0));a=monday;b=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+6)}
    q('ajoFrom').value=iso(a);q('ajoTo').value=iso(b);renderReport();
  }
  function renderTripOptions(){const settings=readSettings(settingsKey),selected=q('ajoVehicle').value;savedPlaces=settings.places;renderPlaces();q('ajoVehicle').innerHTML=`<option value="">${tr("Valitse ajoneuvo")}</option>`+settings.vehicles.map(v=>`<option value="${escapeHtml(v.id)}">${escapeHtml(v.registration)} ${escapeHtml(v.model)}</option>`).join('');q('ajoVehicle').value=selected||settings.defaultVehicle||'';}
  async function load(){try{const w=await getWorkspace();settingsKey='kontakti-ajo-settings:'+getUser()?.id+':'+w.id;try{const settings=JSON.parse(localStorage.getItem(settingsKey)||'{}');savedPlaces=Array.isArray(settings.places)?settings.places:[];if(!q('ajoRate').value)q('ajoRate').value=settings.rate||''}catch{}renderTripOptions();if(!draftRestored){restoreDraft();draftRestored=true}q('ajoFields').disabled=false;lockDraft();const [t,l,e,r]=await Promise.all([page('kontakti_trips',w.id,true),page('kontakti_trip_customers',w.id),page('kontakti_expenses',w.id,true),page('kontakti_expense_receipts',w.id)]);trips=t.sort((a,b)=>b.trip_date.localeCompare(a.trip_date)||b.created_at.localeCompare(a.created_at));links=l;expenses=e.sort((a,b)=>b.expense_date.localeCompare(a.expense_date)||b.created_at.localeCompare(a.created_at));receipts=r;loadedAt=Date.now();renderTripOptions();renderReport();return true}catch(error){loadedAt=0;status('ajoTripStatus',tr(tr('Tietojen lataus epäonnistui: '))+error.message,true);return false}}
  async function saveTrip(event){event.preventDefault();if(savingTrip)return;savingTrip=true;q('ajoTripSave').disabled=true;
    try{
      const w=await getWorkspace();if(!getUser())throw Error(tr('Kirjaudu uudelleen.'));
      let trip=tripValues({date:q('ajoTripDate').value,start:q('ajoStart').value,targets:[...q('ajoDestinations').querySelectorAll('input')].map(e=>e.value),purpose:q('ajoPurpose').value,km:q('ajoKm').value,rate:q('ajoRate').value,notes:q('ajoTripNotes').value});
      const storedBatch=JSON.parse(sessionStorage.getItem('kontakti-batch:'+getUser().id+':'+w.id)||'null');
      if(batchLocked&&storedBatch?.fingerprint)trip=JSON.parse(storedBatch.fingerprint)[1];
      else trip=withTripDetails(trip,{vehicle:readSettings(settingsKey).vehicles.find(v=>v.id===q('ajoVehicle').value),startAt:q('ajoStartAt').value,endAt:q('ajoEndAt').value});
      const rows=expenseValues([...q('ajoDraftExpenses').children].map(row=>({category:row.querySelector('select').value,amount:row.querySelector('[data-amount]').value||(row.dataset.receiptOnly==='1'?'0':''),notes:row.querySelector('[data-notes]').value,file:row.querySelector('input[type=file]').files[0],receiptName:row.dataset.receiptName||''})));
      const prepared=await Promise.all(rows.map(async row=>{if(!row.file){if(row.receiptName)throw Error(tr(tr('Valitse keskeneräisen kirjauksen kuittikuva uudelleen: '))+row.receiptName);return {...row,hash:null};}if(row.file.size<1||row.file.size>MAX_IMAGE)throw Error(tr('Kuittikuvan enimmäiskoko on 5 Mt.'));const bytes=await row.file.arrayBuffer(),info=validateReceipt(row.file,bytes),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');return {...row,bytes,...info,hash,path:`${w.id}/${hash}.${info.ext}`}}));
      const hashes=prepared.filter(r=>r.hash).map(r=>r.hash);if(new Set(hashes).size!==hashes.length)throw Error(tr('Sama kuitti on valittu kahdesti. Poista toinen kuva.'));
      const fingerprint=JSON.stringify([w.id,trip,[...tripCustomers].sort(),prepared.map(({category,amount,notes,hash})=>({category,amount,notes,hash}))]),key='kontakti-batch:'+getUser().id+':'+w.id;
      const previous=JSON.parse(sessionStorage.getItem(key)||'null');if(batchLocked&&previous?.fingerprint!==fingerprint)throw Error(tr('Keskeneräisen kirjauksen tiedot eivät täsmää. Valitse alkuperäiset kuittikuvat ja yritä uudelleen.'));
      const batch=batchIds(sessionStorage,key,fingerprint,prepared.length,()=>crypto.randomUUID());
      for(let i=0;i<prepared.length;i++){const row=prepared[i];if(!row.hash)continue;const old=must(await sb.from('kontakti_expense_receipts').select('expense_id').eq('workspace_id',w.id).eq('image_sha256',row.hash).maybeSingle(),tr('Kuitin tarkistus'));if(old&&old.expense_id!==batch.expenses[i])throw Error(tr('Sama kuittikuva on jo liitetty toiseen kuluun. Valitse toinen kuva.'));}
      batchLocked=true;rememberDraft();q('ajoFields').disabled=true;q('ajoClear').disabled=true;status('ajoTripStatus',tr('Tallennetaan ajo ja kulut…'));
      must(await sb.rpc('kontakti_create_trip',{p_id:batch.trip,p_workspace:w.id,p_date:trip.date,p_route:trip.route,p_km:trip.km,p_rate:trip.rate,p_notes:trip.notes,p_customers:[...tripCustomers].sort()}),tr('Ajon tallennus'));
      const savedTrip=must(await sb.from('kontakti_trips').select('id,notes').eq('id',batch.trip).eq('workspace_id',w.id).single(),tr('Ajon varmennus'));if(savedTrip.id!==batch.trip||savedTrip.notes!==trip.notes)throw Error(tr('Ajon varmennus ei täsmää'));
      for(let i=0;i<prepared.length;i++){
        const row=prepared[i],id=batch.expenses[i];
        if(row.hash){const old=must(await sb.from('kontakti_expense_receipts').select('expense_id').eq('workspace_id',w.id).eq('image_sha256',row.hash).maybeSingle(),tr('Kuitin tarkistus'));if(old&&old.expense_id!==id)throw Error(tr('Sama kuittikuva on jo liitetty toiseen kuluun.'));if(!old){const upload=await sb.storage.from(BUCKET).upload(row.path,new Blob([row.bytes],{type:row.mime}),{contentType:row.mime,upsert:false});if(upload.error&&!/already exists|duplicate|409/i.test(upload.error.message))throw upload.error;}}
        must(await sb.rpc('kontakti_create_expense',{p_id:id,p_workspace:w.id,p_date:trip.date,p_category:row.category,p_amount:row.amount,p_notes:row.notes,p_customer:null,p_trip:batch.trip,p_sha:row.hash,p_path:row.path||null,p_mime:row.mime||null,p_size:row.file?.size||null}),tr('Kulun tallennus'));
        const saved=must(await sb.from('kontakti_expenses').select('id').eq('id',id).eq('workspace_id',w.id).single(),tr('Kulun varmennus'));if(saved.id!==id)throw Error(tr('Kulun varmennus ei täsmää'));
        if(row.hash){const receipt=must(await sb.from('kontakti_expense_receipts').select('expense_id,image_sha256').eq('expense_id',id).eq('workspace_id',w.id).single(),tr('Kuitin varmennus'));if(receipt.image_sha256!==row.hash)throw Error(tr('Kuitin varmennus ei täsmää'));}
      }
      sessionStorage.removeItem(key);try{localStorage.setItem(settingsKey,JSON.stringify({...readSettings(settingsKey),rate:String(trip.rate)}))}catch{}
      tripCustomers.clear();resetDraft();const refreshed=await load();status('ajoTripStatus',refreshed?tr('Ajo ja kulut tallennettu.'):tr('Kirjaus tallentui. Raportin lataus epäonnistui; avaa näkymä uudelleen.'),!refreshed);
    }catch(error){status('ajoTripStatus',tr(error.message)+(batchLocked?tr(' Ajo tai osa kuluista voi olla jo tallennettu. Säilytä tämä näkymä ja yritä sama tallennus uudelleen.'):''),true)}finally{savingTrip=false;q('ajoTripSave').disabled=false;q('ajoFields').disabled=false;lockDraft()}
  }
  async function printReport(){
    const button=q('ajoPrintBtn');button.disabled=true;
    try{renderReport();const from=q('ajoFrom').value,to=q('ajoTo').value,selected=expenses.filter(e=>e.expense_date>=from&&e.expense_date<=to);let images='';for(const expense of selected){const receipt=receipts.find(r=>r.expense_id===expense.id);if(!receipt)continue;const signed=must(await sb.storage.from(BUCKET).createSignedUrl(receipt.storage_path,300),tr('Raportin kuitti'));images+=`<figure><figcaption>${escapeHtml(expense.expense_date)} · ${escapeHtml(tr(CATEGORIES[expense.category]))} · ${money(expense.amount)}</figcaption><img alt="${tr('Kuitti')}" src="${escapeHtml(signed.signedUrl)}"></figure>`}q('ajoPrint').insertAdjacentHTML('beforeend',images);await Promise.all([...q('ajoPrint').querySelectorAll('img')].map(img=>img.decode()));window.print();}
    catch(error){status('ajoTripStatus',tr(tr('Raportin kuittien lataus epäonnistui: '))+error.message,true)}finally{button.disabled=false}
  }
  async function viewReceipt(path){try{const signed=must(await sb.storage.from(BUCKET).createSignedUrl(path,60),tr('Kuitin avaus'));window.location.assign(signed.signedUrl)}catch(error){status('ajoTripStatus',error.message,true)}}
  function renderReport(){if(!root)return;const from=q('ajoFrom')?.value,to=q('ajoTo')?.value;if(!from||!to)return;
    const ts=trips.filter(t=>t.trip_date>=from&&t.trip_date<=to),es=expenses.filter(e=>e.expense_date>=from&&e.expense_date<=to);
    const km=ts.reduce((n,t)=>n+Number(t.kilometers),0),reimbursement=ts.reduce((n,t)=>n+Number(t.reimbursement),0),cost=es.reduce((n,e)=>n+Number(e.amount),0);
    q('ajoStats').innerHTML=`<div class="ajo-stat"><small>${tr("Kilometrit")}</small><strong>${formatKm(Number.isFinite(km)?km:0)} km</strong></div><div class="ajo-stat"><small>${tr("Km-korvaus")}</small><strong>${money(reimbursement)}</strong></div><div class="ajo-stat"><small>${tr("Muut kulut")}</small><strong>${money(cost)}</strong></div><div class="ajo-stat"><small>${tr("Yhteensä")}</small><strong>${money(reimbursement+cost)}</strong></div>`;
    const detailText=t=>{const d=tripDetails(t.notes),m=d.metadata;return [d.notes,m?[tr(m.vehicle.type),m.vehicle.registration,m.vehicle.model].filter(Boolean).join(' · '):tr('Ajoneuvoa ei kirjattu'),m?m.startAt.replace('T',' ')+' – '+m.endAt.replace('T',' '):tr('Kellonaikoja ei kirjattu')].filter(Boolean).join('\n')};
    const unitRate=t=>Number.isFinite(Number(t.rate_per_km))&&t.rate_per_km!=null?Number(t.rate_per_km):(Number(t.kilometers)>0?Number(t.reimbursement)/Number(t.kilometers):null);
    const rateText=t=>unitRate(t)==null?'—':Number(unitRate(t)).toLocaleString(locale(),{maximumFractionDigits:4})+' €/km';
    const customerNames=t=>links.filter(x=>x.trip_id===t.id).map(x=>customer(x.customer_id)?.name||tr('Asiakas')).join(', ');
    q('ajoTripList').innerHTML=ts.length?ts.map(t=>`<div class="ajo-record"><b>${escapeHtml(t.trip_date)} · ${escapeHtml(t.route_text)}</b><small>${formatKm(t.kilometers)} km · ${money(t.reimbursement)} · ${escapeHtml(rateText(t))}<br>${escapeHtml(detailText(t)).replace(/\n/g,'<br>')}${customerNames(t)?' · '+escapeHtml(customerNames(t)):''}</small></div>`).join(''):`<p>${tr("Ei ajoja ajanjaksolla.")}</p>`;
    q('ajoExpenseList').innerHTML=es.length?es.map(e=>{const r=receipts.find(x=>x.expense_id===e.id);return `<div class="ajo-record"><b>${escapeHtml(e.expense_date)} · ${escapeHtml(tr(CATEGORIES[e.category]||e.category))} · ${money(e.amount)}</b><small>${escapeHtml(customer(e.customer_id)?.name||'')}${e.notes?' · '+escapeHtml(e.notes):''}${r?' · '+tr('Kuitti'):''}</small>${r?`<button type="button" data-ajo-receipt="${escapeHtml(r.storage_path)}">${tr("Avaa kuitti")}</button>`:''}</div>`}).join(''):`<p>${tr("Ei kuluja ajanjaksolla.")}</p>`;
    q('ajoPrint').innerHTML=`<h1>Kontakti · ${tr('Ajo ja kulut')}</h1><p>${tr("Ajanjakso")} ${escapeHtml(from)}–${escapeHtml(to)}</p><p>${formatKm(km)} km · ${tr("Km-korvaus")} ${money(reimbursement)} · ${tr("Kulut")} ${money(cost)} · ${tr("Yhteensä")} ${money(reimbursement+cost)}</p><h2>${tr("Ajot")}</h2><table><thead><tr><th>${tr("Päivä / reitti / asiakkaat")}</th><th>${tr("Km")}</th><th>€/km</th><th>${tr("Korvaus")}</th></tr></thead><tbody>${ts.map(t=>`<tr><td>${escapeHtml(t.trip_date)} · ${escapeHtml(t.route_text)}<br>${escapeHtml(customerNames(t))}<br>${escapeHtml(detailText(t)).replace(/\n/g,'<br>')}</td><td>${formatKm(t.kilometers)}</td><td>${escapeHtml(rateText(t))}</td><td>${money(t.reimbursement)}</td></tr>`).join('')}</tbody></table><h2>${tr("Kulut")}</h2><table><thead><tr><th>${tr("Päivä / kategoria / asiakas")}</th><th>${tr("Summa")}</th><th>${tr("Kuitti")}</th></tr></thead><tbody>${es.map(e=>{const r=receipts.find(x=>x.expense_id===e.id);return `<tr><td>${escapeHtml(e.expense_date)} · ${escapeHtml(tr(CATEGORIES[e.category]||e.category))}<br>${escapeHtml(customer(e.customer_id)?.name||'')} ${escapeHtml(e.notes||'')}</td><td>${money(e.amount)}</td><td>${r?escapeHtml(r.image_sha256.slice(0,16)):'—'}</td></tr>`}).join('')}</tbody></table>`;
  }
  return {refreshLanguage(){if(root){localize(root);q('ajoVehicle').options[0].textContent=tr('Valitse ajoneuvo');calc();renderReport();for(const row of q('ajoDraftExpenses').children){updateExpenseSummary(row);if(row.dataset.receiptName)row.querySelector('.ajo-preview').textContent=tr('Valitse kuva uudelleen: ')+row.dataset.receiptName}}},open(el){if(root!==el){root=el;markup()}if(settingsKey)renderTripOptions();if(Date.now()-loadedAt>30000)load()},prefillCustomer(id){if(batchLocked)return;tripCustomers.add(id);if(root){const c=customer(id);if(c){const target=q('ajoDestinations').querySelector('input');if(!target.value)target.value=[c.name,c.address,c.city].filter(Boolean).join(', ');else if(!batchLocked)addTarget([c.name,c.address,c.city].filter(Boolean).join(', '))}}}};
}
