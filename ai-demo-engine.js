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
var S={step:0,total:20,playing:false,paused:false,mini:false};

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
    s.innerHTML='<div class="ds-content"><div style="font-size:60px;margin-bottom:12px">\uD83D\uDD27</div><h1 style="font-size:2rem;font-weight:800;margin:0 0 6px;color:#fff">Trade Master CRM</h1><p style="color:#f97316;font-weight:600;margin:0 0 4px">Interactive AI Demo</p><p style="color:#94a3b8;font-size:.85rem;margin:0 0 24px">'+CO.name+'</p><p style="color:#cbd5e1;font-size:.9rem;line-height:1.7;margin:0 0 28px;max-width:440px">'+((window.currentLang||'es')==='en'?'Danielle will operate the <strong>entire CRM</strong> — creating clients, technicians, jobs, invoices and more. <strong>20 real steps</strong>.':'Brenda operar\u00E1 el <strong>CRM completo</strong> — crear\u00E1 clientes, t\u00E9cnicos, trabajos, facturas y m\u00E1s. <strong>20 pasos reales</strong>.')+'</p><button id="demoStartBtn" class="ds-btn">\u25B6\uFE0F Start Demo</button><br><button id="demoAutoBtn" style="margin-top:12px;padding:12px 36px;background:transparent;color:#f97316;border:2px solid #f97316;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer">\uD83D\uDD04 Auto Play Full Demo</button><p style="font-size:.75rem;color:#64748b;margin-top:12px">\u23F1 8-12 min</p></div>';
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
function s1(){
  say(L(
    "👋 Hi! I'm <b>Danielle</b>, your AI guide. I'll walk you through the entire CRM step by step. Let's start with the most important thing — <b>adding your first customer</b>.",
    "👋 ¡Hola! Soy <b>Brenda</b>, tu guía AI. Te voy a enseñar todo el CRM paso a paso. Empecemos con lo más importante — <b>agregar tu primer cliente</b>."
  ),'info');
  return sl(W).then(ck).then(function(){
    say(L(
      "📍 First, look at the <b>sidebar on the left</b>. Click on <b>Customers</b> to open the client section.",
      "📍 Primero, mira la <b>barra lateral izquierda</b>. Haz click en <b>Clientes</b> para abrir la sección de clientes."
    ),'nav');
    smoothShow('clients');
    return sl(W);
  }).then(ck).then(function(){
    say(L(
      "⚡ Now see that <b>orange button</b> at the top? It says <b>'+ New Customer'</b>. That's how you add every new client. Let me click it for you.",
      "⚡ ¿Ves ese <b>botón naranja</b> arriba? Dice <b>'+ Nuevo Cliente'</b>. Así es como agregas cada cliente nuevo. Déjame hacerle click."
    ),'action');
    return sl(W);
  }).then(ck).then(function(){
    var btn=$q('#clients-section [onclick*="showClientForm()"]');
    return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1500);
  }).then(ck).then(function(){
    say(L(
      "✏️ Perfect! The form is open. Now I'll fill in the customer info. Watch each field — <b>Name, Phone, Email, Property Type, Address, and Notes</b>.",
      "✏️ ¡Perfecto! El formulario está abierto. Ahora voy a llenar la info del cliente. Mira cada campo — <b>Nombre, Teléfono, Email, Tipo de Propiedad, Dirección y Notas</b>."
    ),'action');
    return sl(W);
  }).then(ck).then(function(){
    say(L("✏️ <b>Name:</b> María García","✏️ <b>Nombre:</b> María García"),'action');
    return ty($('clientName'),'María García');
  }).then(function(){return sl(SD);
  }).then(ck).then(function(){
    say(L("📞 <b>Phone:</b> (909) 555-1234","📞 <b>Teléfono:</b> (909) 555-1234"),'action');
    return ty($('clientPhone'),'(909) 555-1234');
  }).then(function(){return sl(SD);
  }).then(ck).then(function(){
    say(L("📧 <b>Email:</b> maria.garcia@email.com","📧 <b>Email:</b> maria.garcia@email.com"),'action');
    return ty($('clientEmail'),'maria.garcia@email.com');
  }).then(function(){return sl(SD);
  }).then(ck).then(function(){
    say(L("🏠 <b>Property Type:</b> Residential","🏠 <b>Tipo de Propiedad:</b> Residencial"),'action');
    sv($('clientPropertyType'),'Residencial');
    return sl(SD);
  }).then(ck).then(function(){
    say(L("📍 <b>Address:</b> 456 Oak St, Fontana, CA","📍 <b>Dirección:</b> 456 Oak St, Fontana, CA"),'action');
    return ty($('clientAddress'),'456 Oak St, Fontana, CA 92335');
  }).then(function(){return sl(SD);
  }).then(ck).then(function(){
    say(L("📝 <b>Notes:</b> Always add important details about the job.","📝 <b>Notas:</b> Siempre agrega detalles importantes del trabajo."),'action');
    return ty($('clientNotes'),L('AC not cooling - Goodman 15 years. Service in Spanish.','AC no enfría - Goodman 15 años. Servicio en español.'));
  }).then(function(){return sl(W);
  }).then(ck).then(function(){
    say(L(
      "💾 Everything is filled in. Now click <b>Save</b>. The CRM will store this customer and you can find them anytime.",
      "💾 Todo está lleno. Ahora haz click en <b>Guardar</b>. El CRM guardará este cliente y lo puedes encontrar cuando quieras."
    ),'action');
    return sl(SD);
  }).then(function(){
    $('clientForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    return sl(2500);
  }).then(function(){
    say(L(
      "✅ <b>María García</b> is now saved! You'll see her in the customer list. That's how easy it is to add clients. Let's add one more.",
      "✅ ¡<b>María García</b> guardada! La verás en la lista de clientes. Así de fácil es agregar clientes. Vamos a agregar uno más."
    ),'success');
  });
}

