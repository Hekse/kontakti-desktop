import test from 'node:test';
import assert from 'node:assert/strict';
import {tr,locale} from '../ajo-i18n.js';
import {tripValues,withTripDetails,tripDetails} from '../ajo-form.js';
test('English presentation leaves persisted trip and user text unchanged',()=>{
 globalThis.document={documentElement:{lang:'en'}};
 try{
  assert.equal(locale(),'en-GB');assert.equal(tr('Km-korvaus'),'Mileage reimbursement');assert.equal(tr('Toimitus Kuopioon'),'Toimitus Kuopioon');
  const trip=tripValues({date:'2026-10-10',start:'Kulut',targets:['Asiakas Oy'],purpose:'Tuotteiden toimitus',km:'27,2',rate:'0,55',notes:'Muistiinpano'});
  const saved=withTripDetails(trip,{vehicle:{registration:'ABC-123',model:'Auto',type:'Auto'},startAt:'2026-10-10T10:00',endAt:'2026-10-10T11:00'});
  assert.equal(saved.route,'Kulut → Asiakas Oy');assert.equal(saved.rate,0.55);assert.equal(tripDetails(saved.notes).metadata.vehicle.type,'Auto');assert.equal(tripDetails(saved.notes).metadata.vehicle.model,'Auto');
  document.documentElement.lang='fi';assert.equal(tr('Km-korvaus'),'Km-korvaus');assert.equal(locale(),'fi-FI');
 }finally{delete globalThis.document;}
});
