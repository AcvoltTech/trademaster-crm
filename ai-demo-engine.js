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
var TS=25,SD=500;
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
  return sl(200).then(function(){
    var r=el.getBoundingClientRect();var rp=document.createElement('div');rp.className='demo-ripple';
    rp.style.cssText='left:'+(r.left+r.width/2)+'px;top:'+(r.top+r.height/2)+'px;';
    document.body.appendChild(rp);return sl(100).then(function(){el.click();return sl(300).then(function(){rp.remove();});});
  });
}
function $(id){return document.getElementById(id);}
function $q(s){return document.querySelector(s);}

/* ===== CSS ===== */
function injectCSS(){
  var s=document.createElement('style');s.textContent=
  '#demoSplash{position:fixed;inset:0;z-index:20000;background:linear-gradient(135deg,#0f172a,#1e293b,#0f172a);display:flex;align-items:center;justify-content:center;transition:opacity .5s,transform .5s}'+
  '#demoSplash.ds-exit{opacity:0;transform:scale(1.05)}.ds-content{text-align:center;color:#fff;max-width:540px;padding:40px;animation:dsFI .8s ease-out}'+
  '.ds-btn{padding:18px 48px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;border-radius:16px;font-size:1.1rem;font-weight:700;cursor:pointer;box-shadow:0 8px 30px rgba(249,115,22,.4)}.ds-btn:hover{transform:translateY(-2px)}'+
  '@keyframes dsFI{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}'+
  '#sofiaPanel{position:fixed;bottom:20px;right:20px;width:380px;max-height:70vh;background:var(--bg-card,#1e293b);border:1px solid var(--border,#334155);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.3);z-index:9999;display:flex;flex-direction:column;overflow:hidden}'+
  '.sf-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:linear-gradient(135deg,#1e3a5f,#2d4a6f);cursor:move;border-radius:16px 16px 0 0;flex-shrink:0}'+
  '.sf-hl{display:flex;align-items:center;gap:10px}.sf-av{font-size:26px}.sf-name{font-weight:700;color:#fff;font-size:14px;display:block}.sf-role{font-size:11px;color:#94a3b8}'+
  '.sf-hr{display:flex;gap:4px}.sf-hb{background:rgba(255,255,255,.15);border:none;color:#fff;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center}.sf-hb:hover{background:rgba(255,255,255,.3)}'+
  '.sf-body{flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0 12px 8px}'+
  '.sf-pbar{height:6px;background:#334155;border-radius:3px;margin:12px 0 4px;overflow:hidden;flex-shrink:0}.sf-pfill{height:100%;background:linear-gradient(90deg,#f97316,#f59e0b);border-radius:3px;width:0;transition:width .5s}'+
  '.sf-step{font-size:11px;color:#94a3b8;text-align:center;margin-bottom:8px;flex-shrink:0}'+
  '.sf-chat{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:4px 0;min-height:100px;max-height:45vh}'+
  '.sf-msg{display:flex;gap:8px;padding:10px 12px;border-radius:10px;font-size:12.5px;line-height:1.6;animation:sfSl .3s ease-out;word-break:break-word}'+
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
  '.demo-ripple{position:fixed;width:30px;height:30px;border-radius:50%;background:rgba(249,115,22,.4);pointer-events:none;z-index:10002;transform:translate(-50%,-50%);animation:dmR .5s ease-out forwards}'+
  '@keyframes dmR{to{width:60px;height:60px;opacity:0}}'+
  '@media(max-width:640px){#sofiaPanel{width:calc(100% - 16px);right:8px;bottom:8px;max-height:55vh}.sf-chat{max-height:35vh}}';
  document.head.appendChild(s);
}