function s2(){
  say(L(
    "Now let's add a <b>commercial client</b> — a restaurant. The process is the same, but we'll select <b>Commercial</b> as the property type.",
    "Ahora vamos a agregar un <b>cliente comercial</b> — un restaurante. El proceso es igual, pero seleccionamos <b>Comercial</b> como tipo de propiedad."
  ),'info');
  return sl(W).then(ck).then(function(){
    smoothShow('clients');
    var btn=$q('#clients-section [onclick*="showClientForm()"]');
    return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1500);
  }).then(ck).then(function(){
    return ty($('clientName'),'Roberto Méndez');
  }).then(function(){var c=$('clientCompany');return c?ty(c,'La Michoacana Restaurant'):Promise.resolve();
  }).then(function(){return ty($('clientPhone'),'(909) 555-5678');
  }).then(function(){return ty($('clientEmail'),'lamichoacana@email.com');
  }).then(function(){sv($('clientPropertyType'),'Comercial');return ty($('clientAddress'),'2890 Highland Ave, San Bernardino, CA');
  }).then(function(){return ty($('clientNotes'),L('Walk-in cooler not holding temp. Urgent.','Walk-in cooler no mantiene temp. Urgente.'));
  }).then(function(){return sl(SD);
  }).then(function(){
    $('clientForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    return sl(2500);
  }).then(function(){
    say(L(
      "✅ <b>2 customers</b> saved — one residential, one commercial. Your client list is growing! Next, let's look at <b>Leads</b>.",
      "✅ <b>2 clientes</b> guardados — uno residencial, uno comercial. ¡Tu lista de clientes está creciendo! Ahora vamos a ver <b>Prospectos</b>."
    ),'success');
  });
}

function s3(){
  say(L(
    "📍 <b>Leads</b> are potential customers who haven't hired you yet. Go to <b>Leads</b> in the sidebar. This is where you track people who called asking for a quote.",
    "📍 Los <b>Prospectos</b> son clientes potenciales que aún no te contratan. Ve a <b>Prospectos</b> en la barra lateral. Aquí registras a la gente que llamó pidiendo cotización."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('leads');
    return sl(W);
  }).then(ck).then(function(){
    say(L(
      "⚡ Click <b>'+ New Lead'</b> to add a prospect. Let's add someone who wants a new furnace.",
      "⚡ Click en <b>'+ Nuevo Prospecto'</b> para agregar uno. Vamos a agregar alguien que quiere un furnace nuevo."
    ),'action');
    var btn=$q('#leads-section [onclick*="showLeadForm"]');
    return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1500);
  }).then(ck).then(function(){
    say(L("✏️ Filling in the lead details...","✏️ Llenando los datos del prospecto..."),'action');
    return ty($('leadName'),'Roberto Sánchez');
  }).then(function(){return ty($('leadPhone'),'(909) 555-9012');
  }).then(function(){return ty($('leadEmail'),'roberto.s@email.com');
  }).then(function(){sv($('leadService'),'Calefacción');sv($('leadPropertyType'),'residential');return ty($('leadAddress'),'1025 Pine Ave, Rialto, CA');
  }).then(function(){return ty($('leadNotes'),L('New furnace. 1800sqft. Budget $4,500.','Furnace nuevo. 1800sqft. Budget $4,500.'));
  }).then(function(){var la=$('leadLat'),ln=$('leadLng');if(la)la.value='34.1064';if(ln)ln.value='-117.3703';return sl(SD);
  }).then(function(){
    $('leadForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    return sl(2500);
  }).then(function(){
    say(L(
      "✅ Lead <b>Roberto Sánchez</b> saved! 🔥 You can see him on the <b>map</b> below and track his status. When he signs, you convert him to a customer with one click.",
      "✅ ¡Prospecto <b>Roberto Sánchez</b> guardado! 🔥 Lo puedes ver en el <b>mapa</b> abajo y seguir su estatus. Cuando firme, lo conviertes a cliente con un click."
    ),'success');
  });
}

