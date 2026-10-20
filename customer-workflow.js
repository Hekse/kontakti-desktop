// Presentation helpers. Stored note/customer IDs and existing dates remain canonical.
export function validPurchaseDate(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
  const d=new Date(value+'T12:00:00Z');
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
}
export const isPurchase=n=>!n.deleted_at&&(Boolean((n.purchases_text||'').trim())||Number(n.sales||0)!==0);
export function purchaseHistory(notes,customerId,from='',to=''){
  if((from&&!validPurchaseDate(from))||(to&&!validPurchaseDate(to))||(from&&to&&from>to))throw Error('invalid-range');
  const rows=notes.filter(n=>n.customer_id===customerId&&isPurchase(n)&&(!from||n.note_date>=from)&&(!to||n.note_date<=to))
    .slice().sort((a,b)=>(b.note_date||'').localeCompare(a.note_date||'')||(b.created_at||'').localeCompare(a.created_at||'')||String(a.id).localeCompare(String(b.id)));
  return {rows,count:rows.length,total:rows.reduce((s,n)=>s+Math.round(Number(n.sales||0)*100),0)/100};
}
export function purchasePeriod(which,today){
  const [year,month]=today.split('-').map(Number);
  if(which==='year')return {from:year+'-01-01',to:today};
  if(which==='prevyear')return {from:(year-1)+'-01-01',to:(year-1)+'-12-31'};
  if(which==='month')return {from:today.slice(0,7)+'-01',to:today};
  if(which==='prevmonth'){
    const d=new Date(Date.UTC(year,month-1,0));
    return {from:d.toISOString().slice(0,7)+'-01',to:d.toISOString().slice(0,10)};
  }
  return {from:'',to:''};
}
// Membership is independent of search/sort filters. A rescheduled customer is
// complete; moving them back to today reopens them. Deleted customers leave the plan.
export function updateDayPlan(previous,date,customers){
  const active=customers.filter(c=>!c.deleted_at),activeIds=new Set(active.map(c=>c.id));
  const due=new Set(active.filter(c=>c.next_date&&c.next_date<=date).map(c=>c.id));
  const ids=[...new Set([...(previous?.date===date&&Array.isArray(previous.ids)?previous.ids:[]),...due])].filter(id=>activeIds.has(id)).sort();
  const total=ids.length,remaining=ids.filter(id=>due.has(id)).length,completed=total-remaining;
  return {date,ids,total,remaining,completed,percent:total?Math.round(completed/total*100):0};
}
