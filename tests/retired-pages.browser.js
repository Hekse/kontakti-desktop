async page=>{
 const context=await page.context().browser().newContext({javaScriptEnabled:false});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='127.0.0.1')return route.abort();if(u.pathname.endsWith('/cloud-ui-v12.html'))return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Current app</title><p>Current app target</p>'});return route.continue()});
 const tab=await context.newPage(),results=[];
 for(const name of ['json-sync-bridge.html','cloud-ui.html','cloud-ui-v2.html']){
  await tab.goto('http://127.0.0.1:3012/kontakti-desktop/'+name+'?next=https%3A%2F%2Fexample.invalid%2F#%3Cscript%3E');
  await tab.waitForURL('http://127.0.0.1:3012/kontakti-desktop/cloud-ui-v12.html');
  if(await tab.locator('iframe,input[type=file],script').count())throw Error('Legacy executable UI survived');
  results.push({page:name,target:tab.url(),javascriptDisabled:true});
 }
 await context.close();return {status:'PASS',results};
}
