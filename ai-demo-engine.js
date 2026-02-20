/**
 * TRADE MASTER CRM - AI DEMO ENGINE v3.0
 * Uses REAL CRM functions - only mocks Supabase
 * ACVOLT Tech School Inc.
 */
(function(){
'use strict';
if(new URLSearchParams(window.location.search).get('demo')!=='true')return;

/* ===== CONFIG ===== */
var TS=25,SD=600;
var CO={name:'Rodriguez HVAC LLC',phone:'(909) 555-0000',email:'info@rodriguezhvac.com',address:'1850 S. Waterman Ave, Suite 100, San Bernardino, CA 92408',license:'C-20 #1087654',bond:'Bond #SB-2024-87654',owner:'Marco Rodriguez'};
var S={step:0,total:20,playing:false,paused:false,mini:false};

/* ===== MOCK SUPABASE ===== */
var _db={clients:[],leads:[],technicians:[],work_orders:[],invoices:[],expenses:[],payroll_entries:[],campaigns:[],price_book:[],home_advisors:[],company_settings:[],appointments:[],installations:[],referrals:[],time_clock:[],team_users:[],estimates:[]};
var _idC=1000;

function MockQB(table){this._t=table;this._f={};this._ins=null;this._upd=null;this._del=false;this._sel=false;this._cols='*';}
MockQB.prototype.select=function(c){this._sel=true;this._cols=c||'*';return this;};
MockQB.prototype.eq=function(k,v){this._f[k]=v;return this;};
MockQB.prototype.neq=function(){return this;};
MockQB.prototype.gt=function(){return this;};
MockQB.prototype.gte=function(){return this;};
MockQB.prototype.lt=function(){return this;};
MockQB.prototype.lte=function(){return this;};
MockQB.prototype.in=function(){return this;};
MockQB.prototype.is=function(){return this;};
MockQB.prototype.ilike=function(){return this;};
MockQB.prototype.order=function(){
  var d=this._resolve();
  return Promise.resolve({data:d,error:null,count:d.length});
};
MockQB.prototype.single=function(){
  if(this._ins){
    var item=this._ins;
    return Promise.resolve({data:item,error:null});
  }
  var d=this._resolve();
  return Promise.resolve({data:d[0]||null,error:null});
};
MockQB.prototype.limit=function(){return this;};
MockQB.prototype.range=function(){return this;};
MockQB.prototype.maybeSingle=function(){return this.single();};
MockQB.prototype.insert=function(data){
  var arr=Array.isArray(data)?data:[data];
  var store=_db[this._t];if(!store){_db[this._t]=[];store=_db[this._t];}
  arr.forEach(function(item){
    item.id=item.id||'mock_'+(++_idC);
    item.created_at=item.created_at||new Date().toISOString();
    store.push(item);
  });
  this._ins=arr.length===1?arr[0]:arr;
  return this;
};
MockQB.prototype.update=function(data){this._upd=data;return this;};
MockQB.prototype.upsert=function(data){return this.insert(data);};
MockQB.prototype['delete']=function(){this._del=true;return this;};
MockQB.prototype._resolve=function(){
  var store=_db[this._t]||[];
  var f=this._f;
  if(this._del){
    _db[this._t]=store.filter(function(r){
      for(var k in f){if(r[k]!==f[k])return true;}return false;
    });
    return[];
  }
  if(this._upd){
    store.forEach(function(r){
      var match=true;for(var k in f){if(r[k]!==f[k])match=false;}
      if(match){for(var u in this._upd)r[u]=this._upd[u];}
    }.bind(this));
    return store;
  }
  return store.filter(function(r){
    for(var k in f){if(r[k]!==f[k])return false;}return true;
  });
};
MockQB.prototype.then=function(resolve,reject){
  try{
    if(this._ins)resolve({data:this._ins,error:null});
    else{var d=this._resolve();resolve({data:d,error:null,count:d.length});}
  }catch(e){if(reject)reject(e);else resolve({data:null,error:e});}
};
MockQB.prototype['catch']=function(fn){return this;};

function installMockSB(){
  window.sbClient={
    from:function(t){return new MockQB(t);},
    auth:{
      getUser:function(){return Promise.resolve({data:{user:{id:'demo-user',email:'demo@rodriguezhvac.com',user_metadata:{first_name:'Marco',last_name:'Rodriguez',company_name:CO.name}}}});},
      getSession:function(){return Promise.resolve({data:{session:{user:{id:'demo-user',email:'demo@rodriguezhvac.com',user_metadata:{first_name:'Marco',last_name:'Rodriguez',company_name:CO.name}}}}});},
      signUp:function(){return Promise.resolve({data:{},error:null});},
      signInWithPassword:function(){return Promise.resolve({data:{},error:null});},
      signOut:function(){return Promise.resolve({});},
      onAuthStateChange:function(){return{data:{subscription:{unsubscribe:function(){}}}};},
      resetPasswordForEmail:function(){return Promise.resolve({});}
    },
    storage:{from:function(){return{upload:function(){return Promise.resolve({data:{},error:null});},getPublicUrl:function(){return{data:{publicUrl:''}};},list:function(){return Promise.resolve({data:[]});}};}}
  };
  window.currentUser={id:'demo-user',email:'demo@rodriguezhvac.com',user_metadata:{first_name:'Marco',last_name:'Rodriguez',company_name:CO.name}};
  window.companyId='demo-company';
  window._companyInfo={id:'demo-company',name:CO.name,email:CO.email,phone:CO.phone,address:CO.address,contractor_license:CO.license,plan:'enterprise'};
  window.currentCompany={id:'demo-company',name:CO.name,plan:'enterprise'};
  try{localStorage.setItem('companyId','demo-company');}catch(e){}
}

/* ===== UTILITIES ===== */
function sl(ms){return new Promise(function(r){setTimeout(r,ms);});}
function ck(){if(S.paused)return new Promise(function(r){var i=setInterval(function(){if(!S.paused){clearInterval(i);r();}},100);});return Promise.resolve();}
function ty(el,txt){
  if(!el)return Promise.resolve();el.value='';el.focus();var i=0;
  return new Promise(function(res){
    (function nxt(){if(i>=txt.length){el.dispatchEvent(new Event('change',{bubbles:true}));res();return;}
      if(S.paused){setTimeout(nxt,100);return;}
      el.value+=txt[i];el.dispatchEvent(new Event('input',{bubbles:true}));i++;setTimeout(nxt,TS);
    })();
  });
}
function sv(el,val){if(!el)return;el.value=val;el.dispatchEvent(new Event('change',{bubbles:true}));}
function clk(el){
  if(!el)return Promise.resolve();
  el.scrollIntoView({behavior:'smooth',block:'center'});
  return sl(200).then(function(){
    var r=el.getBoundingClientRect();var rp=document.createElement('div');rp.className='demo-ripple';
    rp.style.cssText='left:'+(r.left+r.width/2)+'px;top:'+(r.top+r.height/2)+'px;';
    document.body.appendChild(rp);
    return sl(100).then(function(){el.click();return sl(300).then(function(){rp.remove();});});
  });
}
function $(id){return document.getElementById(id);}
function $q(sel){return document.querySelector(sel);}

/* ===== SOFIA UI ===== */
function injectCSS(){
  var st=document.createElement('style');st.textContent=
  '#demoSplash{position:fixed;inset:0;z-index:20000;background:linear-gradient(135deg,#0f172a,#1e293b,#0f172a);display:flex;align-items:center;justify-content:center;transition:opacity .5s,transform .5s}'+
  '#demoSplash.ds-exit{opacity:0;transform:scale(1.05)}'+
  '.ds-content{text-align:center;color:#fff;max-width:540px;padding:40px;animation:dsFI .8s ease-out}'+
  '.ds-btn{padding:18px 48px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;border-radius:16px;font-size:1.1rem;font-weight:700;cursor:pointer;box-shadow:0 8px 30px rgba(249,115,22,.4);transition:all .3s}'+
  '.ds-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(249,115,22,.5)}'+
  '@keyframes dsFI{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}'+
  '#sofiaPanel{position:fixed;bottom:20px;right:20px;width:380px;max-height:70vh;background:var(--bg-card,#1e293b);border:1px solid var(--border,#334155);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.3);z-index:9999;display:flex;flex-direction:column;overflow:hidden;transition:all .3s}'+
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
  '.sf-cb{padding:6px 12px;border:1px solid var(--border,#334155);background:var(--bg-input,#0f172a);color:var(--text,#e2e8f0);border-radius:8px;cursor:pointer;font-size:12px;transition:all .2s}.sf-cb:hover{background:var(--primary,#1e3a5f);color:#fff}'+
  '.sf-cp{background:#f97316;color:#fff;border-color:#f97316;font-weight:600}.sf-auto{background:#10b981;color:#fff;border-color:#10b981;font-weight:600}'+
  '#sfBubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:9998;box-shadow:0 6px 20px rgba(249,115,22,.4);font-size:26px;animation:sfP 2s infinite}'+
  '#sfBubble:hover{transform:scale(1.1)}'+
  '@keyframes sfP{0%,100%{box-shadow:0 6px 20px rgba(249,115,22,.4)}50%{box-shadow:0 6px 30px rgba(249,115,22,.6)}}'+
  '.demo-ripple{position:fixed;width:30px;height:30px;border-radius:50%;background:rgba(249,115,22,.4);pointer-events:none;z-index:10002;transform:translate(-50%,-50%);animation:dmR .5s ease-out forwards}'+
  '@keyframes dmR{to{width:60px;height:60px;opacity:0}}'+
  '@media(max-width:640px){#sofiaPanel{width:calc(100% - 16px);right:8px;bottom:8px;max-height:55vh}.sf-chat{max-height:35vh}}';
  document.head.appendChild(st);
}

function showSplash(){
  return new Promise(function(res){
    var s=document.createElement('div');s.id='demoSplash';
    s.innerHTML='<div class="ds-content"><div style="font-size:60px;margin-bottom:12px">\uD83D\uDD27</div><h1 style="font-size:2rem;font-weight:800;margin:0 0 6px;color:#fff">Trade Master CRM</h1><p style="color:#f97316;font-weight:600;font-size:1rem;margin:0 0 4px">Demo Interactivo con IA</p><p style="color:#94a3b8;font-size:.85rem;margin:0 0 24px">'+CO.name+' \u2014 San Bernardino, CA</p><p style="color:#cbd5e1;font-size:.9rem;line-height:1.7;margin:0 0 28px;max-width:440px">Sof\u00EDa operar\u00E1 el <strong>CRM completo</strong> frente a tus ojos \u2014 crear\u00E1 clientes, t\u00E9cnicos, trabajos, facturas y m\u00E1s. <strong>20 pasos reales</strong>.</p><button id="demoStartBtn" class="ds-btn">\u25B6\uFE0F Iniciar Demo</button><p style="font-size:.75rem;color:#64748b;margin-top:12px">\u23F1 8-12 min | Manual o Auto</p></div>';
    document.body.appendChild(s);
    $('demoStartBtn').onclick=function(){s.classList.add('ds-exit');setTimeout(function(){s.remove();res();},500);};
  });
}

function createSofia(){
  var p=document.createElement('div');p.id='sofiaPanel';
  p.innerHTML='<div class="sf-head" id="sfHead"><div class="sf-hl"><span class="sf-av">\uD83D\uDC69\u200D\uD83D\uDCBC</span><div><span class="sf-name">Sof\u00EDa</span><span class="sf-role">Asistente AI</span></div></div><div class="sf-hr"><button class="sf-hb" id="sfMin">\u2212</button><button class="sf-hb" id="sfClose">\u2715</button></div></div><div class="sf-body"><div class="sf-pbar"><div class="sf-pfill" id="sfPFill"></div></div><div class="sf-step" id="sfStep">Paso 0 de '+S.total+'</div><div class="sf-chat" id="sfChat"></div></div><div class="sf-ctrl"><button class="sf-cb" id="sfRestart">\u23EE\uFE0F</button><button class="sf-cb" id="sfPrev">\u23EA</button><button class="sf-cb sf-cp" id="sfPause">\u23F8\uFE0F</button><button class="sf-cb" id="sfNext">\u23E9</button><button class="sf-cb sf-auto" id="sfAuto">\u25B6\uFE0F Auto</button></div>';
  document.body.appendChild(p);
  $('sfMin').onclick=toggleMin;$('sfClose').onclick=function(){if(confirm('Salir?'))location.href=location.pathname;};
  $('sfRestart').onclick=doRestart;$('sfPrev').onclick=doPrev;$('sfPause').onclick=togglePause;
  $('sfNext').onclick=doNext;$('sfAuto').onclick=doAuto;
  var bb=document.createElement('div');bb.id='sfBubble';bb.innerHTML='\uD83D\uDC69\u200D\uD83D\uDCBC';bb.style.display='none';bb.onclick=toggleMin;document.body.appendChild(bb);
  // Drag
  var drag=false,sx,sy,sl2,st;var hd=$('sfHead');
  hd.onmousedown=function(e){if(e.target.tagName==='BUTTON')return;drag=true;sx=e.clientX;sy=e.clientY;var r=p.getBoundingClientRect();sl2=r.left;st=r.top;e.preventDefault();};
  document.onmousemove=function(e){if(!drag)return;p.style.left=(sl2+e.clientX-sx)+'px';p.style.top=(st+e.clientY-sy)+'px';p.style.right='auto';p.style.bottom='auto';};
  document.onmouseup=function(){drag=false;};
  // Banner
  var b=document.createElement('div');
  b.innerHTML='<div style="background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;padding:8px 16px;text-align:center;font-size:13px;font-weight:600;position:fixed;top:0;left:0;right:0;z-index:10001;display:flex;align-items:center;justify-content:center;gap:12px"><span>\uD83C\uDFAC MODO DEMO \u2014 '+CO.name+'</span><button onclick="location.href=location.pathname" style="background:#fff;color:#ea580c;border:none;border-radius:6px;padding:4px 14px;font-size:11px;font-weight:700;cursor:pointer">\u2715 Salir</button></div>';
  document.body.appendChild(b);document.body.style.paddingTop='38px';
}
function toggleMin(){S.mini=!S.mini;$('sofiaPanel').style.display=S.mini?'none':'flex';$('sfBubble').style.display=S.mini?'flex':'none';}
function say(msg,type){type=type||'info';var ch=$('sfChat');var ic={info:'\uD83D\uDCAC',action:'\u26A1',success:'\u2705',nav:'\uD83D\uDCCD'};var m=document.createElement('div');m.className='sf-msg sf-'+type;m.innerHTML='<span class="sf-mi">'+(ic[type]||'\uD83D\uDCAC')+'</span><span class="sf-mt">'+msg+'</span>';ch.appendChild(m);ch.scrollTop=ch.scrollHeight;if(S.mini)toggleMin();}
function upProg(){$('sfPFill').style.width=(S.step/S.total*100)+'%';$('sfStep').textContent='Paso '+S.step+' de '+S.total;}
function togglePause(){S.paused=!S.paused;$('sfPause').textContent=S.paused?'\u25B6\uFE0F':'\u23F8\uFE0F';}
function doNext(){if(S.step>=S.total){say('\uD83C\uDF89 Demo completado!','success');return Promise.resolve();}S.paused=false;$('sfPause').textContent='\u23F8\uFE0F';S.step++;upProg();return runStep(S.step);}
function doPrev(){if(S.step<=1)return Promise.resolve();S.step=Math.max(0,S.step-2);return doNext();}
function doRestart(){S.step=0;S.paused=false;S.playing=false;_db={clients:[],leads:[],technicians:[],work_orders:[],invoices:[],expenses:[],payroll_entries:[],campaigns:[],price_book:[],home_advisors:[],company_settings:[],appointments:[],installations:[],referrals:[],time_clock:[],team_users:[],estimates:[]};window.clientsData=[];window.leadsData=[];window.techsData=[];window.jobsData=[];window.invoicesData=[];window.expensesData=[];window.payrollData=[];window.campaignsData=[];window.priceBookData=[];window.advisorsData=[];$('sfChat').innerHTML='';upProg();say('\uD83D\uDD04 Reiniciado.','info');return sl(400).then(doNext);}
function doAuto(){
  if(S.playing){S.playing=false;$('sfAuto').textContent='\u25B6\uFE0F Auto';return Promise.resolve();}
  S.playing=true;S.paused=false;$('sfAuto').textContent='\u23F9\uFE0F Stop';
  function loop(){if(!S.playing||S.step>=S.total){S.playing=false;$('sfAuto').textContent='\u25B6\uFE0F Auto';return Promise.resolve();}return doNext().then(function(){if(S.playing)return sl(1500).then(loop);});}
  return loop();
}

/* ===== 20 STEPS ===== */
function runStep(n){return ck().then(function(){switch(n){
  case 1:return s1();case 2:return s2();case 3:return s3();case 4:return s4();case 5:return s5();
  case 6:return s6();case 7:return s7();case 8:return s8();case 9:return s9();case 10:return s10();
  case 11:return s11();case 12:return s12();case 13:return s13();case 14:return s14();case 15:return s15();
  case 16:return s16();case 17:return s17();case 18:return s18();case 19:return s19();case 20:return s20();
}});}

/* S1: Cliente Residencial */
function s1(){
  say('\uD83D\uDC4B Soy <b>Sof\u00EDa</b>, tu asistente AI. Vamos a crear el primer cliente.','info');
  return sl(SD).then(function(){say('\uD83D\uDCCD Navegando a <b>Clientes</b>...','nav');showSection('clients');return sl(SD);})
  .then(function(){say('\u26A1 Abriendo formulario...','action');return clk($q('#clients-section [onclick*="showClientForm()"]'));})
  .then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F <b>Mar\u00EDa Garc\u00EDa</b> \u2014 Residencial, Fontana...','action');return ty($('clientName'),'Mar\u00EDa Garc\u00EDa');})
  .then(function(){return ty($('clientPhone'),'(909) 555-1234');})
  .then(function(){return ty($('clientEmail'),'maria.garcia@email.com');})
  .then(function(){sv($('clientPropertyType'),'Residencial');return sl(100);})
  .then(function(){return ty($('clientAddress'),'456 Oak St, Fontana, CA 92335');})
  .then(function(){return ty($('clientNotes'),'AC no enfr\u00EDa - unidad Goodman 15 a\u00F1os. Servicio en espa\u00F1ol.');})
  .then(function(){return sl(SD);})
  .then(function(){say('\uD83D\uDCBE Guardando...','action');
    $('clientForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say('\u2705 <b>Mar\u00EDa Garc\u00EDa</b> creada. La tabla se actualiz\u00F3 con datos reales.','success');});
}

/* S2: Cliente Comercial */
function s2(){
  say('Ahora un cliente <b>comercial</b> \u2014 restaurante con walk-in cooler.','info');
  return sl(SD).then(function(){showSection('clients');return clk($q('#clients-section [onclick*="showClientForm()"]'));})
  .then(function(){return sl(300);})
  .then(function(){return ty($('clientName'),'Roberto M\u00E9ndez');})
  .then(function(){var co=$('clientCompany');if(co)return ty(co,'La Michoacana Restaurant');})
  .then(function(){return ty($('clientPhone'),'(909) 555-5678');})
  .then(function(){return ty($('clientEmail'),'lamichoacana.sb@email.com');})
  .then(function(){sv($('clientPropertyType'),'Comercial');return ty($('clientAddress'),'2890 Highland Ave, San Bernardino, CA 92405');})
  .then(function(){return ty($('clientNotes'),'Walk-in cooler no mantiene temp. Negocio 7am-10pm. Urgente.');})
  .then(function(){return sl(SD);})
  .then(function(){$('clientForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say('\u2705 <b>2 clientes</b> \u2014 residencial y comercial. Tabla actualizada en tiempo real.','success');});
}

/* S3: Lead */
function s3(){
  say('\uD83D\uDCCD Navegando a <b>Prospectos</b>...','nav');
  return sl(SD).then(function(){showSection('leads');return sl(SD);})
  .then(function(){return clk($q('#leads-section [onclick*="showLeadForm"]'));})
  .then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F <b>Roberto S\u00E1nchez</b> \u2014 Furnace nuevo $4,500...','action');return ty($('leadName'),'Roberto S\u00E1nchez');})
  .then(function(){return ty($('leadPhone'),'(909) 555-9012');})
  .then(function(){return ty($('leadEmail'),'roberto.sanchez@email.com');})
  .then(function(){sv($('leadService'),'Calefacci\u00F3n');sv($('leadPropertyType'),'residential');return ty($('leadAddress'),'1025 Pine Ave, Rialto, CA 92376');})
  .then(function(){return ty($('leadNotes'),'Furnace nuevo. Casa 1,800 sqft. Budget ~$4,500.');})
  .then(function(){
    // Pre-fill lat/lng so handler doesn't block
    var lat=$('leadLat'),lng=$('leadLng');
    if(lat)lat.value='34.1064';if(lng)lng.value='-117.3703';
    return sl(SD);})
  .then(function(){$('leadForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say('\u2705 Lead <b>Roberto S\u00E1nchez</b> \uD83D\uDD25 registrado con pin en mapa.','success');});
}

/* S4: Técnico 1 */
function s4(){
  say('\uD83D\uDCCD Navegando a <b>T\u00E9cnicos</b>...','nav');
  return sl(SD).then(function(){showSection('technicians');return sl(SD);})
  .then(function(){return clk($q('#technicians-section [onclick*="showTechFormInTechSection"]'));})
  .then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F <b>Carlos Mendoza</b> \u2014 HVAC, $35/hr...','action');return ty($('techNameAlt'),'Carlos Mendoza');})
  .then(function(){return ty($('techPhoneAlt'),'(909) 555-3456');})
  .then(function(){return ty($('techEmailAlt'),'carlos@rodriguezhvac.com');})
  .then(function(){sv($('techSpecialtyAlt'),'HVAC');
    var cb=$('techCreateLoginAlt');if(cb)cb.checked=false;
    var pw=$('techPasswordAlt');if(pw)pw.closest('.form-group').parentElement.style.display='none';
    return sl(100);})
  .then(function(){var v=$('techVehicleAlt');if(v)return ty(v,'2023 Ford Transit');})
  .then(function(){var p=$('techPlateAlt');if(p)return ty(p,'8ABC123');})
  .then(function(){return sl(SD);})
  .then(function(){var f=$q('#techFormContainerAlt form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say('\u2705 <b>Carlos Mendoza</b> registrado con GPS y acceso m\u00F3vil.','success');});
}

/* S5: Técnico 2 */
function s5(){
  say('\u26A1 Segundo t\u00E9cnico \u2014 <b>Refrigeraci\u00F3n Comercial</b>.','action');
  return sl(SD).then(function(){return clk($q('#technicians-section [onclick*="showTechFormInTechSection"]'));})
  .then(function(){return sl(300);})
  .then(function(){return ty($('techNameAlt'),'Miguel \u00C1ngel Torres');})
  .then(function(){return ty($('techPhoneAlt'),'(909) 555-7890');})
  .then(function(){return ty($('techEmailAlt'),'miguel@rodriguezhvac.com');})
  .then(function(){sv($('techSpecialtyAlt'),'Refrigeraci\u00F3n');
    var cb=$('techCreateLoginAlt');if(cb)cb.checked=false;return sl(100);})
  .then(function(){var v=$('techVehicleAlt');if(v)return ty(v,'2022 Chevy Express');})
  .then(function(){var p=$('techPlateAlt');if(p)return ty(p,'7DEF456');})
  .then(function(){return sl(SD);})
  .then(function(){var f=$q('#techFormContainerAlt form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say('\u2705 <b>2 t\u00E9cnicos</b> con veh\u00EDculos y GPS. Ven trabajos desde su celular.','success');});
}

/* S6: Advisor */
function s6(){
  say('\uD83D\uDCCD Navegando a <b>Asesores del Hogar</b>...','nav');
  return sl(SD).then(function(){showSection('advisors');return sl(SD);})
  .then(function(){return clk($q('#advisors-section [onclick*="showAdvisorForm"]'));})
  .then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F <b>Diana Castillo</b> \u2014 meta $50K/mes...','action');return ty($('advisorName'),'Diana Castillo');})
  .then(function(){return ty($('advisorPhone'),'(909) 555-2345');})
  .then(function(){return ty($('advisorEmail'),'diana@rodriguezhvac.com');})
  .then(function(){sv($('advisorSpecialty'),'Residencial y Comercial');return ty($('advisorZone'),'Inland Empire - SB, Fontana, Rialto');})
  .then(function(){var g=$('advisorGoal');if(g)return ty(g,'50000');})
  .then(function(){return sl(SD);})
  .then(function(){$('advisorForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say('\u2705 <b>Diana Castillo</b> registrada. Comisiones 5%-20% por ganancia.','success');});
}

/* S7: Job 1 */
function s7(){
  say('\uD83D\uDCCD Navegando a <b>Despacho</b> \u2014 crear trabajos...','nav');
  return sl(SD).then(function(){showSection('dispatch');return sl(SD);})
  .then(function(){return clk($q('#dispatch-section [onclick*="showJobForm"]'));})
  .then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F <b>AC Repair</b> \u2014 Mar\u00EDa Garc\u00EDa, $850...','action');return ty($('jobTitle'),'AC Repair - Unidad Goodman no enfr\u00EDa');})
  .then(function(){sv($('jobServiceType'),'Reparaci\u00F3n');sv($('jobPriority'),'high');return ty($('jobAddress'),'456 Oak St, Fontana, CA 92335');})
  .then(function(){var d=$('jobDate');if(d){d.value=new Date().toISOString().split('T')[0];d.dispatchEvent(new Event('change'));}
    // Set lat/lng
    var jl=$('jobLat'),jg=$('jobLng');if(jl)jl.value='34.0922';if(jg)jg.value='-117.4350';
    // Select tech
    var ts=$('jobTechId');if(ts&&techsData.length){sv(ts,techsData[0].id);}
    return ty($('jobNotes'),'Capacitor y contactor. Mar\u00EDa Garc\u00EDa. $850');})
  .then(function(){return sl(SD);})
  .then(function(){$('jobForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say('\u2705 Trabajo creado y asignado a <b>Carlos</b>. \uD83D\uDD27','success');});
}

/* S8: Job 2 */
function s8(){
  say('\u26A1 Segundo trabajo \u2014 <b>Walk-in Cooler</b> URGENTE.','action');
  return sl(SD).then(function(){return clk($q('#dispatch-section [onclick*="showJobForm"]'));})
  .then(function(){return sl(300);})
  .then(function(){return ty($('jobTitle'),'Walk-in Cooler Repair - Compresor');})
  .then(function(){sv($('jobServiceType'),'Reparaci\u00F3n');sv($('jobPriority'),'urgent');return ty($('jobAddress'),'2890 Highland Ave, San Bernardino, CA 92405');})
  .then(function(){var d=$('jobDate');if(d){d.value=new Date().toISOString().split('T')[0];}
    var jl=$('jobLat'),jg=$('jobLng');if(jl)jl.value='34.1247';if(jg)jg.value='-117.2929';
    var ts=$('jobTechId');if(ts&&techsData.length>1){sv(ts,techsData[1].id);}
    return ty($('jobNotes'),'Restaurante urgente. Cooler 55\u00B0F. La Michoacana. $2,200');})
  .then(function(){return sl(SD);})
  .then(function(){$('jobForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say('\u2705 <b>2 trabajos</b> activos \u2014 $3,050 revenue. GPS tracking en vivo.','success');});
}

/* S9: Service Call */
function s9(){
  say('\uD83D\uDCCD Navegando a <b>Llamadas de Servicio</b> \u2014 EMERGENCIA...','nav');
  return sl(SD).then(function(){showSection('servicecalls');return sl(SD);})
  .then(function(){return clk($q('#servicecalls-section [onclick*="showServiceCallForm"]'));})
  .then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F Emergencia: <b>AC no enfr\u00EDa</b>...','action');return ty($('scClientName'),'Mar\u00EDa Garc\u00EDa');})
  .then(function(){return ty($('scClientPhone'),'(909) 555-1234');})
  .then(function(){return ty($('scAddress'),'456 Oak St, Fontana, CA 92335');})
  .then(function(){return ty($('scProblem'),'AC no enfr\u00EDa. Solo aire caliente. Mascota en casa. Urgente.');})
  .then(function(){sv($('scUrgency'),'emergency');sv($('scPropertyType'),'residential');
    var pd=$('scPreferredDate');if(pd)pd.value=new Date().toISOString().split('T')[0];
    var pt=$('scPreferredTime');if(pt)sv(pt,'asap');
    if(techsData.length){var st2=$('scTechAssign');if(st2)sv(st2,techsData[0].id);}
    return ty($('scNotes'),'Gate code #1234. Estacionar en driveway.');})
  .then(function(){return sl(SD);})
  .then(function(){$('serviceCallForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say('\u2705 Llamada <b style="color:#ef4444">\uD83D\uDD34 EMERGENCIA</b> registrada y despachada.','success');});
}

/* S10: Dispatch GPS */
function s10(){
  say('\uD83D\uDCCD Navegando a <b>Despacho GPS</b>...','nav');
  return sl(SD).then(function(){showSection('dispatch');return sl(SD);})
  .then(function(){say('Centro de Control:<br>\uD83D\uDE90 <b>Carlos</b> \u2192 Fontana (AC Repair)<br>\uD83D\uDE90 <b>Miguel</b> \u2192 San Bernardino (Cooler)<br>Mapa muestra ubicaci\u00F3n GPS en tiempo real.','info');return sl(SD);})
  .then(function(){say('\u2705 <b>Despacho</b> \u2014 asigna, re-asigna, monitorea. Cliente recibe link de tracking.','success');});
}

/* S11: Payroll */
function s11(){
  say('\uD83D\uDCCD Navegando a <b>N\u00F3mina</b>...','nav');
  return sl(SD).then(function(){showSection('payroll');return sl(SD);})
  .then(function(){
    // Inject payroll data directly
    var entries=[
      {id:'pay1',company_id:companyId,tech_id:techsData[0]?techsData[0].id:null,tech_name:techsData[0]?techsData[0].name:'Carlos Mendoza',type:'hourly',hours:42,rate:35,total:1470,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],notes:'',status:'pending',created_at:new Date().toISOString()},
      {id:'pay2',company_id:companyId,tech_id:techsData[1]?techsData[1].id:null,tech_name:techsData[1]?techsData[1].name:'Miguel Torres',type:'hourly',hours:38,rate:30,total:1140,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],notes:'',status:'pending',created_at:new Date().toISOString()},
      {id:'pay3',company_id:companyId,tech_id:advisorsData[0]?advisorsData[0].id:null,tech_name:advisorsData[0]?advisorsData[0].name:'Diana Castillo',type:'commission',hours:0,rate:0,total:457.50,period_start:new Date().toISOString().split('T')[0],period_end:new Date().toISOString().split('T')[0],notes:'Comisi\u00F3n ventas',status:'pending',created_at:new Date().toISOString()}
    ];
    entries.forEach(function(e){_db.payroll_entries.push(e);});
    window.payrollData=entries;
    renderPayroll();return sl(SD);})
  .then(function(){say('\u2705 <b>N\u00F3mina</b>:<br>\uD83D\uDC77 Carlos: 42h \u00D7 $35 = <b>$1,470</b><br>\uD83D\uDC77 Miguel: 38h \u00D7 $30 = <b>$1,140</b><br>\uD83C\uDFE0 Diana: Comisi\u00F3n = <b>$457.50</b><br>Total: <b>$3,067.50</b>','success');});
}

/* S12: Invoice */
function s12(){
  say('\uD83D\uDCCD Navegando a <b>Facturas</b>...','nav');
  return sl(SD).then(function(){showSection('invoices');return sl(SD);})
  .then(function(){
    // Inject invoice directly (form is complex with line items)
    var inv={id:'inv1',company_id:companyId,invoice_number:'INV-202602-0001',client_name:'Mar\u00EDa Garc\u00EDa',client_email:'maria.garcia@email.com',client_phone:'(909) 555-1234',client_address:'456 Oak St, Fontana, CA',line_items:[{name:'Service Call',qty:1,unit_price:120,labor:0,total:120},{name:'Capacitor 45/5 MFD',qty:1,unit_price:85,labor:0,total:85},{name:'Contactor 2P 40A',qty:1,unit_price:65,labor:0,total:65},{name:'Labor AC Repair',qty:2,unit_price:0,labor:125,total:250}],subtotal:520,total:520,balance_due:520,amount_paid:0,status:'draft',due_date:new Date(Date.now()+30*86400000).toISOString().split('T')[0],created_at:new Date().toISOString()};
    _db.invoices.push(inv);window.invoicesData=[inv];
    renderInvoiceKPIs();renderInvoicesTable();return sl(SD);})
  .then(function(){say('\u2705 <b>INV-202602-0001</b> por <b>$520</b>:<br>\u2022 Service Call $120<br>\u2022 Capacitor $85<br>\u2022 Contactor $65<br>\u2022 Labor 2h \u00D7 $125 = $250','success');});
}

/* S13: Mark paid + 2nd invoice */
function s13(){
  say('\u26A1 Marcando factura como <b>PAGADA</b>...','action');
  return sl(SD).then(function(){
    if(invoicesData[0]){invoicesData[0].status='paid';invoicesData[0].amount_paid=520;invoicesData[0].balance_due=0;_db.invoices[0]=invoicesData[0];}
    var inv2={id:'inv2',company_id:companyId,invoice_number:'INV-202602-0002',client_name:'La Michoacana Restaurant',client_email:'lamichoacana.sb@email.com',client_phone:'(909) 555-5678',client_address:'2890 Highland Ave, SB',line_items:[{name:'Walk-in Cooler Repair',qty:1,unit_price:1800,labor:400,total:2200}],subtotal:2200,total:2200,balance_due:2200,amount_paid:0,status:'sent',due_date:new Date(Date.now()+30*86400000).toISOString().split('T')[0],created_at:new Date().toISOString()};
    _db.invoices.push(inv2);invoicesData.push(inv2);
    renderInvoiceKPIs();renderInvoicesTable();return sl(SD);})
  .then(function(){say('\u2705 INV-0001 <b style="color:#16a34a">\u2705 PAGADA</b> $520<br>INV-0002 <b style="color:#f59e0b">\uD83D\uDCB0 Pendiente</b> $2,200','success');});
}

/* S14: Expenses */
function s14(){
  say('\uD83D\uDCCD Navegando a <b>Gastos</b>...','nav');
  return sl(SD).then(function(){showSection('expenses');return sl(SD);})
  .then(function(){return clk($q('#expenses-section [onclick*="showExpenseForm"]'));})
  .then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F Gasolina <b>$287.50</b> Chevron...','action');
    sv($('expCategory'),'vehicle_gas');return ty($('expVendor'),'Chevron - Highland Ave');})
  .then(function(){return ty($('expAmount'),'287.50');})
  .then(function(){sv($('expFrequency'),'monthly');sv($('expType'),'variable');
    $('expDate').value=new Date().toISOString().split('T')[0];return sl(SD);})
  .then(function(){
    // Submit first expense
    $q('#expenses-section form').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(500);})
  .then(function(){
    // Add 3 more expenses directly
    var extras=[
      {id:'exp2',company_id:companyId,category:'general_liability',vendor:'State Farm Insurance',amount:450,frequency:'monthly',date:new Date().toISOString().split('T')[0],type:'fixed'},
      {id:'exp3',company_id:companyId,category:'software_crm',vendor:'Trade Master CRM',amount:149.99,frequency:'monthly',date:new Date().toISOString().split('T')[0],type:'fixed'},
      {id:'exp4',company_id:companyId,category:'vehicle_payment',vendor:'Ford Motor Credit',amount:650,frequency:'monthly',date:new Date().toISOString().split('T')[0],type:'fixed'}
    ];
    extras.forEach(function(e){_db.expenses.push(e);expensesData.push(e);});
    renderExpenses();return sl(SD);})
  .then(function(){say('\u2705 <b>4 gastos</b>: Fijos <b>$1,249.99</b> | Variables <b>$287.50</b> | Total <b>$1,537.49</b>','success');});
}

/* S15: My Money */
function s15(){
  say('\uD83D\uDCCD Navegando a <b>Mi Dinero</b>...','nav');
  return sl(SD).then(function(){showSection('mymoney');return sl(SD);})
  .then(function(){say('\u2705 <b>Mi Dinero</b> \u2014 gr\u00E1fica de ingresos vs gastos, transacciones recientes. Todo calculado desde facturas y gastos reales.','success');});
}

/* S16: Payroll detail */
function s16(){
  say('\uD83D\uDCCD <b>N\u00F3mina</b> detallada...','nav');
  return sl(SD).then(function(){showSection('payroll');renderPayroll();return sl(SD);})
  .then(function(){say('\u2705 Tabla con c\u00E1lculos por hora y comisi\u00F3n. Exporta a ADP, Gusto, QuickBooks.','success');});
}

/* S17: Marketing */
function s17(){
  say('\uD83D\uDCCD Navegando a <b>Mercadotecnia</b>...','nav');
  return sl(SD).then(function(){showSection('marketing');return sl(SD);})
  .then(function(){return clk($q('#marketing-section [onclick*="showCampaignForm"]'));})
  .then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F <b>Promo Verano AC Tune-Up $79</b>...','action');return ty($('campName'),'Promo Verano - AC Tune-Up $79');})
  .then(function(){sv($('campType'),'google_ads');return ty($('campBudget'),'1500');})
  .then(function(){var cs=$('campStart'),ce=$('campEnd');if(cs)cs.value=new Date().toISOString().split('T')[0];
    if(ce){var d=new Date();d.setDate(d.getDate()+60);ce.value=d.toISOString().split('T')[0];}
    return ty($('campMessage'),'AC Tune-Up $79. Inspecci\u00F3n 21 puntos. Rodriguez HVAC. (909) 555-0000');})
  .then(function(){return sl(SD);})
  .then(function(){$q('#marketing-section form').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return sl(800);})
  .then(function(){say('\u2705 Campa\u00F1a <b>Google Ads</b> activa $1,500. Links a Facebook, Yelp, Angi.','success');});
}

/* S18: Price Book */
function s18(){
  say('\uD83D\uDCCD Navegando a <b>Lista de Precios</b>...','nav');
  return sl(SD).then(function(){showSection('pricebook');return sl(SD);})
  .then(function(){
    var items=[
      {name:'Capacitor 45/5 MFD 440V',sku:'CAP-455',category:'ac_parts',unit:'each',cost:12,price:85,description:'Dual run Goodman/Amana'},
      {name:'Contactor 2P 40A',sku:'CON-2P40',category:'ac_parts',unit:'each',cost:8,price:65,description:'Reemplazo compresores'},
      {name:'Motor Fan 1/4 HP',sku:'MTR-025',category:'motors_fans',unit:'each',cost:45,price:195,description:'Condenser fan 208-230V'},
      {name:'R-410A por libra',sku:'REF-410A',category:'refrigerants',unit:'lb',cost:15,price:85,description:'Con recuperaci\u00F3n'},
      {name:'Termostato Honeywell',sku:'TSTAT-HW',category:'controls',unit:'each',cost:35,price:175,description:'T6 Pro programable'},
      {name:'Filtro 16x25x1 MERV 11',sku:'FLT-162',category:'filters',unit:'each',cost:4,price:25,description:'Plisado MERV 11'},
      {name:'Service Call 0-10mi',sku:'SC-010',category:'labor',unit:'flat',cost:0,price:70,description:'Diagn\u00F3stico'},
      {name:'Service Call 10-20mi',sku:'SC-1020',category:'labor',unit:'flat',cost:0,price:120,description:'Diagn\u00F3stico'},
      {name:'Labor por Hora',sku:'LAB-HR',category:'labor',unit:'hour',cost:0,price:125,description:'Tarifa est\u00E1ndar'},
      {name:'AC Tune-Up 21pts',sku:'TUNE-21',category:'labor',unit:'flat',cost:0,price:79,description:'Preventivo 21 puntos'}
    ];
    items.forEach(function(it){it.id='pb_'+(++_idC);it.company_id=companyId;_db.price_book.push(it);});
    window.priceBookData=items;
    renderPriceBook();return sl(SD);})
  .then(function(){say('\u2705 <b>10 art\u00EDculos</b> con m\u00E1rgenes \u2014 Capacitor: $12\u2192$85 (608%), Motor: $45\u2192$195 (333%), R-410A: $15\u2192$85 (467%)','success');});
}

/* S19: Reports */
function s19(){
  say('\uD83D\uDCCD Navegando a <b>Reportes</b>...','nav');
  return sl(SD).then(function(){showSection('reports');return sl(SD);})
  .then(function(){say('\u2705 <b>Reportes</b> \u2014 revenue, trabajos por t\u00E9cnico, fuentes de clientes, productividad. Exporta a PDF.','success');});
}

/* S20: Settings + Dashboard + CTA */
function s20(){
  say('\uD83D\uDCCD \u00DAltimo paso \u2014 <b>Configuraci\u00F3n</b>...','nav');
  return sl(SD).then(function(){showSection('settings');return sl(SD);})
  .then(function(){var el=$('settingsCompanyName');if(el&&!el.value)return ty(el,CO.name);})
  .then(function(){var el=$('settingsPhone');if(el&&!el.value)return ty(el,CO.phone);})
  .then(function(){var el=$('settingsEmail');if(el&&!el.value)return ty(el,CO.email);})
  .then(function(){var el=$('settingsAddress');if(el&&!el.value)return ty(el,CO.address);})
  .then(function(){var el=$('settingsLicense');if(el&&!el.value)return ty(el,CO.license);})
  .then(function(){var el=$('settingsBond');if(el&&!el.value)return ty(el,CO.bond);})
  .then(function(){var el=$('settingsOwnerName');if(el&&!el.value)return ty(el,CO.owner);})
  .then(function(){return sl(SD);})
  .then(function(){say('\u2705 Configuraci\u00F3n completa. Subir documentos: Workers Comp, Liability, W-9.','success');return sl(SD);})
  .then(function(){say('\uD83D\uDCCD Regresando al <b>Dashboard</b>...','nav');showSection('dashboard');return sl(SD);})
  .then(function(){say('\uD83C\uDF89\uD83C\uDF89 <b>\u00A1DEMO COMPLETADO!</b> \uD83C\uDF89\uD83C\uDF89','success');return sl(800);})
  .then(function(){say('En 20 pasos viste TODO:<br>\uD83D\uDC65 2 clientes | \uD83C\uDFAF 1 lead | \uD83D\uDC77 2 t\u00E9cnicos | \uD83C\uDFE0 1 advisor<br>\uD83D\uDD27 2 trabajos $3,050 | \uD83D\uDCDE 1 emergencia<br>\uD83D\uDCC4 2 facturas $2,720 | \uD83C\uDFE2 4 gastos $1,537<br>\uD83D\uDCE3 1 campa\u00F1a | \uD83D\uDCD2 10 art\u00EDculos | \uD83D\uDCB3 N\u00F3mina $3,067','info');return sl(800);})
  .then(function(){
    var ch=$('sfChat');var cta=document.createElement('div');
    cta.innerHTML='<div style="padding:14px;text-align:center"><a href="'+location.pathname+'" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;text-decoration:none;border-radius:14px;font-weight:700;font-size:15px;box-shadow:0 6px 20px rgba(249,115,22,.4)">\uD83D\uDE80 Registrarme en Trade Master CRM</a><p style="margin-top:8px;font-size:11px;color:var(--text-muted)">Plan Free 10 clientes | Pro $149.99/mes</p><button onclick="$(' + "'sfRestart'" + ').click()" style="margin-top:8px;padding:6px 14px;background:#1e3a5f;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:11px">\uD83D\uDD04 Ver Demo Otra Vez</button></div>';
    ch.appendChild(cta);ch.scrollTop=99999;
  });
}

/* ===== INIT ===== */
function init(){
  installMockSB();injectCSS();
  // Hide auth, show dashboard
  var ap=$('authPage'),dp=$('dashboardPage');
  if(ap)ap.style.display='none';
  if(dp)dp.style.display='grid';
  // Set user info
  var sn=$('sidebarUserName'),si=$('sidebarInitials'),cd=$('companyDisplay');
  if(sn)sn.textContent='Marco';if(si)si.textContent='M';
  var ui=$('userInitials');if(ui)ui.textContent='M';
  if(cd)cd.textContent=CO.name;
  var sb=document.querySelector('.sidebar-brand h2');if(sb)sb.textContent=CO.name;
  document.title=CO.name+' - CRM HVACR';
  // Pre-fill settings
  var stg={settingsCompanyName:CO.name,settingsPhone:CO.phone,settingsEmail:CO.email,settingsAddress:CO.address,settingsLicense:CO.license,settingsBond:CO.bond,settingsOwnerName:CO.owner};
  for(var k in stg){var el=$(k);if(el)el.value=stg[k];}
  // Init global vars
  window.companyId='demo-company';window.currentLang=window.currentLang||'es';
  // Show splash then Sofia
  showSplash().then(function(){
    createSofia();
    say('\uD83D\uDC4B Soy <b>Sof\u00EDa</b>, tu asistente AI de Trade Master CRM.','info');
    return sl(400);
  }).then(function(){
    say('Voy a <b>operar el CRM completo</b> \u2014 20 pasos con datos reales.','info');return sl(400);
  }).then(function(){
    say('Usa <b>\u23E9 Next</b> o <b>\u25B6\uFE0F Auto</b> para comenzar.','info');
  });
}

// Suppress alerts in demo mode (handlers show alerts after save)
var _origAlert=window.alert;
window.alert=function(msg){
  if(S&&(S.step>0||S.playing))return; // Suppress during demo steps
  _origAlert.call(window,msg);
};

// Wait for script.js to fully load and initialize, then take over
setTimeout(init,1500);
})();
