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
  '.sf-hr{display:flex;gap:4px;align-items:center}.sf-hb{background:rgba(255,255,255,.15);border:none;color:#fff;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center}.sf-hb:hover{background:rgba(255,255,255,.3)}'+
  '.sf-lang{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#94a3b8;padding:2px 8px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;white-space:nowrap}.sf-lang:hover{background:rgba(255,255,255,.2);color:#fff}.sf-lang-on{background:rgba(249,115,22,.3);border-color:#f97316;color:#f97316}'+
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
  var isEN=getLang()==='en';
  p.innerHTML='<div class="sf-head" id="sfHead"><div class="sf-hl"><span class="sf-av" id="sfAvatar">'+(isEN?'\uD83D\uDC71\u200D\u2640\uFE0F':'\uD83D\uDC69\uD83C\uDFFC')+'</span><div><span class="sf-name" id="sfName">'+(isEN?'Danielle':'Brenda')+'</span><span class="sf-role">AI Assistant</span></div></div><div class="sf-hr"><button class="sf-lang'+(isEN?' sf-lang-on':'')+'" id="sfEN" title="English">\uD83D\uDC71\u200D\u2640\uFE0F EN</button><button class="sf-lang'+(!isEN?' sf-lang-on':'')+'" id="sfES" title="Español">\uD83D\uDC69\uD83C\uDFFC ES</button><button class="sf-hb" id="sfMute" title="Sound">\uD83D\uDD0A</button><button class="sf-hb" id="sfMin">\u2212</button><button class="sf-hb" id="sfClose">\u2715</button></div></div><div class="sf-body"><div class="sf-pbar"><div class="sf-pfill" id="sfPFill"></div></div><div class="sf-step" id="sfStep">Step 0 of '+S.total+'</div><div class="sf-chat" id="sfChat"></div></div><div class="sf-ctrl"><button class="sf-cb" id="sfPrev">\u23EA Prev</button><button class="sf-cb sf-cp" id="sfPause">\u23F8\uFE0F Pause</button><button class="sf-cb" id="sfNext">\u23E9 Next</button><button class="sf-cb sf-auto" id="sfAuto">\u25B6\uFE0F Auto</button></div>';
  document.body.appendChild(p);
  function switchLang(lang){
    window.currentLang=lang;
    var en=lang==='en';
    $('sfName').textContent=en?'Danielle':'Brenda';
    $('sfAvatar').textContent=en?'\uD83D\uDC71\u200D\u2640\uFE0F':'\uD83D\uDC69\uD83C\uDFFC';
    $('sfEN').className='sf-lang'+(en?' sf-lang-on':'');
    $('sfES').className='sf-lang'+(!en?' sf-lang-on':'');
    if(window.speechSynthesis)speechSynthesis.cancel();
    if(_currentAudio){try{_currentAudio.pause();}catch(e){}_currentAudio=null;}
  }
  $('sfEN').onclick=function(){switchLang('en');};
  $('sfES').onclick=function(){switchLang('es');};
  $('sfMute').onclick=function(){_ttsOn=!_ttsOn;this.textContent=_ttsOn?'\uD83D\uDD0A':'\uD83D\uDD07';if(!_ttsOn){if(window.speechSynthesis)speechSynthesis.cancel();if(_currentAudio){try{_currentAudio.pause();}catch(e){}}}};
  $('sfMin').onclick=toggleMin;$('sfClose').onclick=function(){if(confirm('Exit demo?'))location.href=location.pathname;};
  $('sfPrev').onclick=doPrev;$('sfPause').onclick=togglePause;$('sfNext').onclick=doNext;$('sfAuto').onclick=doAuto;
  var bb=document.createElement('div');bb.id='sfBubble';bb.textContent=getLang()==='en'?'\uD83D\uDC71\u200D\u2640\uFE0F':'\uD83D\uDC69\uD83C\uDFFC';bb.onclick=toggleMin;document.body.appendChild(bb);
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
var _currentAudio=null; // Track current audio for pause/cancel
function getLang(){return(window.currentLang||'es');}

/* speak() returns a Promise that resolves ONLY when audio finishes playing */
function speak(txt){
  if(!_ttsOn)return Promise.resolve();
  var clean=txt.replace(/<[^>]*>/g,'').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').trim();
  if(!clean)return Promise.resolve();
  return _11KEY?speakEL(clean):speakWS(clean);
}

/* Web Speech API - returns Promise, resolves ONLY on end */
function speakWS(txt){
  return new Promise(function(resolve){
    if(!window.speechSynthesis){resolve();return;}
    speechSynthesis.cancel();
    var done=false;
    function fin(){if(!done){done=true;resolve();}}
    var lang=getLang();var u=new SpeechSynthesisUtterance(txt);
    u.lang=lang==='en'?'en-US':'es-MX';u.rate=1.0;u.pitch=1.1;u.volume=1;
    var vs=speechSynthesis.getVoices();var tl=u.lang;
    var v=vs.find(function(x){return x.lang===tl&&/female|samantha|zira|sabina/i.test(x.name);})||
    vs.find(function(x){return x.lang===tl;})||vs.find(function(x){return x.lang.startsWith(lang);})||null;
    if(v)u.voice=v;
    u.onend=fin;
    u.onerror=fin;
    speechSynthesis.speak(u);
    // Safety: estimate duration from text length (150 words/min avg)
    var words=txt.split(/\s+/).length;
    var estMs=Math.max(3000,(words/2.5)*1000+2000);
    setTimeout(fin,estMs);
  });
}

/* ElevenLabs TTS - returns Promise, resolves ONLY when audio finishes playing */
function speakEL(txt){
  return new Promise(function(resolve){
    var done=false;
    function fin(){if(!done){done=true;_currentAudio=null;resolve();}}
    var vid=_VOICES[getLang()]||_VOICES.en;
    fetch('https://api.elevenlabs.io/v1/text-to-speech/'+vid+'/stream',{
      method:'POST',headers:{'Content-Type':'application/json','xi-api-key':_11KEY},
      body:JSON.stringify({text:txt,model_id:'eleven_turbo_v2_5',voice_settings:{stability:0.5,similarity_boost:0.75,style:0.3}})
    }).then(function(r){if(!r.ok)throw new Error('EL '+r.status);return r.blob();})
    .then(function(b){
      var a=new Audio();
      _currentAudio=a;
      a.onended=function(){URL.revokeObjectURL(a.src);fin();};
      a.onerror=function(){URL.revokeObjectURL(a.src);fin();};
      a.src=URL.createObjectURL(b);
      a.play().catch(function(){
        console.warn('Autoplay blocked, using Web Speech');
        speakWS(txt).then(fin);
      });
    })
    .catch(function(e){
      console.warn('EL error, falling back to Web Speech:',e);
      speakWS(txt).then(fin);
    });
    setTimeout(fin,90000);
  });
}

