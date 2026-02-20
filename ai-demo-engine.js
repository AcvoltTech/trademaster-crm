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
  $('sfMute').onclick=function(){_ttsOn=!_ttsOn;this.textContent=_ttsOn?'\uD83D\uDD0A':'\uD83D\uDD07';if(!_ttsOn){if(window.speechSynthesis)speechSynthesis.cancel();if(_currentAudio){try{_currentAudio.pause();}catch(e){}}}};
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
      var a=new Audio(URL.createObjectURL(b));
      _currentAudio=a;
      a.onended=function(){URL.revokeObjectURL(a.src);fin();};
      a.onerror=function(){URL.revokeObjectURL(a.src);fin();};
      // Wait for audio to be ready before playing
      a.oncanplaythrough=function(){
        a.play().then(function(){
          // Audio is playing! Set safety timeout based on actual duration
          var safeDur=(a.duration||30)*1000+3000;
          setTimeout(fin,safeDur);
        }).catch(function(){
          // Autoplay blocked - fall back to Web Speech
          console.warn('Autoplay blocked, using Web Speech');
          speakWS(txt).then(fin);
        });
      };
      a.load();
    })
    .catch(function(e){
      console.warn('EL error, falling back to Web Speech:',e);
      speakWS(txt).then(fin);
    });
    // Ultimate safety: 90 seconds max (for very long messages)
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

/* ===== 35 STEPS - FULL CRM TUTORIAL ===== */


/* ===== 35 STEPS - FULL SALES NARRATION - SYNCHRONIZED ===== */

function s1(){
  return sayW(L(
    "👋 <b>Thank you for choosing Trade Master CRM</b> to manage your company and take it to the next level! My name is <b>Danielle</b>, and I'm going to personally walk you through every single feature of this CRM. I'll show you exactly what each section does, why it matters for your business, and how to use it. By the end, you'll know how to run your entire company from one place. Let's get started!",
    "👋 <b>¡Gracias por elegir Trade Master CRM</b> para administrar tu empresa y llevarla al siguiente nivel! Mi nombre es <b>Brenda</b>, y te voy a enseñar personalmente cada función de este CRM. Te voy a mostrar exactamente qué hace cada sección, por qué es importante para tu negocio, y cómo usarla. Al final, vas a saber cómo manejar toda tu empresa desde un solo lugar. ¡Empecemos!"
  ),'info');
}

function s2(){
  return sayW(L(
    "📍 This is your <b>Dashboard</b> — think of it as your business command center. Every morning when you open the CRM, this is the first thing you see. It shows you today's scheduled jobs, how much revenue you've made this week, which technicians are out in the field, and any urgent items that need your attention. Everything updates in real-time, so you always have the pulse of your business.",
    "📍 Este es tu <b>Tablero</b> — piensa en él como tu centro de comando. Cada mañana cuando abras el CRM, esto es lo primero que ves. Te muestra los trabajos programados de hoy, cuánto ingreso has generado esta semana, qué técnicos están en campo, y cualquier cosa urgente que necesite tu atención. Todo se actualiza en tiempo real, así que siempre tienes el pulso de tu negocio."
  ),'nav').then(ck).then(function(){smoothShow('dashboard');
    return sayW(L(
      "✅ See the cards at the top? Those are your KPIs — jobs won, revenue, service calls, and team performance. Below that you have the map showing technician locations, recent activity, and quick action buttons. Now let's fill this dashboard with real data!",
      "✅ ¿Ves las tarjetas arriba? Esos son tus KPIs — trabajos ganados, ingresos, llamadas de servicio y desempeño del equipo. Abajo tienes el mapa con ubicaciones de técnicos, actividad reciente y botones de acción rápida. ¡Ahora vamos a llenar este tablero con datos reales!"
    ),'success');
  });
}

