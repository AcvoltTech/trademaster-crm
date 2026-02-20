/**
 * TRADE MASTER CRM - AI DEMO ENGINE v4.0
 * Installs mock BEFORE DOMContentLoaded so script.js inits naturally
 * ACVOLT Tech School Inc.
 */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('demo')!=='true')return;

/* ===== COMPANY DATA ===== */
var CO={name:'Rodriguez HVAC LLC',phone:'(909) 555-0000',email:'info@rodriguezhvac.com',address:'1850 S. Waterman Ave, Suite 100, San Bernardino, CA 92408',license:'C-20 #1087654',bond:'Bond #SB-2024-87654',owner:'Marco Rodriguez'};
var TS=55,SD=2000,W=3000;
var S={step:0,total:35,playing:false,paused:false,mini:false};

/* ===== MOCK SUPABASE - INSTALL IMMEDIATELY ===== */
var _db={companies:[],clients:[],leads:[],technicians:[],work_orders:[],invoices:[],expenses:[],payroll_entries:[],campaigns:[],price_book:[],home_advisors:[],company_settings:[],appointments:[],installations:[],referrals:[],time_clock:[],team_users:[],estimates:[],password_reset_requests:[]};
var _idc=1000;

// Pre-populate company
_db.companies.push({id:'demo-co',name:CO.name,email:CO.email,phone:CO.phone,address:CO.address,contractor_license:CO.license,created_by:'demo-user',plan:'enterprise',created_at:new Date().toISOString()});
_db.company_settings.push({id:'cs1',company_id:'demo-co',owner_name:CO.owner,contractor_bond:CO.bond,payroll_config:{},created_at:new Date().toISOString()});

function MQ(t){this._t=t;this._f={};this._ins=null;this._upd=null;this._del=false;}
MQ.prototype.select=function(){return this;};
MQ.prototype.eq=function(k,v){this._f[k]=v;return this;};
MQ.prototype.neq=function(){return this;};MQ.prototype.gt=function(){return this;};MQ.prototype.gte=function(){return this;};
MQ.prototype.lt=function(){return this;};MQ.prototype.lte=function(){return this;};MQ.prototype.in=function(){return this;};
MQ.prototype.is=function(){return this;};MQ.prototype.ilike=function(){return this;};MQ.prototype.like=function(){return this;};
MQ.prototype.or=function(){return this;};MQ.prototype.not=function(){return this;};MQ.prototype.filter=function(){return this;};
MQ.prototype.limit=function(){return this;};MQ.prototype.range=function(){return this;};
MQ.prototype.order=function(){return this;};
MQ.prototype.single=function(){
  if(this._ins)return Promise.resolve({data:this._ins,error:null});
  var d=this._run();return Promise.resolve({data:d[0]||null,error:null});
};
MQ.prototype.maybeSingle=function(){return this.single();};
MQ.prototype.insert=function(data){
  var arr=Array.isArray(data)?data:[data];var s=_db[this._t];if(!s){_db[this._t]=[];s=_db[this._t];}
  for(var i=0;i<arr.length;i++){arr[i].id=arr[i].id||'m'+(++_idc);arr[i].created_at=arr[i].created_at||new Date().toISOString();s.push(arr[i]);}
  this._ins=arr.length===1?arr[0]:arr;return this;
};
MQ.prototype.update=function(d){this._upd=d;return this;};
MQ.prototype.upsert=function(d){return this.insert(d);};
MQ.prototype['delete']=function(){this._del=true;return this;};
MQ.prototype._run=function(){
  var s=_db[this._t]||[];var f=this._f;
  if(this._del){_db[this._t]=s.filter(function(r){for(var k in f)if(r[k]!==f[k])return true;return false;});return[];}
  if(this._upd){var u=this._upd;s.forEach(function(r){var m=true;for(var k in f)if(r[k]!==f[k])m=false;if(m)for(var x in u)r[x]=u[x];});return s;}
  return s.filter(function(r){for(var k in f)if(r[k]!==f[k])return false;return true;});
};
MQ.prototype.then=function(ok,fail){
  try{if(this._ins)ok({data:this._ins,error:null});
  else{var d=this._run();ok({data:d,error:null,count:d.length});}
  }catch(e){if(fail)fail(e);else ok({data:null,error:e});}
};
MQ.prototype['catch']=function(){return this;};

// INSTALL MOCK NOW - before DOMContentLoaded
window.sbClient={
  from:function(t){return new MQ(t);},
  auth:{
    getUser:function(){return Promise.resolve({data:{user:{id:'demo-user',email:'demo@rodriguezhvac.com',user_metadata:{first_name:'Marco',last_name:'Rodriguez',company_name:CO.name}}}});},
    getSession:function(){return Promise.resolve({data:{session:{user:{id:'demo-user',email:'demo@rodriguezhvac.com',user_metadata:{first_name:'Marco',last_name:'Rodriguez',company_name:CO.name}}}}});},
    signUp:function(){return Promise.resolve({data:{},error:null});},
    signInWithPassword:function(){return Promise.resolve({data:{},error:null});},
    signOut:function(){return Promise.resolve({});},
    onAuthStateChange:function(fn){return{data:{subscription:{unsubscribe:function(){}}}};},
    resetPasswordForEmail:function(){return Promise.resolve({});}
  },
  storage:{from:function(){return{upload:function(){return Promise.resolve({data:{},error:null});},getPublicUrl:function(){return{data:{publicUrl:''}};},list:function(){return Promise.resolve({data:[]});}};}},
  channel:function(){return{on:function(){return this;},subscribe:function(){return this;}};},
  removeChannel:function(){}
};

// Suppress alerts during demo
var _origAlert=window.alert;
window.alert=function(msg){if(S.step>0||S.playing)return;_origAlert.call(window,msg);};

// Polyfill: formatMoney (missing from script.js)
if(typeof window.formatMoney==='undefined'){window.formatMoney=function(n){if(n==null)return'0.00';return Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});};}

/* ===== UTILITIES ===== */
function sl(ms){return new Promise(function(r){setTimeout(r,ms);});}
function ck(){if(S.paused)return new Promise(function(r){var i=setInterval(function(){if(!S.paused){clearInterval(i);r();}},100);});return Promise.resolve();}
function ty(el,txt){
  if(!el)return Promise.resolve();el.value='';el.focus();var i=0;
  return new Promise(function(res){
    (function n(){if(i>=txt.length){el.dispatchEvent(new Event('change',{bubbles:true}));res();return;}
    if(S.paused){setTimeout(n,100);return;}el.value+=txt[i];el.dispatchEvent(new Event('input',{bubbles:true}));i++;setTimeout(n,TS);})();
  });
}
function sv(el,v){if(!el)return;el.value=v;el.dispatchEvent(new Event('change',{bubbles:true}));}
function clk(el){
  if(!el){console.warn('Demo: element not found for click');return Promise.resolve();}
  el.scrollIntoView({behavior:'smooth',block:'center'});
  return sl(400).then(function(){
    var r=el.getBoundingClientRect();var rp=document.createElement('div');rp.className='demo-ripple';
    rp.style.cssText='left:'+(r.left+r.width/2)+'px;top:'+(r.top+r.height/2)+'px;';
    document.body.appendChild(rp);return sl(300).then(function(){el.click();return sl(500).then(function(){rp.remove();});});
  });
}
function $(id){return document.getElementById(id);}
function $q(s){return document.querySelector(s);}
// Smooth section switch - prevents flash
var _origShowSection=null;
function smoothShow(name){
  var mc=$q('.main-content');
  if(mc){mc.style.opacity='0';setTimeout(function(){if(_origShowSection)_origShowSection(name);else if(window.showSection)window.showSection(name);mc.style.opacity='1';},150);}
  else{if(_origShowSection)_origShowSection(name);else if(window.showSection)window.showSection(name);}
}

