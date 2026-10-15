import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const html=readFileSync(new URL('../cloud-ui-v12.html',import.meta.url),'utf8');
const fn=html.slice(html.indexOf('function visible('),html.indexOf('function renderList('));
function setup(day){
 const ctx=vm.createContext({cs:[{id:'late',next_date:'2026-10-14'},{id:'today',next_date:day},{id:'tomorrow',next_date:add(day,1),priority:true},{id:'later',next_date:add(day,2)},{id:'none'}],view:'today',todayISO:()=>day,addDaysISO:add,curFilters:()=>({sortMode:'default'}),computeRange:()=>null,buildMetrics:()=>new Map(),lastTodayEligibleTotal:0});
 vm.runInContext(fn,ctx);return ctx;
}
function add(day,n){const d=new Date(day+'T00:00:00');d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
for(const day of ['2026-10-15','2026-10-31','2026-12-31','2028-02-28']) test('preview separate from today and counters across '+day,()=>{
 const ctx=setup(day);assert.deepEqual(Array.from(ctx.visible(),c=>c.id),['late','today']);
 const current=ctx.lastVisibleArr;assert.deepEqual(Array.from(ctx.visible(true),c=>c.id),['tomorrow']);
 assert.equal(ctx.lastTodayEligibleTotal,2);assert.equal(ctx.lastVisibleArr,current);
});
test('preview shares customer filters without changing eligibility',()=>{const ctx=setup('2026-10-15');ctx.curFilters=()=>({sortMode:'default',priorityOnly:true});assert.equal(ctx.visible().length,0);assert.equal(ctx.visible(true).length,1);assert.equal(ctx.lastTodayEligibleTotal,2)});
