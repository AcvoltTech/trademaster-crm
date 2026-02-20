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
  $('sfMute').onclick=function(){_ttsOn=!_ttsOn;this.textContent=_ttsOn?'\uD83D\uDD0A':'\uD83D\uDD07';if(!_ttsOn&&window.speechSynthesis)speechSynthesis.cancel();};
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
var _audioQ=[],_audioPlaying=false;
function initVoice(){_voiceReady=true;}
var _ttsOn=true;
function getLang(){return(window.currentLang||'es');}
function speak(txt){
  if(!_ttsOn)return;
  var clean=txt.replace(/<[^>]*>/g,'').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').trim();
  if(!clean)return;
  if(_11KEY){speakEL(clean);}else{speakWS(clean);}
}
function speakWS(txt){
  if(!window.speechSynthesis)return;speechSynthesis.cancel();
  var lang=getLang();var u=new SpeechSynthesisUtterance(txt);
  u.lang=lang==='en'?'en-US':'es-MX';u.rate=1.0;u.pitch=1.1;u.volume=1;
  var vs=speechSynthesis.getVoices();var tl=u.lang;
  var v=vs.find(function(x){return x.lang===tl&&/female|samantha|zira|sabina/i.test(x.name);})||
  vs.find(function(x){return x.lang===tl;})||vs.find(function(x){return x.lang.startsWith(lang);})||null;
  if(v)u.voice=v;speechSynthesis.speak(u);
}
function speakEL(txt){_audioQ.push(txt);if(!_audioPlaying)playNextEL();}
function playNextEL(){
  if(_audioQ.length===0){_audioPlaying=false;return;}
  _audioPlaying=true;var txt=_audioQ.shift();
  var vid=_VOICES[getLang()]||_VOICES.en;
  fetch('https://api.elevenlabs.io/v1/text-to-speech/'+vid+'/stream',{
    method:'POST',headers:{'Content-Type':'application/json','xi-api-key':_11KEY},
    body:JSON.stringify({text:txt,model_id:'eleven_turbo_v2_5',voice_settings:{stability:0.5,similarity_boost:0.75,style:0.3}})
  }).then(function(r){if(!r.ok)throw new Error('EL '+r.status);return r.blob();})
  .then(function(b){var a=new Audio(URL.createObjectURL(b));a.onended=function(){URL.revokeObjectURL(a.src);playNextEL();};a.onerror=function(){playNextEL();};a.play();})
  .catch(function(e){console.warn('EL fallback:',e);speakWS(txt);playNextEL();});
}
function L(en,es){return getLang()==='en'?en:es;}
function say(msg,t){t=t||'info';var ch=$('sfChat');var ic={info:'\uD83D\uDCAC',action:'\u26A1',success:'\u2705',nav:'\uD83D\uDCCD'};var m=document.createElement('div');m.className='sf-msg sf-'+t;m.innerHTML='<span class="sf-mi">'+(ic[t]||'\uD83D\uDCAC')+'</span><span class="sf-mt">'+msg+'</span>';ch.appendChild(m);ch.scrollTop=ch.scrollHeight;if(S.mini)toggleMin();speak(msg);}

/* ===== NAVIGATION FUNCTIONS ===== */
function upP(){$('sfPFill').style.width=(S.step/S.total*100)+'%';$('sfStep').textContent=L('Step '+S.step+' of '+S.total,'Paso '+S.step+' de '+S.total);}
function togglePause(){S.paused=!S.paused;$('sfPause').textContent=S.paused?'\u25B6\uFE0F':'\u23F8\uFE0F';if(S.paused){speechSynthesis&&speechSynthesis.cancel();_audioQ=[];}}
function doNext(){if(S.step>=S.total){say(L('\uD83C\uDF89 Demo complete!','\uD83C\uDF89 Demo completado!'),'success');return Promise.resolve();}S.paused=false;$('sfPause').textContent='\u23F8\uFE0F';S.step++;upP();return runStep(S.step);}
function doPrev(){if(S.step<=1)return Promise.resolve();S.step=Math.max(0,S.step-2);return doNext();}
function doAuto(){
  if(S.playing){S.playing=false;$('sfAuto').textContent='\u25B6\uFE0F Auto';return Promise.resolve();}
  S.playing=true;S.paused=false;$('sfAuto').textContent='\u23F9\uFE0F Stop';
  function lp(){if(!S.playing||S.step>=S.total){S.playing=false;$('sfAuto').textContent='\u25B6\uFE0F Auto';return Promise.resolve();}return doNext().then(function(){if(S.playing)return sl(4000).then(lp);});}
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

/* S1: WARM WELCOME */
function s1(){
  say(L(
    "👋 <b>Thank you for choosing Trade Master CRM</b> to manage your company and take it to the next level! I'm <b>Danielle</b>, and I'll personally walk you through every single feature of this CRM. By the end of this demo, you'll know exactly how to run your entire business from one place. Let's get started!",
    "👋 <b>¡Gracias por elegir Trade Master CRM</b> para administrar tu empresa y llevarla al siguiente nivel! Soy <b>Brenda</b>, y te voy a enseñar personalmente cada función de este CRM. Al final de este demo, vas a saber exactamente cómo manejar todo tu negocio desde un solo lugar. ¡Empecemos!"
  ),'info');
  return sl(W+2000);
}

/* S2: DASHBOARD TOUR */
function s2(){
  say(L(
    "📍 This is your <b>Dashboard</b> — your home base. Everything you need is right here: today's jobs, revenue, team activity, and quick actions. Think of it as your business cockpit.",
    "📍 Este es tu <b>Tablero</b> — tu base principal. Todo lo que necesitas está aquí: trabajos del día, ingresos, actividad del equipo y acciones rápidas. Piensa en él como la cabina de tu negocio."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('dashboard');
    return sl(W);
  }).then(ck).then(function(){
    say(L(
      "✅ You can see <b>today's schedule</b>, <b>revenue cards</b>, <b>team locations on the map</b>, and <b>recent activity</b>. Everything updates in real-time. Now let's fill it with data!",
      "✅ Puedes ver el <b>horario de hoy</b>, <b>tarjetas de ingresos</b>, <b>ubicaciones del equipo en el mapa</b> y <b>actividad reciente</b>. Todo se actualiza en tiempo real. ¡Ahora vamos a llenarlo con datos!"
    ),'success');
  });
}

/* S3: NAVIGATE TO CLIENTS */
function s3(){
  say(L(
    "📍 Let's start with <b>Customers</b>. Look at the <b>sidebar on the left</b> — that's your main menu. Click <b>Customers</b> to open the client section. This is where you store everyone you do business with.",
    "📍 Empecemos con <b>Clientes</b>. Mira la <b>barra lateral izquierda</b> — ese es tu menú principal. Haz click en <b>Clientes</b> para abrir la sección de clientes. Aquí guardas a todos con los que haces negocio."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('clients');
    return sl(W);
  }).then(ck).then(function(){
    say(L(
      "⚡ See that <b>orange button</b> at the top? It says <b>'+ New Customer'</b>. That's how you add every new client. I'll click it now and show you how to fill in the form.",
      "⚡ ¿Ves ese <b>botón naranja</b> arriba? Dice <b>'+ Nuevo Cliente'</b>. Así es como agregas cada cliente nuevo. Voy a hacerle click y te enseño cómo llenar el formulario."
    ),'action');
    var btn=$q('#clients-section [onclick*="showClientForm()"]');
    return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1500);});
}