/* ===== CSS ===== */
function injectCSS(){
  var s=document.createElement('style');s.textContent=
  '#demoSplash{position:fixed;inset:0;z-index:20000;background:linear-gradient(135deg,#0f172a,#1e293b,#0f172a);display:flex;align-items:center;justify-content:center;transition:opacity .8s,transform .8s}'+
  '#demoSplash.ds-exit{opacity:0;transform:scale(1.05)}.ds-content{text-align:center;color:#fff;max-width:540px;padding:40px;animation:dsFI .8s ease-out}'+
  '.ds-btn{padding:18px 48px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;border-radius:16px;font-size:1.1rem;font-weight:700;cursor:pointer;box-shadow:0 8px 30px rgba(249,115,22,.4)}.ds-btn:hover{transform:translateY(-2px)}'+
  '@keyframes dsFI{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}'+
  '#sofiaPanel{position:fixed;bottom:20px;right:20px;width:400px;min-width:340px;max-height:70vh;background:var(--bg-card,#1e293b);border:1px solid var(--border,#334155);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.3);z-index:99999;display:flex;flex-direction:column;overflow:hidden}'+
  '.sf-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:linear-gradient(135deg,#1e3a5f,#2d4a6f);cursor:move;border-radius:16px 16px 0 0;flex-shrink:0}'+
  '.sf-hl{display:flex;align-items:center;gap:10px}.sf-av{font-size:26px}.sf-name{font-weight:700;color:#fff;font-size:14px;display:block}.sf-role{font-size:11px;color:#94a3b8}'+
  '.sf-hr{display:flex;gap:4px}.sf-hb{background:rgba(255,255,255,.15);border:none;color:#fff;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center}.sf-hb:hover{background:rgba(255,255,255,.3)}'+
  '.sf-body{flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0 12px 8px}'+
  '.sf-pbar{height:6px;background:#334155;border-radius:3px;margin:12px 0 4px;overflow:hidden;flex-shrink:0}.sf-pfill{height:100%;background:linear-gradient(90deg,#f97316,#f59e0b);border-radius:3px;width:0;transition:width .5s}'+
  '.sf-step{font-size:11px;color:#94a3b8;text-align:center;margin-bottom:8px;flex-shrink:0}'+
  '.sf-chat{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:4px 0;min-height:100px;max-height:45vh}'+
  '.sf-msg{display:flex;gap:8px;padding:10px 12px;border-radius:10px;font-size:13px;line-height:1.6;animation:sfSl .5s ease-out;word-wrap:break-word;overflow-wrap:break-word}'+
  '.sf-mi{flex-shrink:0;font-size:14px;margin-top:1px}.sf-mt{flex:1}'+
  '.sf-info{background:#1e3a5f22;border:1px solid #1e3a5f44;color:var(--text,#cbd5e1)}'+
  '.sf-action{background:#f9731622;border:1px solid #f9731644;color:var(--text,#cbd5e1)}'+
  '.sf-success{background:#10b98122;border:1px solid #10b98144;color:var(--text,#cbd5e1)}'+
  '.sf-nav{background:#8b5cf622;border:1px solid #8b5cf644;color:var(--text,#cbd5e1)}'+
  '@keyframes sfSl{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'+
  '.sf-ctrl{display:flex;gap:6px;padding:10px 12px;border-top:1px solid var(--border,#334155);flex-shrink:0;justify-content:center}'+
  '.sf-cb{padding:6px 12px;border:1px solid var(--border,#334155);background:var(--bg-input,#0f172a);color:var(--text,#e2e8f0);border-radius:8px;cursor:pointer;font-size:12px}.sf-cb:hover{background:var(--primary,#1e3a5f);color:#fff}'+
  '.sf-cp{background:#f97316;color:#fff;border-color:#f97316;font-weight:600}.sf-auto{background:#10b981;color:#fff;border-color:#10b981;font-weight:600}'+
  '#sfBubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;display:none;align-items:center;justify-content:center;cursor:pointer;z-index:9998;box-shadow:0 6px 20px rgba(249,115,22,.4);font-size:26px;animation:sfP 2s infinite}'+
  '#sfBubble:hover{transform:scale(1.1)}@keyframes sfP{0%,100%{box-shadow:0 6px 20px rgba(249,115,22,.4)}50%{box-shadow:0 6px 30px rgba(249,115,22,.6)}}'+
  '.demo-ripple{position:fixed;width:30px;height:30px;border-radius:50%;background:rgba(249,115,22,.4);pointer-events:none;z-index:10002;transform:translate(-50%,-50%);animation:dmR .8s ease-out forwards}'+
  '@keyframes dmR{to{width:60px;height:60px;opacity:0}}'+
  '@media(max-width:640px){#sofiaPanel{width:calc(100% - 16px);min-width:280px;right:8px;bottom:8px;max-height:55vh}.sf-chat{max-height:35vh}}';
  document.head.appendChild(s);
  // Add smooth transitions to CRM sections to prevent flash
  var st2=document.createElement('style');st2.textContent=
  '.main-content{transition:opacity .3s ease !important}'+
  '.section-content{animation:demoFadeIn .4s ease-out !important}'+
  '@keyframes demoFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'+
  '.form-group input,.form-group select,.form-group textarea{transition:border-color .2s,box-shadow .2s !important}'+
  '.form-group input:focus,.form-group select:focus,.form-group textarea:focus{box-shadow:0 0 0 3px rgba(249,115,22,.2) !important;border-color:#f97316 !important}';
  document.head.appendChild(st2);
}

/* ===== SPLASH ===== */
function showSplash(){
  return new Promise(function(res){
    var s=document.createElement('div');s.id='demoSplash';
    s.innerHTML='<div class="ds-content"><div style="font-size:60px;margin-bottom:12px">\uD83D\uDD27</div><h1 style="font-size:2rem;font-weight:800;margin:0 0 6px;color:#fff">Trade Master CRM</h1><p style="color:#f97316;font-weight:600;margin:0 0 4px">Interactive AI Demo</p><p style="color:#94a3b8;font-size:.85rem;margin:0 0 24px">'+CO.name+'</p><p style="color:#cbd5e1;font-size:.9rem;line-height:1.7;margin:0 0 28px;max-width:440px">'+((window.currentLang||'es')==='en'?'I will walk you through every feature of the <strong>entire CRM</strong> — creating clients, technicians, jobs, invoices and more. <strong>35 complete steps</strong>.':'Brenda te enseñar\u00E1 cada funci\u00F3n del <strong>CRM completo</strong> — crear\u00E1 clientes, t\u00E9cnicos, trabajos, facturas y m\u00E1s. <strong>35 pasos completos</strong>.')+'</p><button id="demoStartBtn" class="ds-btn">\u25B6\uFE0F Start Demo</button><br><button id="demoAutoBtn" style="margin-top:12px;padding:12px 36px;background:transparent;color:#f97316;border:2px solid #f97316;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer">\uD83D\uDD04 Auto Play Full Demo</button><p style="font-size:.75rem;color:#64748b;margin-top:12px">\u23F1 30-40 min</p></div>';
    document.body.appendChild(s);
    $('demoStartBtn').onclick=function(){s.classList.add('ds-exit');setTimeout(function(){s.remove();res('manual');},800);};
    $('demoAutoBtn').onclick=function(){s.classList.add('ds-exit');setTimeout(function(){s.remove();res('auto');},800);};
  });
}

