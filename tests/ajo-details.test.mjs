import test from 'node:test';
import assert from 'node:assert/strict';
import {tripValues,withTripDetails,tripDetails} from '../ajo-form.js';
const trip=tripValues({date:'2026-10-10',start:'Toimisto',targets:['Asiakas'],purpose:'Käynti',km:'20',rate:'0,55',notes:'Huomio'});
const vehicle={registration:'ABC-123',type:'Auto',model:'Testiauto'};
const details={vehicle,startAt:'2026-10-10T23:30',endAt:'2026-10-11T01:00'};
test('vehicle and overnight travel times survive persisted notes',()=>{const saved=withTripDetails(trip,details);const decoded=tripDetails(saved.notes);assert.equal(decoded.notes,trip.notes);assert.equal(decoded.metadata.endAt,details.endAt);vehicle.model='Changed';assert.equal(tripDetails(saved.notes).metadata.vehicle.model,'Testiauto');vehicle.model='Testiauto'});
test('legacy notes and malformed metadata stay readable',()=>{assert.deepEqual(tripDetails('Vanha ajo'),{notes:'Vanha ajo',metadata:null});const malformed='Huomio\n[Kontakti-ajotiedot-v1]oops';assert.equal(tripDetails(malformed).notes,malformed)});
test('missing vehicle, reversed times and wrong start date are rejected',()=>{assert.throws(()=>withTripDetails(trip,{...details,vehicle:null}));assert.throws(()=>withTripDetails(trip,{...details,endAt:'2026-10-10T20:00'}));assert.throws(()=>withTripDetails(trip,{...details,startAt:'2026-10-09T20:00'}));assert.throws(()=>withTripDetails(trip,{...details,startAt:''}))});
test('metadata respects persisted notes length limit',()=>{assert.throws(()=>withTripDetails({...trip,notes:'a'.repeat(1990)},details))});

test("impossible calendar dates cannot become valid trips",()=>{assert.throws(()=>withTripDetails({...trip,date:"2026-02-30"},{...details,startAt:"2026-02-30T12:00",endAt:"2026-03-01T14:00"}))});
