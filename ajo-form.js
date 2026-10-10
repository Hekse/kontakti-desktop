export const categories={hotel:'Hotelli',fuel:'Polttoaine',parking:'Pysäköinti',meal:'Lounas / ruokailu',toll:'Tietulli / lautta',transport:'Julkinen liikenne / taksi',other:'Muu'};
export const number=value=>Number(String(value).trim().replace(',','.'));
export function tripValues({date,start,targets,purpose,km,rate,notes}){
  const stops=[start,...targets].map(v=>v.trim());
  if(!date||stops.some(v=>!v)||!purpose.trim()||String(km).trim()===''||String(rate).trim()==='')throw Error('Täytä päivämäärä, lähtöpaikka, kohteet, ajon tarkoitus, kilometrit ja €/km.');
  km=number(km);rate=number(rate);
  if(!Number.isFinite(km)||km<0||!Number.isFinite(rate)||rate<0)throw Error('Tarkista kilometrit ja €/km.');
  const route=stops.join(' → '),description=[purpose.trim(),notes.trim()].filter(Boolean).join('\n');
  if(route.length>500||description.length>2000)throw Error('Reitti tai muistiinpano on liian pitkä.');
  return {date,route,km,rate,notes:description};
}
export function expenseValues(rows){
  return rows.map(row=>{
    const amount=number(row.amount),notes=(row.notes||'').trim();
    if(!categories[row.category]||String(row.amount).trim()===''||!Number.isFinite(amount)||amount<0||notes.length>2000)throw Error('Tarkista kululaji, summa ja kuvaus.');
    return {...row,amount,notes:notes||null};
  });
}
// The same IDs survive a partial save. Changed data starts a separate batch.
export function batchIds(storage,key,fingerprint,count,uuid){
  let old;try{old=JSON.parse(storage.getItem(key)||'null')}catch{}
  if(old?.fingerprint===fingerprint&&old.expenses?.length===count)return old;
  const batch={fingerprint,trip:uuid(),expenses:Array.from({length:count},uuid)};
  storage.setItem(key,JSON.stringify(batch));return batch;
}

const validDateTime=value=>{if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value||''))return false;const [year,month,day,hour,minute]=value.split(/[-T:]/).map(Number),d=new Date(year,month-1,day,hour,minute);return d.getFullYear()===year&&d.getMonth()===month-1&&d.getDate()===day&&d.getHours()===hour&&d.getMinutes()===minute};
const TRIP_METADATA='\n[Kontakti-ajotiedot-v1]';
export function tripDetails(notes){
  const value=String(notes||''),i=value.lastIndexOf(TRIP_METADATA);
  if(i<0)return {notes:value,metadata:null};
  try{const metadata=JSON.parse(value.slice(i+TRIP_METADATA.length));if(metadata.version!==1||!metadata.vehicle||typeof metadata.vehicle.registration!=='string'||typeof metadata.vehicle.type!=='string'||typeof metadata.startAt!=='string'||typeof metadata.endAt!=='string'||!validDateTime(metadata.startAt)||!validDateTime(metadata.endAt)||metadata.endAt<metadata.startAt)return {notes:value,metadata:null};return {notes:value.slice(0,i),metadata}}catch{return {notes:value,metadata:null}}
}
export function withTripDetails(trip,{vehicle,startAt,endAt}){
  if(!vehicle?.registration||!vehicle?.type)throw Error('Lisää ajoneuvo asetuksissa ja valitse se ajolle.');
  if(!validDateTime(startAt)||!validDateTime(endAt)||endAt<startAt||startAt.slice(0,10)!==trip.date)throw Error('Tarkista lähtö- ja paluuajankohdat. Paluu ei voi olla ennen lähtöä.');
  const metadata={version:1,vehicle:{registration:vehicle.registration,model:vehicle.model||'',type:vehicle.type},startAt,endAt};
  const notes=trip.notes+TRIP_METADATA+JSON.stringify(metadata);
  if(notes.length>2000)throw Error('Muistiinpano on liian pitkä ajoneuvo- ja aikatietojen kanssa.');
  return {...trip,notes};
}
