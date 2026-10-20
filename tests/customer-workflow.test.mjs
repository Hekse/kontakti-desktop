import test from 'node:test';
import assert from 'node:assert/strict';
import {purchaseHistory,purchasePeriod,updateDayPlan,validPurchaseDate} from '../customer-workflow.js';

const day='2026-10-20';
const customers=Array.from({length:19},(_,i)=>({id:String(i),next_date:day}));
test('day cohort survives reload, counts each customer once and resets next day',()=>{
  let plan=updateDayPlan(null,day,customers);
  assert.equal(plan.remaining,19);assert.equal(plan.total,19);
  const updated=customers.map((c,i)=>i<2?{...c,next_date:'2026-10-21'}:c);
  plan=updateDayPlan(JSON.parse(JSON.stringify(plan)),day,updated);
  assert.deepEqual([plan.remaining,plan.completed,plan.total],[17,2,19]);
  const again=updateDayPlan(plan,day,updated);
  assert.deepEqual(again,plan);
  const finished=updateDayPlan(plan,day,updated.map(c=>({...c,next_date:'2026-10-21'})));
  assert.deepEqual([finished.remaining,finished.completed,finished.percent],[0,19,100]);
  const tomorrow=updateDayPlan(finished,'2026-10-21',updated);
  assert.equal(tomorrow.completed,0);assert.equal(tomorrow.remaining,19);
});
test('new due customers expand cohort; requeued customers reopen and deletions leave it',()=>{
  const plan=updateDayPlan(null,day,customers);
  assert.equal(updateDayPlan(plan,day,[...customers,{id:'new',next_date:day}]).total,20);
  const done=updateDayPlan(plan,day,customers.map(c=>({...c,next_date:'2026-10-22'})));
  assert.equal(updateDayPlan(done,day,customers).remaining,19);
  assert.equal(updateDayPlan(plan,day,customers.filter(c=>c.id!=='0')).total,18);
  assert.equal(updateDayPlan(plan,day,customers.map(c=>({...c,deleted_at:day}))).total,0);
});
test('purchase history includes full data, both boundary dates, adjustments and text-only orders',()=>{
  const notes=Array.from({length:12},(_,i)=>({id:String(i),customer_id:'a',note_date:i<6?'2026-10-01':'2026-10-20',purchases_text:'Ostos '+i,sales:0.1}));
  notes.push({id:'credit',customer_id:'a',note_date:'2026-10-20',sales:-0.2});
  notes.push({id:'note',customer_id:'a',note_date:'2026-10-01',note_text:'Soitettu',sales:0});
  notes.push({id:'other',customer_id:'b',note_date:'2026-10-01',sales:900});
  notes.push({id:'deleted',customer_id:'a',note_date:'2026-10-01',sales:900,deleted_at:day});
  const result=purchaseHistory(notes,'a','2026-10-01','2026-10-20');
  assert.equal(result.count,13);assert.equal(result.total,1);
  assert.equal(purchaseHistory(notes,'a','2026-10-02','2026-10-19').count,0);
  assert.equal(notes.length,16);assert.throws(()=>purchaseHistory(notes,'a','2026-11-01','2026-10-01'));
});
test('custom and preset periods use real inclusive calendar dates',()=>{
  assert.deepEqual(purchasePeriod('prevmonth','2026-01-20'),{from:'2025-12-01',to:'2025-12-31'});
  assert.deepEqual(purchasePeriod('prevmonth','2028-03-01'),{from:'2028-02-01',to:'2028-02-29'});
  assert.deepEqual(purchasePeriod('prevyear',day),{from:'2025-01-01',to:'2025-12-31'});
  assert.deepEqual(purchasePeriod('all',day),{from:'',to:''});
  assert.equal(validPurchaseDate('2026-02-30'),false);assert.equal(validPurchaseDate('2028-02-29'),true);
});