function s4(){
  say(L(
    "📍 Now let's add your <b>Technicians</b>. These are the guys who go out and do the work. Go to <b>Technicians</b> in the sidebar.",
    "📍 Ahora vamos a agregar tus <b>Técnicos</b>. Estos son los que salen a hacer el trabajo. Ve a <b>Técnicos</b> en la barra lateral."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('technicians');
    return sl(W);
  }).then(ck).then(function(){
    say(L(
      "⚡ Click <b>'+ New Technician'</b>. You'll enter their name, phone, email, specialty, and vehicle info for GPS tracking.",
      "⚡ Click en <b>'+ Nuevo Técnico'</b>. Vas a poner su nombre, teléfono, email, especialidad e info del vehículo para rastreo GPS."
    ),'action');
    var btn=$q('#technicians-section [onclick*="showTechFormInTechSection"]');
    return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1500);
  }).then(ck).then(function(){
    say(L("✏️ <b>Carlos Mendoza</b> — HVAC specialist, $35/hr","✏️ <b>Carlos Mendoza</b> — especialista HVAC, $35/hr"),'action');
    return ty($('techNameAlt'),'Carlos Mendoza');
  }).then(function(){return ty($('techPhoneAlt'),'(909) 555-3456');
  }).then(function(){return ty($('techEmailAlt'),'carlos@rodriguezhvac.com');
  }).then(function(){sv($('techSpecialtyAlt'),'HVAC');var cb=$('techCreateLoginAlt');if(cb)cb.checked=false;return sl(300);
  }).then(function(){var v=$('techVehicleAlt');return v?ty(v,'2023 Ford Transit'):Promise.resolve();
  }).then(function(){var p=$('techPlateAlt');return p?ty(p,'8ABC123'):Promise.resolve();
  }).then(function(){return sl(SD);
  }).then(function(){
    var f=$q('#techFormContainerAlt form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    return sl(2500);
  }).then(function(){
    say(L(
      "✅ <b>Carlos Mendoza</b> registered! He now has GPS tracking on his vehicle and can receive job assignments on his phone.",
      "✅ ¡<b>Carlos Mendoza</b> registrado! Ahora tiene rastreo GPS en su vehículo y puede recibir trabajos en su celular."
    ),'success');
  });
}

function s5(){
  say(L(
    "⚡ Let's add a second technician — <b>Miguel Ángel Torres</b>, who specializes in <b>Refrigeration</b>. Same process.",
    "⚡ Vamos a agregar un segundo técnico — <b>Miguel Ángel Torres</b>, especialista en <b>Refrigeración</b>. Mismo proceso."
  ),'action');
  return sl(W).then(ck).then(function(){
    var btn=$q('#technicians-section [onclick*="showTechFormInTechSection"]');
    return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1500);
  }).then(function(){return ty($('techNameAlt'),'Miguel Ángel Torres');
  }).then(function(){return ty($('techPhoneAlt'),'(909) 555-7890');
  }).then(function(){return ty($('techEmailAlt'),'miguel@rodriguezhvac.com');
  }).then(function(){sv($('techSpecialtyAlt'),'Refrigeración');var cb=$('techCreateLoginAlt');if(cb)cb.checked=false;return sl(300);
  }).then(function(){var v=$('techVehicleAlt');return v?ty(v,'2022 Chevy Express'):Promise.resolve();
  }).then(function(){var p=$('techPlateAlt');return p?ty(p,'7DEF456'):Promise.resolve();
  }).then(function(){
    var f=$q('#techFormContainerAlt form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    return sl(2500);
  }).then(function(){
    say(L(
      "✅ <b>2 technicians</b> ready! Both have GPS tracking and mobile access. You can see where they are in real-time from the Dispatch screen.",
      "✅ ¡<b>2 técnicos</b> listos! Ambos con rastreo GPS y acceso móvil. Puedes ver dónde están en tiempo real desde la pantalla de Despacho."
    ),'success');
  });
}

function s6(){
  say(L(
    "📍 Now let's add a <b>Home Advisor</b> — this is your sales person who goes to homes and sells installations. Go to <b>Home Advisors</b>.",
    "📍 Ahora vamos a agregar un <b>Asesor del Hogar</b> — es tu vendedor que va a las casas y vende instalaciones. Ve a <b>Asesores del Hogar</b>."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('advisors');
    return sl(W);
  }).then(ck).then(function(){
    say(L("⚡ Click <b>'+ New Advisor'</b>.","⚡ Click en <b>'+ Nuevo Asesor'</b>."),'action');
    var btn=$q('#advisors-section [onclick*="showAdvisorForm"]');
    return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1500);
  }).then(ck).then(function(){
    say(L("✏️ <b>Diana Castillo</b> — sales goal $50K/month, covers Inland Empire","✏️ <b>Diana Castillo</b> — meta de ventas $50K/mes, cubre Inland Empire"),'action');
    return ty($('advisorName'),'Diana Castillo');
  }).then(function(){return ty($('advisorPhone'),'(909) 555-2345');
  }).then(function(){return ty($('advisorEmail'),'diana@rodriguezhvac.com');
  }).then(function(){sv($('advisorSpecialty'),'Residencial y Comercial');return ty($('advisorZone'),'Inland Empire');
  }).then(function(){var g=$('advisorGoal');return g?ty(g,'50000'):Promise.resolve();
  }).then(function(){
    $('advisorForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    return sl(2500);
  }).then(function(){
    say(L(
      "✅ <b>Diana Castillo</b> is set up! She earns 5%-20% commission on every sale. The CRM tracks her performance automatically.",
      "✅ ¡<b>Diana Castillo</b> configurada! Gana 5%-20% comisión en cada venta. El CRM rastrea su rendimiento automáticamente."
    ),'success');
  });
}

