// Synthetic browser test backend; never contacts Supabase or uses a real session.
const key='kontakti-workflow-fixture-db-v2';
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const makeData=()=>({
  kontakti_workspaces:[{id:'workflow-fixture-workspace',name:'Kontakti testitiedot'}],
  kontakti_customers:Array.from({length:19},(_,i)=>({id:'fixture-'+i,workspace_id:'workflow-fixture-workspace',name:i===0?'Esimerkkikauppa Keskusta (testidata)':'Testiasiakas '+String(i+1).padStart(2,'0'),city:'Kuopio',next_date:today(),next_action:'Soitto',last_contact:'2026-09-01',created_at:'2026-01-01',deleted_at:null})),
  kontakti_notes:[...[1040,530,430,70,600,520,480,400,330,300].map((sales,i)=>({id:'purchase-'+i,workspace_id:'workflow-fixture-workspace',customer_id:'fixture-0',note_date:`2026-${String(10-i).padStart(2,'0')}-08`,purchases_text:i===0?'Songbird ennakkomyynti (testi)':'Testituotteet '+i,sales,created_at:'2026-10-20T08:00:00Z',created_source:'cloud-ui-v12',deleted_at:null})),{id:'contact',workspace_id:'workflow-fixture-workspace',customer_id:'fixture-0',note_date:today(),note_text:'Aiempi yhteydenotto (testi)',sales:0,created_source:'cloud-ui-v12',deleted_at:null}]
});
export function createClient(){
  let tables;try{tables=JSON.parse(localStorage.getItem(key))}catch{}tables||=makeData();
  const save=()=>localStorage.setItem(key,JSON.stringify(tables));
  return {auth:{async getUser(){return {data:{user:{id:'workflow-fixture-user'}}}},async signOut(){return {}}},from(table){
    let filters=[],offset=0,last=Infinity,one=false,mutation=null,executed=false,result;
    const query={select(){return query},eq(k,v){filters.push(r=>r[k]===v);return query},is(k,v){filters.push(r=>(r[k]??null)===v);return query},order(){return query},range(a,b){offset=a;last=b;return query},limit(n){last=n-1;return query},single(){one=true;return query},insert(value){mutation={insert:value};return query},update(value){mutation={update:value};return query},then(resolve,reject){
      if(!executed){executed=true;const rows=tables[table]||[];
        if(mutation?.insert){const values=Array.isArray(mutation.insert)?mutation.insert:[mutation.insert];for(const v of values)rows.push({id:crypto.randomUUID(),created_at:new Date().toISOString(),deleted_at:null,...v});save();}
        if(mutation?.update){rows.filter(r=>filters.every(f=>f(r))).forEach(r=>Object.assign(r,mutation.update));save();}
        // Smaller-than-requested pages test the real application pagination path.
        const data=rows.filter(r=>filters.every(f=>f(r))).slice(offset,Math.min(last+1,offset+3));
        result={data:one?(data[0]||null):structuredClone(data),error:null};
      }
      return Promise.resolve(result).then(resolve,reject);
    }};return query;
  }};
}