function L(en,es){return getLang()==='en'?en:es;}

/* say() shows message in chat + speaks. Returns Promise that resolves when VOICE FINISHES */
function say(msg,t){
  t=t||'info';var ch=$('sfChat');
  var ic={info:'\uD83D\uDCAC',action:'\u26A1',success:'\u2705',nav:'\uD83D\uDCCD'};
  var m=document.createElement('div');m.className='sf-msg sf-'+t;
  m.innerHTML='<span class="sf-mi">'+(ic[t]||'\uD83D\uDCAC')+'</span><span class="sf-mt">'+msg+'</span>';
  ch.appendChild(m);ch.scrollTop=ch.scrollHeight;if(S.mini)toggleMin();
  return speak(msg);
}

/* sayW = say + Wait. DIRECTLY chains: show msg → speak → wait for finish → 800ms pause */
function sayW(msg,t){
  return say(msg,t).then(function(){return sl(800);});
}

/* ===== NAVIGATION FUNCTIONS ===== */
function upP(){$('sfPFill').style.width=(S.step/S.total*100)+'%';$('sfStep').textContent=L('Step '+S.step+' of '+S.total,'Paso '+S.step+' de '+S.total);}
function togglePause(){
  S.paused=!S.paused;
  $('sfPause').textContent=S.paused?'\u25B6\uFE0F':'\u23F8\uFE0F';
  if(S.paused){
    if(window.speechSynthesis)speechSynthesis.cancel();
    if(_currentAudio){try{_currentAudio.pause();}catch(e){}}
  }
}
function doNext(){
  if(S.step>=S.total){return say(L('\uD83C\uDF89 Demo complete!','\uD83C\uDF89 Demo completado!'),'success');}
  S.paused=false;$('sfPause').textContent='\u23F8\uFE0F';S.step++;upP();return runStep(S.step);
}
function doPrev(){if(S.step<=1)return Promise.resolve();S.step=Math.max(0,S.step-2);return doNext();}
function doAuto(){
  if(S.playing){S.playing=false;$('sfAuto').textContent='\u25B6\uFE0F Auto';return Promise.resolve();}
  S.playing=true;S.paused=false;$('sfAuto').textContent='\u23F9\uFE0F Stop';
  function lp(){
    if(!S.playing||S.step>=S.total){S.playing=false;$('sfAuto').textContent='\u25B6\uFE0F Auto';return Promise.resolve();}
    return doNext().then(function(){
      // doNext returns the step's Promise chain which already includes sayW waits
      // Just add a 2-second gap between steps
      if(S.playing)return sl(2000).then(lp);
    });
  }
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

/* ===== 35 STEPS - NAVIGATE FIRST, EXPLAIN WHILE SEEING ===== */

function s1(){
  return sayW(L(
    "👋 <b>Thank you for choosing Trade Master CRM</b> to manage your company and take it to the next level! My name is <b>Danielle</b>, and I'm going to personally walk you through every single feature of this CRM. I'll show you exactly what each section does, why it matters for your business, and how to use it. By the end, you'll know how to run your entire company from one place. Let's get started!",
    "👋 <b>¡Gracias por elegir Trade Master CRM</b> para administrar tu empresa y llevarla al siguiente nivel! Mi nombre es <b>Brenda</b>, y te voy a enseñar personalmente cada función de este CRM. Te voy a mostrar exactamente qué hace cada sección, por qué es importante para tu negocio, y cómo usarla. Al final, vas a saber cómo manejar toda tu empresa desde un solo lugar. ¡Empecemos!"
  ),'info');
}

function s2(){
  smoothShow('dashboard');
  return sayW(L(
    "📍 This is your <b>Dashboard</b> — think of it as your business command center. Every morning when you open the CRM, this is the first thing you see. It shows you today's scheduled jobs, how much revenue you've made this week, which technicians are out in the field, and any urgent items that need your attention. See the KPI cards at the top? Those are your key numbers. Below that you have the map, recent activity, and quick action buttons. Everything updates in real-time. Now let's fill it with data!",
    "📍 Este es tu <b>Tablero</b> — piensa en él como tu centro de comando. Cada mañana cuando abras el CRM, esto es lo primero que ves. Te muestra los trabajos programados de hoy, cuánto ingreso has generado esta semana, qué técnicos están en campo, y cualquier cosa urgente. ¿Ves las tarjetas KPI arriba? Esos son tus números clave. Abajo tienes el mapa, actividad reciente y botones de acción rápida. Todo se actualiza en tiempo real. ¡Ahora vamos a llenarlo con datos!"
  ),'nav');
}

function s3(){
  smoothShow('clients');
  return sayW(L(
    "📍 This is the <b>Customers</b> section — your client database. Every person or business you serve gets stored here with their name, phone, email, address, property type, and notes. You can search, filter, and sort your entire customer list. See that <b>orange button</b> at the top that says <b>'+ New Customer'</b>? That's how you add a new client. Let me click it and show you how easy it is to fill in the form.",
    "📍 Esta es la sección de <b>Clientes</b> — tu base de datos de clientes. Cada persona o negocio que atiendes se guarda aquí con nombre, teléfono, email, dirección, tipo de propiedad y notas. Puedes buscar, filtrar y ordenar toda tu lista. ¿Ves ese <b>botón naranja</b> arriba que dice <b>'+ Nuevo Cliente'</b>? Así agregas un cliente nuevo. Déjame hacerle click y mostrarte qué fácil es llenar el formulario."
  ),'nav').then(ck).then(function(){
    var btn=$q('#clients-section [onclick*="showClientForm()"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);});
}

function s4(){
  return sayW(L(
    "✏️ The form is open. Our first client is <b>María García</b>, a residential customer in Fontana whose AC isn't cooling. Watch how I fill each field...",
    "✏️ El formulario está abierto. Nuestra primera cliente es <b>María García</b>, una cliente residencial en Fontana cuyo AC no enfría. Mira cómo lleno cada campo..."
  ),'action').then(ck).then(function(){
    return ty($('clientName'),'María García');
  }).then(function(){return sl(SD);
  }).then(ck).then(function(){
    return sayW(L("📞 The <b>phone number</b> is how the system sends appointment reminders and tracking links to customers.","📞 El <b>teléfono</b> es como el sistema envía recordatorios de citas y links de rastreo a clientes."),'action');
  }).then(function(){return ty($('clientPhone'),'(909) 555-1234');
  }).then(function(){return ty($('clientEmail'),'maria.garcia@email.com');
  }).then(function(){
    return sayW(L("🏠 I select <b>Residential</b> — pricing and service differ for homes vs commercial buildings.","🏠 Selecciono <b>Residencial</b> — los precios y servicio son diferentes para casas vs edificios comerciales."),'action');
  }).then(function(){sv($('clientPropertyType'),'Residencial');
    return ty($('clientAddress'),'456 Oak St, Fontana, CA 92335');
  }).then(function(){
    return ty($('clientNotes'),L('AC not cooling - Goodman 15 years. Gate code #1234.','AC no enfría - Goodman 15 años. Código de reja #1234.'));
  }).then(function(){return sl(SD);
  }).then(ck).then(function(){
    return sayW(L("💾 Everything filled in. I click <b>Save</b>...","💾 Todo lleno. Hago click en <b>Guardar</b>..."),'action');
  }).then(function(){
    $('clientForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>María García</b> saved! See her in the list? You can edit her anytime, add notes, or view her complete history. Let's add a commercial client now.","✅ ¡<b>María García</b> guardada! ¿La ves en la lista? Puedes editarla cuando quieras, agregar notas o ver su historial completo. Ahora agreguemos un cliente comercial."),'success');
  });
}

function s5(){
  return sayW(L(
    "⚡ Same process for a <b>commercial client</b> — a restaurant called <b>La Michoacana</b>. For commercial clients, you also enter the business name and select <b>Commercial</b> as property type.",
    "⚡ Mismo proceso para un <b>cliente comercial</b> — un restaurante llamado <b>La Michoacana</b>. Para clientes comerciales, también pones el nombre del negocio y seleccionas <b>Comercial</b>."
  ),'info').then(ck).then(function(){
    var btn=$q('#clients-section [onclick*="showClientForm()"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('clientName'),'Roberto Méndez');
  }).then(function(){var c=$('clientCompany');return c?ty(c,'La Michoacana Restaurant'):Promise.resolve();
  }).then(function(){return ty($('clientPhone'),'(909) 555-5678');
  }).then(function(){return ty($('clientEmail'),'lamichoacana@email.com');
  }).then(function(){sv($('clientPropertyType'),'Comercial');return ty($('clientAddress'),'2890 Highland Ave, San Bernardino, CA');
  }).then(function(){return ty($('clientNotes'),L('Walk-in cooler not holding temp. Open 7am-10pm.','Walk-in cooler no mantiene temp. Abre 7am-10pm.'));
  }).then(function(){return sl(SD);
  }).then(function(){$('clientForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>2 clients</b> — residential and commercial. Your customer database grows with every new client. You can search by name, phone, or filter by property type!","✅ <b>2 clientes</b> — residencial y comercial. Tu base de datos crece con cada nuevo cliente. ¡Puedes buscar por nombre, teléfono, o filtrar por tipo de propiedad!"),'success');
  });
}

function s6(){
  smoothShow('leads');
  return sayW(L(
    "📍 This is <b>Leads</b>. A lead is different from a customer — it's someone who called asking for a quote but hasn't hired you yet. Every customer starts as a lead. This section helps you track those opportunities so you never forget to follow up. Let me add one — <b>Roberto Sánchez</b> wants a $4,500 furnace installed.",
    "📍 Estos son <b>Prospectos</b>. Un prospecto es diferente de un cliente — es alguien que llamó pidiendo cotización pero aún no te contrata. Cada cliente empieza como prospecto. Esta sección te ayuda a rastrear oportunidades para que nunca olvides dar seguimiento. Déjame agregar uno — <b>Roberto Sánchez</b> quiere un furnace de $4,500 instalado."
  ),'nav').then(ck).then(function(){
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
    return sayW(L("✅ Lead saved! 🔥 See him on the map? When Roberto signs the contract, you convert him to a customer with <b>one click</b> — all his info transfers automatically!","✅ ¡Prospecto guardado! 🔥 ¿Lo ves en el mapa? Cuando Roberto firme, lo conviertes a cliente con <b>un click</b> — ¡toda su info se transfiere automáticamente!"),'success');
  });
}

function s7(){
  smoothShow('pipeline');
  return sayW(L(
    "📍 This is the <b>Sales Pipeline</b> — one of the most powerful features. See the columns? <b>New Lead, Contacted, Quoted, Negotiating, Won, and Lost</b>. You drag and drop deals between columns as they progress. At a glance you know: how many deals are open, your total pipeline value, and your closing rate. This is how professional HVAC companies track their sales!",
    "📍 Este es el <b>Flujo de Ventas</b> — una de las funciones más poderosas. ¿Ves las columnas? <b>Nuevo, Contactado, Cotizado, Negociando, Ganado y Perdido</b>. Arrastras y sueltas los tratos entre columnas conforme avanzan. De un vistazo sabes: cuántos tratos tienes, el valor total, y tu tasa de cierre. ¡Así es como las empresas profesionales de HVAC rastrean sus ventas!"
  ),'nav');
}

function s8(){
  smoothShow('technicians');
  return sayW(L(
    "📍 This is <b>Technicians</b> — your field team. Each tech you register here gets their own <b>mobile login</b> to see jobs on their phone, plus <b>GPS tracking</b> so you always know where your vans are. Let me add one — I'll click <b>'+ New Technician'</b>.",
    "📍 Estos son los <b>Técnicos</b> — tu equipo de campo. Cada técnico que registras aquí recibe su propio <b>acceso móvil</b> para ver trabajos en su celular, más <b>rastreo GPS</b> para que siempre sepas dónde están tus camionetas. Déjame agregar uno — voy a hacer click en <b>'+ Nuevo Técnico'</b>."
  ),'nav').then(ck).then(function(){
    var btn=$q('#technicians-section [onclick*="showTechFormInTechSection"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(ck).then(function(){
    return sayW(L("✏️ Adding <b>Carlos Mendoza</b> — HVAC specialist, $35/hr, drives a 2023 Ford Transit. His vehicle info connects to GPS tracking.","✏️ Agregando a <b>Carlos Mendoza</b> — especialista HVAC, $35/hr, maneja una 2023 Ford Transit. La info del vehículo se conecta al rastreo GPS."),'action');
  }).then(function(){return ty($('techNameAlt'),'Carlos Mendoza');
  }).then(function(){return ty($('techPhoneAlt'),'(909) 555-3456');
  }).then(function(){return ty($('techEmailAlt'),'carlos@rodriguezhvac.com');
  }).then(function(){sv($('techSpecialtyAlt'),'HVAC');var cb=$('techCreateLoginAlt');if(cb)cb.checked=false;return sl(300);
  }).then(function(){var v=$('techVehicleAlt');return v?ty(v,'2023 Ford Transit'):Promise.resolve();
  }).then(function(){var p=$('techPlateAlt');return p?ty(p,'8ABC123'):Promise.resolve();
  }).then(function(){var f=$q('#techFormContainerAlt form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>Carlos Mendoza</b> registered! He'll show up on the dispatch map, receive job notifications on his phone, and customers can track his arrival — like Uber for HVAC!","✅ ¡<b>Carlos Mendoza</b> registrado! Aparecerá en el mapa, recibirá notificaciones en su celular, y los clientes pueden rastrear su llegada — ¡como Uber para HVAC!"),'success');
  });
}

function s9(){
  return sayW(L("⚡ Adding second technician — <b>Miguel Ángel Torres</b>, <b>Commercial Refrigeration</b> specialist.","⚡ Agregando segundo técnico — <b>Miguel Ángel Torres</b>, especialista en <b>Refrigeración Comercial</b>."),'action'
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
    return sayW(L("✅ <b>2 technicians</b> registered with vehicles and GPS! They can see their daily schedule on their phones and clock in from the field.","✅ ¡<b>2 técnicos</b> registrados con vehículos y GPS! Pueden ver su horario diario en su celular y registrar entrada desde el campo."),'success');
  });
}

function s10(){
  smoothShow('advisors');
  return sayW(L(
    "📍 This is <b>Home Advisors</b> — your sales team. These are the people who visit homes, present quotes, and close deals on installations. The CRM tracks their sales, calculates commissions automatically, and shows performance against their monthly goal. Let me add <b>Diana Castillo</b>.",
    "📍 Estos son los <b>Asesores del Hogar</b> — tu equipo de ventas. Son quienes visitan casas, presentan cotizaciones y cierran tratos. El CRM rastrea sus ventas, calcula comisiones automáticamente, y muestra desempeño contra su meta mensual. Déjame agregar a <b>Diana Castillo</b>."
  ),'nav').then(ck).then(function(){
    var btn=$q('#advisors-section [onclick*="showAdvisorForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('advisorName'),'Diana Castillo');
  }).then(function(){return ty($('advisorPhone'),'(909) 555-2345');
  }).then(function(){return ty($('advisorEmail'),'diana@rodriguezhvac.com');
  }).then(function(){sv($('advisorSpecialty'),'Residencial y Comercial');return ty($('advisorZone'),'Inland Empire');
  }).then(function(){var g=$('advisorGoal');return g?ty(g,'50000'):Promise.resolve();
  }).then(function(){$('advisorForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>Diana Castillo</b> — $50K/month goal, 5%-20% commissions tracked automatically. She can log in and see her own sales dashboard!","✅ <b>Diana Castillo</b> — meta $50K/mes, comisiones 5%-20% rastreadas automáticamente. ¡Ella puede iniciar sesión y ver su propio tablero de ventas!"),'success');
  });
}

function s11(){
  smoothShow('calendar');
  return sayW(L(
    "📍 This is the <b>Calendar</b> — your scheduling hub. Every appointment, job, follow-up, and reminder shows up here. You can see your entire team's schedule: which technician is booked when, what time slots are open, and upcoming deadlines. Drag and drop to reschedule, set automatic reminders, and never miss an appointment again. This is your digital whiteboard!",
    "📍 Este es el <b>Calendario</b> — tu centro de horarios. Cada cita, trabajo, seguimiento y recordatorio aparece aquí. Puedes ver el horario de todo tu equipo: qué técnico está reservado cuándo, qué horarios están abiertos, y fechas próximas. Arrastra y suelta para re-agendar, pon recordatorios automáticos, y nunca pierdas una cita. ¡Esta es tu pizarra digital!"
  ),'nav');
}

function s12(){
  smoothShow('dispatch');
  return sayW(L(
    "📍 This is <b>Dispatch</b> — your command center! Here you create jobs, assign them to technicians, and track everything live on the map. Think of it like being an air traffic controller, but for HVAC vans. Let me create a real job and show you how it works. I'll click <b>'+ New Job'</b>.",
    "📍 Este es <b>Despacho</b> — ¡tu centro de control! Aquí creas trabajos, los asignas a técnicos, y rastreas todo en vivo en el mapa. Piénsalo como ser un controlador de tráfico aéreo, pero para camionetas de HVAC. Déjame crear un trabajo real. Voy a hacer click en <b>'+ Nuevo Trabajo'</b>."
  ),'nav').then(ck).then(function(){
    var btn=$q('#dispatch-section [onclick*="showJobForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(ck).then(function(){
    return sayW(L("✏️ Sending Carlos to fix María's AC — <b>$850 repair</b>. I set the priority, address, and assign the technician.","✏️ Enviando a Carlos a arreglar el AC de María — <b>reparación de $850</b>. Pongo la prioridad, dirección y asigno al técnico."),'action');
  }).then(function(){return ty($('jobTitle'),'AC Repair - Goodman not cooling');
  }).then(function(){sv($('jobServiceType'),'Reparación');sv($('jobPriority'),'high');return ty($('jobAddress'),'456 Oak St, Fontana, CA');
  }).then(function(){var d=$('jobDate');if(d)d.value=new Date().toISOString().split('T')[0];var la=$('jobLat'),ln=$('jobLng');if(la)la.value='34.09';if(ln)ln.value='-117.43';var ts=$('jobTechId');if(ts&&window.techsData&&techsData[0])sv(ts,techsData[0].id);return ty($('jobNotes'),L('Capacitor and contactor. $850','Capacitor y contactor. $850'));
  }).then(function(){$('jobForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ Job assigned to <b>Carlos</b>! He gets a phone notification with address and details. María gets a <b>tracking link</b> to see when Carlos arrives — like Uber for HVAC!","✅ ¡Trabajo asignado a <b>Carlos</b>! Recibe notificación con dirección y detalles. María recibe un <b>link de rastreo</b> para ver cuándo llega Carlos — ¡como Uber para HVAC!"),'success');
  });
}

function s13(){
  return sayW(L("⚡ Second job — <b>URGENT!</b> La Michoacana's walk-in cooler is failing. Food is at risk. Dispatching Miguel immediately with <b>Urgent</b> priority.","⚡ Segundo trabajo — <b>¡URGENTE!</b> El walk-in cooler de La Michoacana está fallando. La comida está en riesgo. Despachando a Miguel inmediatamente con prioridad <b>Urgente</b>."),'action'
  ).then(ck).then(function(){
    var btn=$q('#dispatch-section [onclick*="showJobForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('jobTitle'),'Walk-in Cooler - Compressor');
  }).then(function(){sv($('jobServiceType'),'Reparación');sv($('jobPriority'),'urgent');return ty($('jobAddress'),'2890 Highland Ave, SB, CA');
  }).then(function(){var d=$('jobDate');if(d)d.value=new Date().toISOString().split('T')[0];var la=$('jobLat'),ln=$('jobLng');if(la)la.value='34.12';if(ln)ln.value='-117.29';var ts=$('jobTechId');if(ts&&window.techsData&&techsData[1])sv(ts,techsData[1].id);return ty($('jobNotes'),L('Urgent. Cooler 55°F. Food risk. $2,200','Urgente. Cooler 55°F. Comida en riesgo. $2,200'));
  }).then(function(){$('jobForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>2 jobs dispatched</b> — <b>$3,050 in revenue!</b> Carlos → Fontana, Miguel → San Bernardino. Both tracked live on the map.","✅ <b>2 trabajos despachados</b> — <b>¡$3,050 en ingresos!</b> Carlos → Fontana, Miguel → San Bernardino. Ambos rastreados en vivo."),'success');
  });
}

function s14(){
  smoothShow('servicecalls');
  return sayW(L(
    "📍 This is <b>Service Calls</b>. When a customer calls your office with an emergency — phone ringing, they're stressed, AC is out at 110 degrees — your receptionist logs the call here <b>fast</b>. Name, phone, address, problem, urgency. Logged and dispatched in under a minute. Let me show you...",
    "📍 Estas son las <b>Llamadas de Servicio</b>. Cuando un cliente llama con emergencia — teléfono sonando, están estresados, AC apagado a 43 grados — tu recepcionista registra la llamada aquí <b>rápido</b>. Nombre, teléfono, dirección, problema, urgencia. Registrada y despachada en menos de un minuto. Déjame mostrarte..."
  ),'nav').then(ck).then(function(){
    var btn=$q('#servicecalls-section [onclick*="showServiceCallForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('scClientName'),'María García');
  }).then(function(){return ty($('scClientPhone'),'(909) 555-1234');
  }).then(function(){return ty($('scAddress'),'456 Oak St, Fontana, CA');
  }).then(function(){return ty($('scProblem'),L('AC not cooling. Pet in house. Urgent.','AC no enfría. Mascota en casa. Urgente.'));
  }).then(function(){sv($('scUrgency'),'emergency');sv($('scPropertyType'),'residential');var pd=$('scPreferredDate');if(pd)pd.value=new Date().toISOString().split('T')[0];if(window.techsData&&techsData[0]){var st=$('scTechAssign');if(st)sv(st,techsData[0].id);}return ty($('scNotes'),'Gate #1234.');
  }).then(function(){$('serviceCallForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b style='color:#ef4444'>🔴 EMERGENCY</b> logged and dispatched! Tech gets an immediate alert. Every call is timestamped for your records — this protects your business legally too!","✅ ¡<b style='color:#ef4444'>🔴 EMERGENCIA</b> registrada y despachada! El técnico recibe alerta inmediata. Cada llamada queda con fecha y hora — ¡esto también protege tu negocio legalmente!"),'success');
  });
}

function s15(){
  smoothShow('dispatch');
  return sayW(L(
    "📍 Back to <b>Dispatch</b> — look at the <b>GPS tracking map</b>! You can see exactly where each technician is in real-time. Carlos heading to Fontana, Miguel to San Bernardino. You can re-assign jobs, check arrival times, and send customers a tracking link. No more 'he'll be there between 8 and 12' — your customers know the <b>exact arrival time</b>!",
    "📍 De vuelta en <b>Despacho</b> — ¡mira el <b>mapa de rastreo GPS</b>! Puedes ver exactamente dónde está cada técnico en tiempo real. Carlos camino a Fontana, Miguel a San Bernardino. Puedes re-asignar trabajos, checar tiempos de llegada, y enviar al cliente un link de rastreo. No más 'llega entre 8 y 12' — ¡tus clientes saben la <b>hora exacta</b> de llegada!"
  ),'nav');
}

function s16(){
  smoothShow('jobs');
  return sayW(L(
    "📍 This is <b>Jobs</b> — your master list of ALL work orders. Dispatch creates and assigns jobs; this section lets you view and manage them all. Filter by status — pending, in progress, completed — and see the revenue each job brings in. Export to PDF for records or insurance claims. It's your complete work history!",
    "📍 Estos son los <b>Trabajos</b> — tu lista maestra de TODAS las órdenes. Despacho crea y asigna trabajos; esta sección te permite verlos y administrarlos. Filtra por estatus — pendiente, en progreso, completado — y ve el ingreso de cada trabajo. Exporta a PDF para archivos o reclamos de seguro. ¡Es tu historial completo!"
  ),'nav');
}

function s17(){
  smoothShow('invoices');
  return sayW(L(
    "📍 Time to get <b>paid</b>! This is <b>Invoices</b> — create professional invoices with your company logo, line items, and terms. Email them to customers or print as PDF. Let me create one for María's AC repair: Service Call $120, Capacitor $85, Contactor $65, Labor $250. Total: <b>$520</b>.",
    "📍 ¡Hora de <b>cobrar</b>! Estas son las <b>Facturas</b> — crea facturas profesionales con tu logo, líneas de detalle y términos. Envíalas por email o imprime como PDF. Déjame crear una para la reparación de María: Visita $120, Capacitor $85, Contactor $65, Mano de obra $250. Total: <b>$520</b>."
  ),'nav').then(ck).then(function(){
    var inv={id:'inv1',company_id:'demo-co',invoice_number:'INV-202602-0001',client_name:'María García',client_email:'maria.garcia@email.com',client_phone:'(909) 555-1234',client_address:'456 Oak St, Fontana',line_items:[{name:'Service Call',qty:1,unit_price:120,labor:0,total:120},{name:'Capacitor 45/5',qty:1,unit_price:85,labor:0,total:85},{name:'Contactor 2P',qty:1,unit_price:65,labor:0,total:65},{name:'Labor',qty:2,unit_price:0,labor:125,total:250}],subtotal:520,total:520,balance_due:520,amount_paid:0,status:'draft',created_at:new Date().toISOString()};
    _db.invoices.push(inv);window.invoicesData=[inv];renderInvoiceKPIs();renderInvoicesTable();
    return sayW(L("✅ <b>Invoice INV-0001</b> created for <b>$520</b>! One click to email it to María, or print as PDF. The CRM tracks every dollar.","✅ <b>Factura INV-0001</b> creada por <b>$520</b>! Un click para enviarla a María por email, o imprimir como PDF. El CRM rastrea cada dólar."),'success');
  });
}

function s18(){
  return sayW(L("⚡ María just paid! Marking as <b>PAID</b>, and creating the restaurant's invoice — <b>$2,200</b> for the cooler repair.","⚡ ¡María pagó! Marcando como <b>PAGADA</b>, y creando la factura del restaurante — <b>$2,200</b> por la reparación del cooler."),'action'
  ).then(ck).then(function(){
    invoicesData[0].status='paid';invoicesData[0].amount_paid=520;invoicesData[0].balance_due=0;
    var inv2={id:'inv2',company_id:'demo-co',invoice_number:'INV-202602-0002',client_name:'La Michoacana',client_phone:'(909) 555-5678',client_email:'lm@email.com',client_address:'2890 Highland, SB',line_items:[{name:'Cooler Repair',qty:1,unit_price:1800,labor:400,total:2200}],subtotal:2200,total:2200,balance_due:2200,amount_paid:0,status:'sent',created_at:new Date().toISOString()};
    _db.invoices.push(inv2);invoicesData.push(inv2);renderInvoiceKPIs();renderInvoicesTable();
    return sayW(L("✅ See the KPI cards? INV-0001 is green — <b>PAID $520</b>. INV-0002 is yellow — <b>PENDING $2,200</b>. You always know how much is coming in and how much is outstanding.","✅ ¿Ves las tarjetas? INV-0001 está en verde — <b>PAGADA $520</b>. INV-0002 está en amarillo — <b>PENDIENTE $2,200</b>. Siempre sabes cuánto entra y cuánto falta."),'success');
  });
}

function s19(){
  smoothShow('collections');
  return sayW(L(
    "📍 This is <b>Collections</b>. When invoices go past due — 30, 60, 90 days — this section shows who owes you and for how long. Send automatic payment reminders with one click. No more chasing people for money — the CRM does it for you. This is how you protect your cash flow!",
    "📍 Esta es <b>Cobranza</b>. Cuando las facturas se vencen — 30, 60, 90 días — esta sección muestra quién te debe y desde cuándo. Envía recordatorios de pago automáticos con un click. No más perseguir gente por dinero — ¡el CRM lo hace por ti! ¡Así proteges tu flujo de efectivo!"
  ),'nav');
}

function s20(){
  smoothShow('receipts');
  return sayW(L(
    "📍 This is <b>Receipts</b>. When a customer pays — cash, check, Zelle, Venmo, or card — you record it here. This gives you a paper trail for tax season and helps reconcile with your bank statements. Every payment documented with date, amount, method, and who paid. Your accountant will love you!",
    "📍 Estos son los <b>Recibos</b>. Cuando un cliente paga — efectivo, cheque, Zelle, Venmo o tarjeta — lo registras aquí. Esto te da un rastro de papel para impuestos y ayuda a conciliar con tus estados de cuenta. Cada pago documentado con fecha, monto, método y quién pagó. ¡Tu contador te va a amar!"
  ),'nav');
}

function s21(){
  smoothShow('expenses');
  return sayW(L(
    "📍 This is <b>Business Expenses</b>. Gas, insurance, tools, vehicle payments, CRM subscription — everything you spend goes here so you see your true profit. Let me add some real expenses...",
    "📍 Estos son los <b>Gastos del Negocio</b>. Gasolina, seguro, herramientas, pagos de vehículo, suscripción CRM — todo lo que gastas va aquí para ver tu ganancia real. Déjame agregar algunos gastos reales..."
  ),'nav').then(ck).then(function(){
    var btn=$q('#expenses-section [onclick*="showExpenseForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){sv($('expCategory'),'vehicle_gas');return ty($('expVendor'),'Chevron');
  }).then(function(){return ty($('expAmount'),'287.50');
  }).then(function(){sv($('expFrequency'),'monthly');sv($('expType'),'variable');$('expDate').value=new Date().toISOString().split('T')[0];return sl(SD);
  }).then(function(){var f=$q('#expenses-section form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(1500);
  }).then(ck).then(function(){
    [{category:'general_liability',vendor:'State Farm',amount:450,type:'fixed'},{category:'software_crm',vendor:'Trade Master CRM',amount:149.99,type:'fixed'},{category:'vehicle_payment',vendor:'Ford Motor Credit',amount:650,type:'fixed'}]
    .forEach(function(e){e.id='exp'+(++_idc);e.company_id='demo-co';e.frequency='monthly';e.date=new Date().toISOString().split('T')[0];e.created_at=new Date().toISOString();_db.expenses.push(e);expensesData.push(e);});
    renderExpenses();
    return sayW(L("✅ <b>4 expenses</b> tracked: Gas $287, Insurance $450, CRM $150, Vehicle $650 = <b>$1,537/month</b>. The CRM separates fixed vs variable costs — essential for knowing your true profit margin!","✅ <b>4 gastos</b>: Gas $287, Seguro $450, CRM $150, Vehículo $650 = <b>$1,537/mes</b>. El CRM separa costos fijos vs variables — ¡esencial para saber tu margen real!"),'success');
  });
}

function s22(){
  smoothShow('mymoney');
  return sayW(L(
    "📍 This is <b>My Money</b> — the financial overview every business owner dreams about. See the chart? Income on one side, expenses on the other, and your <b>net profit</b> right in the middle. All the data comes from the invoices and expenses you just entered — it's all connected! This is the health of your business in one screen.",
    "📍 Este es <b>Mi Dinero</b> — la vista financiera que todo dueño de negocio sueña. ¿Ves la gráfica? Ingresos de un lado, gastos del otro, y tu <b>ganancia neta</b> justo en medio. Todos los datos vienen de las facturas y gastos que acabas de ingresar — ¡todo está conectado! Esta es la salud de tu negocio en una pantalla."
  ),'nav');
}

function s23(){
  smoothShow('payroll');
  return sayW(L(
    "📍 This is <b>Payroll</b> — probably the most important section for your team. The CRM calculates everything: <b>hours worked times hourly rate</b> for technicians, and <b>commission percentages</b> for advisors. No more spreadsheets! Let me load the data...",
    "📍 Esta es la <b>Nómina</b> — probablemente la sección más importante para tu equipo. El CRM calcula todo: <b>horas trabajadas por tarifa</b> para técnicos, y <b>porcentajes de comisión</b> para asesores. ¡No más hojas de cálculo! Déjame cargar los datos..."
  ),'nav').then(ck).then(function(){
    var e=[
      {id:'py1',company_id:'demo-co',tech_name:techsData[0]?techsData[0].name:'Carlos Mendoza',type:'hourly',hours:42,rate:35,total:1470,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()},
      {id:'py2',company_id:'demo-co',tech_name:techsData[1]?techsData[1].name:'Miguel Torres',type:'hourly',hours:38,rate:30,total:1140,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()},
      {id:'py3',company_id:'demo-co',tech_name:advisorsData&&advisorsData[0]?advisorsData[0].name:'Diana Castillo',type:'commission',hours:0,rate:0,total:457.50,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()}];
    e.forEach(function(x){_db.payroll_entries.push(x);});window.payrollData=e;renderPayroll();
    return sayW(L("✅ See the table? Carlos: 42hrs × $35 = <b>$1,470</b>. Miguel: 38hrs × $30 = <b>$1,140</b>. Diana: <b>$457</b> commission. Total: <b>$3,067</b>. All calculated automatically!","✅ ¿Ves la tabla? Carlos: 42hrs × $35 = <b>$1,470</b>. Miguel: 38hrs × $30 = <b>$1,140</b>. Diana: <b>$457</b> comisión. Total: <b>$3,067</b>. ¡Todo calculado automáticamente!"),'success');
  });
}

function s24(){
  return sayW(L(
    "⚡ And here's a game-changer — export payroll directly to <b>QuickBooks, ADP, or Gusto</b> with one click. No double-entry, no copying numbers. The CRM talks to your payroll provider. This saves hours every pay period!",
    "⚡ Y aquí está algo que cambia el juego — exporta la nómina directo a <b>QuickBooks, ADP o Gusto</b> con un click. Sin doble captura, sin copiar números. ¡El CRM habla con tu proveedor de nómina! ¡Esto ahorra horas cada período de pago!"
  ),'success');
}

function s25(){
  smoothShow('inbox');
  return sayW(L(
    "📍 This is your <b>Inbox</b> — your notification center. Every important event shows up here: new leads, completed jobs, overdue invoices, team updates. Think of it as your business news feed — you'll never miss anything important. Read, archive, or take action instantly!",
    "📍 Esta es tu <b>Bandeja</b> — tu centro de notificaciones. Cada evento importante aparece aquí: nuevos prospectos, trabajos completados, facturas vencidas, actualizaciones. Es como tu feed de noticias del negocio — nunca te pierdes de nada. ¡Lee, archiva o toma acción al instante!"
  ),'nav');
}

function s26(){
  smoothShow('mailbox');
  return sayW(L(
    "📍 This is <b>Business Mail</b> — send and receive professional emails right from the CRM. No need to switch to Gmail or Outlook. Email quotes, send follow-ups, and create thank-you templates. Everything stays connected to the right customer record!",
    "📍 Este es el <b>Correo del Negocio</b> — envía y recibe emails profesionales directo desde el CRM. Sin cambiar a Gmail u Outlook. Envía cotizaciones, seguimientos y plantillas de agradecimiento. ¡Todo queda conectado al registro del cliente correcto!"
  ),'nav');
}

function s27(){
  smoothShow('marketing');
  return sayW(L(
    "📍 This is <b>Marketing</b> — grow your business! Create campaigns for Google Ads, Facebook, Yelp, and more. The CRM tracks which campaigns bring the most customers so you know exactly where to spend. Let me create a real campaign...",
    "📍 Esta es <b>Mercadotecnia</b> — ¡haz crecer tu negocio! Crea campañas para Google Ads, Facebook, Yelp y más. El CRM rastrea qué campañas traen más clientes para que sepas dónde gastar. Déjame crear una campaña real..."
  ),'nav').then(ck).then(function(){
    var btn=$q('#marketing-section [onclick*="showCampaignForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('campName'),'Promo Summer - AC Tune-Up $79');
  }).then(function(){sv($('campType'),'google_ads');return ty($('campBudget'),'1500');
  }).then(function(){var cs=$('campStart'),ce=$('campEnd');if(cs)cs.value=new Date().toISOString().split('T')[0];if(ce){var d=new Date();d.setDate(d.getDate()+60);ce.value=d.toISOString().split('T')[0];}return ty($('campMessage'),'AC Tune-Up $79. Rodriguez HVAC. (909) 555-0000');
  }).then(function(){var f=$q('#marketing-section form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ Campaign active! $1,500 for 60 days. The CRM tracks every lead from this ad — calls, jobs, and <b>return on investment</b>. $1,500 in ads → $15,000 in jobs = 10x ROI!","✅ ¡Campaña activa! $1,500 por 60 días. El CRM rastrea cada prospecto de este anuncio — llamadas, trabajos y <b>retorno de inversión</b>. $1,500 en anuncios → $15,000 en trabajos = ¡10x ROI!"),'success');
  });
}

function s28(){
  smoothShow('pricebook');
  return sayW(L(
    "📍 This is the <b>Price Book</b> — your product catalog with <b>cost</b> and <b>selling price</b> side by side. When creating invoices, prices come from here so everything is consistent. Let me load 10 common HVAC items...",
    "📍 Esta es la <b>Lista de Precios</b> — tu catálogo con <b>costo</b> y <b>precio de venta</b> lado a lado. Al crear facturas, los precios vienen de aquí para que todo sea consistente. Déjame cargar 10 artículos comunes de HVAC..."
  ),'nav').then(ck).then(function(){
    [{name:'Capacitor 45/5 MFD',sku:'CAP-455',category:'ac_parts',unit:'each',cost:12,price:85},{name:'Contactor 2P 40A',sku:'CON-2P',category:'ac_parts',unit:'each',cost:8,price:65},{name:'Motor Fan 1/4 HP',sku:'MTR-025',category:'motors',unit:'each',cost:45,price:195},{name:'R-410A per lb',sku:'REF-410',category:'refrigerants',unit:'lb',cost:15,price:85},{name:'Thermostat Honeywell',sku:'TSTAT',category:'controls',unit:'each',cost:35,price:175},{name:'Filter 16x25x1',sku:'FLT-162',category:'filters',unit:'each',cost:4,price:25},{name:'Service Call 0-10mi',sku:'SC-010',category:'labor',unit:'flat',cost:0,price:70},{name:'Service Call 10-20mi',sku:'SC-1020',category:'labor',unit:'flat',cost:0,price:120},{name:'Labor per Hour',sku:'LAB-HR',category:'labor',unit:'hour',cost:0,price:125},{name:'AC Tune-Up 21pts',sku:'TUNE-21',category:'labor',unit:'flat',cost:0,price:79}]
    .forEach(function(it){it.id='pb'+(++_idc);it.company_id='demo-co';_db.price_book.push(it);});
    window.priceBookData=_db.price_book.slice();renderPriceBook();
    return sayW(L("✅ <b>10 items</b> loaded! Look at those margins — Capacitor costs $12, sells for $85 — <b>608% markup</b>! R-410A costs $15, sells for $85 — <b>467%</b>! The Price Book ensures every tech charges the right price.","✅ ¡<b>10 artículos</b>! Mira esos márgenes — Capacitor cuesta $12, se vende a $85 — <b>608% markup</b>! R-410A cuesta $15, se vende a $85 — <b>467%</b>! La Lista de Precios asegura que cada técnico cobre bien."),'success');
  });
}

function s29(){
  smoothShow('reports');
  return sayW(L(
    "📍 This is <b>Reports</b> — the big picture in charts and graphs. Revenue by month, jobs per technician, lead sources, team productivity, profit margins. Export any report to <b>PDF</b> to share with your accountant, partner, or bank. Data-driven decisions make your business grow faster!",
    "📍 Estos son los <b>Reportes</b> — la foto completa en gráficas. Ingresos por mes, trabajos por técnico, fuentes de prospectos, productividad, márgenes. Exporta cualquier reporte a <b>PDF</b> para tu contador, socio o banco. ¡Las decisiones basadas en datos hacen crecer tu negocio más rápido!"
  ),'nav');
}

function s30(){
  smoothShow('team');
  return sayW(L(
    "📍 This is <b>Users and Team</b> — control who has CRM access and what they can do. Admin sees everything, Dispatcher sees jobs and techs, Technician sees only their assignments. Your sensitive financial data stays protected. Add or remove access anytime!",
    "📍 Estos son <b>Usuarios y Equipo</b> — controla quién tiene acceso al CRM y qué puede hacer. Admin ve todo, Despachador ve trabajos y técnicos, Técnico solo ve sus asignaciones. Tu info financiera se mantiene protegida. ¡Agrega o quita acceso cuando quieras!"
  ),'nav');
}

function s31(){
  smoothShow('hr');
  return sayW(L(
    "📍 This is <b>Human Resources</b> — employee contracts, certifications, expiration dates, performance reviews, W-4s and I-9s. When an EPA certification is about to expire, you get a notification. No more compliance surprises! All documents in one secure place — goodbye paper files!",
    "📍 Estos son <b>Recursos Humanos</b> — contratos, certificaciones, fechas de vencimiento, evaluaciones, W-4 e I-9. Cuando una certificación EPA esté por vencer, recibes notificación. ¡No más sorpresas de cumplimiento! Todos los documentos en un lugar seguro — ¡adiós archivos de papel!"
  ),'nav');
}

function s32(){
  smoothShow('settings');
  return sayW(L(
    "📍 This is <b>Settings</b> — configure your company profile: business name, contractor license, insurance bond, owner info, and logo. All this info automatically appears on invoices, contracts, and emails. Set it up once and it flows through the entire CRM — everything looks polished and professional!",
    "📍 Esta es <b>Configuración</b> — configura tu perfil: nombre, licencia de contratista, fianza, info del dueño y logo. Toda esta info aparece automáticamente en facturas, contratos y emails. ¡Configúralo una vez y fluye por todo el CRM — todo se ve pulido y profesional!"
  ),'nav');
}

function s33(){
  smoothShow('dashboard');
  return sayW(L(
    "📍 Look at the <b>Dashboard</b> now compared to when we started! It's full of real data — active jobs, revenue numbers, team locations, recent activity. This is what YOUR business will look like inside Trade Master CRM. From empty to fully running — customers, technicians, jobs, invoices, payroll, marketing — all connected!",
    "📍 ¡Mira el <b>Tablero</b> ahora comparado con cuando empezamos! Está lleno de datos reales — trabajos activos, ingresos, ubicaciones del equipo, actividad reciente. Así se verá TU negocio dentro de Trade Master CRM. De vacío a completamente operando — clientes, técnicos, trabajos, facturas, nómina, mercadotecnia — ¡todo conectado!"
  ),'nav');
}

function s34(){
  return sayW(L(
    "🎉 <b>DEMO COMPLETE!</b> In 35 steps we built an entire business:<br>👥 2 customers<br>🎯 1 lead ($4,500)<br>📈 Sales pipeline<br>👷 2 technicians with GPS<br>🏠 1 advisor<br>📅 Calendar<br>🔧 2 jobs ($3,050)<br>📞 1 emergency<br>🚐 Live GPS tracking<br>📄 2 invoices ($2,720)<br>💰 Collections & receipts<br>🏢 4 expenses ($1,537/mo)<br>💵 Financial overview<br>💳 Payroll ($3,067)<br>📬 Inbox & email<br>📣 Marketing campaign<br>📒 10 price book items<br>📊 Reports<br>👥 Team<br>🛡️ HR<br>⚙️ Settings",
    "🎉 <b>¡DEMO COMPLETADO!</b> En 35 pasos construimos un negocio completo:<br>👥 2 clientes<br>🎯 1 prospecto ($4,500)<br>📈 Flujo de ventas<br>👷 2 técnicos con GPS<br>🏠 1 asesora<br>📅 Calendario<br>🔧 2 trabajos ($3,050)<br>📞 1 emergencia<br>🚐 Rastreo GPS en vivo<br>📄 2 facturas ($2,720)<br>💰 Cobranza y recibos<br>🏢 4 gastos ($1,537/mes)<br>💵 Vista financiera<br>💳 Nómina ($3,067)<br>📬 Bandeja y correo<br>📣 Campaña marketing<br>📒 10 artículos precios<br>📊 Reportes<br>👥 Equipo<br>🛡️ RH<br>⚙️ Configuración"
  ),'success');
}

function s35(){
  return sayW(L(
    "🚀 <b>This is what Trade Master CRM can do for your business.</b> Everything you just saw — from the first customer to GPS tracking, invoicing, payroll, and marketing — all in one place, from any device. No more juggling 5 different apps. No more lost paperwork. No more forgotten follow-ups. Just one powerful CRM that runs your entire operation. Ready to take your company to the next level?",
    "🚀 <b>Esto es lo que Trade Master CRM puede hacer por tu negocio.</b> Todo lo que acabas de ver — desde el primer cliente hasta rastreo GPS, facturación, nómina y mercadotecnia — todo en un lugar, desde cualquier dispositivo. No más malabarismos con 5 apps. No más papeleo perdido. No más seguimientos olvidados. Solo un CRM poderoso que maneja toda tu operación. ¿Listo para llevar tu empresa al siguiente nivel?"
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