/* ===== SOFIA PANEL ===== */
function createAssistant(){
  var p=document.createElement('div');p.id='sofiaPanel';
  var _nm=getLang()==="en"?"Danielle":"Brenda";
  p.innerHTML='<div class="sf-head" id="sfHead"><div class="sf-hl"><span class="sf-av">\uD83D\uDC69\u200D\uD83D\uDCBC</span><div><span class="sf-name">Danielle</span><span class="sf-role">AI Assistant</span></div></div><div class="sf-hr"><button class="sf-hb" id="sfMute" title="Sonido">\uD83D\uDD0A</button><button class="sf-hb" id="sfMin">\u2212</button><button class="sf-hb" id="sfClose">\u2715</button></div></div><div class="sf-body"><div class="sf-pbar"><div class="sf-pfill" id="sfPFill"></div></div><div class="sf-step" id="sfStep">Step 0 of '+S.total+'</div><div class="sf-chat" id="sfChat"></div></div><div class="sf-ctrl"><button class="sf-cb" id="sfPrev">\u23EA Prev</button><button class="sf-cb sf-cp" id="sfPause">\u23F8\uFE0F Pause</button><button class="sf-cb" id="sfNext">\u23E9 Next</button><button class="sf-cb sf-auto" id="sfAuto">\u25B6\uFE0F Auto</button></div>';
  document.body.appendChild(p);
  $('sfMute').onclick=function(){_ttsOn=!_ttsOn;this.textContent=_ttsOn?'\uD83D\uDD0A':'\uD83D\uDD07';if(!_ttsOn){if(window.speechSynthesis)speechSynthesis.cancel();_voiceDone=Promise.resolve();}};
  $('sfMin').onclick=toggleMin;$('sfClose').onclick=function(){if(confirm('Exit demo?'))location.href=location.pathname;};
  $('sfPrev').onclick=doPrev;$('sfPause').onclick=togglePause;$('sfNext').onclick=doNext;$('sfAuto').onclick=doAuto;
  var bb=document.createElement('div');bb.id='sfBubble';bb.textContent='\uD83D\uDC69\u200D\uD83D\uDCBC';bb.onclick=toggleMin;document.body.appendChild(bb);
  // Drag
  var dr=false,sx,sy,sl2,st;$('sfHead').onmousedown=function(e){if(e.target.tagName==='BUTTON')return;dr=true;sx=e.clientX;sy=e.clientY;var r=p.getBoundingClientRect();sl2=r.left;st=r.top;e.preventDefault();};
  document.addEventListener('mousemove',function(e){if(!dr)return;p.style.left=(sl2+e.clientX-sx)+'px';p.style.top=(st+e.clientY-sy)+'px';p.style.right='auto';p.style.bottom='auto';});
  document.addEventListener('mouseup',function(){dr=false;});
  // Banner
  var bn=document.createElement('div');
  bn.innerHTML='<div style="background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;padding:8px 16px;text-align:center;font-size:13px;font-weight:600;position:fixed;top:0;left:0;right:0;z-index:10001;display:flex;align-items:center;justify-content:center;gap:12px"><span>\uD83C\uDFAC DEMO \u2014 '+CO.name+'</span><button onclick="location.href=location.pathname" style="background:#fff;color:#ea580c;border:none;border-radius:6px;padding:4px 14px;font-size:11px;font-weight:700;cursor:pointer">\u2715 Exit</button></div>';
  document.body.appendChild(bn);document.body.style.paddingTop='38px';
}
function toggleMin(){S.mini=!S.mini;$('sofiaPanel').style.display=S.mini?'none':'flex';$('sfBubble').style.display=S.mini?'flex':'none';}
var _voiceReady=false;
var _11KEY='sk_246e5760546ff26aad19d7ac336b20c4fc9b4da50cbd02ae';// ElevenLabs API key
var _VOICES={en:'u5dk6dUlaEl9FLWKszcn',es:'7iMdMxFdAglGhAvtYtqS'};// Danielle=EN, Brenda=ES
/* Voice queue removed - now Promise-based for sync */
function initVoice(){_voiceReady=true;}
var _ttsOn=true;
var _voiceDone=Promise.resolve(); // Resolves when current speech finishes
function getLang(){return(window.currentLang||'es');}

/* speak() returns a Promise that resolves ONLY when audio finishes */
function speak(txt){
  if(!_ttsOn){_voiceDone=Promise.resolve();return _voiceDone;}
  var clean=txt.replace(/<[^>]*>/g,'').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').trim();
  if(!clean){_voiceDone=Promise.resolve();return _voiceDone;}
  if(_11KEY){_voiceDone=speakEL(clean);}else{_voiceDone=speakWS(clean);}
  return _voiceDone;
}

/* Web Speech API - returns Promise, resolves on end */
function speakWS(txt){
  return new Promise(function(resolve){
    if(!window.speechSynthesis){resolve();return;}
    speechSynthesis.cancel();
    var lang=getLang();var u=new SpeechSynthesisUtterance(txt);
    u.lang=lang==='en'?'en-US':'es-MX';u.rate=1.0;u.pitch=1.1;u.volume=1;
    var vs=speechSynthesis.getVoices();var tl=u.lang;
    var v=vs.find(function(x){return x.lang===tl&&/female|samantha|zira|sabina/i.test(x.name);})||
    vs.find(function(x){return x.lang===tl;})||vs.find(function(x){return x.lang.startsWith(lang);})||null;
    if(v)u.voice=v;
    u.onend=function(){resolve();};
    u.onerror=function(){resolve();};
    speechSynthesis.speak(u);
    // Safety timeout: resolve after 30s max
    setTimeout(resolve,30000);
  });
}

/* ElevenLabs TTS - returns Promise, resolves when audio finishes playing */
function speakEL(txt){
  return new Promise(function(resolve){
    var vid=_VOICES[getLang()]||_VOICES.en;
    fetch('https://api.elevenlabs.io/v1/text-to-speech/'+vid+'/stream',{
      method:'POST',headers:{'Content-Type':'application/json','xi-api-key':_11KEY},
      body:JSON.stringify({text:txt,model_id:'eleven_turbo_v2_5',voice_settings:{stability:0.5,similarity_boost:0.75,style:0.3}})
    }).then(function(r){if(!r.ok)throw new Error('EL '+r.status);return r.blob();})
    .then(function(b){
      var a=new Audio(URL.createObjectURL(b));
      a.onended=function(){URL.revokeObjectURL(a.src);resolve();};
      a.onerror=function(){URL.revokeObjectURL(a.src);resolve();};
      a.play().catch(function(){resolve();});
    })
    .catch(function(e){console.warn('EL fallback:',e);speakWS(txt).then(resolve);});
    // Safety timeout: resolve after 30s max
    setTimeout(resolve,30000);
  });
}

function L(en,es){return getLang()==='en'?en:es;}

/* say() shows message + speaks + returns Promise that resolves when voice FINISHES */
function say(msg,t){
  t=t||'info';var ch=$('sfChat');
  var ic={info:'\uD83D\uDCAC',action:'\u26A1',success:'\u2705',nav:'\uD83D\uDCCD'};
  var m=document.createElement('div');m.className='sf-msg sf-'+t;
  m.innerHTML='<span class="sf-mi">'+(ic[t]||'\uD83D\uDCAC')+'</span><span class="sf-mt">'+msg+'</span>';
  ch.appendChild(m);ch.scrollTop=ch.scrollHeight;if(S.mini)toggleMin();
  return speak(msg); // Returns Promise - resolves when voice finishes!
}

/* wv(extra) - Wait for Voice to finish + extra pause (default 800ms) */
function wv(extra){
  extra=extra||800;
  return _voiceDone.then(function(){return sl(extra);});
}

/* ===== NAVIGATION FUNCTIONS ===== */
function upP(){$('sfPFill').style.width=(S.step/S.total*100)+'%';$('sfStep').textContent=L('Step '+S.step+' of '+S.total,'Paso '+S.step+' de '+S.total);}
function togglePause(){S.paused=!S.paused;$('sfPause').textContent=S.paused?'\u25B6\uFE0F':'\u23F8\uFE0F';if(S.paused){if(window.speechSynthesis)speechSynthesis.cancel();_voiceDone=Promise.resolve();}}
function doNext(){if(S.step>=S.total){say(L('\uD83C\uDF89 Demo complete!','\uD83C\uDF89 Demo completado!'),'success');return Promise.resolve();}S.paused=false;$('sfPause').textContent='\u23F8\uFE0F';S.step++;upP();return runStep(S.step);}
function doPrev(){if(S.step<=1)return Promise.resolve();S.step=Math.max(0,S.step-2);return doNext();}
function doAuto(){
  if(S.playing){S.playing=false;$('sfAuto').textContent='\u25B6\uFE0F Auto';return Promise.resolve();}
  S.playing=true;S.paused=false;$('sfAuto').textContent='\u23F9\uFE0F Stop';
  function lp(){if(!S.playing||S.step>=S.total){S.playing=false;$('sfAuto').textContent='\u25B6\uFE0F Auto';return Promise.resolve();}return doNext().then(function(){if(S.playing)return wv(2000).then(lp);});}
  return lp();
}
function runStep(n){return ck().then(function(){
  switch(n){
    case 1:return s1();case 2:return s2();case 3:return s3();case 4:return s4();case 5:return s5();
    case 6:return s6();case 7:return s7();case 8:return s8();case 9:return s9();case 10:return s10();
    case 11:return s11();case 12:return s12();case 13:return s13();case 14:return s14();case 15:return s15();
    case 16:return s16();case 17:return s17();case 18:return s18();case 19:return s19();case 20:return s20();
    case 21:return s21();case 22:return s22();case 23:return s23();case 24:return s24();case 25:return s25();
    case 26:return s26();case 27:return s27();case 28:return s28();case 29:return s29();case 30:return s30();
    case 31:return s31();case 32:return s32();case 33:return s33();case 34:return s34();case 35:return s35();
  }
});}
/* ===== 35 STEPS - FULL CRM TUTORIAL ===== */