function s7(){
  say(L(
    "📍 Now the fun part — <b>Dispatch</b>! This is your command center. Here you create jobs, assign technicians, and track everything. Go to <b>Dispatch</b>.",
    "📍 ¡Ahora lo bueno — <b>Despacho</b>! Este es tu centro de control. Aquí creas trabajos, asignas técnicos y rastreas todo. Ve a <b>Despacho</b>."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('dispatch');
    return sl(W);
  }).then(ck).then(function(){
    say(L(
      "⚡ Click <b>'+ New Job'</b> to create a work order. We'll assign María García's AC repair to Carlos.",
      "⚡ Click en <b>'+ Nuevo Trabajo'</b> para crear una orden. Vamos a asignar la reparación de AC de María García a Carlos."
    ),'action');
    var btn=$q('#dispatch-section [onclick*="showJobForm"]');
    return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1500);
  }).then(ck).then(function(){
    say(L("✏️ Filling in the job details — title, service type, priority, address, and notes...","✏️ Llenando los detalles del trabajo — título, tipo de servicio, prioridad, dirección y notas..."),'action');
    return ty($('jobTitle'),'AC Repair - Goodman not cooling');
  }).then(function(){sv($('jobServiceType'),'Reparación');sv($('jobPriority'),'high');return ty($('jobAddress'),'456 Oak St, Fontana, CA');
  }).then(function(){
    var d=$('jobDate');if(d)d.value=new Date().toISOString().split('T')[0];
    var la=$('jobLat'),ln=$('jobLng');if(la)la.value='34.09';if(ln)ln.value='-117.43';
    var ts=$('jobTechId');if(ts&&window.techsData&&techsData[0])sv(ts,techsData[0].id);
    return ty($('jobNotes'),L('Capacitor and contactor. María García. $850','Capacitor y contactor. María García. $850'));
  }).then(function(){return sl(SD);
  }).then(function(){
    $('jobForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    return sl(2500);
  }).then(function(){
    say(L(
      "✅ Job assigned to <b>Carlos</b>! He'll get a notification on his phone with the address and job details. The customer also gets a tracking link.",
      "✅ ¡Trabajo asignado a <b>Carlos</b>! Le llega una notificación a su celular con la dirección y detalles. El cliente también recibe un link de rastreo."
    ),'success');
  });
}

function s8(){
  say(L(
    "⚡ Let's create an <b>URGENT</b> job — the restaurant's walk-in cooler is failing. Same process, but we set priority to <b>Urgent</b> and assign to Miguel.",
    "⚡ Creemos un trabajo <b>URGENTE</b> — el walk-in cooler del restaurante está fallando. Mismo proceso, pero ponemos prioridad <b>Urgente</b> y asignamos a Miguel."
  ),'action');
  return sl(W).then(ck).then(function(){
    var btn=$q('#dispatch-section [onclick*="showJobForm"]');
    return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1500);
  }).then(function(){return ty($('jobTitle'),'Walk-in Cooler - Compressor');
  }).then(function(){sv($('jobServiceType'),'Reparación');sv($('jobPriority'),'urgent');return ty($('jobAddress'),'2890 Highland Ave, SB, CA');
  }).then(function(){
    var d=$('jobDate');if(d)d.value=new Date().toISOString().split('T')[0];
    var la=$('jobLat'),ln=$('jobLng');if(la)la.value='34.12';if(ln)ln.value='-117.29';
    var ts=$('jobTechId');if(ts&&window.techsData&&techsData[1])sv(ts,techsData[1].id);
    return ty($('jobNotes'),L('Urgent. Cooler 55°F. La Michoacana. $2,200','Urgente. Cooler 55°F. La Michoacana. $2,200'));
  }).then(function(){
    $('jobForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    return sl(2500);
  }).then(function(){
    say(L(
      "✅ <b>2 jobs dispatched</b> — total value <b>$3,050</b>. Carlos goes to Fontana, Miguel goes to San Bernardino. You can track both in real-time!",
      "✅ <b>2 trabajos despachados</b> — valor total <b>$3,050</b>. Carlos va a Fontana, Miguel a San Bernardino. ¡Puedes rastrear ambos en tiempo real!"
    ),'success');
  });
}

function s9(){
  say(L(
    "📍 <b>Service Calls</b> — this is different from Dispatch. When a customer calls with an emergency, you log it here FAST. Go to <b>Service Calls</b>.",
    "📍 <b>Llamadas de Servicio</b> — esto es diferente de Despacho. Cuando un cliente llama con emergencia, lo registras aquí RÁPIDO. Ve a <b>Llamadas de Servicio</b>."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('servicecalls');
    return sl(W);
  }).then(ck).then(function(){
    say(L("⚡ Click <b>'+ New Service Call'</b> to log the emergency.","⚡ Click en <b>'+ Nueva Llamada'</b> para registrar la emergencia."),'action');
    var btn=$q('#servicecalls-section [onclick*="showServiceCallForm"]');
    return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1500);
  }).then(ck).then(function(){
    say(L("✏️ Logging emergency: <b>AC not cooling, pet in house</b>","✏️ Registrando emergencia: <b>AC no enfría, mascota en casa</b>"),'action');
    return ty($('scClientName'),'María García');
  }).then(function(){return ty($('scClientPhone'),'(909) 555-1234');
  }).then(function(){return ty($('scAddress'),'456 Oak St, Fontana, CA');
  }).then(function(){return ty($('scProblem'),L('AC not cooling. Hot air only. Pet in house. Urgent.','AC no enfría. Aire caliente. Mascota en casa. Urgente.'));
  }).then(function(){
    sv($('scUrgency'),'emergency');sv($('scPropertyType'),'residential');
    var pd=$('scPreferredDate');if(pd)pd.value=new Date().toISOString().split('T')[0];
    if(window.techsData&&techsData[0]){var st=$('scTechAssign');if(st)sv(st,techsData[0].id);}
    return ty($('scNotes'),'Gate #1234.');
  }).then(function(){
    $('serviceCallForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    return sl(2500);
  }).then(function(){
    say(L(
      "✅ <b style='color:#ef4444'>🔴 EMERGENCY</b> logged and dispatched! The technician gets an immediate alert. The customer gets an ETA.",
      "✅ <b style='color:#ef4444'>🔴 EMERGENCIA</b> registrada y despachada! El técnico recibe alerta inmediata. El cliente recibe un tiempo estimado."
    ),'success');
  });
}

