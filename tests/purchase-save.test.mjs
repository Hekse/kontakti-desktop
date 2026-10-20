import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {validPurchaseDate} from '../customer-workflow.js';
const html=readFileSync(new URL('../cloud-ui-v12.html',import.meta.url),'utf8');
const saveCode=html.slice(html.indexOf('async function savePurchases(c){'),html.indexOf('function startEditLatest'));
function setup(date='2026-09-15',amount='123,45'){
 const fields={purchaseDate:{value:date},purchasesText:{value:'Songbird ennakkomyynti'},salesInput:{value:amount},btnSavePurchases:{}};
 const inserts=[],errors=[],customer={id:'customer',last_contact:'2026-10-20',next_date:'2026-11-01'};
 const context=vm.createContext({$:id=>fields[id],saveInFlight:false,parseNum:v=>Number(v.replace(',','.')),validPurchaseDate,validAmount:v=>/^\d+([.,]\d{1,2})?$/.test(v),t:k=>k,showFormError:(id,message)=>errors.push({id,message}),workspace:async()=>({id:'workspace'}),todayISO:()=> '2026-10-20',insertNoteRow:async row=>inserts.push(row),captureForm:()=>({noteText:'Unsaved note'}),load:async()=>true,renderAll(){},restoreForm(){},buttonSaved(){},toast(){},setListStatus(){},sel:null});
 vm.runInContext(saveCode,context);return {context,inserts,errors,customer};
}
test('a purchase uses its chosen day without changing the contact schedule',async()=>{
 const {context,inserts,customer}=setup();await context.savePurchases(customer);
 assert.equal(inserts.length,1);assert.equal(inserts[0].note_date,'2026-09-15');assert.equal(inserts[0].sales,123.45);
 assert.equal(inserts[0].note_text,null);assert.equal(inserts[0].customer_id,customer.id);assert.equal(inserts[0].workspace_id,'workspace');
 assert.equal(customer.last_contact,'2026-10-20');assert.equal(customer.next_date,'2026-11-01');
});
test('invalid or empty dates and invalid amounts never write a purchase',async()=>{
 for(const [day,amount] of [['','1'],['2026-02-30','1'],['2026-09-15','abc'],['2026-09-15','-10']]){
  const fixture=setup(day,amount);await fixture.context.savePurchases(fixture.customer);assert.equal(fixture.inserts.length,0);assert.equal(fixture.errors.length,1);
 }
});
