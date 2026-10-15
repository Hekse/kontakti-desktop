const translations={
 fi:{heroTitle:'Asiakkaat lähellä,',heroSubtitle:'seuraava yhteys selvillä.',intro:'Asiakkaat, yhteydenotot ja seuraavat askeleet yhdessä paikassa.',calls:'Päivän yhteydenotot',callsSub:'Tiedät, kenelle soittaa seuraavaksi',customers:'Asiakkuuden koko kuva',customersSub:'Muistiinpanot ja historia mukana',next:'Huominen jo näkyvissä',nextSub:'Valmistaudu seuraavaan päivään',expenses:'Ajot ja kulut',expensesSub:'Kirjaa ajot, kulut ja kuitit samalla.',welcome:'Tervetuloa takaisin',welcomeSub:'Kirjaudu jatkaaksesi Kontaktiin.',email:'Sähköposti',password:'Salasana',forgot:'Unohditko salasanasi?',signIn:'Kirjaudu',authenticating:'Kirjaudutaan…',loading:'Valmistellaan työtilaasi…',loadingSub:'Asiakkaat ja päivän yhteydenotot',failed:'Kirjautuminen epäonnistui. Tarkista sähköposti ja salasana.',rateLimited:'Liian monta kirjautumisyritystä. Odota hetki ja yritä uudelleen.',loadFailed:'Työtilan lataaminen epäonnistui. Tarkista verkkoyhteys ja yritä uudelleen.',retry:'Yritä uudelleen',show:'Näytä salasana',hide:'Piilota salasana'},
 en:{heroTitle:'Keep customers close,',heroSubtitle:'know your next connection.',intro:'Customers, contacts and next steps together in one place.',calls:'Your daily contacts',callsSub:'Know who to call next',customers:'The full customer picture',customersSub:'Notes and history wherever you go',next:'Tomorrow at a glance',nextSub:'Prepare for the next day',expenses:'Trips and expenses',expensesSub:'Record trips, expenses and receipts together.',welcome:'Welcome back',welcomeSub:'Sign in to continue to Kontakti.',email:'Email',password:'Password',forgot:'Forgot your password?',signIn:'Sign in',authenticating:'Signing in…',loading:'Preparing your workspace…',loadingSub:'Customers and your daily contacts',failed:'Sign in failed. Check your email and password.',rateLimited:'Too many sign-in attempts. Please wait a moment and try again.',loadFailed:'Could not load your workspace. Check your connection and try again.',retry:'Try again',show:'Show password',hide:'Hide password'}
};

// Credentials stay in the form and go only to the existing Supabase Auth call.
// Workspace data is loaded by the application once, before this screen is hidden.
export function createLoginScreen({host,sb,onAuthenticated,onLanguageChange}){
 const q=id=>host.querySelector('#'+id);
 let lang='fi';try{lang=localStorage.getItem('kontakti_v5_lang')==='en'?'en':'fi'}catch{}
 let submitting=false,loadingKey='loading',errorKey=null;
 const t=key=>translations[lang][key];
 function applyLanguage(){
  host.querySelectorAll('[data-login-i18n]').forEach(el=>{el.textContent=t(el.dataset.loginI18n)});
  host.querySelectorAll('[data-login-lang]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.loginLang===lang)));
  q('loginTogglePassword').setAttribute('aria-label',t(q('loginPassword').type==='password'?'show':'hide'));
  q('loginLoadingTitle').textContent=t(loadingKey);
  if(errorKey)q('loginError').textContent=t(errorKey);
  document.documentElement.lang=lang;
 }
 function loading(key='loading'){
  loadingKey=key;host.hidden=false;q('loginLoading').hidden=false;q('loginError').hidden=true;q('splashRetry').hidden=true;
  q('loginSubmit').disabled=true;host.setAttribute('aria-busy','true');applyLanguage();
 }
 function showForm(){
  host.hidden=false;submitting=false;errorKey=null;q('loginForm').hidden=false;q('loginLoading').hidden=true;q('loginError').hidden=true;q('splashRetry').hidden=true;
  q('loginSubmit').disabled=false;host.setAttribute('aria-busy','false');document.title='Kontakti — '+(lang==='en'?'Sign in':'Kirjaudu');
 }
 function error(){
  errorKey='loadFailed';host.hidden=false;q('loginLoading').hidden=true;q('loginError').hidden=false;q('splashRetry').hidden=false;
  q('loginSubmit').disabled=true;host.setAttribute('aria-busy','false');applyLanguage();
 }
 host.querySelectorAll('[data-login-lang]').forEach(button=>button.addEventListener('click',()=>{
  lang=button.dataset.loginLang;try{localStorage.setItem('kontakti_v5_lang',lang)}catch{}
  applyLanguage();onLanguageChange?.(lang);
 }));
 q('loginTogglePassword').addEventListener('click',()=>{q('loginPassword').type=q('loginPassword').type==='password'?'text':'password';applyLanguage()});
 q('loginForm').addEventListener('submit',async event=>{
  event.preventDefault();if(submitting)return;
  const email=q('loginEmail').value.trim(),password=q('loginPassword').value;if(!email||!password)return;
  submitting=true;loading('authenticating');
  try{
   const result=await sb.auth.signInWithPassword({email,password});
   if(result.error)throw result.error;
   q('loginPassword').value='';loading();await onAuthenticated();
  }catch(err){
   showForm();errorKey=err?.status===429||/rate limit|too many requests/i.test(err?.message||'')?'rateLimited':'failed';q('loginError').hidden=false;applyLanguage();
  }
 });
 applyLanguage();
 return {loading,showForm,error};
}