function s10(){
  say(L(
    "📍 Let's go back to <b>Dispatch</b> to see the GPS tracking. This is your <b>real-time command center</b>.",
    "📍 Regresemos a <b>Despacho</b> para ver el rastreo GPS. Este es tu <b>centro de control en tiempo real</b>."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('dispatch');
    return sl(W);
  }).then(ck).then(function(){
    say(L(
      "🚐 Look at the map — you can see exactly where each technician is:<br><br>🚐 <b>Carlos</b> → heading to Fontana (AC Repair)<br>🚐 <b>Miguel</b> → heading to San Bernardino (Cooler)<br><br>Your customers also get a <b>tracking link</b> — like Uber for HVAC!",
      "🚐 Mira el mapa — puedes ver exactamente dónde está cada técnico:<br><br>🚐 <b>Carlos</b> → camino a Fontana (AC Repair)<br>🚐 <b>Miguel</b> → camino a San Bernardino (Cooler)<br><br>Tus clientes también reciben un <b>link de rastreo</b> — ¡como Uber para HVAC!"
    ),'info');
    return sl(W+2000);
  }).then(function(){
    say(L("✅ Your entire fleet monitored in real-time!","✅ ¡Toda tu flota monitoreada en tiempo real!"),'success');
  });
}

function s11(){
  say(L(
    "📍 Now let's look at <b>Payroll</b>. Go to <b>Payroll</b> in the sidebar. This is where you track what you owe each technician and advisor.",
    "📍 Ahora veamos la <b>Nómina</b>. Ve a <b>Nómina</b> en la barra lateral. Aquí rastreas lo que le debes a cada técnico y asesor."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('payroll');
    return sl(W);
  }).then(ck).then(function(){
    say(L(
      "⚡ I'm adding payroll data for this pay period. Watch the numbers — <b>hours worked × hourly rate = total pay</b>.",
      "⚡ Estoy agregando datos de nómina para este período. Mira los números — <b>horas trabajadas × tarifa por hora = pago total</b>."
    ),'action');
    var e=[
      {id:'py1',company_id:'demo-co',tech_id:techsData[0]?techsData[0].id:null,tech_name:techsData[0]?techsData[0].name:'Carlos',type:'hourly',hours:42,rate:35,total:1470,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()},
      {id:'py2',company_id:'demo-co',tech_id:techsData[1]?techsData[1].id:null,tech_name:techsData[1]?techsData[1].name:'Miguel',type:'hourly',hours:38,rate:30,total:1140,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()},
      {id:'py3',company_id:'demo-co',tech_id:null,tech_name:advisorsData&&advisorsData[0]?advisorsData[0].name:'Diana Castillo',type:'commission',hours:0,rate:0,total:457.50,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()}
    ];
    e.forEach(function(x){_db.payroll_entries.push(x);});window.payrollData=e;renderPayroll();
    return sl(W);
  }).then(function(){
    say(L(
      "✅ Payroll ready:<br>👷 Carlos: 42hrs × $35 = <b>$1,470</b><br>👷 Miguel: 38hrs × $30 = <b>$1,140</b><br>💼 Diana: commission = <b>$457.50</b><br>📊 Total: <b>$3,067.50</b>",
      "✅ Nómina lista:<br>👷 Carlos: 42hrs × $35 = <b>$1,470</b><br>👷 Miguel: 38hrs × $30 = <b>$1,140</b><br>💼 Diana: comisión = <b>$457.50</b><br>📊 Total: <b>$3,067.50</b>"
    ),'success');
  });
}

function s12(){
  say(L(
    "📍 Time for <b>Invoices</b>! Go to <b>Invoices</b>. This is how you bill your customers. Every job should have an invoice.",
    "📍 ¡Hora de <b>Facturas</b>! Ve a <b>Facturas</b>. Así cobras a tus clientes. Cada trabajo debe tener una factura."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('invoices');
    return sl(W);
  }).then(ck).then(function(){
    say(L(
      "⚡ I'm creating an invoice for María García's AC repair. Watch how it breaks down — <b>service call + parts + labor</b>.",
      "⚡ Estoy creando una factura para la reparación de AC de María García. Mira cómo se desglosa — <b>visita + partes + mano de obra</b>."
    ),'action');
    var inv={id:'inv1',company_id:'demo-co',invoice_number:'INV-202602-0001',client_name:'María García',client_email:'maria.garcia@email.com',client_phone:'(909) 555-1234',client_address:'456 Oak St, Fontana',line_items:[{name:'Service Call',qty:1,unit_price:120,labor:0,total:120},{name:'Capacitor 45/5',qty:1,unit_price:85,labor:0,total:85},{name:'Contactor 2P',qty:1,unit_price:65,labor:0,total:65},{name:'Labor',qty:2,unit_price:0,labor:125,total:250}],subtotal:520,total:520,balance_due:520,amount_paid:0,status:'draft',created_at:new Date().toISOString()};
    _db.invoices.push(inv);window.invoicesData=[inv];renderInvoiceKPIs();renderInvoicesTable();
    return sl(W);
  }).then(function(){
    say(L(
      "✅ <b>INV-0001</b> created — <b>$520</b><br>• Service Call: $120<br>• Capacitor 45/5: $85<br>• Contactor 2P: $65<br>• Labor (2hrs): $250<br><br>You can email this to the customer or print it as PDF!",
      "✅ <b>INV-0001</b> creada — <b>$520</b><br>• Visita: $120<br>• Capacitor 45/5: $85<br>• Contactor 2P: $65<br>• Mano de obra (2hrs): $250<br><br>¡La puedes enviar por email o imprimir como PDF!"
    ),'success');
  });
}