/* S4: CREATE CLIENT 1 - RESIDENTIAL */
function s4(){
  say(L(
    "✏️ The form is open. I'll fill in each field one by one so you can see exactly what goes where. First client: <b>María García</b> — a residential customer in Fontana.",
    "✏️ El formulario está abierto. Voy a llenar cada campo uno por uno para que veas exactamente qué va dónde. Primer cliente: <b>María García</b> — una cliente residencial en Fontana."
  ),'action');
  return sl(W).then(ck).then(function(){
    say(L("✏️ <b>Name:</b> María García","✏️ <b>Nombre:</b> María García"),'action');
    return ty($('clientName'),'María García');
  }).then(function(){return sl(SD);
  }).then(ck).then(function(){
    say(L("📞 <b>Phone:</b> (909) 555-1234","📞 <b>Teléfono:</b> (909) 555-1234"),'action');
    return ty($('clientPhone'),'(909) 555-1234');
  }).then(function(){return sl(SD);
  }).then(ck).then(function(){
    return ty($('clientEmail'),'maria.garcia@email.com');
  }).then(function(){sv($('clientPropertyType'),'Residencial');return sl(SD);
  }).then(ck).then(function(){
    return ty($('clientAddress'),'456 Oak St, Fontana, CA 92335');
  }).then(function(){
    return ty($('clientNotes'),L('AC not cooling - Goodman 15 years. Service in Spanish.','AC no enfría - Goodman 15 años. Servicio en español.'));
  }).then(function(){return sl(W);
  }).then(ck).then(function(){
    say(L("💾 All filled in! Now I click <b>Save</b>...","💾 ¡Todo listo! Ahora hago click en <b>Guardar</b>..."),'action');
    $('clientForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    return sl(2500);
  }).then(function(){
    say(L("✅ <b>María García</b> saved! She's now in your customer list forever. Let's add one more.","✅ ¡<b>María García</b> guardada! Ya está en tu lista de clientes para siempre. Vamos a agregar uno más."),'success');
  });
}

/* S5: CREATE CLIENT 2 - COMMERCIAL */
function s5(){
  say(L(
    "⚡ Now a <b>commercial client</b> — a restaurant. Same process, but we select <b>Commercial</b> as the property type. Watch...",
    "⚡ Ahora un <b>cliente comercial</b> — un restaurante. Mismo proceso, pero seleccionamos <b>Comercial</b> como tipo de propiedad. Mira..."
  ),'info');
  return sl(W).then(ck).then(function(){
    var btn=$q('#clients-section [onclick*="showClientForm()"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('clientName'),'Roberto Méndez');
  }).then(function(){var c=$('clientCompany');return c?ty(c,'La Michoacana Restaurant'):Promise.resolve();
  }).then(function(){return ty($('clientPhone'),'(909) 555-5678');
  }).then(function(){return ty($('clientEmail'),'lamichoacana@email.com');
  }).then(function(){sv($('clientPropertyType'),'Comercial');return ty($('clientAddress'),'2890 Highland Ave, San Bernardino, CA');
  }).then(function(){return ty($('clientNotes'),L('Walk-in cooler not holding temp. Urgent.','Walk-in cooler no mantiene temp. Urgente.'));
  }).then(function(){return sl(SD);
  }).then(function(){$('clientForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2500);
  }).then(function(){
    say(L("✅ <b>2 clients</b> — residential and commercial. Your customer base is growing!","✅ <b>2 clientes</b> — residencial y comercial. ¡Tu base de clientes está creciendo!"),'success');
  });
}

/* S6: LEADS */
function s6(){
  say(L(
    "📍 Now let's go to <b>Leads</b>. A lead is someone who called asking for a quote but hasn't hired you yet. This is your <b>sales pipeline starter</b> — every customer starts as a lead.",
    "📍 Ahora vamos a <b>Prospectos</b>. Un prospecto es alguien que llamó pidiendo cotización pero aún no te contrata. Este es el <b>inicio de tu pipeline de ventas</b> — cada cliente empieza como prospecto."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('leads');return sl(W);
  }).then(ck).then(function(){
    say(L("⚡ Click <b>'+ New Lead'</b>. Let's add someone who wants a new furnace — a $4,500 opportunity!","⚡ Click en <b>'+ Nuevo Prospecto'</b>. Agreguemos alguien que quiere un furnace nuevo — ¡una oportunidad de $4,500!"),'action');
    var btn=$q('#leads-section [onclick*="showLeadForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('leadName'),'Roberto Sánchez');
  }).then(function(){return ty($('leadPhone'),'(909) 555-9012');
  }).then(function(){return ty($('leadEmail'),'roberto.s@email.com');
  }).then(function(){sv($('leadService'),'Calefacción');sv($('leadPropertyType'),'residential');return ty($('leadAddress'),'1025 Pine Ave, Rialto, CA');
  }).then(function(){return ty($('leadNotes'),L('New furnace. 1800sqft. Budget $4,500.','Furnace nuevo. 1800sqft. Budget $4,500.'));
  }).then(function(){var la=$('leadLat'),ln=$('leadLng');if(la)la.value='34.1064';if(ln)ln.value='-117.3703';return sl(SD);
  }).then(function(){$('leadForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2500);
  }).then(function(){
    say(L("✅ Lead <b>Roberto Sánchez</b> 🔥 saved! You can see him on the map. When he signs, convert him to a customer with one click.","✅ ¡Prospecto <b>Roberto Sánchez</b> 🔥 guardado! Lo puedes ver en el mapa. Cuando firme, lo conviertes a cliente con un click."),'success');
  });
}

/* S7: PIPELINE */
function s7(){
  say(L(
    "📍 Speaking of sales — let's look at the <b>Sales Pipeline</b>. This shows you where every deal stands: new leads, quoted, negotiating, won, or lost. It's like a visual funnel of your money.",
    "📍 Hablando de ventas — veamos el <b>Flujo de Ventas</b>. Esto te muestra dónde está cada trato: nuevos, cotizados, negociando, ganados o perdidos. Es como un embudo visual de tu dinero."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('pipeline');return sl(W+2000);
  }).then(function(){
    say(L("✅ Drag deals between columns as they progress. You always know your closing rate and revenue forecast!","✅ Arrastra los tratos entre columnas conforme avanzan. ¡Siempre sabes tu tasa de cierre y pronóstico de ingresos!"),'success');
  });
}

/* S8: TECHNICIAN 1 */
function s8(){
  say(L(
    "📍 Time to add your <b>Technicians</b>. These are the guys in the field doing the work. Go to <b>Technicians</b>. Each tech gets GPS tracking, mobile access, and job assignments sent to their phone.",
    "📍 Hora de agregar tus <b>Técnicos</b>. Estos son los que salen al campo a hacer el trabajo. Ve a <b>Técnicos</b>. Cada técnico tiene rastreo GPS, acceso móvil y trabajos enviados a su celular."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('technicians');return sl(W);
  }).then(ck).then(function(){
    var btn=$q('#technicians-section [onclick*="showTechFormInTechSection"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(ck).then(function(){
    say(L("✏️ <b>Carlos Mendoza</b> — HVAC specialist, $35/hr","✏️ <b>Carlos Mendoza</b> — especialista HVAC, $35/hr"),'action');
    return ty($('techNameAlt'),'Carlos Mendoza');
  }).then(function(){return ty($('techPhoneAlt'),'(909) 555-3456');
  }).then(function(){return ty($('techEmailAlt'),'carlos@rodriguezhvac.com');
  }).then(function(){sv($('techSpecialtyAlt'),'HVAC');var cb=$('techCreateLoginAlt');if(cb)cb.checked=false;return sl(300);
  }).then(function(){var v=$('techVehicleAlt');return v?ty(v,'2023 Ford Transit'):Promise.resolve();
  }).then(function(){var p=$('techPlateAlt');return p?ty(p,'8ABC123'):Promise.resolve();
  }).then(function(){var f=$q('#techFormContainerAlt form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2500);
  }).then(function(){
    say(L("✅ <b>Carlos Mendoza</b> registered! GPS tracking active on his Ford Transit.","✅ ¡<b>Carlos Mendoza</b> registrado! Rastreo GPS activo en su Ford Transit."),'success');
  });
}

/* S9: TECHNICIAN 2 */
function s9(){
  say(L("⚡ Second technician — <b>Miguel Ángel Torres</b>, Refrigeration specialist.","⚡ Segundo técnico — <b>Miguel Ángel Torres</b>, especialista en Refrigeración."),'action');
  return sl(W).then(ck).then(function(){
    var btn=$q('#technicians-section [onclick*="showTechFormInTechSection"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('techNameAlt'),'Miguel Ángel Torres');
  }).then(function(){return ty($('techPhoneAlt'),'(909) 555-7890');
  }).then(function(){return ty($('techEmailAlt'),'miguel@rodriguezhvac.com');
  }).then(function(){sv($('techSpecialtyAlt'),'Refrigeración');var cb=$('techCreateLoginAlt');if(cb)cb.checked=false;return sl(300);
  }).then(function(){var v=$('techVehicleAlt');return v?ty(v,'2022 Chevy Express'):Promise.resolve();
  }).then(function(){var p=$('techPlateAlt');return p?ty(p,'7DEF456'):Promise.resolve();
  }).then(function(){var f=$q('#techFormContainerAlt form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2500);
  }).then(function(){
    say(L("✅ <b>2 technicians</b> ready with GPS tracking and mobile access!","✅ ¡<b>2 técnicos</b> listos con rastreo GPS y acceso móvil!"),'success');
  });
}

/* S10: HOME ADVISOR */
function s10(){
  say(L(
    "📍 Now <b>Home Advisors</b> — your sales team. These are the people who go to homes, sell installations, and earn commissions.",
    "📍 Ahora <b>Asesores del Hogar</b> — tu equipo de ventas. Son los que van a las casas, venden instalaciones y ganan comisiones."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('advisors');return sl(W);
  }).then(ck).then(function(){
    var btn=$q('#advisors-section [onclick*="showAdvisorForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('advisorName'),'Diana Castillo');
  }).then(function(){return ty($('advisorPhone'),'(909) 555-2345');
  }).then(function(){return ty($('advisorEmail'),'diana@rodriguezhvac.com');
  }).then(function(){sv($('advisorSpecialty'),'Residencial y Comercial');return ty($('advisorZone'),'Inland Empire');
  }).then(function(){var g=$('advisorGoal');return g?ty(g,'50000'):Promise.resolve();
  }).then(function(){$('advisorForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2500);
  }).then(function(){
    say(L("✅ <b>Diana Castillo</b> — $50K/month goal, 5%-20% commissions. The CRM tracks her sales automatically.","✅ <b>Diana Castillo</b> — meta $50K/mes, comisiones 5%-20%. El CRM rastrea sus ventas automáticamente."),'success');
  });
}

/* S11: CALENDAR */
function s11(){
  say(L(
    "📍 Let's check the <b>Calendar</b>. This is your scheduling hub — all appointments, jobs, and follow-ups show up here. Your whole team's schedule in one view.",
    "📍 Veamos el <b>Calendario</b>. Este es tu centro de horarios — todas las citas, trabajos y seguimientos aparecen aquí. El horario de todo tu equipo en una vista."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('calendar');return sl(W+2000);
  }).then(function(){
    say(L("✅ You can schedule appointments, set reminders, and see which technician is available when. Drag and drop to reschedule!","✅ Puedes agendar citas, poner recordatorios y ver qué técnico está disponible. ¡Arrastra y suelta para re-agendar!"),'success');
  });
}

/* S12: DISPATCH - JOB 1 */
function s12(){
  say(L(
    "📍 Now the <b>command center</b> — <b>Dispatch</b>! This is where you create jobs, assign technicians, and track everything live on the map. Let me create the first job.",
    "📍 Ahora el <b>centro de control</b> — ¡<b>Despacho</b>! Aquí es donde creas trabajos, asignas técnicos y rastreas todo en vivo en el mapa. Déjame crear el primer trabajo."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('dispatch');return sl(W);
  }).then(ck).then(function(){
    var btn=$q('#dispatch-section [onclick*="showJobForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(ck).then(function(){
    say(L("✏️ <b>AC Repair</b> for María García — assigning to Carlos, $850","✏️ <b>AC Repair</b> para María García — asignando a Carlos, $850"),'action');
    return ty($('jobTitle'),'AC Repair - Goodman not cooling');
  }).then(function(){sv($('jobServiceType'),'Reparación');sv($('jobPriority'),'high');return ty($('jobAddress'),'456 Oak St, Fontana, CA');
  }).then(function(){var d=$('jobDate');if(d)d.value=new Date().toISOString().split('T')[0];var la=$('jobLat'),ln=$('jobLng');if(la)la.value='34.09';if(ln)ln.value='-117.43';var ts=$('jobTechId');if(ts&&window.techsData&&techsData[0])sv(ts,techsData[0].id);return ty($('jobNotes'),L('Capacitor and contactor. $850','Capacitor y contactor. $850'));
  }).then(function(){$('jobForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2500);
  }).then(function(){
    say(L("✅ Job assigned to <b>Carlos</b>! He gets a notification on his phone with the address and details.","✅ ¡Trabajo asignado a <b>Carlos</b>! Le llega notificación a su celular con la dirección y detalles."),'success');
  });
}

/* S13: DISPATCH - JOB 2 URGENT */
function s13(){
  say(L("⚡ Second job — <b>URGENT</b>! The restaurant's walk-in cooler is failing. Food is at risk. Let's dispatch Miguel immediately.","⚡ Segundo trabajo — ¡<b>URGENTE</b>! El walk-in cooler del restaurante está fallando. La comida está en riesgo. Despachemos a Miguel inmediatamente."),'action');
  return sl(W).then(ck).then(function(){
    var btn=$q('#dispatch-section [onclick*="showJobForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('jobTitle'),'Walk-in Cooler - Compressor');
  }).then(function(){sv($('jobServiceType'),'Reparación');sv($('jobPriority'),'urgent');return ty($('jobAddress'),'2890 Highland Ave, SB, CA');
  }).then(function(){var d=$('jobDate');if(d)d.value=new Date().toISOString().split('T')[0];var la=$('jobLat'),ln=$('jobLng');if(la)la.value='34.12';if(ln)ln.value='-117.29';var ts=$('jobTechId');if(ts&&window.techsData&&techsData[1])sv(ts,techsData[1].id);return ty($('jobNotes'),L('Urgent. Cooler 55°F. $2,200','Urgente. Cooler 55°F. $2,200'));
  }).then(function(){$('jobForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2500);
  }).then(function(){
    say(L("✅ <b>2 jobs dispatched</b> — $3,050 total! Carlos → Fontana, Miguel → San Bernardino.","✅ <b>2 trabajos despachados</b> — ¡$3,050 total! Carlos → Fontana, Miguel → San Bernardino."),'success');
  });
}

/* S14: SERVICE CALLS */
function s14(){
  say(L(
    "📍 <b>Service Calls</b> — when a customer calls with an emergency, this is where you log it FAST. It's different from Dispatch — this is the intake for incoming calls.",
    "📍 <b>Llamadas de Servicio</b> — cuando un cliente llama con emergencia, aquí lo registras RÁPIDO. Es diferente de Despacho — esta es la entrada para llamadas entrantes."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('servicecalls');return sl(W);
  }).then(ck).then(function(){
    var btn=$q('#servicecalls-section [onclick*="showServiceCallForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(ck).then(function(){
    say(L("✏️ Emergency: <b>AC not cooling, pet in house!</b>","✏️ Emergencia: <b>¡AC no enfría, mascota en casa!</b>"),'action');
    return ty($('scClientName'),'María García');
  }).then(function(){return ty($('scClientPhone'),'(909) 555-1234');
  }).then(function(){return ty($('scAddress'),'456 Oak St, Fontana, CA');
  }).then(function(){return ty($('scProblem'),L('AC not cooling. Pet in house. Urgent.','AC no enfría. Mascota en casa. Urgente.'));
  }).then(function(){sv($('scUrgency'),'emergency');sv($('scPropertyType'),'residential');var pd=$('scPreferredDate');if(pd)pd.value=new Date().toISOString().split('T')[0];if(window.techsData&&techsData[0]){var st=$('scTechAssign');if(st)sv(st,techsData[0].id);}return ty($('scNotes'),'Gate #1234.');
  }).then(function(){$('serviceCallForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2500);
  }).then(function(){
    say(L("✅ <b style='color:#ef4444'>🔴 EMERGENCY</b> logged and dispatched! Tech gets an immediate alert.","✅ <b style='color:#ef4444'>🔴 EMERGENCIA</b> registrada y despachada! El técnico recibe alerta inmediata."),'success');
  });
}

/* S15: GPS TRACKING */
function s15(){
  say(L(
    "📍 Back to <b>Dispatch</b> — let's see the <b>GPS tracking</b>. This is your real-time command center.",
    "📍 Regresemos a <b>Despacho</b> — veamos el <b>rastreo GPS</b>. Este es tu centro de control en tiempo real."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('dispatch');return sl(W);
  }).then(ck).then(function(){
    say(L(
      "🚐 Look at the map! You can see exactly where each tech is:<br>🚐 <b>Carlos</b> → Fontana<br>🚐 <b>Miguel</b> → San Bernardino<br><br>Your customers get a <b>tracking link</b> too — like Uber for HVAC!",
      "🚐 ¡Mira el mapa! Puedes ver exactamente dónde está cada técnico:<br>🚐 <b>Carlos</b> → Fontana<br>🚐 <b>Miguel</b> → San Bernardino<br><br>¡Tus clientes también reciben un <b>link de rastreo</b> — como Uber para HVAC!"
    ),'info');
    return sl(W+2000);
  }).then(function(){
    say(L("✅ Real-time fleet management. You're always in control!","✅ Administración de flota en tiempo real. ¡Siempre tienes el control!"),'success');
  });
}

/* S16: JOBS LIST */
function s16(){
  say(L(
    "📍 <b>Jobs</b> — this is the master list of ALL work orders. Filter by status: pending, in progress, completed. Track revenue per job.",
    "📍 <b>Trabajos</b> — esta es la lista maestra de TODAS las órdenes de trabajo. Filtra por estatus: pendiente, en progreso, completado. Rastrea ingreso por trabajo."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('jobs');return sl(W+2000);
  }).then(function(){
    say(L("✅ Every job from creation to completion — tracked here. Export to PDF anytime.","✅ Cada trabajo desde la creación hasta el final — rastreado aquí. Exporta a PDF cuando quieras."),'success');
  });
}

/* S17: INVOICES - CREATE */
function s17(){
  say(L(
    "📍 Time to get <b>paid</b>! Let's go to <b>Invoices</b>. Every job should end with an invoice. I'll create one for María García's AC repair.",
    "📍 ¡Hora de <b>cobrar</b>! Vamos a <b>Facturas</b>. Cada trabajo debe terminar con una factura. Voy a crear una para la reparación de AC de María García."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('invoices');return sl(W);
  }).then(ck).then(function(){
    say(L("⚡ Creating invoice: Service Call $120 + Capacitor $85 + Contactor $65 + Labor $250 = <b>$520</b>","⚡ Creando factura: Visita $120 + Capacitor $85 + Contactor $65 + Mano de obra $250 = <b>$520</b>"),'action');
    var inv={id:'inv1',company_id:'demo-co',invoice_number:'INV-202602-0001',client_name:'María García',client_email:'maria.garcia@email.com',client_phone:'(909) 555-1234',client_address:'456 Oak St, Fontana',line_items:[{name:'Service Call',qty:1,unit_price:120,labor:0,total:120},{name:'Capacitor 45/5',qty:1,unit_price:85,labor:0,total:85},{name:'Contactor 2P',qty:1,unit_price:65,labor:0,total:65},{name:'Labor',qty:2,unit_price:0,labor:125,total:250}],subtotal:520,total:520,balance_due:520,amount_paid:0,status:'draft',created_at:new Date().toISOString()};
    _db.invoices.push(inv);window.invoicesData=[inv];renderInvoiceKPIs();renderInvoicesTable();
    return sl(W);
  }).then(function(){
    say(L("✅ <b>INV-0001</b> created for <b>$520</b>! You can email it to the customer or print as PDF.","✅ <b>INV-0001</b> creada por <b>$520</b>! La puedes enviar por email o imprimir como PDF."),'success');
  });
}

/* S18: INVOICES - MARK PAID + 2ND */
function s18(){
  say(L("⚡ María paid! Let me mark it as <b>PAID</b> and create the restaurant invoice...","⚡ ¡María pagó! Déjame marcarla como <b>PAGADA</b> y crear la factura del restaurante..."),'action');
  return sl(W).then(ck).then(function(){
    invoicesData[0].status='paid';invoicesData[0].amount_paid=520;invoicesData[0].balance_due=0;
    var inv2={id:'inv2',company_id:'demo-co',invoice_number:'INV-202602-0002',client_name:'La Michoacana',client_phone:'(909) 555-5678',client_email:'lm@email.com',client_address:'2890 Highland, SB',line_items:[{name:'Cooler Repair',qty:1,unit_price:1800,labor:400,total:2200}],subtotal:2200,total:2200,balance_due:2200,amount_paid:0,status:'sent',created_at:new Date().toISOString()};
    _db.invoices.push(inv2);invoicesData.push(inv2);renderInvoiceKPIs();renderInvoicesTable();return sl(W);
  }).then(function(){
    say(L("✅ INV-0001 <b style='color:#16a34a'>✅ PAID</b> $520 | INV-0002 <b style='color:#f59e0b'>⏳ PENDING</b> $2,200","✅ INV-0001 <b style='color:#16a34a'>✅ PAGADA</b> $520 | INV-0002 <b style='color:#f59e0b'>⏳ PENDIENTE</b> $2,200"),'success');
  });
}

/* S19: COLLECTIONS */
function s19(){
  say(L(
    "📍 <b>Collections</b> — when invoices are overdue, this is where you follow up. Track who owes you, how long it's been, and send reminders. Never lose money again.",
    "📍 <b>Cobranza</b> — cuando las facturas se vencen, aquí es donde das seguimiento. Rastrea quién te debe, cuánto tiempo ha pasado y envía recordatorios. Nunca pierdas dinero otra vez."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('collections');return sl(W+2000);
  }).then(function(){
    say(L("✅ Automatic aging reports: 30, 60, 90 days overdue. One-click reminders to customers!","✅ Reportes de antigüedad automáticos: 30, 60, 90 días vencidos. ¡Recordatorios a clientes con un click!"),'success');
  });
}

/* S20: RECEIPTS */
function s20(){
  say(L(
    "📍 <b>Receipts</b> — track every payment received. When a customer pays cash, check, Zelle, or card — log it here for your records and tax purposes.",
    "📍 <b>Recibos</b> — registra cada pago recibido. Cuando un cliente paga efectivo, cheque, Zelle o tarjeta — regístralo aquí para tus archivos e impuestos."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('receipts');return sl(W+2000);
  }).then(function(){
    say(L("✅ Every payment documented. Your accountant will love you!","✅ Cada pago documentado. ¡Tu contador te va a amar!"),'success');
  });
}

/* S21: EXPENSES */
function s21(){
  say(L(
    "📍 <b>Business Expenses</b> — track everything you spend: gas, insurance, tools, vehicle payments, CRM subscription. If money goes out, it goes here.",
    "📍 <b>Gastos del Negocio</b> — registra todo lo que gastas: gasolina, seguro, herramientas, pagos de vehículo, suscripción del CRM. Si sale dinero, va aquí."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('expenses');return sl(W);
  }).then(ck).then(function(){
    var btn=$q('#expenses-section [onclick*="showExpenseForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){
    say(L("✏️ Adding gas: <b>$287.50</b> at Chevron","✏️ Agregando gasolina: <b>$287.50</b> en Chevron"),'action');
    sv($('expCategory'),'vehicle_gas');return ty($('expVendor'),'Chevron');
  }).then(function(){return ty($('expAmount'),'287.50');
  }).then(function(){sv($('expFrequency'),'monthly');sv($('expType'),'variable');$('expDate').value=new Date().toISOString().split('T')[0];return sl(SD);
  }).then(function(){var f=$q('#expenses-section form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(1500);
  }).then(ck).then(function(){
    [{category:'general_liability',vendor:'State Farm',amount:450,type:'fixed'},{category:'software_crm',vendor:'Trade Master CRM',amount:149.99,type:'fixed'},{category:'vehicle_payment',vendor:'Ford Motor Credit',amount:650,type:'fixed'}]
    .forEach(function(e){e.id='exp'+(++_idc);e.company_id='demo-co';e.frequency='monthly';e.date=new Date().toISOString().split('T')[0];e.created_at=new Date().toISOString();_db.expenses.push(e);expensesData.push(e);});
    renderExpenses();return sl(W);
  }).then(function(){
    say(L("✅ <b>4 expenses</b>: Gas $287.50 + Insurance $450 + CRM $149.99 + Vehicle $650 = <b>$1,537.49/month</b>","✅ <b>4 gastos</b>: Gasolina $287.50 + Seguro $450 + CRM $149.99 + Vehículo $650 = <b>$1,537.49/mes</b>"),'success');
  });
}

/* S22: MY MONEY */
function s22(){
  say(L(
    "📍 <b>My Money</b> — your financial overview. Income vs expenses in a chart. See your profit at a glance. This is the health of your business.",
    "📍 <b>Mi Dinero</b> — tu vista financiera. Ingresos vs gastos en una gráfica. Ve tu ganancia de un vistazo. Esta es la salud de tu negocio."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('mymoney');return sl(W+2000);
  }).then(function(){
    say(L("✅ Revenue coming in, expenses going out, net profit — all in real-time!","✅ Ingresos entrando, gastos saliendo, ganancia neta — ¡todo en tiempo real!"),'success');
  });
}

/* S23: PAYROLL */
function s23(){
  say(L(
    "📍 <b>Payroll</b> — track what you owe each technician and advisor. Hours worked × hourly rate = total pay. No more spreadsheets!",
    "📍 <b>Nómina</b> — rastrea lo que le debes a cada técnico y asesor. Horas trabajadas × tarifa por hora = pago total. ¡No más hojas de cálculo!"
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('payroll');return sl(W);
  }).then(ck).then(function(){
    var e=[
      {id:'py1',company_id:'demo-co',tech_id:techsData[0]?techsData[0].id:null,tech_name:techsData[0]?techsData[0].name:'Carlos',type:'hourly',hours:42,rate:35,total:1470,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()},
      {id:'py2',company_id:'demo-co',tech_id:techsData[1]?techsData[1].id:null,tech_name:techsData[1]?techsData[1].name:'Miguel',type:'hourly',hours:38,rate:30,total:1140,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()},
      {id:'py3',company_id:'demo-co',tech_id:null,tech_name:advisorsData&&advisorsData[0]?advisorsData[0].name:'Diana',type:'commission',hours:0,rate:0,total:457.50,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()}];
    e.forEach(function(x){_db.payroll_entries.push(x);});window.payrollData=e;renderPayroll();return sl(W);
  }).then(function(){
    say(L("✅ Carlos: 42hrs × $35 = <b>$1,470</b> | Miguel: 38hrs × $30 = <b>$1,140</b> | Diana: <b>$457.50</b> commission | Total: <b>$3,067.50</b>","✅ Carlos: 42hrs × $35 = <b>$1,470</b> | Miguel: 38hrs × $30 = <b>$1,140</b> | Diana: <b>$457.50</b> comisión | Total: <b>$3,067.50</b>"),'success');
  });
}

/* S24: PAYROLL EXPORT */
function s24(){
  say(L(
    "⚡ And the best part — you can <b>export payroll</b> directly to <b>QuickBooks, ADP, or Gusto</b> with one click. No double entry!",
    "⚡ Y lo mejor — puedes <b>exportar la nómina</b> directo a <b>QuickBooks, ADP o Gusto</b> con un click. ¡Sin doble captura!"
  ),'info');
  return sl(W+2000).then(function(){
    say(L("✅ Payroll is fully automated. Calculate, review, export — done!","✅ La nómina es completamente automática. Calcula, revisa, exporta — ¡listo!"),'success');
  });
}

/* S25: INBOX */
function s25(){
  say(L(
    "📍 <b>Inbox</b> — your notification center. Every important event shows up here: new leads, completed jobs, overdue invoices, team updates. Never miss anything.",
    "📍 <b>Bandeja</b> — tu centro de notificaciones. Cada evento importante aparece aquí: nuevos prospectos, trabajos completados, facturas vencidas, actualizaciones del equipo. Nunca te pierdas de nada."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('inbox');return sl(W+2000);
  }).then(function(){
    say(L("✅ All notifications in one place. Read, archive, or take action instantly.","✅ Todas las notificaciones en un lugar. Lee, archiva o toma acción al instante."),'success');
  });
}

/* S26: MAILBOX */
function s26(){
  say(L(
    "📍 <b>Business Mail</b> — send and receive emails right from your CRM. No need to switch to Gmail or Outlook. Communicate with customers without leaving the app.",
    "📍 <b>Correo del Negocio</b> — envía y recibe emails directo desde tu CRM. No necesitas cambiar a Gmail o Outlook. Comunícate con clientes sin salir de la app."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('mailbox');return sl(W+2000);
  }).then(function(){
    say(L("✅ Professional email integrated. Templates for quotes, follow-ups, and thank-you notes!","✅ Email profesional integrado. ¡Plantillas para cotizaciones, seguimientos y agradecimientos!"),'success');
  });
}

/* S27: MARKETING */
function s27(){
  say(L(
    "📍 <b>Marketing</b> — grow your business! Create campaigns for Google Ads, Facebook, Yelp. Track which ads bring you the most customers.",
    "📍 <b>Mercadotecnia</b> — ¡haz crecer tu negocio! Crea campañas para Google Ads, Facebook, Yelp. Rastrea qué anuncios te traen más clientes."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('marketing');return sl(W);
  }).then(ck).then(function(){
    var btn=$q('#marketing-section [onclick*="showCampaignForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('campName'),'Promo Summer - AC Tune-Up $79');
  }).then(function(){sv($('campType'),'google_ads');return ty($('campBudget'),'1500');
  }).then(function(){var cs=$('campStart'),ce=$('campEnd');if(cs)cs.value=new Date().toISOString().split('T')[0];if(ce){var d=new Date();d.setDate(d.getDate()+60);ce.value=d.toISOString().split('T')[0];}return ty($('campMessage'),'AC Tune-Up $79. Rodriguez HVAC. (909) 555-0000');
  }).then(function(){var f=$q('#marketing-section form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2500);
  }).then(function(){
    say(L("✅ Campaign <b>Google Ads</b> active! $1,500 budget, 60 days. The CRM tracks ROI automatically.","✅ ¡Campaña <b>Google Ads</b> activa! $1,500 de presupuesto, 60 días. El CRM rastrea el ROI automáticamente."),'success');
  });
}

/* S28: PRICE BOOK */
function s28(){
  say(L(
    "📍 <b>Price Book</b> — your catalog of parts, services, and prices. When you create invoices, you pull prices from here. Set your cost and selling price to see your profit margin.",
    "📍 <b>Lista de Precios</b> — tu catálogo de partes, servicios y precios. Cuando creas facturas, jalas precios de aquí. Pon tu costo y precio de venta para ver tu margen."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('pricebook');return sl(W);
  }).then(ck).then(function(){
    say(L("⚡ Loading 10 common HVAC parts and services...","⚡ Cargando 10 partes y servicios comunes de HVAC..."),'action');
    [{name:'Capacitor 45/5 MFD',sku:'CAP-455',category:'ac_parts',unit:'each',cost:12,price:85},{name:'Contactor 2P 40A',sku:'CON-2P',category:'ac_parts',unit:'each',cost:8,price:65},{name:'Motor Fan 1/4 HP',sku:'MTR-025',category:'motors',unit:'each',cost:45,price:195},{name:'R-410A per lb',sku:'REF-410',category:'refrigerants',unit:'lb',cost:15,price:85},{name:'Thermostat Honeywell',sku:'TSTAT',category:'controls',unit:'each',cost:35,price:175},{name:'Filter 16x25x1',sku:'FLT-162',category:'filters',unit:'each',cost:4,price:25},{name:'Service Call 0-10mi',sku:'SC-010',category:'labor',unit:'flat',cost:0,price:70},{name:'Service Call 10-20mi',sku:'SC-1020',category:'labor',unit:'flat',cost:0,price:120},{name:'Labor per Hour',sku:'LAB-HR',category:'labor',unit:'hour',cost:0,price:125},{name:'AC Tune-Up 21pts',sku:'TUNE-21',category:'labor',unit:'flat',cost:0,price:79}]
    .forEach(function(it){it.id='pb'+(++_idc);it.company_id='demo-co';_db.price_book.push(it);});
    window.priceBookData=_db.price_book.slice();renderPriceBook();return sl(W);
  }).then(function(){
    say(L("✅ <b>10 items</b> loaded! Look at those margins: Capacitor $12→$85 (<b>608%</b>), R-410A $15→$85 (<b>467%</b>). This is how HVAC companies make money!","✅ ¡<b>10 artículos</b> cargados! Mira esos márgenes: Capacitor $12→$85 (<b>608%</b>), R-410A $15→$85 (<b>467%</b>). ¡Así es como las empresas HVAC ganan dinero!"),'success');
  });
}

/* S29: REPORTS */
function s29(){
  say(L(
    "📍 <b>Reports</b> — the big picture of your business. Revenue by month, jobs per technician, lead sources, team productivity — all visualized in charts and graphs.",
    "📍 <b>Reportes</b> — la foto completa de tu negocio. Ingresos por mes, trabajos por técnico, fuentes de prospectos, productividad del equipo — todo visualizado en gráficas."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('reports');return sl(W+2000);
  }).then(function(){
    say(L("✅ Export any report to <b>PDF</b>. Share with your accountant, partner, or bank for loans.","✅ Exporta cualquier reporte a <b>PDF</b>. Comparte con tu contador, socio o banco para préstamos."),'success');
  });
}

/* S30: TEAM - USERS */
function s30(){
  say(L(
    "📍 <b>Users & Team</b> — manage who has access to your CRM. Add office staff, assign roles, control what each person can see and do. Security first!",
    "📍 <b>Usuarios y Equipo</b> — administra quién tiene acceso a tu CRM. Agrega personal de oficina, asigna roles, controla lo que cada persona puede ver y hacer. ¡Seguridad primero!"
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('team');return sl(W+2000);
  }).then(function(){
    say(L("✅ Admin, Manager, Dispatcher, Technician — each role sees only what they need. Your data stays safe.","✅ Admin, Gerente, Despachador, Técnico — cada rol ve solo lo que necesita. Tu información está segura."),'success');
  });
}

/* S31: HR - HUMAN RESOURCES */
function s31(){
  say(L(
    "📍 <b>Human Resources</b> — employee files, contracts, certifications, performance reviews. Everything HR needs, built right into the CRM.",
    "📍 <b>Recursos Humanos</b> — archivos de empleados, contratos, certificaciones, evaluaciones de desempeño. Todo lo que RH necesita, integrado en el CRM."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('hr');return sl(W+2000);
  }).then(function(){
    say(L("✅ Upload contracts, track certifications, manage employee documents — all in one place. No more paper files!","✅ Sube contratos, rastrea certificaciones, administra documentos de empleados — todo en un lugar. ¡No más archivos de papel!"),'success');
  });
}

/* S32: SETTINGS */
function s32(){
  say(L(
    "📍 <b>Settings</b> — configure your company info: name, license, bond, insurance, logo, and legal documents. This info appears on your invoices and contracts.",
    "📍 <b>Configuración</b> — configura tu info de empresa: nombre, licencia, bond, seguro, logo y documentos legales. Esta info aparece en tus facturas y contratos."
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('settings');return sl(W+2000);
  }).then(function(){
    say(L("✅ Company profile, contractor license, insurance bond, contract templates — all saved and ready.","✅ Perfil de empresa, licencia de contratista, fianza de seguro, plantillas de contratos — todo guardado y listo."),'success');
  });
}

/* S33: RETURN TO DASHBOARD */
function s33(){
  say(L(
    "📍 Let's go back to the <b>Dashboard</b> to see everything we've built. Look how your business came alive!",
    "📍 Regresemos al <b>Tablero</b> para ver todo lo que construimos. ¡Mira cómo tu negocio cobró vida!"
  ),'nav');
  return sl(W).then(ck).then(function(){smoothShow('dashboard');return sl(W+2000);
  }).then(function(){
    say(L("✅ Your dashboard is now full of real data — customers, jobs, revenue, team activity. This is YOUR business, organized.","✅ Tu tablero está lleno de datos reales — clientes, trabajos, ingresos, actividad del equipo. Este es TU negocio, organizado."),'success');
  });
}

/* S34: FINAL SUMMARY */
function s34(){
  say(L(
    "🎉 <b>DEMO COMPLETE!</b><br><br>Here's everything we built together in 35 steps:<br><br>👥 2 customers (residential + commercial)<br>🎯 1 lead ($4,500 furnace)<br>📈 Sales pipeline<br>👷 2 technicians with GPS<br>🏠 1 home advisor<br>📅 Calendar & scheduling<br>🔧 2 jobs worth $3,050<br>📞 1 emergency service call<br>🚐 Real-time GPS tracking<br>📄 2 invoices ($2,720 total)<br>💰 Collections & receipts<br>🏢 4 expenses ($1,537/month)<br>💵 Financial overview<br>💳 Payroll ($3,067.50)<br>📬 Inbox & business email<br>📣 1 marketing campaign<br>📒 10 price book items<br>📊 Reports & analytics<br>👥 Team management<br>🛡️ HR & documents<br>⚙️ Company settings",
    "🎉 <b>¡DEMO COMPLETADO!</b><br><br>Esto es todo lo que construimos juntos en 35 pasos:<br><br>👥 2 clientes (residencial + comercial)<br>🎯 1 prospecto ($4,500 furnace)<br>📈 Flujo de ventas<br>👷 2 técnicos con GPS<br>🏠 1 asesora del hogar<br>📅 Calendario y agenda<br>🔧 2 trabajos por $3,050<br>📞 1 llamada de emergencia<br>🚐 Rastreo GPS en tiempo real<br>📄 2 facturas ($2,720 total)<br>💰 Cobranza y recibos<br>🏢 4 gastos ($1,537/mes)<br>💵 Vista financiera<br>💳 Nómina ($3,067.50)<br>📬 Bandeja y correo<br>📣 1 campaña de marketing<br>📒 10 artículos de precios<br>📊 Reportes y analíticas<br>👥 Usuarios y equipo<br>🛡️ RH y documentos<br>⚙️ Configuración"
  ),'success');
  return sl(W+2000);
}

/* S35: CTA - SIGN UP */
function s35(){
  say(L(
    "🚀 <b>This is what Trade Master CRM can do for your business.</b> Everything you just saw — customers, dispatch, GPS, invoicing, payroll, marketing, reports — all in one place, from any device. Ready to take your company to the next level?",
    "🚀 <b>Esto es lo que Trade Master CRM puede hacer por tu negocio.</b> Todo lo que acabas de ver — clientes, despacho, GPS, facturación, nómina, mercadotecnia, reportes — todo en un lugar, desde cualquier dispositivo. ¿Listo para llevar tu empresa al siguiente nivel?"
  ),'info');
  return sl(W).then(function(){
    var ch=$('sfChat');var cta=document.createElement('div');
    cta.innerHTML='<div style="padding:18px;text-align:center"><a href="'+location.pathname+'" style="display:inline-block;padding:18px 44px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;text-decoration:none;border-radius:14px;font-weight:700;font-size:17px;box-shadow:0 8px 24px rgba(249,115,22,.4)">🚀 '+L('Start Free — 10 Clients Free','Empieza Gratis — 10 Clientes Gratis')+'</a><p style="margin-top:10px;font-size:12px;color:var(--text-muted)">'+L('Free plan: 10 clients | Pro: $149.99/mo — unlimited everything','Plan gratis: 10 clientes | Pro: $149.99/mes — todo ilimitado')+'</p><p style="margin-top:6px;font-size:11px;color:#94a3b8">'+L('Questions? Call (909) 555-0000','¿Preguntas? Llama al (909) 555-0000')+'</p></div>';
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
      say(L(
        '\uD83D\uDC4B <b>Thank you for choosing Trade Master CRM</b> to manage your company and take it to the next level! I\'m <b>Danielle</b>, and I\'ll be your personal guide through every feature.',
        '\uD83D\uDC4B <b>\u00A1Gracias por elegir Trade Master CRM</b> para administrar tu empresa y llevarla al siguiente nivel! Soy <b>Brenda</b>, y ser\u00E9 tu gu\u00EDa personal por cada funci\u00F3n.'
      ),'info');
      if(mode==='auto'){
        setTimeout(function(){doAuto();},800);
      }else{
        say(L(
          'Click <b>\u23E9 Next</b> to go step by step, or <b>\u25B6\uFE0F Auto</b> to sit back and watch the full tour.',
          'Clic <b>\u23E9 Next</b> para ir paso a paso, o <b>\u25B6\uFE0F Auto</b> para sentarte y ver el tour completo.'
        ),'info');
      }
    });
  },2000);
});
})();