/* sayW = say and Wait - shows message, speaks, waits for voice to finish + pause */
function sayW(msg,t){say(msg,t);return wv();}
/* ===== 35 STEPS - FULLY SYNCHRONIZED WITH VOICE ===== */

function s1(){
  return sayW(L(
    "👋 <b>Thank you for choosing Trade Master CRM</b> to manage your company and take it to the next level! I'm <b>Danielle</b>, and I'll personally walk you through every single feature of this CRM. By the end of this demo, you'll know exactly how to run your entire business from one place. Let's get started!",
    "👋 <b>¡Gracias por elegir Trade Master CRM</b> para administrar tu empresa y llevarla al siguiente nivel! Soy <b>Brenda</b>, y te voy a enseñar personalmente cada función de este CRM. Al final de este demo, vas a saber exactamente cómo manejar todo tu negocio desde un solo lugar. ¡Empecemos!"
  ),'info');
}

function s2(){
  return sayW(L(
    "📍 This is your <b>Dashboard</b> — your home base. Today's jobs, revenue, team activity, and quick actions — everything you need at a glance.",
    "📍 Este es tu <b>Tablero</b> — tu base principal. Trabajos del día, ingresos, actividad del equipo y acciones rápidas — todo lo que necesitas de un vistazo."
  ),'nav').then(ck).then(function(){smoothShow('dashboard');
    return sayW(L(
      "✅ The dashboard updates in real-time. Now let's fill it with data — starting with <b>Customers</b>!",
      "✅ El tablero se actualiza en tiempo real. ¡Ahora vamos a llenarlo con datos — empezando con <b>Clientes</b>!"
    ),'success');
  });
}