function s13(){
  say(L(
    "⚡ Now let's mark that invoice as <b>PAID</b> — the customer paid! And I'll add a second invoice for the restaurant job.",
    "⚡ Ahora marquemos esa factura como <b>PAGADA</b> — ¡el cliente pagó! Y voy a agregar una segunda factura para el trabajo del restaurante."
  ),'action');
  return sl(W).then(ck).then(function(){
    invoicesData[0].status='paid';invoicesData[0].amount_paid=520;invoicesData[0].balance_due=0;
    var inv2={id:'inv2',company_id:'demo-co',invoice_number:'INV-202602-0002',client_name:'La Michoacana',client_phone:'(909) 555-5678',client_email:'lm@email.com',client_address:'2890 Highland, SB',line_items:[{name:'Cooler Repair',qty:1,unit_price:1800,labor:400,total:2200}],subtotal:2200,total:2200,balance_due:2200,amount_paid:0,status:'sent',created_at:new Date().toISOString()};
    _db.invoices.push(inv2);invoicesData.push(inv2);renderInvoiceKPIs();renderInvoicesTable();
    return sl(W);
  }).then(function(){
    say(L(
      "✅ INV-0001 <b style='color:#16a34a'>✅ PAID</b> $520<br>INV-0002 <b style='color:#f59e0b'>⏳ PENDING</b> $2,200<br><br>The dashboard tracks paid vs pending automatically. You always know who owes you money!",
      "✅ INV-0001 <b style='color:#16a34a'>✅ PAGADA</b> $520<br>INV-0002 <b style='color:#f59e0b'>⏳ PENDIENTE</b> $2,200<br><br>¡El dashboard rastrea pagadas vs pendientes automáticamente. Siempre sabes quién te debe!"
    ),'success');
  });
}

function s14(){
  say(L(
    "📍 Every business has <b>Expenses</b>. Go to <b>Expenses</b> to track what you spend — gas, insurance, tools, CRM subscription, everything.",
    "📍 Todo negocio tiene <b>Gastos</b>. Ve a <b>Gastos</b> para registrar lo que gastas — gasolina, seguro, herramientas, suscripción del CRM, todo."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('expenses');
    return sl(W);
  }).then(ck).then(function(){
    say(L("⚡ Click <b>'+ New Expense'</b> to log your first expense.","⚡ Click en <b>'+ Nuevo Gasto'</b> para registrar tu primer gasto."),'action');
    var btn=$q('#expenses-section [onclick*="showExpenseForm"]');
    return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1500);
  }).then(ck).then(function(){
    say(L("✏️ Adding gas expense — <b>$287.50</b> at Chevron","✏️ Agregando gasto de gasolina — <b>$287.50</b> en Chevron"),'action');
    sv($('expCategory'),'vehicle_gas');return ty($('expVendor'),'Chevron');
  }).then(function(){return ty($('expAmount'),'287.50');
  }).then(function(){sv($('expFrequency'),'monthly');sv($('expType'),'variable');$('expDate').value=new Date().toISOString().split('T')[0];return sl(SD);
  }).then(function(){
    var f=$q('#expenses-section form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    return sl(2000);
  }).then(ck).then(function(){
    say(L("⚡ Now adding 3 more monthly expenses...","⚡ Ahora agregando 3 gastos mensuales más..."),'action');
    [{category:'general_liability',vendor:'State Farm',amount:450,type:'fixed'},
     {category:'software_crm',vendor:'Trade Master CRM',amount:149.99,type:'fixed'},
     {category:'vehicle_payment',vendor:'Ford Motor Credit',amount:650,type:'fixed'}]
    .forEach(function(e){e.id='exp'+(++_idc);e.company_id='demo-co';e.frequency='monthly';e.date=new Date().toISOString().split('T')[0];e.created_at=new Date().toISOString();_db.expenses.push(e);expensesData.push(e);});
    renderExpenses();
    return sl(W);
  }).then(function(){
    say(L(
      "✅ <b>4 expenses</b> tracked:<br>⛽ Gas: $287.50<br>🛡️ Insurance: $450<br>💻 CRM: $149.99<br>🚐 Vehicle: $650<br>📊 Total monthly: <b>$1,537.49</b>",
      "✅ <b>4 gastos</b> registrados:<br>⛽ Gasolina: $287.50<br>🛡️ Seguro: $450<br>💻 CRM: $149.99<br>🚐 Vehículo: $650<br>📊 Total mensual: <b>$1,537.49</b>"
    ),'success');
  });
}

