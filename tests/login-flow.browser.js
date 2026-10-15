// Run with playwright-cli run-code --filename tests/login-flow.browser.js; serve the parent work folder on 3012.
async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const authMock=`export function createClient(){
  const state=window.__test={signed:false,authCalls:0,customerLoads:0,noteLoads:0,mode:'success',hold:false,failData:false};
  const user={id:'fixture-user',email:'fixture@example.invalid'};
  return {auth:{getUser:async()=>({data:{user:state.signed?user:null}}),signInWithPassword:async()=>{state.authCalls++;if(state.mode==='invalid')return {error:{status:400,message:'invalid'}};if(state.mode==='rate')return {error:{status:429,message:'rate limited'}};state.signed=true;return {data:{user}}},signOut:async()=>{state.signed=false;return {}}},from(table){const query={select(){return query},eq(){return query},is(){return query},order(){return query},limit:async()=>({data:[{id:'fixture-workspace'}]}),async range(from){if(from)return {data:[]};if(table==='kontakti_customers'){state.customerLoads++;if(state.hold)await new Promise(r=>window.__releaseWorkspace=r);if(state.failData){state.failData=false;return {error:{message:'fixture offline'}}}return {data:[{id:'fixture-customer',name:'Testiasiakas',next_date:new Date().toISOString().slice(0,10)},{id:'tomorrow',name:'Huomisen asiakas',next_date:new Date(Date.now()+86400000).toISOString().slice(0,10)}]}}state.noteLoads++;return {data:[]}}};return query}}}
 `;
 await page.route('https://esm.sh/@supabase/supabase-js@2.117.2',r=>r.fulfill({contentType:'text/javascript',body:authMock}));
 await page.goto('http://127.0.0.1:3012/kontakti-desktop/login.html');
 await page.locator('#loginForm').waitFor({state:'visible'});
 for(const width of [320,390,768,1024,1440,1660]){
  await page.setViewportSize({width,height:948});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.querySelector('.login-page').scrollWidth>innerWidth))throw Error('overflow '+width);
  const colors=await page.locator('#loginHeroTitle span').evaluateAll(es=>es.map(e=>getComputedStyle(e).color));if(colors[0]!==colors[1])throw Error('headline color');
  const flags=await page.locator('[data-login-lang]').evaluateAll(es=>es.map(e=>({border:getComputedStyle(e).borderWidth,background:getComputedStyle(e).backgroundColor,shadow:getComputedStyle(e).boxShadow})));if(flags.some(s=>s.border!=='0px'||s.shadow!=='none'||s.background!=='rgba(0, 0, 0, 0)'))throw Error('flag boxes');
  if(width===390||width===1660)await page.screenshot({path:'output/playwright/login-final-'+width+'.png'});
 }
 await page.getByRole('button',{name:'English',exact:true}).click();await page.getByRole('heading',{name:'Welcome back',exact:true}).waitFor();
 await page.getByLabel('Email',{exact:true}).fill('fixture@example.invalid');await page.getByLabel('Password',{exact:true}).fill('fixture-only');
 await page.getByRole('button',{name:'Show password',exact:true}).click();if(await page.getByLabel('Password',{exact:true}).getAttribute('type')!=='text')throw Error('toggle');
 for(const [mode,text] of [['invalid','Sign in failed. Check your email and password.'],['rate','Too many sign-in attempts. Please wait a moment and try again.']]){
  await page.evaluate(m=>window.__test.mode=m,mode);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByText(text,{exact:true}).waitFor();
 }
 await page.evaluate(()=>{window.__test.mode='success';window.__test.hold=true});
 await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByText('Preparing your workspace…',{exact:true}).waitFor();
 const during=await page.evaluate(()=>({booting:document.body.classList.contains('booting'),hidden:getComputedStyle(document.querySelector('.app')).visibility,password:document.querySelector('#loginPassword').value,loads:window.__test.customerLoads}));
 if(!during.booting||during.hidden!=='hidden'||during.password!==''||during.loads!==1)throw Error('loading barrier '+JSON.stringify(during));
 await page.screenshot({path:'output/playwright/login-loading-final.png'});
 await page.evaluate(()=>window.__releaseWorkspace());await page.locator('#splash').waitFor({state:'hidden'});
 if(await page.locator('#pillToday').textContent()!=='1'||await page.locator('.tomorrow-preview').count()!==1)throw Error('app render');
 if(await page.evaluate(()=>window.__test.customerLoads)!==1)throw Error('duplicate fetch');
 // A workspace failure must keep the app hidden and retry on this same screen.
 await page.reload();await page.locator('#loginForm').waitFor({state:'visible'});
 await page.evaluate(()=>{window.__test.failData=true});
 await page.getByLabel('Email',{exact:true}).fill('fixture@example.invalid');await page.getByLabel('Password',{exact:true}).fill('fixture-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.getByText('Could not load your workspace. Check your connection and try again.',{exact:true}).waitFor();
 if(!await page.evaluate(()=>document.body.classList.contains('booting')))throw Error('failure leaked app');
 await page.getByRole('button',{name:'Try again',exact:true}).click();await page.locator('#splash').waitFor({state:'hidden'});
 if(errors.length)throw Error(JSON.stringify(errors));
 return {widths:[320,390,768,1024,1440,1660],flagsWithoutBoxes:true,headlineOneColor:true,FI_EN:true,passwordToggle:true,invalidAuth:true,rateLimit:true,dataReadyBarrier:true,singleCustomerLoad:true,workspaceRetry:true,existingTodayAndTomorrow:true,errors};
}