function s3(){
  return sayW(L(
    "📍 The first thing every business needs is <b>customers</b>. Let me show you how the Customers section works. Look at the <b>sidebar on the left</b> — that's your main navigation menu. Every section of the CRM is right there. I'm going to click on <b>Customers</b> now.",
    "📍 Lo primero que todo negocio necesita son <b>clientes</b>. Déjame mostrarte cómo funciona la sección de Clientes. Mira la <b>barra lateral izquierda</b> — ese es tu menú de navegación principal. Cada sección del CRM está ahí. Voy a hacer click en <b>Clientes</b> ahora."
  ),'nav').then(ck).then(function(){smoothShow('clients');
    return sayW(L(
      "⚡ This is your <b>customer database</b>. Every person or business you serve gets stored here — their name, phone, email, address, property type, and any notes about them. You can search, filter, and sort. Now see that <b>orange button</b> at the top that says <b>'+ New Customer'</b>? That's how you add a new client. Let me show you — I'll click it and fill in a real customer.",
      "⚡ Esta es tu <b>base de datos de clientes</b>. Cada persona o negocio que atiendes se guarda aquí — su nombre, teléfono, email, dirección, tipo de propiedad y notas sobre ellos. Puedes buscar, filtrar y ordenar. Ahora ¿ves ese <b>botón naranja</b> arriba que dice <b>'+ Nuevo Cliente'</b>? Así es como agregas un cliente nuevo. Déjame mostrarte — voy a hacerle click y llenar un cliente real."
    ),'action');
  }).then(ck).then(function(){
    var btn=$q('#clients-section [onclick*="showClientForm()"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);});
}

function s4(){
  return sayW(L(
    "✏️ Perfect, the form is open. Watch how easy this is — I'll fill in each field one by one. Our first client is <b>María García</b>, a residential customer in Fontana whose AC isn't cooling.",
    "✏️ Perfecto, el formulario está abierto. Mira qué fácil es — voy a llenar cada campo uno por uno. Nuestra primera cliente es <b>María García</b>, una cliente residencial en Fontana cuyo AC no enfría."
  ),'action').then(ck).then(function(){
    return sayW(L("✏️ First, the <b>name</b>...","✏️ Primero, el <b>nombre</b>..."),'action');
  }).then(function(){return ty($('clientName'),'María García');
  }).then(function(){return sl(SD);
  }).then(ck).then(function(){
    return sayW(L("📞 Now the <b>phone number</b> — this is how the system will send appointment reminders and tracking links.","📞 Ahora el <b>teléfono</b> — así es como el sistema enviará recordatorios de citas y links de rastreo."),'action');
  }).then(function(){return ty($('clientPhone'),'(909) 555-1234');
  }).then(function(){return ty($('clientEmail'),'maria.garcia@email.com');
  }).then(function(){
    return sayW(L("🏠 I'm selecting <b>Residential</b> as property type. This matters because pricing and service are different for homes vs commercial buildings.","🏠 Selecciono <b>Residencial</b> como tipo de propiedad. Esto importa porque los precios y servicio son diferentes para casas vs edificios comerciales."),'action');
  }).then(function(){sv($('clientPropertyType'),'Residencial');
    return ty($('clientAddress'),'456 Oak St, Fontana, CA 92335');
  }).then(function(){
    return sayW(L("📝 And finally <b>notes</b> — always write important details about the customer. What equipment they have, any special instructions, language preference. This helps your techs provide better service.","📝 Y finalmente las <b>notas</b> — siempre escribe detalles importantes del cliente. Qué equipo tienen, instrucciones especiales, preferencia de idioma. Esto ayuda a tus técnicos a dar mejor servicio."),'action');
  }).then(function(){
    return ty($('clientNotes'),L('AC not cooling - Goodman 15 years. Service in Spanish. Gate code #1234.','AC no enfría - Goodman 15 años. Servicio en español. Código de reja #1234.'));
  }).then(function(){return sl(SD);
  }).then(ck).then(function(){
    return sayW(L("💾 Everything is filled in. Now I click <b>Save</b> and the customer is stored permanently in your database.","💾 Todo está lleno. Ahora hago click en <b>Guardar</b> y el cliente se guarda permanentemente en tu base de datos."),'action');
  }).then(function(){
    $('clientForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ Done! <b>María García</b> is now saved. See her in the list? That's how easy it is to add a customer. You can come back anytime to edit her info, add more notes, or view her history. Let's add one more.","✅ ¡Listo! <b>María García</b> está guardada. ¿La ves en la lista? Así de fácil es agregar un cliente. Puedes regresar cuando quieras a editar su info, agregar notas o ver su historial. Vamos a agregar uno más."),'success');
  });
}

function s5(){
  return sayW(L(
    "⚡ Now let me show you a <b>commercial client</b>. The process is exactly the same, but this time we're adding a restaurant — <b>La Michoacana</b>. For commercial clients, you also enter the business name, and select <b>Commercial</b> as property type. Watch...",
    "⚡ Ahora déjame mostrarte un <b>cliente comercial</b>. El proceso es exactamente igual, pero esta vez agregamos un restaurante — <b>La Michoacana</b>. Para clientes comerciales, también pones el nombre del negocio, y seleccionas <b>Comercial</b> como tipo. Mira..."
  ),'info').then(ck).then(function(){
    var btn=$q('#clients-section [onclick*="showClientForm()"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('clientName'),'Roberto Méndez');
  }).then(function(){var c=$('clientCompany');return c?ty(c,'La Michoacana Restaurant'):Promise.resolve();
  }).then(function(){return ty($('clientPhone'),'(909) 555-5678');
  }).then(function(){return ty($('clientEmail'),'lamichoacana@email.com');
  }).then(function(){sv($('clientPropertyType'),'Comercial');return ty($('clientAddress'),'2890 Highland Ave, San Bernardino, CA');
  }).then(function(){return ty($('clientNotes'),L('Walk-in cooler not holding temp. Open 7am-10pm. Urgent.','Walk-in cooler no mantiene temp. Abre 7am-10pm. Urgente.'));
  }).then(function(){return sl(SD);
  }).then(function(){$('clientForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>2 clients</b> saved — one residential, one commercial. Your customer table now shows both with all their details. As you add more customers, you can search by name, phone, or filter by property type. The CRM grows with your business!","✅ <b>2 clientes</b> guardados — uno residencial, uno comercial. Tu tabla de clientes ahora muestra ambos con todos sus detalles. Conforme agregues más clientes, puedes buscar por nombre, teléfono, o filtrar por tipo de propiedad. ¡El CRM crece con tu negocio!"),'success');
  });
}

function s6(){
  return sayW(L(
    "📍 Now let me take you to <b>Leads</b>. This is different from Customers. A <b>lead</b> is someone who called you, asked for a quote, but hasn't hired you yet. Think of it this way — every customer starts as a lead first. This section helps you track those opportunities so you never forget to follow up. Let me show you how it works.",
    "📍 Ahora déjame llevarte a <b>Prospectos</b>. Esto es diferente de Clientes. Un <b>prospecto</b> es alguien que te llamó, pidió cotización, pero aún no te contrata. Piénsalo así — cada cliente empieza como prospecto primero. Esta sección te ayuda a rastrear esas oportunidades para que nunca olvides darle seguimiento. Déjame mostrarte cómo funciona."
  ),'nav').then(ck).then(function(){smoothShow('leads');
    return sayW(L("⚡ I'm going to add a lead — <b>Roberto Sánchez</b>, who wants a brand new furnace installed. That's a <b>$4,500 opportunity</b>. Watch how we capture all the details...","⚡ Voy a agregar un prospecto — <b>Roberto Sánchez</b>, que quiere un furnace nuevo instalado. Esa es una <b>oportunidad de $4,500</b>. Mira cómo capturamos todos los detalles..."),'action');
  }).then(ck).then(function(){
    var btn=$q('#leads-section [onclick*="showLeadForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('leadName'),'Roberto Sánchez');
  }).then(function(){return ty($('leadPhone'),'(909) 555-9012');
  }).then(function(){return ty($('leadEmail'),'roberto.s@email.com');
  }).then(function(){sv($('leadService'),'Calefacción');sv($('leadPropertyType'),'residential');return ty($('leadAddress'),'1025 Pine Ave, Rialto, CA');
  }).then(function(){return ty($('leadNotes'),L('New furnace. 1800sqft house. Budget around $4,500. Wife makes decisions.','Furnace nuevo. Casa 1800sqft. Budget aprox $4,500. Esposa toma decisiones.'));
  }).then(function(){var la=$('leadLat'),ln=$('leadLng');if(la)la.value='34.1064';if(ln)ln.value='-117.3703';return sl(SD);
  }).then(function(){$('leadForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ Lead saved! 🔥 See him on the map with a pin? The CRM shows you exactly where your opportunities are. When Roberto signs the contract, you convert him to a customer with <b>one click</b> — all his info transfers automatically. No retyping!","✅ ¡Prospecto guardado! 🔥 ¿Lo ves en el mapa con un pin? El CRM te muestra exactamente dónde están tus oportunidades. Cuando Roberto firme el contrato, lo conviertes a cliente con <b>un click</b> — toda su info se transfiere automáticamente. ¡Sin volver a escribir!"),'success');
  });
}

function s7(){
  return sayW(L(
    "📍 Speaking of sales — let me show you the <b>Sales Pipeline</b>. This is one of the most powerful features. It shows you a visual board of every deal you're working on, organized in columns: <b>New Lead, Contacted, Quoted, Negotiating, Won, and Lost</b>. Think of it like a funnel — leads come in on the left, and money comes out on the right.",
    "📍 Hablando de ventas — déjame mostrarte el <b>Flujo de Ventas</b>. Esta es una de las funciones más poderosas. Te muestra un tablero visual de cada trato en el que estás trabajando, organizado en columnas: <b>Nuevo, Contactado, Cotizado, Negociando, Ganado y Perdido</b>. Piénsalo como un embudo — los prospectos entran por la izquierda, y el dinero sale por la derecha."
  ),'nav').then(ck).then(function(){smoothShow('pipeline');
    return sayW(L("✅ You drag and drop deals between columns as they progress. At a glance you can see: how many deals are open, what's your total pipeline value, and what's your closing rate. This is how professional HVAC companies track their sales!","✅ Arrastras y sueltas los tratos entre columnas conforme avanzan. De un vistazo puedes ver: cuántos tratos tienes abiertos, cuál es el valor total de tu pipeline, y cuál es tu tasa de cierre. ¡Así es como las empresas profesionales de HVAC rastrean sus ventas!"),'success');
  });
}

function s8(){
  return sayW(L(
    "📍 Now let's add your <b>field team</b>. The <b>Technicians</b> section is where you register every tech who works for you. Here's what makes this special — each technician gets their own <b>mobile login</b> so they can see their jobs on their phone, plus <b>GPS tracking</b> so you always know where your vans are. Let me show you how to add one.",
    "📍 Ahora vamos a agregar tu <b>equipo de campo</b>. La sección de <b>Técnicos</b> es donde registras a cada técnico que trabaja para ti. Lo especial es que cada técnico recibe su propio <b>acceso móvil</b> para que vea sus trabajos en su celular, más <b>rastreo GPS</b> para que siempre sepas dónde están tus camionetas. Déjame mostrarte cómo agregar uno."
  ),'nav').then(ck).then(function(){smoothShow('technicians');
    return sayW(L("⚡ I'll click <b>'+ New Technician'</b> and fill in the form. We're adding <b>Carlos Mendoza</b> — he's our HVAC specialist.","⚡ Voy a hacer click en <b>'+ Nuevo Técnico'</b> y llenar el formulario. Estamos agregando a <b>Carlos Mendoza</b> — es nuestro especialista en HVAC."),'action');
  }).then(ck).then(function(){
    var btn=$q('#technicians-section [onclick*="showTechFormInTechSection"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('techNameAlt'),'Carlos Mendoza');
  }).then(function(){return ty($('techPhoneAlt'),'(909) 555-3456');
  }).then(function(){return ty($('techEmailAlt'),'carlos@rodriguezhvac.com');
  }).then(function(){sv($('techSpecialtyAlt'),'HVAC');var cb=$('techCreateLoginAlt');if(cb)cb.checked=false;return sl(300);
  }).then(function(){
    return sayW(L("🚐 Notice I'm also adding his <b>vehicle info</b> — make, model, and plate number. This connects to the GPS tracking so you can see which van is where on the map.","🚐 Nota que también agrego la <b>info de su vehículo</b> — marca, modelo y placas. Esto se conecta al rastreo GPS para que veas qué camioneta está dónde en el mapa."),'action');
  }).then(function(){var v=$('techVehicleAlt');return v?ty(v,'2023 Ford Transit'):Promise.resolve();
  }).then(function(){var p=$('techPlateAlt');return p?ty(p,'8ABC123'):Promise.resolve();
  }).then(function(){var f=$q('#techFormContainerAlt form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>Carlos Mendoza</b> is now registered! He'll show up on the dispatch map, he can receive job notifications on his phone, and customers can track his arrival in real-time. Pretty powerful, right?","✅ ¡<b>Carlos Mendoza</b> está registrado! Va a aparecer en el mapa de despacho, puede recibir notificaciones de trabajos en su celular, y los clientes pueden rastrear su llegada en tiempo real. Bastante poderoso, ¿verdad?"),'success');
  });
}

function s9(){
  return sayW(L("⚡ Let me quickly add a second technician — <b>Miguel Ángel Torres</b>, who specializes in <b>Commercial Refrigeration</b>. Same process, different specialty.","⚡ Déjame agregar rápidamente un segundo técnico — <b>Miguel Ángel Torres</b>, especialista en <b>Refrigeración Comercial</b>. Mismo proceso, diferente especialidad."),'action'
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
    return sayW(L("✅ <b>2 technicians</b> registered, each with their vehicle and GPS. They can see their daily schedule on their phones and clock in and out from the field!","✅ <b>2 técnicos</b> registrados, cada uno con su vehículo y GPS. ¡Pueden ver su horario diario en su celular y registrar entrada y salida desde el campo!"),'success');
  });
}

function s10(){
  return sayW(L(
    "📍 Now <b>Home Advisors</b> — this is your <b>sales team</b>. These are the people who visit homes, present quotes, and close deals on installations. The CRM tracks their sales, calculates their commissions automatically, and shows them their performance against their monthly goal. Let me add one.",
    "📍 Ahora <b>Asesores del Hogar</b> — este es tu <b>equipo de ventas</b>. Son las personas que visitan casas, presentan cotizaciones y cierran tratos de instalaciones. El CRM rastrea sus ventas, calcula sus comisiones automáticamente, y les muestra su desempeño contra su meta mensual. Déjame agregar uno."
  ),'nav').then(ck).then(function(){smoothShow('advisors');
    var btn=$q('#advisors-section [onclick*="showAdvisorForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('advisorName'),'Diana Castillo');
  }).then(function(){return ty($('advisorPhone'),'(909) 555-2345');
  }).then(function(){return ty($('advisorEmail'),'diana@rodriguezhvac.com');
  }).then(function(){sv($('advisorSpecialty'),'Residencial y Comercial');return ty($('advisorZone'),'Inland Empire');
  }).then(function(){var g=$('advisorGoal');return g?ty(g,'50000'):Promise.resolve();
  }).then(function(){$('advisorForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>Diana Castillo</b> is registered with a <b>$50,000/month sales goal</b>. The CRM calculates her commissions — 5% to 20% based on profit margins. She can log in and see her dashboard with sales performance, pending quotes, and commission earned. This motivates your sales team!","✅ <b>Diana Castillo</b> está registrada con una <b>meta de ventas de $50,000/mes</b>. El CRM calcula sus comisiones — 5% a 20% basado en márgenes de ganancia. Ella puede iniciar sesión y ver su tablero con desempeño de ventas, cotizaciones pendientes y comisión ganada. ¡Esto motiva a tu equipo de ventas!"),'success');
  });
}

function s11(){
  return sayW(L(
    "📍 Let me show you the <b>Calendar</b>. This is your scheduling hub — every appointment, job, follow-up call, and reminder shows up here in one view. You can see your entire team's schedule: which technician is booked when, what time slots are open, and upcoming deadlines. You can create appointments, drag them to reschedule, and set automatic reminders so nothing falls through the cracks.",
    "📍 Déjame mostrarte el <b>Calendario</b>. Este es tu centro de horarios — cada cita, trabajo, llamada de seguimiento y recordatorio aparece aquí en una vista. Puedes ver el horario de todo tu equipo: qué técnico está reservado cuándo, qué horarios están abiertos, y fechas límite próximas. Puedes crear citas, arrastrarlas para re-agendar, y poner recordatorios automáticos para que nada se te escape."
  ),'nav').then(ck).then(function(){smoothShow('calendar');
    return sayW(L("✅ Think of this as your digital whiteboard. No more sticky notes or forgetting appointments. Everything is here, organized by day, week, or month!","✅ Piensa en esto como tu pizarra digital. No más notas pegajosas ni citas olvidadas. ¡Todo está aquí, organizado por día, semana o mes!"),'success');
  });
}

function s12(){
  return sayW(L(
    "📍 Now the real power — <b>Dispatch</b>! This is your <b>command center</b>. When a job needs to get done, this is where you create it, assign it to a technician, and track it on the map. Think of it like being an air traffic controller, but for HVAC vans. Let me create a real job and show you how it works.",
    "📍 Ahora el verdadero poder — ¡<b>Despacho</b>! Este es tu <b>centro de control</b>. Cuando un trabajo necesita hacerse, aquí es donde lo creas, lo asignas a un técnico, y lo rastreas en el mapa. Piénsalo como ser un controlador de tráfico aéreo, pero para camionetas de HVAC. Déjame crear un trabajo real y mostrarte cómo funciona."
  ),'nav').then(ck).then(function(){smoothShow('dispatch');
    return sayW(L("⚡ I'll click <b>'+ New Job'</b>. We're sending Carlos to fix María García's AC — that's an $850 repair.","⚡ Voy a hacer click en <b>'+ Nuevo Trabajo'</b>. Estamos enviando a Carlos a arreglar el AC de María García — es una reparación de $850."),'action');
  }).then(ck).then(function(){
    var btn=$q('#dispatch-section [onclick*="showJobForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('jobTitle'),'AC Repair - Goodman not cooling');
  }).then(function(){sv($('jobServiceType'),'Reparación');sv($('jobPriority'),'high');return ty($('jobAddress'),'456 Oak St, Fontana, CA');
  }).then(function(){var d=$('jobDate');if(d)d.value=new Date().toISOString().split('T')[0];var la=$('jobLat'),ln=$('jobLng');if(la)la.value='34.09';if(ln)ln.value='-117.43';var ts=$('jobTechId');if(ts&&window.techsData&&techsData[0])sv(ts,techsData[0].id);return ty($('jobNotes'),L('Capacitor and contactor replacement. $850','Reemplazo de capacitor y contactor. $850'));
  }).then(function(){$('jobForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ Job created and assigned to <b>Carlos</b>! Here's what happens automatically: Carlos gets a notification on his phone with the address and all job details. The customer, María, gets a <b>tracking link</b> so she can see when Carlos is on his way — just like Uber, but for HVAC! How cool is that?","✅ ¡Trabajo creado y asignado a <b>Carlos</b>! Esto es lo que pasa automáticamente: Carlos recibe una notificación en su celular con la dirección y todos los detalles. La cliente, María, recibe un <b>link de rastreo</b> para que vea cuándo Carlos va en camino — ¡igual que Uber, pero para HVAC! ¿Qué te parece?"),'success');
  });
}

function s13(){
  return sayW(L("⚡ Let me create a second job — this one is <b>URGENT</b>! The restaurant La Michoacana has a walk-in cooler failing. Food is at risk. We need Miguel there immediately. Watch how I set the priority to Urgent...","⚡ Déjame crear un segundo trabajo — ¡este es <b>URGENTE</b>! El restaurante La Michoacana tiene el walk-in cooler fallando. La comida está en riesgo. Necesitamos a Miguel ahí inmediatamente. Mira cómo pongo la prioridad en Urgente..."),'action'
  ).then(ck).then(function(){
    var btn=$q('#dispatch-section [onclick*="showJobForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('jobTitle'),'Walk-in Cooler - Compressor');
  }).then(function(){sv($('jobServiceType'),'Reparación');sv($('jobPriority'),'urgent');return ty($('jobAddress'),'2890 Highland Ave, SB, CA');
  }).then(function(){var d=$('jobDate');if(d)d.value=new Date().toISOString().split('T')[0];var la=$('jobLat'),ln=$('jobLng');if(la)la.value='34.12';if(ln)ln.value='-117.29';var ts=$('jobTechId');if(ts&&window.techsData&&techsData[1])sv(ts,techsData[1].id);return ty($('jobNotes'),L('Urgent. Cooler at 55°F. Food at risk. $2,200','Urgente. Cooler a 55°F. Comida en riesgo. $2,200'));
  }).then(function(){$('jobForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ <b>2 jobs dispatched</b> — that's <b>$3,050 in revenue</b> right there! Carlos is heading to Fontana, Miguel to San Bernardino. Both tracked live on the map.","✅ <b>2 trabajos despachados</b> — ¡eso son <b>$3,050 en ingresos</b>! Carlos va camino a Fontana, Miguel a San Bernardino. Ambos rastreados en vivo en el mapa."),'success');
  });
}

function s14(){
  return sayW(L(
    "📍 Now <b>Service Calls</b>. This is different from Dispatch. When a customer calls your office with an emergency — the phone is ringing, they're stressed, their AC is out and it's 110 degrees — this is where your receptionist logs that call <b>fast</b>. Name, phone, address, problem, urgency level. Boom — logged and dispatched in under a minute.",
    "📍 Ahora <b>Llamadas de Servicio</b>. Esto es diferente de Despacho. Cuando un cliente llama a tu oficina con una emergencia — el teléfono está sonando, están estresados, su AC no funciona y están a 43 grados — aquí es donde tu recepcionista registra esa llamada <b>rápido</b>. Nombre, teléfono, dirección, problema, nivel de urgencia. ¡Pum! Registrada y despachada en menos de un minuto."
  ),'nav').then(ck).then(function(){smoothShow('servicecalls');
    return sayW(L("⚡ Let me show you — I'm logging an emergency call right now. María García's AC stopped working and she has a pet in the house!","⚡ Déjame mostrarte — estoy registrando una llamada de emergencia ahora. ¡El AC de María García dejó de funcionar y tiene una mascota en la casa!"),'action');
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
    return sayW(L("✅ <b style='color:#ef4444'>🔴 EMERGENCY</b> call logged and dispatched! The technician gets an immediate push notification. The call is tracked with a timestamp so you have a record of every emergency. This protects your business legally too!","✅ ¡Llamada de <b style='color:#ef4444'>🔴 EMERGENCIA</b> registrada y despachada! El técnico recibe una notificación push inmediata. La llamada queda registrada con fecha y hora para que tengas historial de cada emergencia. ¡Esto también protege tu negocio legalmente!"),'success');
  });
}

function s15(){
  return sayW(L(
    "📍 Let me go back to <b>Dispatch</b> to show you the <b>GPS tracking map</b>. This is one of the features our customers love the most.",
    "📍 Déjame regresar a <b>Despacho</b> para mostrarte el <b>mapa de rastreo GPS</b>. Esta es una de las funciones que más les encanta a nuestros clientes."
  ),'nav').then(ck).then(function(){smoothShow('dispatch');
    return sayW(L(
      "🚐 Look at the map! You can see exactly where each technician is in real-time. Carlos is heading to Fontana, Miguel is heading to San Bernardino. You can re-assign jobs, check arrival times, and even send the customer a tracking link so they know exactly when the tech will arrive. No more 'he'll be there between 8 and 12.' Your customers know the EXACT arrival time!",
      "🚐 ¡Mira el mapa! Puedes ver exactamente dónde está cada técnico en tiempo real. Carlos va camino a Fontana, Miguel va camino a San Bernardino. Puedes re-asignar trabajos, checar tiempos de llegada, y hasta enviarle al cliente un link de rastreo para que sepan exactamente cuándo llega el técnico. No más 'llega entre 8 y 12.' ¡Tus clientes saben la hora EXACTA de llegada!"
    ),'success');
  });
}

function s16(){
  return sayW(L(
    "📍 The <b>Jobs</b> section is your master list of ALL work orders. Think of Dispatch as creating and assigning jobs, and this section as viewing and managing them. You can filter by status — pending, in progress, completed — and see the revenue each job brings in. It's your complete work history.",
    "📍 La sección de <b>Trabajos</b> es tu lista maestra de TODAS las órdenes de trabajo. Piensa en Despacho como crear y asignar trabajos, y esta sección como verlos y administrarlos. Puedes filtrar por estatus — pendiente, en progreso, completado — y ver el ingreso de cada trabajo. Es tu historial completo de trabajo."
  ),'nav').then(ck).then(function(){smoothShow('jobs');
    return sayW(L("✅ Every job from creation to completion — tracked right here. You can export to PDF for your records or for insurance claims.","✅ Cada trabajo desde la creación hasta el final — rastreado aquí. Puedes exportar a PDF para tus archivos o para reclamos de seguro."),'success');
  });
}

function s17(){
  return sayW(L(
    "📍 Time to get <b>paid</b>! The <b>Invoices</b> section is where you create professional invoices with your company logo, line items, and terms. You can email them directly to customers or print them as PDF. Let me create one for María García's AC repair so you can see how it works.",
    "📍 ¡Hora de <b>cobrar</b>! La sección de <b>Facturas</b> es donde creas facturas profesionales con el logo de tu empresa, líneas de detalle y términos. Puedes enviarlas directo por email a clientes o imprimirlas como PDF. Déjame crear una para la reparación de AC de María García para que veas cómo funciona."
  ),'nav').then(ck).then(function(){smoothShow('invoices');
    return sayW(L("⚡ I'm building the invoice with line items: Service Call $120, Capacitor $85, Contactor $65, and 2 hours of Labor at $125 each. Total: <b>$520</b>.","⚡ Estoy creando la factura con líneas de detalle: Visita $120, Capacitor $85, Contactor $65, y 2 horas de Mano de obra a $125 cada una. Total: <b>$520</b>."),'action');
  }).then(ck).then(function(){
    var inv={id:'inv1',company_id:'demo-co',invoice_number:'INV-202602-0001',client_name:'María García',client_email:'maria.garcia@email.com',client_phone:'(909) 555-1234',client_address:'456 Oak St, Fontana',line_items:[{name:'Service Call',qty:1,unit_price:120,labor:0,total:120},{name:'Capacitor 45/5',qty:1,unit_price:85,labor:0,total:85},{name:'Contactor 2P',qty:1,unit_price:65,labor:0,total:65},{name:'Labor',qty:2,unit_price:0,labor:125,total:250}],subtotal:520,total:520,balance_due:520,amount_paid:0,status:'draft',created_at:new Date().toISOString()};
    _db.invoices.push(inv);window.invoicesData=[inv];renderInvoiceKPIs();renderInvoicesTable();
    return sayW(L("✅ <b>Invoice INV-0001</b> created for <b>$520</b>! You can email it to María with one click, print it as PDF, or mark it as paid when she pays. The CRM tracks every dollar.","✅ <b>Factura INV-0001</b> creada por <b>$520</b>! Puedes enviarla a María por email con un click, imprimirla como PDF, o marcarla como pagada cuando pague. El CRM rastrea cada dólar."),'success');
  });
}

function s18(){
  return sayW(L("⚡ Good news — María just paid! Let me mark it as <b>PAID</b>. And I'll also create the restaurant's invoice for the cooler repair — <b>$2,200</b>. Watch the dashboard update in real-time...","⚡ ¡Buenas noticias — María acaba de pagar! Déjame marcarla como <b>PAGADA</b>. Y también creo la factura del restaurante por la reparación del cooler — <b>$2,200</b>. Mira cómo el tablero se actualiza en tiempo real..."),'action'
  ).then(ck).then(function(){
    invoicesData[0].status='paid';invoicesData[0].amount_paid=520;invoicesData[0].balance_due=0;
    var inv2={id:'inv2',company_id:'demo-co',invoice_number:'INV-202602-0002',client_name:'La Michoacana',client_phone:'(909) 555-5678',client_email:'lm@email.com',client_address:'2890 Highland, SB',line_items:[{name:'Cooler Repair',qty:1,unit_price:1800,labor:400,total:2200}],subtotal:2200,total:2200,balance_due:2200,amount_paid:0,status:'sent',created_at:new Date().toISOString()};
    _db.invoices.push(inv2);invoicesData.push(inv2);renderInvoiceKPIs();renderInvoicesTable();
    return sayW(L("✅ See the KPI cards at the top? INV-0001 is now green — <b>PAID $520</b>. INV-0002 is yellow — <b>PENDING $2,200</b>. You always know exactly how much money is coming in and how much is outstanding.","✅ ¿Ves las tarjetas KPI arriba? INV-0001 está en verde — <b>PAGADA $520</b>. INV-0002 está en amarillo — <b>PENDIENTE $2,200</b>. Siempre sabes exactamente cuánto dinero está entrando y cuánto falta por cobrar."),'success');
  });
}

function s19(){
  return sayW(L(
    "📍 <b>Collections</b>. Now this is something every business owner needs. When invoices go past due — 30, 60, 90 days — this section shows you exactly who owes you money and for how long. You can send automatic payment reminders to customers with one click. No more chasing people down for money — the CRM does it for you.",
    "📍 <b>Cobranza</b>. Esto es algo que todo dueño de negocio necesita. Cuando las facturas se vencen — 30, 60, 90 días — esta sección te muestra exactamente quién te debe dinero y desde cuándo. Puedes enviar recordatorios de pago automáticos a clientes con un click. No más persiguiendo gente por dinero — el CRM lo hace por ti."
  ),'nav').then(ck).then(function(){smoothShow('collections');
    return sayW(L("✅ This is how you protect your cash flow. The aging report tells you exactly where your money is stuck. Professional companies collect fast!","✅ Así es como proteges tu flujo de efectivo. El reporte de antigüedad te dice exactamente dónde está atorado tu dinero. ¡Las empresas profesionales cobran rápido!"),'success');
  });
}

function s20(){
  return sayW(L(
    "📍 <b>Receipts</b>. When a customer pays you — whether it's cash, check, Zelle, Venmo, or credit card — you record it here. This gives you a paper trail for tax season, and it helps you reconcile with your bank statements. Your accountant will thank you!",
    "📍 <b>Recibos</b>. Cuando un cliente te paga — ya sea efectivo, cheque, Zelle, Venmo o tarjeta — lo registras aquí. Esto te da un rastro de papel para los impuestos, y te ayuda a conciliar con tus estados de cuenta bancarios. ¡Tu contador te va a agradecer!"
  ),'nav').then(ck).then(function(){smoothShow('receipts');
    return sayW(L("✅ Every payment documented with date, amount, method, and who paid. No more guessing at tax time!","✅ Cada pago documentado con fecha, monto, método y quién pagó. ¡No más adivinanzas en temporada de impuestos!"),'success');
  });
}

function s21(){
  return sayW(L(
    "📍 Now let's track what goes OUT. <b>Business Expenses</b> — gas for the vans, insurance payments, tool purchases, vehicle payments, CRM subscription, office supplies. Everything you spend on the business goes here so you can see your true profit. Let me add some real expenses.",
    "📍 Ahora rastreemos lo que SALE. <b>Gastos del Negocio</b> — gasolina para las camionetas, pagos de seguro, compras de herramientas, pagos de vehículo, suscripción del CRM, suministros de oficina. Todo lo que gastas en el negocio va aquí para que veas tu ganancia real. Déjame agregar algunos gastos reales."
  ),'nav').then(ck).then(function(){smoothShow('expenses');
    return sayW(L("⚡ First, let me add <b>$287.50</b> for gas at Chevron...","⚡ Primero, déjame agregar <b>$287.50</b> de gasolina en Chevron..."),'action');
  }).then(ck).then(function(){
    var btn=$q('#expenses-section [onclick*="showExpenseForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){sv($('expCategory'),'vehicle_gas');return ty($('expVendor'),'Chevron');
  }).then(function(){return ty($('expAmount'),'287.50');
  }).then(function(){sv($('expFrequency'),'monthly');sv($('expType'),'variable');$('expDate').value=new Date().toISOString().split('T')[0];return sl(SD);
  }).then(function(){var f=$q('#expenses-section form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(1500);
  }).then(ck).then(function(){
    return sayW(L("⚡ Now adding Insurance $450, CRM subscription $149.99, and vehicle payment $650...","⚡ Ahora agregando Seguro $450, suscripción CRM $149.99, y pago de vehículo $650..."),'action');
  }).then(function(){
    [{category:'general_liability',vendor:'State Farm',amount:450,type:'fixed'},{category:'software_crm',vendor:'Trade Master CRM',amount:149.99,type:'fixed'},{category:'vehicle_payment',vendor:'Ford Motor Credit',amount:650,type:'fixed'}]
    .forEach(function(e){e.id='exp'+(++_idc);e.company_id='demo-co';e.frequency='monthly';e.date=new Date().toISOString().split('T')[0];e.created_at=new Date().toISOString();_db.expenses.push(e);expensesData.push(e);});
    renderExpenses();
    return sayW(L("✅ <b>4 expenses</b> tracked. The CRM separates them into <b>fixed</b> costs like insurance and vehicle, and <b>variable</b> costs like gas. Your total monthly expenses: <b>$1,537</b>. This is essential for knowing your true profit margin!","✅ <b>4 gastos</b> registrados. El CRM los separa en costos <b>fijos</b> como seguro y vehículo, y costos <b>variables</b> como gasolina. Tu total de gastos mensuales: <b>$1,537</b>. ¡Esto es esencial para saber tu margen de ganancia real!"),'success');
  });
}

function s22(){
  return sayW(L(
    "📍 <b>My Money</b> — this is the financial overview every business owner dreams about. It shows you a chart with income on one side and expenses on the other, so you can see your <b>net profit</b> at a glance. All the data comes from the invoices and expenses you just entered — it's all connected!",
    "📍 <b>Mi Dinero</b> — esta es la vista financiera que todo dueño de negocio sueña. Te muestra una gráfica con ingresos de un lado y gastos del otro, para que veas tu <b>ganancia neta</b> de un vistazo. Todos los datos vienen de las facturas y gastos que acabas de ingresar — ¡todo está conectado!"
  ),'nav').then(ck).then(function(){smoothShow('mymoney');
    return sayW(L("✅ Revenue coming in, expenses going out, and your profit right in the middle. This is the health of your business in one screen. Now you can make informed decisions!","✅ Ingresos entrando, gastos saliendo, y tu ganancia justo en medio. Esta es la salud de tu negocio en una pantalla. ¡Ahora puedes tomar decisiones informadas!"),'success');
  });
}

function s23(){
  return sayW(L(
    "📍 <b>Payroll</b> — probably the most important section for your team. This is where you track what you owe each technician and advisor. The CRM calculates everything: <b>hours worked times hourly rate</b> for technicians, and <b>commission percentages</b> for sales advisors. No more spreadsheets or manual calculations!",
    "📍 <b>Nómina</b> — probablemente la sección más importante para tu equipo. Aquí es donde rastreas lo que le debes a cada técnico y asesor. El CRM calcula todo: <b>horas trabajadas por tarifa por hora</b> para técnicos, y <b>porcentajes de comisión</b> para asesores de ventas. ¡No más hojas de cálculo ni cálculos manuales!"
  ),'nav').then(ck).then(function(){smoothShow('payroll');
    return sayW(L("⚡ Let me load the payroll for this period...","⚡ Déjame cargar la nómina de este período..."),'action');
  }).then(ck).then(function(){
    var e=[
      {id:'py1',company_id:'demo-co',tech_name:techsData[0]?techsData[0].name:'Carlos Mendoza',type:'hourly',hours:42,rate:35,total:1470,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()},
      {id:'py2',company_id:'demo-co',tech_name:techsData[1]?techsData[1].name:'Miguel Torres',type:'hourly',hours:38,rate:30,total:1140,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()},
      {id:'py3',company_id:'demo-co',tech_name:advisorsData&&advisorsData[0]?advisorsData[0].name:'Diana Castillo',type:'commission',hours:0,rate:0,total:457.50,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],status:'pending',created_at:new Date().toISOString()}];
    e.forEach(function(x){_db.payroll_entries.push(x);});window.payrollData=e;renderPayroll();
    return sayW(L("✅ Look at the table! Carlos worked 42 hours at $35/hr — that's <b>$1,470</b>. Miguel worked 38 hours at $30/hr — <b>$1,140</b>. Diana earned <b>$457</b> in commission from her sales. Total payroll: <b>$3,067</b>. All calculated automatically!","✅ ¡Mira la tabla! Carlos trabajó 42 horas a $35/hr — eso son <b>$1,470</b>. Miguel trabajó 38 horas a $30/hr — <b>$1,140</b>. Diana ganó <b>$457</b> en comisión por sus ventas. Nómina total: <b>$3,067</b>. ¡Todo calculado automáticamente!"),'success');
  });
}

function s24(){
  return sayW(L(
    "⚡ And here's a game-changer — you can <b>export payroll data</b> directly to <b>QuickBooks, ADP, or Gusto</b> with one click. No double-entry, no copying numbers from one system to another. The CRM talks to your payroll provider. This saves hours every pay period!",
    "⚡ Y aquí está algo que cambia el juego — puedes <b>exportar datos de nómina</b> directo a <b>QuickBooks, ADP o Gusto</b> con un click. Sin doble captura, sin copiar números de un sistema a otro. El CRM habla con tu proveedor de nómina. ¡Esto ahorra horas cada período de pago!"
  ),'success');
}

function s25(){
  return sayW(L(
    "📍 <b>Inbox</b> — this is your notification center. Every important event in your business shows up here: when a new lead comes in, when a job is completed, when an invoice becomes overdue, when a technician clocks in. Think of it as your business news feed. You'll never miss anything important again.",
    "📍 <b>Bandeja</b> — este es tu centro de notificaciones. Cada evento importante en tu negocio aparece aquí: cuando entra un nuevo prospecto, cuando se completa un trabajo, cuando una factura se vence, cuando un técnico registra entrada. Piénsalo como tu feed de noticias del negocio. Nunca te vas a perder de nada importante otra vez."
  ),'nav').then(ck).then(function(){smoothShow('inbox');
    return sayW(L("✅ Read, archive, or take action on any notification instantly. Stay on top of everything without checking 10 different places!","✅ Lee, archiva o toma acción en cualquier notificación al instante. ¡Mantente al tanto de todo sin checar 10 lugares diferentes!"),'success');
  });
}

function s26(){
  return sayW(L(
    "📍 <b>Business Mail</b> — send and receive professional emails right from your CRM. No need to switch to Gmail, Yahoo, or Outlook. You can email quotes to customers, send follow-ups after service calls, and create thank-you templates. Everything stays in one place, connected to the right customer record.",
    "📍 <b>Correo del Negocio</b> — envía y recibe emails profesionales directo desde tu CRM. No necesitas cambiar a Gmail, Yahoo u Outlook. Puedes enviar cotizaciones a clientes, enviar seguimientos después de llamadas de servicio, y crear plantillas de agradecimiento. Todo se queda en un lugar, conectado al registro del cliente correcto."
  ),'nav').then(ck).then(function(){smoothShow('mailbox');
    return sayW(L("✅ Professional communication built right in. Your emails look polished and everything is tracked in the customer's history!","✅ Comunicación profesional integrada. ¡Tus emails se ven profesionales y todo queda registrado en el historial del cliente!"),'success');
  });
}

function s27(){
  return sayW(L(
    "📍 Now let's grow your business with <b>Marketing</b>! This section lets you create advertising campaigns for Google Ads, Facebook, Instagram, Yelp, and more. The CRM tracks which campaigns bring in the most leads and customers, so you know exactly where to spend your advertising budget. Let me create a real campaign.",
    "📍 ¡Ahora hagamos crecer tu negocio con <b>Mercadotecnia</b>! Esta sección te permite crear campañas de publicidad para Google Ads, Facebook, Instagram, Yelp y más. El CRM rastrea qué campañas traen más prospectos y clientes, para que sepas exactamente dónde gastar tu presupuesto de publicidad. Déjame crear una campaña real."
  ),'nav').then(ck).then(function(){smoothShow('marketing');
    return sayW(L("⚡ I'm creating a <b>Summer AC Tune-Up promotion</b> on Google Ads — $79 special, $1,500 budget for 60 days. Watch...","⚡ Estoy creando una <b>promoción de Tune-Up de AC de verano</b> en Google Ads — especial de $79, presupuesto de $1,500 por 60 días. Mira..."),'action');
  }).then(ck).then(function(){
    var btn=$q('#marketing-section [onclick*="showCampaignForm"]');return btn?clk(btn):Promise.resolve();
  }).then(function(){return sl(1200);
  }).then(function(){return ty($('campName'),'Promo Summer - AC Tune-Up $79');
  }).then(function(){sv($('campType'),'google_ads');return ty($('campBudget'),'1500');
  }).then(function(){var cs=$('campStart'),ce=$('campEnd');if(cs)cs.value=new Date().toISOString().split('T')[0];if(ce){var d=new Date();d.setDate(d.getDate()+60);ce.value=d.toISOString().split('T')[0];}return ty($('campMessage'),'AC Tune-Up $79. Rodriguez HVAC. (909) 555-0000');
  }).then(function(){var f=$q('#marketing-section form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(2000);
  }).then(function(){
    return sayW(L("✅ Campaign created! The CRM will track every lead that comes from this ad. You'll know exactly: how many calls, how many jobs, and the <b>return on investment</b>. If you spent $1,500 on ads and got $15,000 in jobs — that's a 10x ROI!","✅ ¡Campaña creada! El CRM va a rastrear cada prospecto que venga de este anuncio. Vas a saber exactamente: cuántas llamadas, cuántos trabajos, y el <b>retorno de inversión</b>. Si gastaste $1,500 en anuncios y conseguiste $15,000 en trabajos — ¡eso es un ROI de 10x!"),'success');
  });
}

function s28(){
  return sayW(L(
    "📍 <b>Price Book</b> — this is your product catalog. Every part, service, and labor rate your company offers, with your <b>cost</b> and <b>selling price</b> side by side. When you create invoices, you pull prices from here so everything is consistent. The CRM also calculates your <b>profit margin</b> automatically. Let me load some common HVAC items.",
    "📍 <b>Lista de Precios</b> — este es tu catálogo de productos. Cada parte, servicio y tarifa de mano de obra que ofrece tu empresa, con tu <b>costo</b> y <b>precio de venta</b> lado a lado. Cuando creas facturas, jalas precios de aquí para que todo sea consistente. El CRM también calcula tu <b>margen de ganancia</b> automáticamente. Déjame cargar algunos artículos comunes de HVAC."
  ),'nav').then(ck).then(function(){smoothShow('pricebook');
    return sayW(L("⚡ Loading 10 parts and services with real pricing...","⚡ Cargando 10 partes y servicios con precios reales..."),'action');
  }).then(ck).then(function(){
    [{name:'Capacitor 45/5 MFD',sku:'CAP-455',category:'ac_parts',unit:'each',cost:12,price:85},{name:'Contactor 2P 40A',sku:'CON-2P',category:'ac_parts',unit:'each',cost:8,price:65},{name:'Motor Fan 1/4 HP',sku:'MTR-025',category:'motors',unit:'each',cost:45,price:195},{name:'R-410A per lb',sku:'REF-410',category:'refrigerants',unit:'lb',cost:15,price:85},{name:'Thermostat Honeywell',sku:'TSTAT',category:'controls',unit:'each',cost:35,price:175},{name:'Filter 16x25x1',sku:'FLT-162',category:'filters',unit:'each',cost:4,price:25},{name:'Service Call 0-10mi',sku:'SC-010',category:'labor',unit:'flat',cost:0,price:70},{name:'Service Call 10-20mi',sku:'SC-1020',category:'labor',unit:'flat',cost:0,price:120},{name:'Labor per Hour',sku:'LAB-HR',category:'labor',unit:'hour',cost:0,price:125},{name:'AC Tune-Up 21pts',sku:'TUNE-21',category:'labor',unit:'flat',cost:0,price:79}]
    .forEach(function(it){it.id='pb'+(++_idc);it.company_id='demo-co';_db.price_book.push(it);});
    window.priceBookData=_db.price_book.slice();renderPriceBook();
    return sayW(L("✅ <b>10 items</b> loaded! Look at those margins — a Capacitor costs you $12 and you sell it for $85, that's a <b>608% markup</b>! R-410A refrigerant costs $15 per pound and sells for $85 — <b>467%</b>! This is how HVAC companies make serious money. The Price Book makes sure every tech charges the right price.","✅ ¡<b>10 artículos</b> cargados! Mira esos márgenes — un Capacitor te cuesta $12 y lo vendes a $85, ¡eso es un <b>markup de 608%</b>! El refrigerante R-410A cuesta $15 por libra y se vende a $85 — ¡<b>467%</b>! Así es como las empresas de HVAC ganan dinero en serio. La Lista de Precios asegura que cada técnico cobre el precio correcto."),'success');
  });
}

function s29(){
  return sayW(L(
    "📍 <b>Reports</b> — the big picture of your business in charts and graphs. Revenue by month, jobs per technician, where your customers come from, team productivity, profit margins — everything visualized so you can spot trends and make better decisions. You can export any report to PDF to share with your partner, accountant, or bank when applying for loans.",
    "📍 <b>Reportes</b> — la foto completa de tu negocio en gráficas. Ingresos por mes, trabajos por técnico, de dónde vienen tus clientes, productividad del equipo, márgenes de ganancia — todo visualizado para que detectes tendencias y tomes mejores decisiones. Puedes exportar cualquier reporte a PDF para compartir con tu socio, contador o banco cuando apliques para préstamos."
  ),'nav').then(ck).then(function(){smoothShow('reports');
    return sayW(L("✅ Data-driven decisions make your business grow faster. This is the section your accountant and your bank will love!","✅ Las decisiones basadas en datos hacen que tu negocio crezca más rápido. ¡Esta es la sección que tu contador y tu banco van a amar!"),'success');
  });
}

function s30(){
  return sayW(L(
    "📍 <b>Users and Team</b> — this is where you control who has access to your CRM and what they can do. You can add office staff, dispatchers, and managers, each with their own login and <b>role-based permissions</b>. An Admin sees everything, a Dispatcher only sees jobs and technicians, a Technician only sees their own assignments. Your sensitive financial data stays protected.",
    "📍 <b>Usuarios y Equipo</b> — aquí es donde controlas quién tiene acceso a tu CRM y qué puede hacer. Puedes agregar personal de oficina, despachadores y gerentes, cada uno con su propio login y <b>permisos basados en roles</b>. Un Admin ve todo, un Despachador solo ve trabajos y técnicos, un Técnico solo ve sus propias asignaciones. Tu información financiera sensible se mantiene protegida."
  ),'nav').then(ck).then(function(){smoothShow('team');
    return sayW(L("✅ Security first! Every team member sees only what they need to do their job. You can add or remove access anytime.","✅ ¡Seguridad primero! Cada miembro del equipo ve solo lo que necesita para hacer su trabajo. Puedes agregar o quitar acceso cuando quieras."),'success');
  });
}

function s31(){
  return sayW(L(
    "📍 <b>Human Resources</b> — beyond just tracking time and pay, this section handles the HR side: employee contracts, certifications and their expiration dates, performance reviews, and important documents like W-4s and I-9s. When an EPA certification is about to expire, you'll get a notification. No more compliance surprises!",
    "📍 <b>Recursos Humanos</b> — más allá de rastrear tiempo y pago, esta sección maneja el lado de RH: contratos de empleados, certificaciones y sus fechas de vencimiento, evaluaciones de desempeño, y documentos importantes como W-4 e I-9. Cuando una certificación EPA esté por vencer, recibirás notificación. ¡No más sorpresas de cumplimiento!"
  ),'nav').then(ck).then(function(){smoothShow('hr');
    return sayW(L("✅ All employee documents in one secure place. Upload contracts, track certifications, manage reviews. Goodbye paper files!","✅ Todos los documentos de empleados en un lugar seguro. Sube contratos, rastrea certificaciones, administra evaluaciones. ¡Adiós archivos de papel!"),'success');
  });
}

function s32(){
  return sayW(L(
    "📍 Last setup section — <b>Settings</b>. This is where you configure your company profile: business name, contractor license number, insurance bond, owner information, and your logo. All this info automatically appears on your invoices, contracts, and emails, giving your business a professional image.",
    "📍 Última sección de configuración — <b>Configuración</b>. Aquí es donde configuras tu perfil de empresa: nombre del negocio, número de licencia de contratista, fianza de seguro, información del dueño, y tu logo. Toda esta info aparece automáticamente en tus facturas, contratos y emails, dándole a tu negocio una imagen profesional."
  ),'nav').then(ck).then(function(){smoothShow('settings');
    return sayW(L("✅ Set it up once and forget it. Your company info flows through the entire CRM — invoices, emails, contracts, everything looks polished and professional!","✅ Configúralo una vez y olvídate. Tu info de empresa fluye por todo el CRM — facturas, emails, contratos, ¡todo se ve pulido y profesional!"),'success');
  });
}

function s33(){
  return sayW(L(
    "📍 Let's go back to the <b>Dashboard</b> one more time. Look at how different it looks now compared to when we started! It's full of real data — active jobs, revenue numbers, team locations, recent activity. This is what YOUR business will look like inside Trade Master CRM.",
    "📍 Regresemos al <b>Tablero</b> una última vez. ¡Mira lo diferente que se ve ahora comparado con cuando empezamos! Está lleno de datos reales — trabajos activos, números de ingresos, ubicaciones del equipo, actividad reciente. Así es como TU negocio se verá dentro de Trade Master CRM."
  ),'nav').then(ck).then(function(){smoothShow('dashboard');
    return sayW(L("✅ From an empty CRM to a fully running business — customers, technicians, jobs, invoices, payroll, marketing — all connected, all in one place!","✅ De un CRM vacío a un negocio completamente operando — clientes, técnicos, trabajos, facturas, nómina, mercadotecnia — ¡todo conectado, todo en un lugar!"),'success');
  });
}

function s34(){
  return sayW(L(
    "🎉 <b>DEMO COMPLETE!</b><br><br>In 35 steps, we built an entire business together:<br>👥 2 customers — residential and commercial<br>🎯 1 lead worth $4,500<br>📈 Sales pipeline<br>👷 2 technicians with GPS tracking<br>🏠 1 home advisor with commissions<br>📅 Calendar and scheduling<br>🔧 2 jobs dispatched — $3,050 revenue<br>📞 1 emergency service call<br>🚐 Live GPS fleet tracking<br>📄 2 invoices — $2,720 total<br>💰 Collections and receipts<br>🏢 4 business expenses — $1,537/month<br>💵 Financial overview<br>💳 Payroll — $3,067<br>📬 Inbox and business email<br>📣 1 Google Ads campaign<br>📒 10 price book items<br>📊 Reports and analytics<br>👥 Team management<br>🛡️ Human resources<br>⚙️ Company settings",
    "🎉 <b>¡DEMO COMPLETADO!</b><br><br>En 35 pasos, construimos un negocio completo juntos:<br>👥 2 clientes — residencial y comercial<br>🎯 1 prospecto de $4,500<br>📈 Flujo de ventas<br>👷 2 técnicos con rastreo GPS<br>🏠 1 asesora con comisiones<br>📅 Calendario y agenda<br>🔧 2 trabajos despachados — $3,050 ingreso<br>📞 1 llamada de emergencia<br>🚐 Rastreo GPS de flota en vivo<br>📄 2 facturas — $2,720 total<br>💰 Cobranza y recibos<br>🏢 4 gastos del negocio — $1,537/mes<br>💵 Vista financiera<br>💳 Nómina — $3,067<br>📬 Bandeja y correo<br>📣 1 campaña Google Ads<br>📒 10 artículos de precios<br>📊 Reportes y analíticas<br>👥 Equipo y usuarios<br>🛡️ Recursos humanos<br>⚙️ Configuración"
  ),'success');
}

function s35(){
  return sayW(L(
    "🚀 <b>This is what Trade Master CRM can do for your business.</b> Everything you just saw — from the first customer to GPS tracking to invoicing to payroll — it's all in one place, accessible from your computer, tablet, or phone. No more juggling 5 different apps. No more lost paperwork. No more forgotten follow-ups. Just one powerful CRM that runs your entire operation. Ready to take your company to the next level?",
    "🚀 <b>Esto es lo que Trade Master CRM puede hacer por tu negocio.</b> Todo lo que acabas de ver — desde el primer cliente hasta rastreo GPS, facturación y nómina — todo está en un lugar, accesible desde tu computadora, tablet o celular. No más malabarismos con 5 apps diferentes. No más papeleo perdido. No más seguimientos olvidados. Solo un CRM poderoso que maneja toda tu operación. ¿Listo para llevar tu empresa al siguiente nivel?"
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