function s15(){
  say(L(
    "📍 <b>My Money</b> — this is your financial overview. Go to <b>My Money</b>. It shows income vs expenses in a chart so you can see your profit at a glance.",
    "📍 <b>Mi Dinero</b> — esta es tu vista financiera. Ve a <b>Mi Dinero</b>. Muestra ingresos vs gastos en una gráfica para que veas tu ganancia de un vistazo."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('mymoney');
    return sl(W+2000);
  }).then(function(){
    say(L(
      "✅ Here you see <b>everything</b> — revenue coming in, expenses going out, and your net profit. Real-time financial health of your business!",
      "✅ Aquí ves <b>todo</b> — ingresos entrando, gastos saliendo, y tu ganancia neta. ¡Salud financiera de tu negocio en tiempo real!"
    ),'success');
  });
}

function s16(){
  say(L(
    "📍 Let's check <b>Payroll</b> one more time. This view shows the detailed breakdown — hours, rates, overtime, and export options.",
    "📍 Revisemos <b>Nómina</b> una vez más. Esta vista muestra el desglose detallado — horas, tarifas, horas extra y opciones de exportar."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('payroll');
    return sl(W+2000);
  }).then(function(){
    say(L(
      "✅ You can export this to <b>QuickBooks, ADP, or Gusto</b> with one click. No more manual payroll calculations!",
      "✅ Puedes exportar esto a <b>QuickBooks, ADP o Gusto</b> con un click. ¡No más cálculos de nómina manuales!"
    ),'success');
  });
}

function s17(){
  say(L(
    "📍 <b>Marketing</b> — go to the <b>Marketing</b> section. This is where you create and track your advertising campaigns.",
    "📍 <b>Mercadotecnia</b> — ve a la sección de <b>Mercadotecnia</b>. Aquí es donde creas y rastreas tus campañas de publicidad."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('marketing');
    return sl(W);
  }).then(ck).then(function(){
    say(L("⚡ Click <b>'+ New Campaign'</b> to create a Google Ads campaign.","⚡ Click en <b>'+ Nueva Campaña'</b> para crear una campaña de Google Ads."),'action');
    var btn=$q('#marketing-section [onclick*="showCampaignForm"]');
    return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1500);
  }).then(ck).then(function(){
    say(L("✏️ Creating: <b>AC Tune-Up $79</b> — Google Ads, $1,500 budget","✏️ Creando: <b>AC Tune-Up $79</b> — Google Ads, $1,500 de presupuesto"),'action');
    return ty($('campName'),'Promo Summer - AC Tune-Up $79');
  }).then(function(){sv($('campType'),'google_ads');return ty($('campBudget'),'1500');
  }).then(function(){
    var cs=$('campStart'),ce=$('campEnd');if(cs)cs.value=new Date().toISOString().split('T')[0];
    if(ce){var d=new Date();d.setDate(d.getDate()+60);ce.value=d.toISOString().split('T')[0];}
    return ty($('campMessage'),'Tune-Up $79. Rodriguez HVAC. (909) 555-0000');
  }).then(function(){
    var f=$q('#marketing-section form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    return sl(2500);
  }).then(function(){
    say(L(
      "✅ Campaign <b>Google Ads</b> active! Budget: $1,500 for 60 days. The CRM tracks which leads come from each campaign so you know your ROI.",
      "✅ ¡Campaña <b>Google Ads</b> activa! Presupuesto: $1,500 por 60 días. El CRM rastrea qué prospectos vienen de cada campaña para que sepas tu ROI."
    ),'success');
  });
}

function s18(){
  say(L(
    "📍 <b>Price Book</b> — this is your catalog of parts, services and prices. Go to <b>Price Book</b>. When you create invoices, you pull prices from here.",
    "📍 <b>Lista de Precios</b> — este es tu catálogo de partes, servicios y precios. Ve a <b>Lista de Precios</b>. Cuando creas facturas, jalas precios de aquí."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('pricebook');
    return sl(W);
  }).then(ck).then(function(){
    say(L("⚡ I'm adding 10 common HVAC parts and services with cost and selling price...","⚡ Estoy agregando 10 partes y servicios comunes de HVAC con costo y precio de venta..."),'action');
    [{name:'Capacitor 45/5 MFD',sku:'CAP-455',category:'ac_parts',unit:'each',cost:12,price:85},
     {name:'Contactor 2P 40A',sku:'CON-2P',category:'ac_parts',unit:'each',cost:8,price:65},
     {name:'Motor Fan 1/4 HP',sku:'MTR-025',category:'motors',unit:'each',cost:45,price:195},
     {name:'R-410A per lb',sku:'REF-410',category:'refrigerants',unit:'lb',cost:15,price:85},
     {name:'Thermostat Honeywell',sku:'TSTAT',category:'controls',unit:'each',cost:35,price:175},
     {name:'Filter 16x25x1',sku:'FLT-162',category:'filters',unit:'each',cost:4,price:25},
     {name:'Service Call 0-10mi',sku:'SC-010',category:'labor',unit:'flat',cost:0,price:70},
     {name:'Service Call 10-20mi',sku:'SC-1020',category:'labor',unit:'flat',cost:0,price:120},
     {name:'Labor per Hour',sku:'LAB-HR',category:'labor',unit:'hour',cost:0,price:125},
     {name:'AC Tune-Up 21pts',sku:'TUNE-21',category:'labor',unit:'flat',cost:0,price:79}]
    .forEach(function(it){it.id='pb'+(++_idc);it.company_id='demo-co';_db.price_book.push(it);});
    window.priceBookData=_db.price_book.slice();renderPriceBook();
    return sl(W);
  }).then(function(){
    say(L(
      "✅ <b>10 items</b> in your price book! Look at the margins:<br>• Capacitor: cost $12 → sell $85 (<b>608% markup</b>)<br>• R-410A: cost $15/lb → sell $85/lb (<b>467% markup</b>)<br><br>This is how HVAC companies make money!",
      "✅ ¡<b>10 artículos</b> en tu lista de precios! Mira los márgenes:<br>• Capacitor: costo $12 → venta $85 (<b>608% margen</b>)<br>• R-410A: costo $15/lb → venta $85/lb (<b>467% margen</b>)<br><br>¡Así es como las empresas HVAC ganan dinero!"
    ),'success');
  });
}