function s3(){
  return sayW(L(
    "📍 Look at the <b>sidebar on the left</b> — that's your main menu. I'm clicking <b>Customers</b> to open the client section. This is where you store everyone you do business with.",
    "📍 Mira la <b>barra lateral izquierda</b> — ese es tu menú principal. Voy a hacer click en <b>Clientes</b> para abrir la sección. Aquí guardas a todos con los que haces negocio."
  ),'nav').then(ck).then(function(){smoothShow('clients');
    return sayW(L(
      "⚡ See that <b>orange button</b> at the top? It says <b>'+ New Customer'</b>. That's how you add every new client. I'll click it now.",
      "⚡ ¿Ves ese <b>botón naranja</b> arriba? Dice <b>'+ Nuevo Cliente'</b>. Así es como agregas cada cliente nuevo. Voy a hacerle click."
    ),'action');
  }).then(ck).then(function(){
    var btn=$q('#clients-section [onclick*="showClientForm()"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);});
}

function s4(){
  return sayW(L(
    "✏️ The form is open. I'll fill in each field so you can see exactly what goes where. First client: <b>María García</b> — a residential customer in Fontana.",
    "✏️ El formulario está abierto. Voy a llenar cada campo para que veas exactamente qué va dónde. Primer cliente: <b>María García</b> — una cliente residencial en Fontana."
  ),'action').then(ck).then(function(){
    return sayW(L("✏️ <b>Name:</b> María García","✏️ <b>Nombre:</b> María García"),'action');
  }).then(function(){return ty($('clientName'),'María García');
  }).then(function(){return sl(SD);
  }).then(ck).then(function(){
    return sayW(L("📞 <b>Phone:</b> (909) 555-1234","📞 <b>Teléfono:</b> (909) 555-1234"),'action');
  }).then(function(){return ty($('clientPhone'),'(909) 555-1234');
  }).then(function(){return ty($('clientEmail'),'maria.garcia@email.com');
  }).then(function(){sv($('clientPropertyType'),'Residencial');
    return ty($('clientAddress'),'456 Oak St, Fontana, CA 92335');
  }).then(function(){
    return ty($('clientNotes'),L('AC not cooling - Goodman 15 years.','AC no enfría - Goodman 15 años.'));
  }).then(function(){return sl(SD);
  }).then(ck).then(function(){
    return sayW(L("💾 All filled in! Now I click <b>Save</b>...","💾 ¡Todo listo! Ahora hago click en <b>Guardar</b>..."),'action');
  }).then(function(){
    $('clientForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>María García</b> saved! She's in your customer list forever. Let's add one more.","✅ ¡<b>María García</b> guardada! Está en tu lista de clientes para siempre. Vamos a agregar uno más."),'success');
  });
}

function s5(){
  return sayW(L(
    "⚡ Now a <b>commercial client</b> — a restaurant. Same process, but we select <b>Commercial</b> as the property type.",
    "⚡ Ahora un <b>cliente comercial</b> — un restaurante. Mismo proceso, pero seleccionamos <b>Comercial</b> como tipo de propiedad."
  ),'info').then(ck).then(function(){
    var btn=$q('#clients-section [onclick*="showClientForm()"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('clientName'),'Roberto Méndez');
  }).then(function(){var c=$('clientCompany');return c?ty(c,'La Michoacana Restaurant'):Promise.resolve();
  }).then(function(){return ty($('clientPhone'),'(909) 555-5678');
  }).then(function(){return ty($('clientEmail'),'lamichoacana@email.com');
  }).then(function(){sv($('clientPropertyType'),'Comercial');return ty($('clientAddress'),'2890 Highland Ave, San Bernardino, CA');
  }).then(function(){return ty($('clientNotes'),L('Walk-in cooler not holding temp. Urgent.','Walk-in cooler no mantiene temp. Urgente.'));
  }).then(function(){return sl(SD);
  }).then(function(){$('clientForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>2 clients</b> — residential and commercial. Your customer base is growing!","✅ <b>2 clientes</b> — residencial y comercial. ¡Tu base de clientes está creciendo!"),'success');
  });
}

function s6(){
  return sayW(L(
    "📍 Now <b>Leads</b>. A lead is someone who called asking for a quote but hasn't hired you yet. Every customer starts as a lead. This is your sales pipeline starter.",
    "📍 Ahora <b>Prospectos</b>. Un prospecto es alguien que llamó pidiendo cotización pero aún no te contrata. Cada cliente empieza como prospecto. Este es el inicio de tu pipeline."
  ),'nav').then(ck).then(function(){smoothShow('leads');
    return sayW(L("⚡ Click <b>'+ New Lead'</b>. Let's add a $4,500 furnace opportunity!","⚡ Click en <b>'+ Nuevo Prospecto'</b>. ¡Agreguemos una oportunidad de $4,500 furnace!"),'action');
  }).then(ck).then(function(){
    var btn=$q('#leads-section [onclick*="showLeadForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('leadName'),'Roberto Sánchez');
  }).then(function(){return ty($('leadPhone'),'(909) 555-9012');
  }).then(function(){return ty($('leadEmail'),'roberto.s@email.com');
  }).then(function(){sv($('leadService'),'Calefacción');sv($('leadPropertyType'),'residential');return ty($('leadAddress'),'1025 Pine Ave, Rialto, CA');
  }).then(function(){return ty($('leadNotes'),L('New furnace. 1800sqft. Budget $4,500.','Furnace nuevo. 1800sqft. Budget $4,500.'));
  }).then(function(){var la=$('leadLat'),ln=$('leadLng');if(la)la.value='34.1064';if(ln)ln.value='-117.3703';return sl(SD);
  }).then(function(){$('leadForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ Lead <b>Roberto Sánchez</b> saved! 🔥 When he signs, convert him to a customer with one click.","✅ ¡Prospecto <b>Roberto Sánchez</b> guardado! 🔥 Cuando firme, lo conviertes a cliente con un click."),'success');
  });
}

function s7(){
  return sayW(L(
    "📍 The <b>Sales Pipeline</b> shows where every deal stands — new, quoted, negotiating, won, or lost. It's a visual funnel of your money.",
    "📍 El <b>Flujo de Ventas</b> muestra dónde está cada trato — nuevo, cotizado, negociando, ganado o perdido. Es un embudo visual de tu dinero."
  ),'nav').then(ck).then(function(){smoothShow('pipeline');
    return sayW(L("✅ Drag deals between columns as they progress. Always know your closing rate!","✅ Arrastra los tratos entre columnas conforme avanzan. ¡Siempre sabes tu tasa de cierre!"),'success');
  });
}

function s8(){
  return sayW(L(
    "📍 Time to add your <b>Technicians</b> — the field team. Each tech gets GPS tracking, mobile access, and jobs sent to their phone.",
    "📍 Hora de agregar tus <b>Técnicos</b> — el equipo de campo. Cada técnico tiene rastreo GPS, acceso móvil y trabajos enviados a su celular."
  ),'nav').then(ck).then(function(){smoothShow('technicians');
    return sayW(L("⚡ Click <b>'+ New Technician'</b>...","⚡ Click en <b>'+ Nuevo Técnico'</b>..."),'action');
  }).then(ck).then(function(){
    var btn=$q('#technicians-section [onclick*="showTechFormInTechSection"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(ck).then(function(){
    return sayW(L("✏️ <b>Carlos Mendoza</b> — HVAC specialist, $35/hr, 2023 Ford Transit","✏️ <b>Carlos Mendoza</b> — especialista HVAC, $35/hr, 2023 Ford Transit"),'action');
  }).then(function(){return ty($('techNameAlt'),'Carlos Mendoza');
  }).then(function(){return ty($('techPhoneAlt'),'(909) 555-3456');
  }).then(function(){return ty($('techEmailAlt'),'carlos@rodriguezhvac.com');
  }).then(function(){sv($('techSpecialtyAlt'),'HVAC');var cb=$('techCreateLoginAlt');if(cb)cb.checked=false;return sl(300);
  }).then(function(){var v=$('techVehicleAlt');return v?ty(v,'2023 Ford Transit'):Promise.resolve();
  }).then(function(){var p=$('techPlateAlt');return p?ty(p,'8ABC123'):Promise.resolve();
  }).then(function(){var f=$q('#techFormContainerAlt form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>Carlos Mendoza</b> registered! GPS tracking active on his Ford Transit.","✅ ¡<b>Carlos Mendoza</b> registrado! Rastreo GPS activo en su Ford Transit."),'success');
  });
}

function s9(){
  return sayW(L("⚡ Second technician — <b>Miguel Ángel Torres</b>, Refrigeration specialist.","⚡ Segundo técnico — <b>Miguel Ángel Torres</b>, especialista en Refrigeración."),'action'
  ).then(ck).then(function(){
    var btn=$q('#technicians-section [onclick*="showTechFormInTechSection"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('techNameAlt'),'Miguel Ángel Torres');
  }).then(function(){return ty($('techPhoneAlt'),'(909) 555-7890');
  }).then(function(){return ty($('techEmailAlt'),'miguel@rodriguezhvac.com');
  }).then(function(){sv($('techSpecialtyAlt'),'Refrigeración');var cb=$('techCreateLoginAlt');if(cb)cb.checked=false;return sl(300);
  }).then(function(){var v=$('techVehicleAlt');return v?ty(v,'2022 Chevy Express'):Promise.resolve();
  }).then(function(){var p=$('techPlateAlt');return p?ty(p,'7DEF456'):Promise.resolve();
  }).then(function(){var f=$q('#techFormContainerAlt form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>2 technicians</b> ready with GPS tracking and mobile access!","✅ ¡<b>2 técnicos</b> listos con rastreo GPS y acceso móvil!"),'success');
  });
}

function s10(){
  return sayW(L(
    "📍 Now <b>Home Advisors</b> — your sales team who go to homes, sell installations, and earn commissions.",
    "📍 Ahora <b>Asesores del Hogar</b> — tu equipo de ventas que va a las casas, vende instalaciones y gana comisiones."
  ),'nav').then(ck).then(function(){smoothShow('advisors');
    return sayW(L("⚡ Adding <b>Diana Castillo</b> — $50K/month sales goal...","⚡ Agregando <b>Diana Castillo</b> — meta de ventas $50K/mes..."),'action');
  }).then(ck).then(function(){
    var btn=$q('#advisors-section [onclick*="showAdvisorForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('advisorName'),'Diana Castillo');
  }).then(function(){return ty($('advisorPhone'),'(909) 555-2345');
  }).then(function(){return ty($('advisorEmail'),'diana@rodriguezhvac.com');
  }).then(function(){sv($('advisorSpecialty'),'Residencial y Comercial');return ty($('advisorZone'),'Inland Empire');
  }).then(function(){var g=$('advisorGoal');return g?ty(g,'50000'):Promise.resolve();
  }).then(function(){$('advisorForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>Diana Castillo</b> — 5%-20% commissions, tracked automatically!","✅ <b>Diana Castillo</b> — comisiones 5%-20%, ¡rastreadas automáticamente!"),'success');
  });
}

function s11(){
  return sayW(L(
    "📍 The <b>Calendar</b> — your scheduling hub. All appointments, jobs, and follow-ups in one view. Your whole team's schedule at a glance.",
    "📍 El <b>Calendario</b> — tu centro de horarios. Todas las citas, trabajos y seguimientos en una vista. El horario de todo tu equipo de un vistazo."
  ),'nav').then(ck).then(function(){smoothShow('calendar');
    return sayW(L("✅ Schedule appointments, set reminders, drag and drop to reschedule!","✅ ¡Agenda citas, pon recordatorios, arrastra y suelta para re-agendar!"),'success');
  });
}

function s12(){
  return sayW(L(
    "📍 Now the <b>command center</b> — <b>Dispatch</b>! Create jobs, assign technicians, track everything live on the map. Let me create the first job.",
    "📍 Ahora el <b>centro de control</b> — ¡<b>Despacho</b>! Crea trabajos, asigna técnicos, rastrea todo en vivo en el mapa. Déjame crear el primer trabajo."
  ),'nav').then(ck).then(function(){smoothShow('dispatch');
    return sayW(L("⚡ Click <b>'+ New Job'</b>...","⚡ Click en <b>'+ Nuevo Trabajo'</b>..."),'action');
  }).then(ck).then(function(){
    var btn=$q('#dispatch-section [onclick*="showJobForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(ck).then(function(){
    return sayW(L("✏️ <b>AC Repair</b> for María García — assigning to Carlos, $850","✏️ <b>Reparación AC</b> para María García — asignando a Carlos, $850"),'action');
  }).then(function(){return ty($('jobTitle'),'AC Repair - Goodman not cooling');
  }).then(function(){sv($('jobServiceType'),'Reparación');sv($('jobPriority'),'high');return ty($('jobAddress'),'456 Oak St, Fontana, CA');
  }).then(function(){var d=$('jobDate');if(d)d.value=new Date().toISOString().split('T')[0];var la=$('jobLat'),ln=$('jobLng');if(la)la.value='34.09';if(ln)ln.value='-117.43';var ts=$('jobTechId');if(ts&&window.techsData&&techsData[0])sv(ts,techsData[0].id);return ty($('jobNotes'),L('Capacitor and contactor. $850','Capacitor y contactor. $850'));
  }).then(function(){$('jobForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ Job assigned to <b>Carlos</b>! He gets a phone notification with the address and details.","✅ ¡Trabajo asignado a <b>Carlos</b>! Le llega notificación con la dirección y detalles."),'success');
  });
}

function s13(){
  return sayW(L("⚡ Second job — <b>URGENT</b>! The restaurant's walk-in cooler is failing. Dispatching Miguel immediately.","⚡ Segundo trabajo — ¡<b>URGENTE</b>! El walk-in cooler del restaurante está fallando. Despachando a Miguel inmediatamente."),'action'
  ).then(ck).then(function(){
    var btn=$q('#dispatch-section [onclick*="showJobForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('jobTitle'),'Walk-in Cooler - Compressor');
  }).then(function(){sv($('jobServiceType'),'Reparación');sv($('jobPriority'),'urgent');return ty($('jobAddress'),'2890 Highland Ave, SB, CA');
  }).then(function(){var d=$('jobDate');if(d)d.value=new Date().toISOString().split('T')[0];var la=$('jobLat'),ln=$('jobLng');if(la)la.value='34.12';if(ln)ln.value='-117.29';var ts=$('jobTechId');if(ts&&window.techsData&&techsData[1])sv(ts,techsData[1].id);return ty($('jobNotes'),L('Urgent. Cooler 55°F. $2,200','Urgente. Cooler 55°F. $2,200'));
  }).then(function(){$('jobForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>2 jobs dispatched</b> — $3,050 total! Carlos → Fontana, Miguel → San Bernardino.","✅ <b>2 trabajos despachados</b> — ¡$3,050 total! Carlos → Fontana, Miguel → San Bernardino."),'success');
  });
}

function s14(){
  return sayW(L(
    "📍 <b>Service Calls</b> — when a customer calls with an emergency, log it here FAST. This is the intake for incoming calls.",
    "📍 <b>Llamadas de Servicio</b> — cuando un cliente llama con emergencia, regístralo aquí RÁPIDO. Esta es la entrada para llamadas entrantes."
  ),'nav').then(ck).then(function(){smoothShow('servicecalls');
    return sayW(L("⚡ Logging an emergency: <b>AC not cooling, pet in house!</b>","⚡ Registrando emergencia: <b>¡AC no enfría, mascota en casa!</b>"),'action');
  }).then(ck).then(function(){
    var btn=$q('#servicecalls-section [onclick*="showServiceCallForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('scClientName'),'María García');
  }).then(function(){return ty($('scClientPhone'),'(909) 555-1234');
  }).then(function(){return ty($('scAddress'),'456 Oak St, Fontana, CA');
  }).then(function(){return ty($('scProblem'),L('AC not cooling. Pet in house. Urgent.','AC no enfría. Mascota en casa. Urgente.'));
  }).then(function(){sv($('scUrgency'),'emergency');sv($('scPropertyType'),'residential');var pd=$('scPreferredDate');if(pd)pd.value=new Date().toISOString().split('T')[0];if(window.techsData&&techsData[0]){var st=$('scTechAssign');if(st)sv(st,techsData[0].id);}return ty($('scNotes'),'Gate #1234.');
  }).then(function(){$('serviceCallForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b style='color:#ef4444'>🔴 EMERGENCY</b> logged and dispatched! Tech gets an immediate alert.","✅ <b style='color:#ef4444'>🔴 EMERGENCIA</b> registrada y despachada! El técnico recibe alerta inmediata."),'success');
  });
}

function s15(){
  return sayW(L(
    "📍 Back to <b>Dispatch</b> for the <b>GPS tracking</b>. This is your real-time command center. Look at the map!",
    "📍 Regresemos a <b>Despacho</b> para el <b>rastreo GPS</b>. Este es tu centro de control en tiempo real. ¡Mira el mapa!"
  ),'nav').then(ck).then(function(){smoothShow('dispatch');
    return sayW(L(
      "🚐 You can see exactly where each tech is. Carlos heading to Fontana, Miguel to San Bernardino. Your customers also get a tracking link — like Uber for HVAC!",
      "🚐 Puedes ver exactamente dónde está cada técnico. Carlos camino a Fontana, Miguel a San Bernardino. ¡Tus clientes también reciben un link de rastreo — como Uber para HVAC!"
    ),'info');
  }).then(function(){
    return sayW(L("✅ Real-time fleet management. You're always in control!","✅ Administración de flota en tiempo real. ¡Siempre tienes el control!"),'success');
  });
}

function s16(){
  return sayW(L(
    "📍 <b>Jobs</b> — the master list of ALL work orders. Filter by status: pending, in progress, completed. Track revenue per job.",
    "📍 <b>Trabajos</b> — la lista maestra de TODAS las órdenes. Filtra por estatus: pendiente, en progreso, completado. Rastrea ingreso por trabajo."
  ),'nav').then(ck).then(function(){smoothShow('jobs');
    return sayW(L("✅ Every job tracked from creation to completion. Export to PDF anytime.","✅ Cada trabajo rastreado desde la creación hasta el final. Exporta a PDF cuando quieras."),'success');
  });
}

function s17(){
  return sayW(L(
    "📍 Time to get <b>paid</b>! <b>Invoices</b> — every job should end with an invoice. I'll create one for María García's AC repair.",
    "📍 ¡Hora de <b>cobrar</b>! <b>Facturas</b> — cada trabajo debe terminar con una factura. Voy a crear una para la reparación de María García."
  ),'nav').then(ck).then(function(){smoothShow('invoices');
    return sayW(L("⚡ Creating invoice: Service Call $120 + Capacitor $85 + Contactor $65 + Labor $250 = <b>$520</b>","⚡ Creando factura: Visita $120 + Capacitor $85 + Contactor $65 + Mano de obra $250 = <b>$520</b>"),'action');
  }).then(ck).then(function(){
    var inv={id:'inv1',company_id:'demo-co',invoice_number:'INV-202602-0001',client_name:'María García',client_email:'maria.garcia@email.com',client_phone:'(909) 555-1234',client_address:'456 Oak St, Fontana',line_items:[{name:'Service Call',qty:1,unit_price:120,labor:0,total:120},{name:'Capacitor 45/5',qty:1,unit_price:85,labor:0,total:85},{name:'Contactor 2P',qty:1,unit_price:65,labor:0,total:65},{name:'Labor',qty:2,unit_price:0,labor:125,total:250}],subtotal:520,total:520,balance_due:520,amount_paid:0,status:'draft',created_at:new Date().toISOString()};
    _db.invoices.push(inv);window.invoicesData=[inv];renderInvoiceKPIs();renderInvoicesTable();
    return sayW(L("✅ <b>INV-0001</b> created for <b>$520</b>! Email it or print as PDF.","✅ <b>INV-0001</b> creada por <b>$520</b>! Envíala por email o imprime como PDF."),'success');
  });
}

function s18(){
  return sayW(L("⚡ María paid! Marking as <b>PAID</b> and creating the restaurant invoice...","⚡ ¡María pagó! Marcando como <b>PAGADA</b> y creando la factura del restaurante..."),'action'
  ).then(ck).then(function(){
    invoicesData[0].status='paid';invoicesData[0].amount_paid=520;invoicesData[0].balance_due=0;
    var inv2={id:'inv2',company_id:'demo-co',invoice_number:'INV-202602-0002',client_name:'La Michoacana',client_phone:'(909) 555-5678',client_email:'lm@email.com',client_address:'2890 Highland, SB',line_items:[{name:'Cooler Repair',qty:1,unit_price:1800,labor:400,total:2200}],subtotal:2200,total:2200,balance_due:2200,amount_paid:0,status:'sent',created_at:new Date().toISOString()};
    _db.invoices.push(inv2);invoicesData.push(inv2);renderInvoiceKPIs();renderInvoicesTable();
    return sayW(L("✅ INV-0001 <b style='color:#16a34a'>✅ PAID</b> $520 | INV-0002 <b style='color:#f59e0b'>⏳ PENDING</b> $2,200","✅ INV-0001 <b style='color:#16a34a'>✅ PAGADA</b> $520 | INV-0002 <b style='color:#f59e0b'>⏳ PENDIENTE</b> $2,200"),'success');
  });
}

function s19(){
  return sayW(L(
    "📍 <b>Collections</b> — when invoices are overdue, follow up here. Track who owes you, how long, send reminders. Never lose money again.",
    "📍 <b>Cobranza</b> — cuando las facturas se vencen, da seguimiento aquí. Rastrea quién te debe, cuánto tiempo, envía recordatorios. Nunca pierdas dinero."
  ),'nav').then(ck).then(function(){smoothShow('collections');
    return sayW(L("✅ Automatic aging reports: 30, 60, 90 days overdue. One-click reminders!","✅ Reportes de antigüedad automáticos: 30, 60, 90 días vencidos. ¡Recordatorios con un click!"),'success');
  });
}

function s20(){
  return sayW(L(
    "📍 <b>Receipts</b> — track every payment received. Cash, check, Zelle, or card — log it here for your records and taxes.",
    "📍 <b>Recibos</b> — registra cada pago recibido. Efectivo, cheque, Zelle o tarjeta — regístralo aquí para archivos e impuestos."
  ),'nav').then(ck).then(function(){smoothShow('receipts');
    return sayW(L("✅ Every payment documented. Your accountant will love you!","✅ Cada pago documentado. ¡Tu contador te va a amar!"),'success');
  });
}

function s21(){
  return sayW(L(
    "📍 <b>Business Expenses</b> — track everything you spend: gas, insurance, tools, vehicle payments. If money goes out, it goes here.",
    "📍 <b>Gastos del Negocio</b> — registra todo lo que gastas: gasolina, seguro, herramientas, pagos de vehículo. Si sale dinero, va aquí."
  ),'nav').then(ck).then(function(){smoothShow('expenses');
    return sayW(L("⚡ Adding gas expense: <b>$287.50</b> at Chevron","⚡ Agregando gasto de gasolina: <b>$287.50</b> en Chevron"),'action');
  }).then(ck).then(function(){
    var btn=$q('#expenses-section [onclick*="showExpenseForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){sv($('expCategory'),'vehicle_gas');return ty($('expVendor'),'Chevron');
  }).then(function(){return ty($('expAmount'),'287.50');
  }).then(function(){sv($('expFrequency'),'monthly');sv($('expType'),'variable');$('expDate').value=new Date().toISOString().split('T')[0];return sl(SD);
  }).then(function(){var f=$q('#expenses-section form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(1500);
  }).then(ck).then(function(){
    return sayW(L("⚡ Adding 3 more monthly expenses...","⚡ Agregando 3 gastos mensuales más..."),'action');
  }).then(function(){
    [{category:'general_liability',vendor:'State Farm',amount:450,type:'fixed'},{category:'software_crm',vendor:'Trade Master CRM',amount:149.99,type:'fixed'},{category:'vehicle_payment',vendor:'Ford Motor Credit',amount:650,type:'fixed'}]
    .forEach(function(e){e.id='exp'+(++_idc);e.company_id='demo-co';e.frequency='monthly';e.date=new Date().toISOString().split('T')[0];e.created_at=new Date().toISOString();_db.expenses.push(e);expensesData.push(e);});
    renderExpenses();
    return sayW(L("✅ <b>4 expenses</b>: Gas $287 + Insurance $450 + CRM $150 + Vehicle $650 = <b>$1,537/month</b>","✅ <b>4 gastos</b>: Gas $287 + Seguro $450 + CRM $150 + Vehículo $650 = <b>$1,537/mes</b>"),'success');
  });
}

function s22(){
  return sayW(L(
    "📍 <b>My Money</b> — your financial overview. Income vs expenses in a chart. See your profit at a glance.",
    "📍 <b>Mi Dinero</b> — tu vista financiera. Ingresos vs gastos en gráfica. Ve tu ganancia de un vistazo."
  ),'nav').then(ck).then(function(){smoothShow('mymoney');
    return sayW(L("✅ Revenue in, expenses out, net profit — all in real-time!","✅ Ingresos entrando, gastos saliendo, ganancia neta — ¡todo en tiempo real!"),'success');
  });
}

function s23(){
  return sayW(L(
    "📍 <b>Payroll</b> — track what you owe each technician and advisor. Hours worked times hourly rate equals total pay. No more spreadsheets!",
    "📍 <b>Nómina</b> — rastrea lo que le debes a cada técnico y asesor. Horas trabajadas por tarifa por hora igual a pago total. ¡No más hojas de cálculo!"
  ),'nav').then(ck).then(function(){smoothShow('payroll');
    return sayW(L("⚡ Adding payroll data for this period...","⚡ Agregando datos de nómina para este período..."),'action');
  }).then(ck).then(function(){
    var e=[
      {id:'py1',company_id:'demo-co',tech_id:techsData[0]?techsData[0].id:null,tech_name:techsData[0]?techsData[0].name:'Carlos',type:'hourly',hours:42,rate:35,total:1470,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()},
      {id:'py2',company_id:'demo-co',tech_id:techsData[1]?techsData[1].id:null,tech_name:techsData[1]?techsData[1].name:'Miguel',type:'hourly',hours:38,rate:30,total:1140,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()},
      {id:'py3',company_id:'demo-co',tech_id:null,tech_name:advisorsData&&advisorsData[0]?advisorsData[0].name:'Diana',type:'commission',hours:0,rate:0,total:457.50,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()}];
    e.forEach(function(x){_db.payroll_entries.push(x);});window.payrollData=e;renderPayroll();
    return sayW(L("✅ Carlos: 42hrs × $35 = <b>$1,470</b> | Miguel: 38hrs × $30 = <b>$1,140</b> | Diana: <b>$457</b> commission | Total: <b>$3,067</b>","✅ Carlos: 42hrs × $35 = <b>$1,470</b> | Miguel: 38hrs × $30 = <b>$1,140</b> | Diana: <b>$457</b> comisión | Total: <b>$3,067</b>"),'success');
  });
}

function s24(){
  return sayW(L(
    "⚡ The best part — <b>export payroll</b> directly to <b>QuickBooks, ADP, or Gusto</b> with one click. No double entry!",
    "⚡ Lo mejor — ¡<b>exporta la nómina</b> directo a <b>QuickBooks, ADP o Gusto</b> con un click! ¡Sin doble captura!"
  ),'info').then(function(){
    return sayW(L("✅ Payroll is fully automated. Calculate, review, export — done!","✅ La nómina es completamente automática. Calcula, revisa, exporta — ¡listo!"),'success');
  });
}

function s25(){
  return sayW(L(
    "📍 <b>Inbox</b> — your notification center. New leads, completed jobs, overdue invoices, team updates — all here. Never miss anything.",
    "📍 <b>Bandeja</b> — tu centro de notificaciones. Nuevos prospectos, trabajos completados, facturas vencidas, actualizaciones — todo aquí."
  ),'nav').then(ck).then(function(){smoothShow('inbox');
    return sayW(L("✅ All notifications in one place. Read, archive, or take action instantly.","✅ Todas las notificaciones en un lugar. Lee, archiva o toma acción al instante."),'success');
  });
}

function s26(){
  return sayW(L(
    "📍 <b>Business Mail</b> — send and receive emails right from the CRM. No need to switch to Gmail or Outlook.",
    "📍 <b>Correo del Negocio</b> — envía y recibe emails directo desde el CRM. No necesitas cambiar a Gmail o Outlook."
  ),'nav').then(ck).then(function(){smoothShow('mailbox');
    return sayW(L("✅ Professional email integrated. Templates for quotes, follow-ups, and thank-you notes!","✅ Email profesional integrado. ¡Plantillas para cotizaciones, seguimientos y agradecimientos!"),'success');
  });
}

function s27(){
  return sayW(L(
    "📍 <b>Marketing</b> — grow your business! Create campaigns for Google Ads, Facebook, Yelp. Track which ads bring the most customers.",
    "📍 <b>Mercadotecnia</b> — ¡haz crecer tu negocio! Crea campañas para Google Ads, Facebook, Yelp. Rastrea qué anuncios traen más clientes."
  ),'nav').then(ck).then(function(){smoothShow('marketing');
    return sayW(L("⚡ Creating a <b>Google Ads</b> campaign: AC Tune-Up $79, $1,500 budget...","⚡ Creando campaña de <b>Google Ads</b>: AC Tune-Up $79, presupuesto $1,500..."),'action');
  }).then(ck).then(function(){
    var btn=$q('#marketing-section [onclick*="showCampaignForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('campName'),'Promo Summer - AC Tune-Up $79');
  }).then(function(){sv($('campType'),'google_ads');return ty($('campBudget'),'1500');
  }).then(function(){var cs=$('campStart'),ce=$('campEnd');if(cs)cs.value=new Date().toISOString().split('T')[0];if(ce){var d=new Date();d.setDate(d.getDate()+60);ce.value=d.toISOString().split('T')[0];}return ty($('campMessage'),'AC Tune-Up $79. Rodriguez HVAC. (909) 555-0000');
  }).then(function(){var f=$q('#marketing-section form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ Campaign <b>Google Ads</b> active! $1,500 for 60 days. CRM tracks ROI automatically.","✅ ¡Campaña <b>Google Ads</b> activa! $1,500 por 60 días. El CRM rastrea el ROI automáticamente."),'success');
  });
}

function s28(){
  return sayW(L(
    "📍 <b>Price Book</b> — your catalog of parts, services, and prices. Set cost and selling price to see your profit margin.",
    "📍 <b>Lista de Precios</b> — tu catálogo de partes, servicios y precios. Pon costo y precio de venta para ver tu margen."
  ),'nav').then(ck).then(function(){smoothShow('pricebook');
    return sayW(L("⚡ Loading 10 common HVAC parts and services...","⚡ Cargando 10 partes y servicios comunes de HVAC..."),'action');
  }).then(ck).then(function(){
    [{name:'Capacitor 45/5 MFD',sku:'CAP-455',category:'ac_parts',unit:'each',cost:12,price:85},{name:'Contactor 2P 40A',sku:'CON-2P',category:'ac_parts',unit:'each',cost:8,price:65},{name:'Motor Fan 1/4 HP',sku:'MTR-025',category:'motors',unit:'each',cost:45,price:195},{name:'R-410A per lb',sku:'REF-410',category:'refrigerants',unit:'lb',cost:15,price:85},{name:'Thermostat Honeywell',sku:'TSTAT',category:'controls',unit:'each',cost:35,price:175},{name:'Filter 16x25x1',sku:'FLT-162',category:'filters',unit:'each',cost:4,price:25},{name:'Service Call 0-10mi',sku:'SC-010',category:'labor',unit:'flat',cost:0,price:70},{name:'Service Call 10-20mi',sku:'SC-1020',category:'labor',unit:'flat',cost:0,price:120},{name:'Labor per Hour',sku:'LAB-HR',category:'labor',unit:'hour',cost:0,price:125},{name:'AC Tune-Up 21pts',sku:'TUNE-21',category:'labor',unit:'flat',cost:0,price:79}]
    .forEach(function(it){it.id='pb'+(++_idc);it.company_id='demo-co';_db.price_book.push(it);});
    window.priceBookData=_db.price_book.slice();renderPriceBook();
    return sayW(L("✅ <b>10 items</b> loaded! Capacitor $12→$85 (608% margin), R-410A $15→$85 (467%). This is how HVAC makes money!","✅ ¡<b>10 artículos</b>! Capacitor $12→$85 (608% margen), R-410A $15→$85 (467%). ¡Así ganan dinero las empresas HVAC!"),'success');
  });
}

function s29(){
  return sayW(L(
    "📍 <b>Reports</b> — the big picture. Revenue by month, jobs per technician, lead sources, team productivity — all in charts.",
    "📍 <b>Reportes</b> — la foto completa. Ingresos por mes, trabajos por técnico, fuentes de prospectos, productividad — todo en gráficas."
  ),'nav').then(ck).then(function(){smoothShow('reports');
    return sayW(L("✅ Export any report to <b>PDF</b>. Share with your accountant or bank.","✅ Exporta cualquier reporte a <b>PDF</b>. Comparte con tu contador o banco."),'success');
  });
}

function s30(){
  return sayW(L(
    "📍 <b>Users & Team</b> — manage CRM access. Add office staff, assign roles, control what each person can see and do.",
    "📍 <b>Usuarios y Equipo</b> — administra acceso al CRM. Agrega personal, asigna roles, controla lo que cada persona ve y hace."
  ),'nav').then(ck).then(function(){smoothShow('team');
    return sayW(L("✅ Admin, Manager, Dispatcher, Technician — each role sees only what they need.","✅ Admin, Gerente, Despachador, Técnico — cada rol ve solo lo que necesita."),'success');
  });
}

function s31(){
  return sayW(L(
    "📍 <b>Human Resources</b> — employee files, contracts, certifications, performance reviews. Everything HR needs, built into the CRM.",
    "📍 <b>Recursos Humanos</b> — archivos de empleados, contratos, certificaciones, evaluaciones. Todo lo que RH necesita, integrado en el CRM."
  ),'nav').then(ck).then(function(){smoothShow('hr');
    return sayW(L("✅ Upload contracts, track certifications, manage documents — no more paper files!","✅ Sube contratos, rastrea certificaciones, administra documentos — ¡no más archivos de papel!"),'success');
  });
}

function s32(){
  return sayW(L(
    "📍 <b>Settings</b> — configure company info: name, license, bond, insurance, logo. This appears on invoices and contracts.",
    "📍 <b>Configuración</b> — configura info de empresa: nombre, licencia, bond, seguro, logo. Esto aparece en facturas y contratos."
  ),'nav').then(ck).then(function(){smoothShow('settings');
    return sayW(L("✅ Company profile, contractor license, insurance bond, contract templates — all saved and ready.","✅ Perfil de empresa, licencia, fianza, plantillas de contratos — todo guardado y listo."),'success');
  });
}

function s33(){
  return sayW(L(
    "📍 Let's go back to the <b>Dashboard</b> to see everything we've built. Look how your business came alive!",
    "📍 Regresemos al <b>Tablero</b> para ver todo lo que construimos. ¡Mira cómo tu negocio cobró vida!"
  ),'nav').then(ck).then(function(){smoothShow('dashboard');
    return sayW(L("✅ Your dashboard is full of real data now! This is YOUR business, organized.","✅ ¡Tu tablero está lleno de datos reales! Este es TU negocio, organizado."),'success');
  });
}

function s34(){
  return sayW(L(
    "🎉 <b>DEMO COMPLETE!</b> Here's everything we built in 35 steps:<br>👥 2 customers<br>🎯 1 lead ($4,500)<br>📈 Sales pipeline<br>👷 2 technicians with GPS<br>🏠 1 advisor<br>📅 Calendar<br>🔧 2 jobs ($3,050)<br>📞 1 emergency<br>📄 2 invoices ($2,720)<br>💰 Collections & receipts<br>🏢 4 expenses ($1,537/mo)<br>💳 Payroll ($3,067)<br>📬 Inbox & email<br>📣 Marketing campaign<br>📒 10 price book items<br>📊 Reports<br>👥 Team<br>🛡️ HR<br>⚙️ Settings",
    "🎉 <b>¡DEMO COMPLETADO!</b> Todo lo que construimos en 35 pasos:<br>👥 2 clientes<br>🎯 1 prospecto ($4,500)<br>📈 Flujo de ventas<br>👷 2 técnicos con GPS<br>🏠 1 asesora<br>📅 Calendario<br>🔧 2 trabajos ($3,050)<br>📞 1 emergencia<br>📄 2 facturas ($2,720)<br>💰 Cobranza y recibos<br>🏢 4 gastos ($1,537/mes)<br>💳 Nómina ($3,067)<br>📬 Bandeja y correo<br>📣 Campaña marketing<br>📒 10 artículos precios<br>📊 Reportes<br>👥 Equipo<br>🛡️ RH<br>⚙️ Configuración"
  ),'success');
}

function s35(){
  return sayW(L(
    "🚀 <b>This is what Trade Master CRM does for your business.</b> Customers, dispatch, GPS, invoicing, payroll, marketing, reports — all in one place, from any device. Ready to take your company to the next level?",
    "🚀 <b>Esto es lo que Trade Master CRM hace por tu negocio.</b> Clientes, despacho, GPS, facturación, nómina, mercadotecnia, reportes — todo en un lugar, desde cualquier dispositivo. ¿Listo para llevar tu empresa al siguiente nivel?"
  ),'info').then(function(){
    var ch=$('sfChat');var cta=document.createElement('div');
    cta.innerHTML='<div style="padding:18px;text-align:center"><a href="'+location.pathname+'" style="display:inline-block;padding:18px 44px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;text-decoration:none;border-radius:14px;font-weight:700;font-size:17px;box-shadow:0 8px 24px rgba(249,115,22,.4)">🚀 '+L('Start Free — 10 Clients Free','Empieza Gratis — 10 Clientes Gratis')+'</a><p style="margin-top:10px;font-size:12px;color:var(--text-muted)">'+L('Free: 10 clients | Pro: $149.99/mo — unlimited','Gratis: 10 clientes | Pro: $149.99/mes — ilimitado')+'</p></div>';
    ch.appendChild(cta);ch.scrollTop=99999;
  });
}
/* ===== INIT - Wait for CRM to fully load ===== */
document.addEventListener('DOMContentLoaded',function(){
  setTimeout(function(){
    injectCSS();initVoice();
    if(window.showSection&&!_origShowSection){_origShowSection=window.showSection;}
    showSplash().then(function(mode){
      createAssistant();
      sayW(L(
        '\uD83D\uDC4B <b>Thank you for choosing Trade Master CRM</b> to manage your company and take it to the next level! I\'m <b>Danielle</b>, and I\'ll be your personal guide through every feature.',
        '\uD83D\uDC4B <b>\u00A1Gracias por elegir Trade Master CRM</b> para administrar tu empresa y llevarla al siguiente nivel! Soy <b>Brenda</b>, y ser\u00E9 tu gu\u00EDa personal por cada funci\u00F3n.'
      ),'info').then(function(){
        if(mode==='auto'){
          doAuto();
        }else{
          sayW(L(
            'Click <b>\u23E9 Next</b> to go step by step, or <b>\u25B6\uFE0F Auto</b> to sit back and watch the full tour.',
            'Clic <b>\u23E9 Next</b> para ir paso a paso, o <b>\u25B6\uFE0F Auto</b> para sentarte y ver el tour completo.'
          ),'info');
        }
      });
    });
  },2000);
});
})();