/* ===== SPLASH ===== */
function showSplash(){
  return new Promise(function(res){
    var s=document.createElement('div');s.id='demoSplash';
    s.innerHTML='<div class="ds-content"><div style="font-size:60px;margin-bottom:12px">\uD83D\uDD27</div><h1 style="font-size:2rem;font-weight:800;margin:0 0 6px;color:#fff">Trade Master CRM</h1><p style="color:#f97316;font-weight:600;margin:0 0 4px">Interactive AI Demo</p><p style="color:#94a3b8;font-size:.85rem;margin:0 0 24px">'+CO.name+'</p><p style="color:#cbd5e1;font-size:.9rem;line-height:1.7;margin:0 0 28px;max-width:440px">'+((window.currentLang||'es')==='en'?'Danielle will operate the <strong>entire CRM</strong> — creating clients, technicians, jobs, invoices and more. <strong>20 real steps</strong>.':'Brenda operar\u00E1 el <strong>CRM completo</strong> — crear\u00E1 clientes, t\u00E9cnicos, trabajos, facturas y m\u00E1s. <strong>20 pasos reales</strong>.')+'</p><button id="demoStartBtn" class="ds-btn">\u25B6\uFE0F Start Demo</button><br><button id="demoAutoBtn" style="margin-top:12px;padding:12px 36px;background:transparent;color:#f97316;border:2px solid #f97316;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer">\uD83D\uDD04 Auto Play Full Demo</button><p style="font-size:.75rem;color:#64748b;margin-top:12px">\u23F1 8-12 min</p></div>';
    document.body.appendChild(s);
    $('demoStartBtn').onclick=function(){s.classList.add('ds-exit');setTimeout(function(){s.remove();res('manual');},500);};
    $('demoAutoBtn').onclick=function(){s.classList.add('ds-exit');setTimeout(function(){s.remove();res('auto');},500);};
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
var _11KEY='';// ElevenLabs API key
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
function upP(){$('sfPFill').style.width=(S.step/S.total*100)+'%';$('sfStep').textContent='Step '+S.step+' of '+S.total;}
function togglePause(){S.paused=!S.paused;$('sfPause').textContent=S.paused?L('\u25B6\uFE0F Play','\u25B6\uFE0F Play'):'\u23F8\uFE0F Pause';}
function doNext(){if(S.step>=S.total){say(L('\uD83C\uDF89 Demo complete!','\uD83C\uDF89 Demo completado!'),'success');return Promise.resolve();}S.paused=false;$('sfPause').textContent='\u23F8\uFE0F Pause';S.step++;upP();return runStep(S.step);}
function doPrev(){if(S.step<=1)return Promise.resolve();S.step=Math.max(0,S.step-2);return doNext();}
function doAuto(){
  if(S.playing){S.playing=false;$('sfAuto').textContent='\u25B6\uFE0F Auto';return Promise.resolve();}
  S.playing=true;S.paused=false;$('sfAuto').textContent='\u23F9 Stop';
  function lp(){if(!S.playing||S.step>=S.total){S.playing=false;$('sfAuto').textContent='\u25B6\uFE0F Auto';return Promise.resolve();}return doNext().then(function(){if(S.playing)return sl(1200).then(lp);});}
  return lp();
}

/* ===== 20 STEPS ===== */
function runStep(n){return ck().then(function(){switch(n){
case 1:return s1();case 2:return s2();case 3:return s3();case 4:return s4();case 5:return s5();
case 6:return s6();case 7:return s7();case 8:return s8();case 9:return s9();case 10:return s10();
case 11:return s11();case 12:return s12();case 13:return s13();case 14:return s14();case 15:return s15();
case 16:return s16();case 17:return s17();case 18:return s18();case 19:return s19();case 20:return s20();
}});}

function s1(){
  say(L("I'm <b>Danielle</b>. Let's create your first client.","Soy <b>Brenda</b>. Vamos a crear tu primer cliente."),'info');
  return sl(SD).then(function(){say(L('<b>Customers</b>','<b>Clientes</b>'),'nav');showSection('clients');return sl(SD);})
  .then(function(){say(L('Opening form...','Abriendo formulario...'),'action');var btn=$q('#clients-section [onclick*="showClientForm()"]');return btn?clk(btn):Promise.resolve();})
  .then(function(){return sl(400);})
  .then(function(){say(L('✏️ <b>María García</b> — Residential, Fontana','✏️ <b>María García</b> — Residencial, Fontana'),'action');return ty($('clientName'),'María García');})
  .then(function(){return ty($('clientPhone'),'(909) 555-1234');})
  .then(function(){return ty($('clientEmail'),'maria.garcia@email.com');})
  .then(function(){sv($('clientPropertyType'),'Residencial');return sl(50);})
  .then(function(){return ty($('clientAddress'),'456 Oak St, Fontana, CA 92335');})
  .then(function(){return ty($('clientNotes'),L('AC not cooling - Goodman 15 years. Service in Spanish.','AC no enfría - Goodman 15 años. Servicio en español.'));})
  .then(function(){return sl(SD);})
  .then(function(){say(L('💾 Saving...','💾 Guardando...'),'action');$('clientForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say(L('✅ <b>María García</b> created!','✅ <b>María García</b> creada!'),'success');});
}
function s2(){
  say(L('<b>Commercial</b> client — restaurant.','Cliente <b>comercial</b> — restaurante.'),'info');
  return sl(SD).then(function(){showSection('clients');var btn=$q('#clients-section [onclick*="showClientForm()"]');return btn?clk(btn):Promise.resolve();})
  .then(function(){return sl(400);})
  .then(function(){return ty($('clientName'),'Roberto Méndez');})
  .then(function(){var c=$('clientCompany');return c?ty(c,'La Michoacana Restaurant'):Promise.resolve();})
  .then(function(){return ty($('clientPhone'),'(909) 555-5678');})
  .then(function(){return ty($('clientEmail'),'lamichoacana@email.com');})
  .then(function(){sv($('clientPropertyType'),'Comercial');return ty($('clientAddress'),'2890 Highland Ave, San Bernardino, CA');})
  .then(function(){return ty($('clientNotes'),L('Walk-in cooler not holding temp. Urgent.','Walk-in cooler no mantiene temp. Urgente.'));})
  .then(function(){$('clientForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say(L('✅ <b>2 clients</b> in the table.','✅ <b>2 clientes</b> en la tabla.'),'success');});
}
function s3(){
  say(L('📍 <b>Leads</b> — hot lead.','📍 <b>Prospectos</b> — lead caliente.'),'nav');
  return sl(SD).then(function(){showSection('leads');return sl(SD);})
  .then(function(){var btn=$q('#leads-section [onclick*="showLeadForm"]');return btn?clk(btn):Promise.resolve();})
  .then(function(){return sl(400);})
  .then(function(){say(L('✏️ <b>Roberto Sánchez</b> — Furnace $4,500','✏️ <b>Roberto Sánchez</b> — Furnace $4,500'),'action');return ty($('leadName'),'Roberto Sánchez');})
  .then(function(){return ty($('leadPhone'),'(909) 555-9012');})
  .then(function(){return ty($('leadEmail'),'roberto.s@email.com');})
  .then(function(){sv($('leadService'),'Calefacción');sv($('leadPropertyType'),'residential');return ty($('leadAddress'),'1025 Pine Ave, Rialto, CA');})
  .then(function(){return ty($('leadNotes'),L('New furnace. 1800sqft. Budget $4,500.','Furnace nuevo. 1800sqft. Budget $4,500.'));})
  .then(function(){var la=$('leadLat'),ln=$('leadLng');if(la)la.value='34.1064';if(ln)ln.value='-117.3703';return sl(SD);})
  .then(function(){$('leadForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say(L('✅ Lead <b>Roberto Sánchez</b> 🔥','✅ Lead <b>Roberto Sánchez</b> 🔥'),'success');});
}
function s4(){
  say(L('📍 <b>Technicians</b>','📍 <b>Técnicos</b>'),'nav');
  return sl(SD).then(function(){showSection('technicians');return sl(SD);})
  .then(function(){var btn=$q('#technicians-section [onclick*="showTechFormInTechSection"]');return btn?clk(btn):Promise.resolve();})
  .then(function(){return sl(400);})
  .then(function(){say(L('✏️ <b>Carlos Mendoza</b> — HVAC, $35/hr','✏️ <b>Carlos Mendoza</b> — HVAC, $35/hr'),'action');return ty($('techNameAlt'),'Carlos Mendoza');})
  .then(function(){return ty($('techPhoneAlt'),'(909) 555-3456');})
  .then(function(){return ty($('techEmailAlt'),'carlos@rodriguezhvac.com');})
  .then(function(){sv($('techSpecialtyAlt'),'HVAC');var cb=$('techCreateLoginAlt');if(cb)cb.checked=false;return sl(50);})
  .then(function(){var v=$('techVehicleAlt');return v?ty(v,'2023 Ford Transit'):Promise.resolve();})
  .then(function(){var p=$('techPlateAlt');return p?ty(p,'8ABC123'):Promise.resolve();})
  .then(function(){return sl(SD);})
  .then(function(){var f=$q('#techFormContainerAlt form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say(L('✅ <b>Carlos Mendoza</b> registered.','✅ <b>Carlos Mendoza</b> registrado.'),'success');});
}
function s5(){
  say(L('⚡ Second technician — <b>Refrigeration</b>.','⚡ Segundo técnico — <b>Refrigeración</b>.'),'action');
  return sl(SD).then(function(){var btn=$q('#technicians-section [onclick*="showTechFormInTechSection"]');return btn?clk(btn):Promise.resolve();})
  .then(function(){return sl(400);})
  .then(function(){return ty($('techNameAlt'),'Miguel Ángel Torres');})
  .then(function(){return ty($('techPhoneAlt'),'(909) 555-7890');})
  .then(function(){return ty($('techEmailAlt'),'miguel@rodriguezhvac.com');})
  .then(function(){sv($('techSpecialtyAlt'),'Refrigeración');var cb=$('techCreateLoginAlt');if(cb)cb.checked=false;return sl(50);})
  .then(function(){var v=$('techVehicleAlt');return v?ty(v,'2022 Chevy Express'):Promise.resolve();})
  .then(function(){var p=$('techPlateAlt');return p?ty(p,'7DEF456'):Promise.resolve();})
  .then(function(){var f=$q('#techFormContainerAlt form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say(L('✅ <b>2 technicians</b> with GPS and mobile access.','✅ <b>2 técnicos</b> con GPS y acceso móvil.'),'success');});
}
function s6(){
  say(L('📍 <b>Home Advisors</b>','📍 <b>Asesores del Hogar</b>'),'nav');
  return sl(SD).then(function(){showSection('advisors');return sl(SD);})
  .then(function(){var btn=$q('#advisors-section [onclick*="showAdvisorForm"]');return btn?clk(btn):Promise.resolve();})
  .then(function(){return sl(400);})
  .then(function(){say(L('✏️ <b>Diana Castillo</b> — goal $50K/month','✏️ <b>Diana Castillo</b> — meta $50K/mes'),'action');return ty($('advisorName'),'Diana Castillo');})
  .then(function(){return ty($('advisorPhone'),'(909) 555-2345');})
  .then(function(){return ty($('advisorEmail'),'diana@rodriguezhvac.com');})
  .then(function(){sv($('advisorSpecialty'),'Residencial y Comercial');return ty($('advisorZone'),'Inland Empire');})
  .then(function(){var g=$('advisorGoal');return g?ty(g,'50000'):Promise.resolve();})
  .then(function(){$('advisorForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say(L('✅ <b>Diana Castillo</b> — commissions 5%-20%.','✅ <b>Diana Castillo</b> — comisiones 5%-20%.'),'success');});
}
function s7(){
  say(L('📍 <b>Dispatch</b> — create jobs','📍 <b>Despacho</b> — crear trabajos'),'nav');
  return sl(SD).then(function(){showSection('dispatch');return sl(SD);})
  .then(function(){var btn=$q('#dispatch-section [onclick*="showJobForm"]');return btn?clk(btn):Promise.resolve();})
  .then(function(){return sl(400);})
  .then(function(){say(L('✏️ <b>AC Repair</b> $850 → Carlos','✏️ <b>AC Repair</b> $850 → Carlos'),'action');return ty($('jobTitle'),'AC Repair - Goodman not cooling');})
  .then(function(){sv($('jobServiceType'),'Reparación');sv($('jobPriority'),'high');return ty($('jobAddress'),'456 Oak St, Fontana, CA');})
  .then(function(){var d=$('jobDate');if(d)d.value=new Date().toISOString().split('T')[0];
    var la=$('jobLat'),ln=$('jobLng');if(la)la.value='34.09';if(ln)ln.value='-117.43';
    var ts=$('jobTechId');if(ts&&window.techsData&&techsData[0])sv(ts,techsData[0].id);
    return ty($('jobNotes'),L('Capacitor and contactor. María García. $850','Capacitor y contactor. María García. $850'));})
  .then(function(){$('jobForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say(L('✅ Job assigned to <b>Carlos</b>.','✅ Trabajo asignado a <b>Carlos</b>.'),'success');});
}
function s8(){
  say(L('⚡ <b>Walk-in Cooler</b> URGENT','⚡ <b>Walk-in Cooler</b> URGENTE'),'action');
  return sl(SD).then(function(){var btn=$q('#dispatch-section [onclick*="showJobForm"]');return btn?clk(btn):Promise.resolve();})
  .then(function(){return sl(400);})
  .then(function(){return ty($('jobTitle'),'Walk-in Cooler - Compressor');})
  .then(function(){sv($('jobServiceType'),'Reparación');sv($('jobPriority'),'urgent');return ty($('jobAddress'),'2890 Highland Ave, SB, CA');})
  .then(function(){var d=$('jobDate');if(d)d.value=new Date().toISOString().split('T')[0];
    var la=$('jobLat'),ln=$('jobLng');if(la)la.value='34.12';if(ln)ln.value='-117.29';
    var ts=$('jobTechId');if(ts&&window.techsData&&techsData[1])sv(ts,techsData[1].id);
    return ty($('jobNotes'),L('Urgent. Cooler 55°F. La Michoacana. $2,200','Urgente. Cooler 55°F. La Michoacana. $2,200'));})
  .then(function(){$('jobForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say(L('✅ <b>2 jobs</b> $3,050.','✅ <b>2 trabajos</b> $3,050.'),'success');});
}
function s9(){
  say(L('📍 <b>Service Calls</b> — EMERGENCY','📍 <b>Llamadas de Servicio</b> — EMERGENCIA'),'nav');
  return sl(SD).then(function(){showSection('servicecalls');return sl(SD);})
  .then(function(){var btn=$q('#servicecalls-section [onclick*="showServiceCallForm"]');return btn?clk(btn):Promise.resolve();})
  .then(function(){return sl(400);})
  .then(function(){say(L('✏️ Emergency: <b>AC not cooling</b>','✏️ Emergencia: <b>AC no enfría</b>'),'action');return ty($('scClientName'),'María García');})
  .then(function(){return ty($('scClientPhone'),'(909) 555-1234');})
  .then(function(){return ty($('scAddress'),'456 Oak St, Fontana, CA');})
  .then(function(){return ty($('scProblem'),L('AC not cooling. Hot air only. Pet in house. Urgent.','AC no enfría. Aire caliente. Mascota. Urgente.'));})
  .then(function(){sv($('scUrgency'),'emergency');sv($('scPropertyType'),'residential');
    var pd=$('scPreferredDate');if(pd)pd.value=new Date().toISOString().split('T')[0];
    if(window.techsData&&techsData[0]){var st=$('scTechAssign');if(st)sv(st,techsData[0].id);}
    return ty($('scNotes'),'Gate #1234.');})
  .then(function(){$('serviceCallForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say(L('✅ <b style="color:#ef4444">🔴 EMERGENCY</b> dispatched.','✅ <b style="color:#ef4444">🔴 EMERGENCIA</b> despachada.'),'success');});
}
function s10(){
  say(L('📍 <b>GPS Dispatch</b> — live tracking','📍 <b>Despacho GPS</b> — monitoreo en vivo'),'nav');
  return sl(SD).then(function(){showSection('dispatch');return sl(SD);})
  .then(function(){say(L('🚐 Carlos → Fontana<br>🚐 Miguel → San Bernardino<br>Real-time GPS. Customer gets tracking link.','🚐 Carlos → Fontana<br>🚐 Miguel → San Bernardino<br>GPS en tiempo real. Cliente recibe link de tracking.'),'info');return sl(SD);})
  .then(function(){say(L('✅ Control center operating.','✅ Centro de control operando.'),'success');});
}
function s11(){
  say(L('📍 <b>Payroll</b>','📍 <b>Nómina</b>'),'nav');
  return sl(SD).then(function(){showSection('payroll');return sl(SD);})
  .then(function(){
    var e=[{id:'py1',company_id:'demo-co',tech_id:techsData[0]?techsData[0].id:null,tech_name:techsData[0]?techsData[0].name:'Carlos',type:'hourly',hours:42,rate:35,total:1470,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()},
    {id:'py2',company_id:'demo-co',tech_id:techsData[1]?techsData[1].id:null,tech_name:techsData[1]?techsData[1].name:'Miguel',type:'hourly',hours:38,rate:30,total:1140,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()},
    {id:'py3',company_id:'demo-co',tech_id:null,tech_name:advisorsData&&advisorsData[0]?advisorsData[0].name:'Diana Castillo',type:'commission',hours:0,rate:0,total:457.50,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()}];
    e.forEach(function(x){_db.payroll_entries.push(x);});window.payrollData=e;renderPayroll();return sl(SD);})
  .then(function(){say('✅ Carlos: <b>$1,470</b> | Miguel: <b>$1,140</b> | Diana: <b>$457.50</b> | Total: <b>$3,067.50</b>','success');});
}
function s12(){
  say(L('📍 <b>Invoices</b>','📍 <b>Facturas</b>'),'nav');
  return sl(SD).then(function(){showSection('invoices');return sl(SD);})
  .then(function(){
    var inv={id:'inv1',company_id:'demo-co',invoice_number:'INV-202602-0001',client_name:'María García',client_email:'maria.garcia@email.com',client_phone:'(909) 555-1234',client_address:'456 Oak St, Fontana',line_items:[{name:'Service Call',qty:1,unit_price:120,labor:0,total:120},{name:'Capacitor 45/5',qty:1,unit_price:85,labor:0,total:85},{name:'Contactor 2P',qty:1,unit_price:65,labor:0,total:65},{name:'Labor',qty:2,unit_price:0,labor:125,total:250}],subtotal:520,total:520,balance_due:520,amount_paid:0,status:'draft',created_at:new Date().toISOString()};
    _db.invoices.push(inv);window.invoicesData=[inv];renderInvoiceKPIs();renderInvoicesTable();return sl(SD);})
  .then(function(){say('✅ <b>INV-0001</b> $520: Service $120 + Capacitor $85 + Contactor $65 + Labor $250','success');});
}
function s13(){
  say(L('⚡ Marking <b>PAID</b>...','⚡ Marcando <b>PAGADA</b>...'),'action');
  return sl(SD).then(function(){
    invoicesData[0].status='paid';invoicesData[0].amount_paid=520;invoicesData[0].balance_due=0;
    var inv2={id:'inv2',company_id:'demo-co',invoice_number:'INV-202602-0002',client_name:'La Michoacana',client_phone:'(909) 555-5678',client_email:'lm@email.com',client_address:'2890 Highland, SB',line_items:[{name:'Cooler Repair',qty:1,unit_price:1800,labor:400,total:2200}],subtotal:2200,total:2200,balance_due:2200,amount_paid:0,status:'sent',created_at:new Date().toISOString()};
    _db.invoices.push(inv2);invoicesData.push(inv2);renderInvoiceKPIs();renderInvoicesTable();return sl(SD);})
  .then(function(){say(L('✅ INV-0001 <b style="color:#16a34a">PAID</b> $520 | INV-0002 <b style="color:#f59e0b">$2,200 pending</b>','✅ INV-0001 <b style="color:#16a34a">PAGADA</b> $520 | INV-0002 <b style="color:#f59e0b">$2,200 pendiente</b>'),'success');});
}
function s14(){
  say(L('📍 <b>Expenses</b>','📍 <b>Gastos</b>'),'nav');
  return sl(SD).then(function(){showSection('expenses');return sl(SD);})
  .then(function(){var btn=$q('#expenses-section [onclick*="showExpenseForm"]');return btn?clk(btn):Promise.resolve();})
  .then(function(){return sl(400);})
  .then(function(){say(L('✏️ Gas <b>$287.50</b>','✏️ Gasolina <b>$287.50</b>'),'action');sv($('expCategory'),'vehicle_gas');return ty($('expVendor'),'Chevron');})
  .then(function(){return ty($('expAmount'),'287.50');})
  .then(function(){sv($('expFrequency'),'monthly');sv($('expType'),'variable');$('expDate').value=new Date().toISOString().split('T')[0];return sl(SD);})
  .then(function(){var f=$q('#expenses-section form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(600);})
  .then(function(){
    [{category:'general_liability',vendor:'State Farm',amount:450,type:'fixed'},
     {category:'software_crm',vendor:'Trade Master CRM',amount:149.99,type:'fixed'},
     {category:'vehicle_payment',vendor:'Ford Motor Credit',amount:650,type:'fixed'}]
    .forEach(function(e){e.id='exp'+(++_idc);e.company_id='demo-co';e.frequency='monthly';e.date=new Date().toISOString().split('T')[0];e.created_at=new Date().toISOString();_db.expenses.push(e);expensesData.push(e);});
    renderExpenses();return sl(SD);})
  .then(function(){say(L('✅ <b>4 expenses</b> — Total: <b>$1,537.49</b>','✅ <b>4 gastos</b> — Total: <b>$1,537.49</b>'),'success');});
}
function s15(){
  say(L('📍 <b>My Money</b>','📍 <b>Mi Dinero</b>'),'nav');
  return sl(SD).then(function(){showSection('mymoney');return sl(SD);})
  .then(function(){say(L('✅ Income vs Expenses chart. Real-time transactions.','✅ Gráfica ingresos vs gastos. Transacciones en tiempo real.'),'success');});
}
function s16(){
  say(L('📍 <b>Payroll</b> detailed','📍 <b>Nómina</b> detallada'),'nav');
  return sl(SD).then(function(){showSection('payroll');return sl(SD);})
  .then(function(){say(L('✅ Full table. Export to QuickBooks, ADP, Gusto.','✅ Tabla completa. Exporta a QuickBooks, ADP, Gusto.'),'success');});
}
function s17(){
  say(L('📍 <b>Marketing</b>','📍 <b>Mercadotecnia</b>'),'nav');
  return sl(SD).then(function(){showSection('marketing');return sl(SD);})
  .then(function(){var btn=$q('#marketing-section [onclick*="showCampaignForm"]');return btn?clk(btn):Promise.resolve();})
  .then(function(){return sl(400);})
  .then(function(){say(L('✏️ <b>AC Tune-Up $79</b> Google Ads','✏️ <b>AC Tune-Up $79</b> Google Ads'),'action');return ty($('campName'),'Promo Summer - AC Tune-Up $79');})
  .then(function(){sv($('campType'),'google_ads');return ty($('campBudget'),'1500');})
  .then(function(){var cs=$('campStart'),ce=$('campEnd');if(cs)cs.value=new Date().toISOString().split('T')[0];if(ce){var d=new Date();d.setDate(d.getDate()+60);ce.value=d.toISOString().split('T')[0];}
    return ty($('campMessage'),'Tune-Up $79. Rodriguez HVAC. (909) 555-0000');})
  .then(function(){var f=$q('#marketing-section form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say(L('✅ Campaign <b>Google Ads</b> $1,500 active.','✅ Campaña <b>Google Ads</b> $1,500 activa.'),'success');});
}
function s18(){
  say(L('📍 <b>Price Book</b>','📍 <b>Lista de Precios</b>'),'nav');
  return sl(SD).then(function(){showSection('pricebook');return sl(SD);})
  .then(function(){
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
    window.priceBookData=_db.price_book.slice();renderPriceBook();return sl(SD);})
  .then(function(){say(L('✅ <b>10 items</b> — Capacitor $12→$85 (608%), R-410A $15→$85 (467%)','✅ <b>10 artículos</b> — Capacitor $12→$85 (608%), R-410A $15→$85 (467%)'),'success');});
}
function s19(){
  say(L('📍 <b>Reports</b>','📍 <b>Reportes</b>'),'nav');
  return sl(SD).then(function(){showSection('reports');return sl(SD);})
  .then(function(){say(L('✅ Revenue, jobs by tech, lead sources, productivity. Export to PDF.','✅ Revenue, trabajos por técnico, fuentes, productividad. Exporta a PDF.'),'success');});
}
function s20(){
  say(L('📍 <b>Settings</b>','📍 <b>Configuración</b>'),'nav');
  return sl(SD).then(function(){showSection('settings');return sl(SD);})
  .then(function(){say(L('✅ Company configured: license, bond, legal docs.','✅ Empresa configurada: licencia, bond, documentos legales.'),'success');return sl(SD);})
  .then(function(){say(L('📍 <b>Dashboard</b> final','📍 <b>Dashboard</b> final'),'nav');showSection('dashboard');return sl(SD);})
  .then(function(){say(L('🎉 <b>DEMO COMPLETE!</b><br>👥 2 clients | 🎯 1 lead | 👷 2 techs | 🏠 1 advisor<br>🔧 2 jobs $3,050 | 📞 1 emergency<br>📄 2 invoices $2,720 | 📣 1 campaign | 📒 10 items','🎉 <b>¡DEMO COMPLETADO!</b><br>👥 2 clientes | 🎯 1 lead | 👷 2 técnicos | 🏠 1 advisor<br>🔧 2 trabajos $3,050 | 📞 1 emergencia<br>📄 2 facturas $2,720 | 📣 1 campaña | 📒 10 artículos'),'success');return sl(600);})
  .then(function(){
    var ch=$('sfChat');var cta=document.createElement('div');
    cta.innerHTML='<div style="padding:14px;text-align:center"><a href="'+location.pathname+'" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;text-decoration:none;border-radius:14px;font-weight:700;font-size:15px;box-shadow:0 6px 20px rgba(249,115,22,.4)">🚀 '+L('Sign Up Now','Registrarme')+'</a><p style="margin-top:8px;font-size:11px;color:var(--text-muted)">'+L('Free 10 clients | Pro $149.99/mo','Free 10 clientes | Pro $149.99/mes')+'</p></div>';
    ch.appendChild(cta);ch.scrollTop=99999;
  });
}
/* ===== INIT - Wait for CRM to fully load ===== */
document.addEventListener('DOMContentLoaded',function(){
  // script.js DOMContentLoaded fires first, inits CRM with our mock
  // Give it time to finish async init (loadCompanyId, showDashboard, loadAllData)
  setTimeout(function(){
    injectCSS();initVoice();
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