function s19(){
  say(L(
    "📍 <b>Reports</b> — the big picture. Go to <b>Reports</b>. This is where you see charts, graphs, and analytics about your entire business.",
    "📍 <b>Reportes</b> — la foto completa. Ve a <b>Reportes</b>. Aquí ves gráficas, charts y analíticas de todo tu negocio."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('reports');
    return sl(W+2000);
  }).then(function(){
    say(L(
      "✅ Revenue by month, jobs per technician, lead sources, team productivity — all in one place. You can <b>export any report to PDF</b> for your records or accountant.",
      "✅ Ingresos por mes, trabajos por técnico, fuentes de prospectos, productividad del equipo — todo en un lugar. Puedes <b>exportar cualquier reporte a PDF</b> para tus archivos o contador."
    ),'success');
  });
}

function s20(){
  say(L(
    "📍 Last stop — <b>Settings</b>. Go to <b>Settings</b> to configure your company info, license, bond, and legal documents.",
    "📍 Última parada — <b>Configuración</b>. Ve a <b>Configuración</b> para poner tu info de empresa, licencia, bond y documentos legales."
  ),'nav');
  return sl(W).then(ck).then(function(){
    smoothShow('settings');
    return sl(W+2000);
  }).then(ck).then(function(){
    say(L(
      "✅ Your company profile, contractor license, insurance bond, and contract templates — all saved here.",
      "✅ Tu perfil de empresa, licencia de contratista, fianza de seguro y plantillas de contratos — todo guardado aquí."
    ),'success');
    return sl(W);
  }).then(ck).then(function(){
    say(L("📍 Let's go back to the <b>Dashboard</b> for the final summary!","📍 ¡Regresemos al <b>Dashboard</b> para el resumen final!"),'nav');
    smoothShow('dashboard');
    return sl(W);
  }).then(ck).then(function(){
    say(L(
      "🎉 <b>DEMO COMPLETE!</b><br><br>Here's everything we built together:<br>👥 2 customers (residential + commercial)<br>🎯 1 lead ($4,500 furnace)<br>👷 2 technicians with GPS<br>🏠 1 home advisor<br>🔧 2 jobs worth $3,050<br>📞 1 emergency service call<br>📄 2 invoices ($2,720 total)<br>💰 4 expenses tracked<br>📣 1 marketing campaign<br>📒 10 price book items<br><br><b>This is YOUR business, organized.</b>",
      "🎉 <b>¡DEMO COMPLETADO!</b><br><br>Esto es todo lo que construimos juntos:<br>👥 2 clientes (residencial + comercial)<br>🎯 1 prospecto ($4,500 furnace)<br>👷 2 técnicos con GPS<br>🏠 1 asesor del hogar<br>🔧 2 trabajos por $3,050<br>📞 1 llamada de emergencia<br>📄 2 facturas ($2,720 total)<br>💰 4 gastos registrados<br>📣 1 campaña de marketing<br>📒 10 artículos en lista de precios<br><br><b>Este es TU negocio, organizado.</b>"
    ),'success');
    return sl(W);
  }).then(function(){
    var ch=$('sfChat');var cta=document.createElement('div');
    cta.innerHTML='<div style="padding:14px;text-align:center"><a href="'+location.pathname+'" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;text-decoration:none;border-radius:14px;font-weight:700;font-size:16px;box-shadow:0 6px 20px rgba(249,115,22,.4)">🚀 '+L('Start Free — 10 Clients Free','Empieza Gratis — 10 Clientes Gratis')+'</a><p style="margin-top:10px;font-size:12px;color:var(--text-muted)">'+L('Free plan: 10 clients | Pro: $149.99/mo — unlimited','Plan gratis: 10 clientes | Pro: $149.99/mes — ilimitado')+'</p></div>';
    ch.appendChild(cta);ch.scrollTop=99999;
  });
}
/* ===== INIT - Wait for CRM to fully load ===== */
document.addEventListener('DOMContentLoaded',function(){
  // script.js DOMContentLoaded fires first, inits CRM with our mock
  // Give it time to finish async init (loadCompanyId, showDashboard, loadAllData)
  setTimeout(function(){
    injectCSS();initVoice();
    // Hook showSection for smooth transitions
    if(window.showSection&&!_origShowSection){_origShowSection=window.showSection;}
    showSplash().then(function(mode){
      createAssistant();
      say(L('\uD83D\uDC4B I\'m <b>Danielle</b>, your AI assistant for Trade Master CRM.','\uD83D\uDC4B Soy <b>Brenda</b>, tu asistente AI de Trade Master CRM.'),'info');
      if(mode==='auto'){
        setTimeout(function(){doAuto();},800);
      }else{
        say('Clic <b>\u23E9 Next</b> o <b>\u25B6\uFE0F Auto</b> para comenzar.','info');
      }
    });
  },2000);
});
})();
