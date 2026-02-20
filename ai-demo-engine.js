/**
 * TRADE MASTER CRM - AI DEMO ENGINE v2.0 COMPLETO
 * Sofia - Asistente AI que OPERA el CRM en vivo
 * ACVOLT Tech School Inc. - San Bernardino, CA
 * Activación: ?demo=true
 */
(function(){
'use strict';
var P=new URLSearchParams(window.location.search);
if(!P.has('demo')||P.get('demo')!=='true')return;

var C={typeSpeed:30,stepDelay:700,company:{name:'Rodriguez HVAC LLC',city:'San Bernardino, CA',license:'C-20 #1087654',owner:'Marco Rodriguez',phone:'(909) 555-0000',email:'info@rodriguezhvac.com',address:'1850 S. Waterman Ave, Suite 100, San Bernardino, CA 92408',bond:'Bond #SB-2024-87654'}};

var D={
  clients:[
    {name:'María García',company:'',phone:'(909) 555-1234',email:'maria.garcia@email.com',ptype:'Residencial',address:'456 Oak St, Fontana, CA 92335',notes:'AC no enfría - unidad Goodman de 15 años. Prefiere servicio en español.'},
    {name:'Roberto Méndez',company:'La Michoacana Restaurant',phone:'(909) 555-5678',email:'lamichoacana.sb@email.com',ptype:'Comercial',address:'2890 Highland Ave, San Bernardino, CA 92405',notes:'Walk-in cooler no mantiene temperatura. Negocio abierto 7am-10pm. Urgente - producto perecedero en riesgo.'}
  ],
  lead:{name:'Roberto Sánchez',phone:'(909) 555-9012',email:'roberto.sanchez@email.com',service:'Calefacción',ptype:'residential',address:'1025 Pine Ave, Rialto, CA 92376',notes:'Interesado en Furnace nuevo. Casa 1,800 sq ft de 1985. Budget ~$4,500. Furnace actual 22 años.'},
  techs:[
    {name:'Carlos Mendoza',phone:'(909) 555-3456',email:'carlos.mendoza@rodriguezhvac.com',spec:'HVAC',vehicle:'2023 Ford Transit',plate:'8ABC123',rate:35},
    {name:'Miguel Ángel Torres',phone:'(909) 555-7890',email:'miguel.torres@rodriguezhvac.com',spec:'Refrigeración',vehicle:'2022 Chevy Express',plate:'7DEF456',rate:30}
  ],
  advisor:{name:'Diana Castillo',phone:'(909) 555-2345',email:'diana.castillo@rodriguezhvac.com',spec:'Residencial y Comercial',zone:'Inland Empire - San Bernardino, Fontana, Rialto, Riverside',goal:'50000'},
  jobs:[
    {title:'AC Repair - Unidad Goodman no enfría',stype:'Reparación',priority:'high',address:'456 Oak St, Fontana, CA 92335',notes:'Capacitor y contactor dañados. Partes Goodman. María García. $850',amount:850},
    {title:'Walk-in Cooler Repair - Compresor fallando',stype:'Reparación',priority:'urgent',address:'2890 Highland Ave, San Bernardino, CA 92405',notes:'Restaurante urgente. Cooler a 55°F. Compresor Copeland. La Michoacana. $2,200',amount:2200}
  ],
  scall:{cname:'María García',phone:'(909) 555-1234',addr:'456 Oak St, Fontana, CA 92335',problem:'AC no enfría desde ayer. Solo sale aire caliente. Tiene mascota. Urgente por temperaturas altas.',urgency:'emergency',ptype:'residential',notes:'Gate code #1234. Estacionar en driveway.'},
  invoice:{cname:'María García',items:[{desc:'Service Call',qty:1,price:120},{desc:'Capacitor 45/5 MFD',qty:1,price:85},{desc:'Contactor 2P 40A',qty:1,price:65},{desc:'Labor 2 hrs',qty:2,price:125}]},
  expense:{cat:'vehicle_gas',vendor:'Chevron - Highland Ave, SB',amount:'287.50',freq:'monthly',type:'variable'},
  campaign:{name:'Promo Verano - AC Tune-Up $79',type:'google_ads',budget:'1500',msg:'¡Prepara tu AC! Tune-up $79. Inspección 21 puntos. Rodriguez HVAC LLC. (909) 555-0000'},
  pricebook:[
    {name:'Capacitor 45/5 MFD 440V',sku:'CAP-455-440',cat:'ac_parts',unit:'each',cost:12,price:85,desc:'Dual run Goodman/Amana'},
    {name:'Contactor 2 Pole 40 Amp',sku:'CON-2P40',cat:'ac_parts',unit:'each',cost:8,price:65,desc:'Reemplazo compresores'},
    {name:'Motor Abanico 1/4 HP',sku:'MTR-FAN-025',cat:'motors_fans',unit:'each',cost:45,price:195,desc:'Condenser fan 208-230V'},
    {name:'Refrigerante R-410A (lb)',sku:'REF-410A',cat:'refrigerants',unit:'lb',cost:15,price:85,desc:'Por libra con recuperación'},
    {name:'Termostato Honeywell Pro',sku:'TSTAT-HW',cat:'controls',unit:'each',cost:35,price:175,desc:'T6 Pro programable'},
    {name:'Filtro 16x25x1 MERV 11',sku:'FLT-16251',cat:'filters',unit:'each',cost:4,price:25,desc:'Plisado MERV 11'},
    {name:'Service Call 0-10 mi',sku:'SC-010',cat:'labor',unit:'flat',cost:0,price:70,desc:'Diagnóstico 0-10 millas'},
    {name:'Service Call 10-20 mi',sku:'SC-1020',cat:'labor',unit:'flat',cost:0,price:120,desc:'Diagnóstico 10-20 millas'},
    {name:'Labor por Hora',sku:'LAB-HR',cat:'labor',unit:'hour',cost:0,price:125,desc:'Tarifa estándar'},
    {name:'AC Tune-Up 21 pts',sku:'TUNE-AC21',cat:'labor',unit:'flat',cost:0,price:79,desc:'Preventivo 21 puntos'}
  ]
};

var S={step:0,total:20,playing:false,paused:false,mini:false};
var mock={clients:[],leads:[],techs:[],advisors:[],jobs:[],scalls:[],invoices:[],expenses:[],campaigns:[],payroll:[],pricebook:[]};

function sl(ms){return new Promise(function(r){setTimeout(r,ms);});}
function wr(){return new Promise(function(r){var i=setInterval(function(){if(!S.paused){clearInterval(i);r();}},100);});}
function ck(){if(S.paused)return wr();return Promise.resolve();}

function ty(el,txt,spd){
  if(!el)return Promise.resolve();spd=spd||C.typeSpeed;el.value='';el.focus();
  var idx=0;
  return new Promise(function(resolve){
    function typeNext(){
      if(idx>=txt.length){el.dispatchEvent(new Event('change',{bubbles:true}));resolve();return;}
      if(S.paused){setTimeout(typeNext,100);return;}
      el.value+=txt[idx];el.dispatchEvent(new Event('input',{bubbles:true}));idx++;
      setTimeout(typeNext,spd);
    }
    typeNext();
  });
}
function sv(sel,val){if(!sel)return;sel.value=val;sel.dispatchEvent(new Event('change',{bubbles:true}));}
function clk(el){
  if(!el)return Promise.resolve();
  el.scrollIntoView({behavior:'smooth',block:'center'});
  return sl(250).then(function(){
    var r=el.getBoundingClientRect();var rp=document.createElement('div');rp.className='demo-ripple';
    rp.style.cssText='left:'+(r.left+r.width/2)+'px;top:'+(r.top+r.height/2)+'px;';
    document.body.appendChild(rp);
    return sl(150).then(function(){el.click();return sl(350).then(function(){rp.remove();});});
  });
}
function nav(sec){if(typeof window.showSection==='function')window.showSection(sec);var links=document.querySelectorAll('.sidebar-nav .nav-link');for(var i=0;i<links.length;i++){links[i].classList.remove('active');if(links[i].getAttribute('onclick')&&links[i].getAttribute('onclick').indexOf("'"+sec+"'")!==-1)links[i].classList.add('active');}}
function hf(id){var e=document.getElementById(id);if(e)e.style.display='none';}
function g(id){var e=document.getElementById(id);return e?e.value:'';}
function today(){return new Date().toISOString().split('T')[0];}
function future(d){var x=new Date();x.setDate(x.getDate()+d);return x.toISOString().split('T')[0];}
function fmtMoney(n){return '$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
function popTD(id){var s=document.getElementById(id);if(!s)return;s.innerHTML='<option value="">Sin asignar</option>';mock.techs.forEach(function(t){s.innerHTML+='<option value="'+t.id+'">'+t.name+' - '+t.spec+'</option>';});}

/* AUTH BYPASS */
function bypassAuth(){
  var a=document.getElementById('authPage'),d=document.getElementById('dashboardPage');
  if(a)a.style.display='none';if(d)d.style.display='flex';
  var sn=document.getElementById('sidebarUserName'),si=document.getElementById('sidebarInitials');
  if(sn)sn.textContent=C.company.owner;if(si)si.textContent='MR';
  var noop=function(){return{select:function(){return{eq:function(){return{single:function(){return Promise.resolve({data:null});},order:function(){return Promise.resolve({data:[]});}};},order:function(){return Promise.resolve({data:[]});},data:[],count:0};},insert:function(d2){return{select:function(){return{single:function(){return Promise.resolve({data:Array.isArray(d2)?d2[0]:d2,error:null});}};}};},'update':function(){return{eq:function(){return Promise.resolve({data:null,error:null});}};},upsert:function(){return Promise.resolve({data:null,error:null});},'delete':function(){return{eq:function(){return Promise.resolve({data:null,error:null});}};}};};
  if(!window.sbClient)window.sbClient={from:noop,auth:{getUser:function(){return Promise.resolve({data:{user:{id:'demo'}}});},getSession:function(){return Promise.resolve({data:{session:{user:{id:'demo'}}}});},signUp:function(){return Promise.resolve({data:{},error:null});},signInWithPassword:function(){return Promise.resolve({data:{},error:null});},onAuthStateChange:function(){return{data:{subscription:{unsubscribe:function(){}}}};}},storage:{from:function(){return{upload:function(){return Promise.resolve({data:{},error:null});},getPublicUrl:function(){return{data:{publicUrl:''}};}};}}}; 
  window.currentCompany={id:'demo-co',name:C.company.name,plan:'enterprise'};
  try{localStorage.setItem('companyId','demo-co');}catch(e){}
  var b=document.createElement('div');b.id='demoBanner';
  b.innerHTML='<div style="background:linear-gradient(135deg,#f97316,#ea580c);color:white;padding:10px 16px;text-align:center;font-size:13px;font-weight:600;position:fixed;top:0;left:0;right:0;z-index:10001;display:flex;align-items:center;justify-content:center;gap:12px;"><span>\uD83C\uDFAC MODO DEMO \u2014 '+C.company.name+' \u2014 San Bernardino, CA</span><button onclick="window.location.href=window.location.pathname" style="background:white;color:#ea580c;border:none;border-radius:6px;padding:4px 14px;font-size:11px;font-weight:700;cursor:pointer;">\u2715 Salir</button></div>';
  document.body.appendChild(b);document.body.style.paddingTop='42px';
}

/* SPLASH */
function showSplash(){
  return new Promise(function(res){
    var s=document.createElement('div');s.id='demoSplash';
    s.innerHTML='<div class="ds-content"><div style="font-size:64px;margin-bottom:16px;">\uD83D\uDD27</div><h1 style="font-size:2.2rem;font-weight:800;margin:0 0 6px;letter-spacing:-1px;color:white;">Trade Master CRM</h1><p style="color:#f97316;font-weight:600;font-size:1.1rem;margin:0 0 4px;">Demo Interactivo con Asistente AI</p><p style="color:#94a3b8;font-size:0.9rem;margin:0 0 28px;">'+C.company.name+' \u2014 '+C.company.city+'</p><p style="color:#cbd5e1;font-size:0.92rem;line-height:1.7;margin:0 0 32px;max-width:460px;">Sof\u00EDa va a <strong>operar el CRM completo</strong> frente a tus ojos \u2014 crear\u00E1 clientes, t\u00E9cnicos, trabajos, facturas, n\u00F3mina y m\u00E1s. <strong>20 acciones reales</strong> en vivo.</p><button id="demoStartBtn" class="ds-btn">\u25B6\uFE0F Iniciar Demo Guiado</button><p style="font-size:0.78rem;color:#64748b;margin-top:14px;">\u23F1\uFE0F 8-12 min | Manual o Auto Play</p></div>';
    document.body.appendChild(s);
    document.getElementById('demoStartBtn').onclick=function(){s.classList.add('ds-exit');setTimeout(function(){s.remove();res();},500);};
  });
}

/* SOFIA PANEL */
function createSofia(){
  var p=document.createElement('div');p.id='sofiaPanel';
  p.innerHTML='<div class="sf-head" id="sfHead"><div class="sf-hl"><span class="sf-av">\uD83D\uDC69\u200D\uD83D\uDCBC</span><div><span class="sf-name">Sof\u00EDa</span><span class="sf-role">Asistente AI</span></div></div><div class="sf-hr"><button class="sf-hb" id="sfMin" title="Minimizar">\u2212</button><button class="sf-hb" id="sfClose" title="Salir">\u2715</button></div></div><div class="sf-body"><div class="sf-pbar"><div class="sf-pfill" id="sfPFill"></div></div><div class="sf-step" id="sfStep">Paso 0 de '+S.total+'</div><div class="sf-chat" id="sfChat"></div></div><div class="sf-ctrl"><button class="sf-cb" id="sfRestart" title="Reiniciar">\u23EE\uFE0F</button><button class="sf-cb" id="sfPrev">\u23EA</button><button class="sf-cb sf-cp" id="sfPause">\u23F8\uFE0F</button><button class="sf-cb" id="sfNext">\u23E9</button><button class="sf-cb sf-auto" id="sfAuto">\u25B6\uFE0F Auto</button></div>';
  document.body.appendChild(p);
  document.getElementById('sfMin').onclick=toggleMin;
  document.getElementById('sfClose').onclick=function(){if(confirm('\u00BFSalir del demo?'))window.location.href=window.location.pathname;};
  document.getElementById('sfRestart').onclick=restart;
  document.getElementById('sfPrev').onclick=prev;
  document.getElementById('sfPause').onclick=togglePause;
  document.getElementById('sfNext').onclick=next;
  document.getElementById('sfAuto').onclick=autoPlay;
  var drag=false,sx,sy,sl2,st;var h=document.getElementById('sfHead');
  h.onmousedown=function(e){if(e.target.tagName==='BUTTON')return;drag=true;sx=e.clientX;sy=e.clientY;var r=p.getBoundingClientRect();sl2=r.left;st=r.top;e.preventDefault();};
  document.onmousemove=function(e){if(!drag)return;p.style.left=(sl2+e.clientX-sx)+'px';p.style.top=(st+e.clientY-sy)+'px';p.style.right='auto';p.style.bottom='auto';};
  document.onmouseup=function(){drag=false;};
  var bb=document.createElement('div');bb.id='sfBubble';bb.innerHTML='<span>\uD83D\uDC69\u200D\uD83D\uDCBC</span>';bb.style.display='none';bb.onclick=toggleMin;document.body.appendChild(bb);
}
function toggleMin(){S.mini=!S.mini;document.getElementById('sofiaPanel').style.display=S.mini?'none':'flex';document.getElementById('sfBubble').style.display=S.mini?'flex':'none';}
function say(msg,type){type=type||'info';var ch=document.getElementById('sfChat');var icons={info:'\uD83D\uDCAC',action:'\u26A1',success:'\u2705',nav:'\uD83D\uDCCD',warn:'\u26A0\uFE0F'};var m=document.createElement('div');m.className='sf-msg sf-'+type;m.innerHTML='<span class="sf-mi">'+(icons[type]||'\uD83D\uDCAC')+'</span><span class="sf-mt">'+msg+'</span>';ch.appendChild(m);ch.scrollTop=ch.scrollHeight;if(S.mini)toggleMin();}
function upProg(){document.getElementById('sfPFill').style.width=(S.step/S.total*100)+'%';document.getElementById('sfStep').textContent='Paso '+S.step+' de '+S.total;}
function togglePause(){S.paused=!S.paused;document.getElementById('sfPause').textContent=S.paused?'\u25B6\uFE0F':'\u23F8\uFE0F';}
function next(){if(S.step>=S.total){say('\uD83C\uDF89 \u00A1Demo completado! Clic \u23EE\uFE0F para reiniciar.','success');return Promise.resolve();}S.paused=false;document.getElementById('sfPause').textContent='\u23F8\uFE0F';S.step++;upProg();return runStep(S.step);}
function prev(){if(S.step<=1)return Promise.resolve();S.step=Math.max(0,S.step-2);return next();}
function restart(){S.step=0;S.paused=false;S.playing=false;mock={clients:[],leads:[],techs:[],advisors:[],jobs:[],scalls:[],invoices:[],expenses:[],campaigns:[],payroll:[],pricebook:[]};document.getElementById('sfChat').innerHTML='';upProg();say('\uD83D\uDD04 Demo reiniciado.','info');return sl(400).then(next);}
function autoPlay(){
  if(S.playing){S.playing=false;document.getElementById('sfAuto').textContent='\u25B6\uFE0F Auto';return Promise.resolve();}
  S.playing=true;S.paused=false;document.getElementById('sfAuto').textContent='\u23F9\uFE0F Stop';
  function loop(){if(!S.playing||S.step>=S.total){S.playing=false;document.getElementById('sfAuto').textContent='\u25B6\uFE0F Auto';return Promise.resolve();}return next().then(function(){if(S.playing)return sl(1800).then(loop);});}
  return loop();
}

/* MOCK HANDLERS */
function setupMocks(){
  window.handleClientCreate=function(e){if(e&&e.preventDefault)e.preventDefault();
    mock.clients.push({id:'dc'+Date.now(),name:g('clientName'),company:g('clientCompany'),phone:g('clientPhone'),email:g('clientEmail'),ptype:g('clientPropertyType'),address:g('clientAddress'),notes:g('clientNotes'),ts:new Date().toISOString()});
    renderClients2();hf('clientFormContainer');};
  window.showClientForm=function(){var c=document.getElementById('clientFormContainer');if(c){c.style.display='block';var f=document.getElementById('clientForm');if(f)f.reset();}};
  window.hideClientForm=function(){hf('clientFormContainer');};
  window.handleLeadCreate=function(e){if(e&&e.preventDefault)e.preventDefault();
    mock.leads.push({id:'dl'+Date.now(),name:g('leadName'),phone:g('leadPhone'),email:g('leadEmail'),service:g('leadService'),ptype:g('leadPropertyType'),address:g('leadAddress'),notes:g('leadNotes'),status:'hot',ts:new Date().toISOString()});
    renderLeads2();hf('leadFormContainer');};
  window.showLeadForm=function(){var c=document.getElementById('leadFormContainer');if(c)c.style.display='block';};
  window.hideLeadForm=function(){hf('leadFormContainer');};
  window.handleTechCreateAlt=function(e){if(e&&e.preventDefault)e.preventDefault();
    mock.techs.push({id:'dt'+Date.now(),name:g('techNameAlt'),phone:g('techPhoneAlt'),email:g('techEmailAlt'),spec:g('techSpecialtyAlt'),vehicle:g('techVehicleAlt'),plate:g('techPlateAlt'),status:'available',ts:new Date().toISOString()});
    renderTechs2();hf('techFormContainerAlt');};
  window.showTechFormInTechSection=function(){var c=document.getElementById('techFormContainerAlt');if(c)c.style.display='block';};
  window.hideTechFormAlt=function(){hf('techFormContainerAlt');};
  window.handleAdvisorCreate=function(e){if(e&&e.preventDefault)e.preventDefault();
    mock.advisors.push({id:'da'+Date.now(),name:g('advisorName'),phone:g('advisorPhone'),email:g('advisorEmail'),spec:g('advisorSpecialty'),zone:g('advisorZone'),goal:g('advisorGoal'),ts:new Date().toISOString()});
    renderAdvisors2();hf('advisorFormContainer');};
  window.showAdvisorForm=function(){var c=document.getElementById('advisorFormContainer');if(c)c.style.display='block';};
  window.hideAdvisorForm=function(){hf('advisorFormContainer');};
  window.handleJobCreate=function(e){if(e&&e.preventDefault)e.preventDefault();
    var n=(mock.jobs.length+1).toString();while(n.length<3)n='0'+n;
    mock.jobs.push({id:'dj'+Date.now(),num:'TM-2026-'+n,title:g('jobTitle'),stype:g('jobServiceType'),priority:g('jobPriority'),address:g('jobAddress'),date:g('jobDate'),tech_id:g('jobTechId'),notes:g('jobNotes'),status:'scheduled',ts:new Date().toISOString()});
    renderJobs2();hf('jobFormContainer');};
  window.showJobForm=function(){var c=document.getElementById('jobFormContainer');if(c){c.style.display='block';var f=document.getElementById('jobForm');if(f)f.reset();}popTD('jobTechId');};
  window.hideJobForm=function(){hf('jobFormContainer');};
  window.handleServiceCallCreate=function(e){if(e&&e.preventDefault)e.preventDefault();
    mock.scalls.push({id:'dsc'+Date.now(),cname:g('scClientName'),phone:g('scClientPhone'),addr:g('scAddress'),problem:g('scProblem'),urgency:g('scUrgency'),ptype:g('scPropertyType'),status:'new',ts:new Date().toISOString()});
    renderSCalls2();hf('serviceCallFormContainer');};
  window.showServiceCallForm=function(){var c=document.getElementById('serviceCallFormContainer');if(c){c.style.display='block';var f=document.getElementById('serviceCallForm');if(f)f.reset();}popTD('scTechAssign');};
  window.hideServiceCallForm=function(){hf('serviceCallFormContainer');};
  window.handleInvoiceCreate=function(e){if(e&&e.preventDefault)e.preventDefault();
    var n=(mock.invoices.length+1).toString();while(n.length<4)n='0'+n;
    mock.invoices.push({id:'dinv'+Date.now(),num:'INV-'+n,cname:g('invClientName'),phone:g('invClientPhone'),email:g('invClientEmail'),total:0,status:'pending',ts:new Date().toISOString()});
    renderInvoices2();hf('invoiceFormContainer');};
  window.showInvoiceForm=function(){var c=document.getElementById('invoiceFormContainer');if(c)c.style.display='block';};
  window.hideInvoiceForm=function(){hf('invoiceFormContainer');};
  window.handleExpenseCreate=function(e){if(e&&e.preventDefault)e.preventDefault();
    mock.expenses.push({id:'dexp'+Date.now(),cat:g('expCategory'),vendor:g('expVendor'),amount:parseFloat(g('expAmount')||0),type:g('expType'),ts:new Date().toISOString()});
    renderExpenses2();hf('expenseFormContainer');};
  window.showExpenseForm=function(){var c=document.getElementById('expenseFormContainer');if(c)c.style.display='block';};
  window.handleCampaignCreate=function(e){if(e&&e.preventDefault)e.preventDefault();
    mock.campaigns.push({id:'dcp'+Date.now(),name:g('campName'),type:g('campType'),budget:parseFloat(g('campBudget')||0),status:'active',ts:new Date().toISOString()});
    renderCampaigns2();hf('campaignFormContainer');};
  window.showCampaignForm=function(){var c=document.getElementById('campaignFormContainer');if(c)c.style.display='block';};
  window.hideCampaignForm=function(){hf('campaignFormContainer');};
  window.handlePriceBookCreate=function(e){if(e&&e.preventDefault)e.preventDefault();
    mock.pricebook.push({id:'dpb'+Date.now(),name:g('pbName'),sku:g('pbSku'),cat:g('pbCategory'),unit:g('pbUnit'),cost:parseFloat(g('pbCost')||0),price:parseFloat(g('pbPrice')||0),desc:g('pbDesc')});
    renderPricebook2();hf('priceBookFormContainer');};
  window.showPriceBookForm=function(){var c=document.getElementById('priceBookFormContainer');if(c)c.style.display='block';};
  window.hidePriceBookForm=function(){hf('priceBookFormContainer');};
  window.handlePayrollCreate=function(e){if(e&&e.preventDefault)e.preventDefault();
    mock.payroll.push({id:'dpr'+Date.now(),tech:g('payTechSelect'),type:g('payType'),hours:parseFloat(g('payHours')||0),rate:parseFloat(g('payRate')||0),total:parseFloat(g('payTotal')||0),ts:new Date().toISOString()});
    renderPayroll2();hf('payrollFormContainer');};
  window.showPayrollEntry=function(){var c=document.getElementById('payrollFormContainer');if(c)c.style.display='block';popTD('payTechSelect');};
  window.hidePayrollEntry=function(){hf('payrollFormContainer');};
  window.checkClientLimit=function(){return Promise.resolve({canAdd:true,currentCount:mock.clients.length,limit:999,plan:'enterprise'});};
  window.showUpgradePlanModal=function(){};
  window.refreshCommandCenter=function(){populateDash();};
  window.refreshCommandCenterMap=function(){};
  window.loadDefaultPriceBook=function(){};
  window.renderClientsList=function(){renderClients2();};
  window.filterPriceBook=function(){};
  window.renderReports=function(){};
  window.renderMyMoney=function(){};
}

/* RENDER FUNCTIONS */
function renderClients2(){
  var c=document.getElementById('clientsList'),cn=document.getElementById('clientCount');
  if(cn)cn.textContent='('+mock.clients.length+')';
  if(!c)return;var h='<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:var(--bg-input);"><th style="padding:10px;text-align:left;">Cliente</th><th style="padding:10px;">Tel\u00E9fono</th><th style="padding:10px;">Tipo</th><th style="padding:10px;">Direcci\u00F3n</th></tr></thead><tbody>';
  mock.clients.forEach(function(cl){h+='<tr style="border-bottom:1px solid var(--border);"><td style="padding:10px;"><strong>'+cl.name+'</strong>'+(cl.company?'<br><small style="color:var(--text-muted);">'+cl.company+'</small>':'')+'</td><td style="padding:10px;">'+cl.phone+'</td><td style="padding:10px;"><span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;background:#f1f5f9;">'+(cl.ptype==='Comercial'?'\uD83C\uDFE2':'\uD83C\uDFE0')+' '+cl.ptype+'</span></td><td style="padding:10px;font-size:11px;">'+cl.address+'</td></tr>';});
  h+='</tbody></table>';c.innerHTML=h;
}
function renderLeads2(){
  var c=document.getElementById('leadsList');if(!c)return;var h='';
  mock.leads.forEach(function(l){h+='<div style="padding:14px;background:var(--bg-input);border-radius:10px;margin-bottom:10px;border-left:4px solid #ef4444;"><div style="display:flex;justify-content:space-between;"><div><strong>'+l.name+'</strong> <span style="background:#fef2f2;color:#ef4444;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;">\uD83D\uDD25 CALIENTE</span></div><span style="font-size:11px;color:var(--text-muted);">'+l.service+'</span></div><div style="font-size:12px;color:var(--text-muted);margin-top:6px;">\uD83D\uDCF1 '+l.phone+' | \uD83D\uDCCD '+l.address+'</div><div style="font-size:11px;color:var(--text-muted);margin-top:4px;">\uD83D\uDCDD '+l.notes+'</div></div>';});
  c.innerHTML=h;
}
function renderTechs2(){
  var c=document.getElementById('techniciansFullList');if(!c)return;
  var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;">';
  mock.techs.forEach(function(t){var ini=t.name.split(' ').map(function(n){return n[0];}).join('');
    h+='<div style="padding:20px;background:var(--bg-input);border-radius:12px;border:1px solid var(--border);"><div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;"><div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#2d4a6f);color:white;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;">'+ini+'</div><div><strong style="font-size:15px;">'+t.name+'</strong><br><span style="font-size:12px;color:var(--text-muted);">\uD83D\uDD27 '+t.spec+'</span></div></div><div style="font-size:12px;line-height:2;color:var(--text-muted);">\uD83D\uDCF1 '+t.phone+'<br>\uD83D\uDCE7 '+t.email+'<br>\uD83D\uDE90 '+t.vehicle+' | \uD83E\uDEA7 '+t.plate+'</div><div style="margin-top:10px;"><span style="background:#dcfce7;color:#166534;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;">\uD83D\uDFE2 Disponible</span></div></div>';});
  h+='</div>';c.innerHTML=h;
}
function renderAdvisors2(){
  var c=document.getElementById('advisorsList');if(!c)return;
  var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">';
  mock.advisors.forEach(function(a){var ini=a.name.split(' ').map(function(n){return n[0];}).join('');
    h+='<div style="padding:20px;background:var(--bg-input);border-radius:12px;border:1px solid var(--border);border-top:4px solid #10b981;"><div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;"><div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);color:white;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;">'+ini+'</div><div><strong>'+a.name+'</strong><br><span style="font-size:11px;color:var(--text-muted);">\uD83C\uDFE0 Home Advisor - '+a.spec+'</span></div></div><div style="font-size:12px;color:var(--text-muted);line-height:1.8;">\uD83D\uDCF1 '+a.phone+'<br>\uD83D\uDCE7 '+a.email+'<br>\uD83D\uDCCD '+a.zone+'<br>\uD83C\uDFAF Meta: $'+parseInt(a.goal).toLocaleString()+'/mes</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;"><div style="background:#dcfce7;padding:8px;border-radius:6px;text-align:center;"><div style="font-size:16px;font-weight:700;color:#166534;">$0</div><div style="font-size:10px;color:#065f46;">Ventas</div></div><div style="background:#dbeafe;padding:8px;border-radius:6px;text-align:center;"><div style="font-size:16px;font-weight:700;color:#1e40af;">$0</div><div style="font-size:10px;color:#1e3a8a;">Comisi\u00F3n</div></div></div></div>';});
  h+='</div>';c.innerHTML=h;
}
function renderJobs2(){
  var c=document.getElementById('jobsList');if(!c)return;var h='';var pc={normal:'#3b82f6',high:'#f59e0b',urgent:'#ef4444'};
  mock.jobs.forEach(function(j){var t=null;for(var i=0;i<mock.techs.length;i++){if(mock.techs[i].id===j.tech_id){t=mock.techs[i];break;}}
    h+='<div style="padding:12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;"><div><strong style="color:var(--primary);">'+j.num+'</strong> - '+j.title+'<br><span style="font-size:11px;color:var(--text-muted);">\uD83D\uDCCD '+j.address+'</span>'+(t?'<br><span style="font-size:11px;">\uD83D\uDC77 '+t.name+'</span>':'')+'</div><div style="text-align:right;"><span style="background:'+(pc[j.priority]||'#3b82f6')+'22;color:'+(pc[j.priority]||'#3b82f6')+';padding:4px 8px;border-radius:6px;font-size:11px;font-weight:600;">'+j.priority.toUpperCase()+'</span><br><span style="font-size:11px;color:var(--text-muted);">\uD83D\uDCC5 '+j.date+'</span></div></div>';});
  c.innerHTML=h;
}
function renderSCalls2(){
  var c=document.getElementById('serviceCallsGrid');if(!c)return;
  var kn=document.getElementById('scKpiNew');if(kn)kn.textContent=mock.scalls.filter(function(s2){return s2.status==='new';}).length;
  var h='';var uc={normal:'#10b981',priority:'#f59e0b',emergency:'#ef4444'};var ul2={normal:'\uD83D\uDFE2 Normal',priority:'\uD83D\uDFE1 Prioritario',emergency:'\uD83D\uDD34 Emergencia'};
  mock.scalls.forEach(function(sc){h+='<div style="padding:16px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;border-left:4px solid '+(uc[sc.urgency]||'#3b82f6')+';margin-bottom:10px;"><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><strong>'+sc.cname+'</strong><span style="background:'+(uc[sc.urgency]||'#3b82f6')+'22;color:'+(uc[sc.urgency]||'#3b82f6')+';padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;">'+(ul2[sc.urgency]||sc.urgency)+'</span></div><div style="font-size:12px;color:var(--text-muted);line-height:1.8;">\uD83D\uDCF1 '+sc.phone+'<br>\uD83D\uDCCD '+sc.addr+'<br>\uD83D\uDD27 '+sc.problem+'</div><div style="margin-top:10px;"><span style="background:#dbeafe;color:#1e40af;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:600;">\uD83C\uDD95 NUEVA</span></div></div>';});
  c.innerHTML=h;
}
function renderInvoices2(){
  var c=document.getElementById('invoicesTable');if(!c)return;
  var h='<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:var(--bg-input);"><th style="padding:10px;text-align:left;">#</th><th style="padding:10px;">Cliente</th><th style="padding:10px;">Total</th><th style="padding:10px;">Estado</th></tr></thead><tbody>';
  mock.invoices.forEach(function(inv){var paid=inv.status==='paid';
    h+='<tr style="border-bottom:1px solid var(--border);'+(paid?'background:#f0fdf4;':'')+'"><td style="padding:10px;font-weight:600;color:var(--primary);">'+inv.num+'</td><td style="padding:10px;">'+inv.cname+'</td><td style="padding:10px;font-weight:600;">'+fmtMoney(inv.total)+'</td><td style="padding:10px;"><span style="background:'+(paid?'#dcfce7':'#fef3c7')+';color:'+(paid?'#166534':'#92400e')+';padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;">'+(paid?'\u2705 Pagada':'\uD83D\uDCB0 Pendiente')+'</span></td></tr>';});
  h+='</tbody></table>';c.innerHTML=h;
}
function renderExpenses2(){
  var f=0,v=0;mock.expenses.forEach(function(e){if(e.type==='fixed')f+=e.amount;else v+=e.amount;});
  var el1=document.getElementById('expFixed'),el2=document.getElementById('expVariable'),el3=document.getElementById('expTotal');
  if(el1)el1.textContent=fmtMoney(f);if(el2)el2.textContent=fmtMoney(v);if(el3)el3.textContent=fmtMoney(f+v);
}
function renderCampaigns2(){
  var c=document.getElementById('campaignsList'),cn=document.getElementById('mktCampaignCount');
  if(cn)cn.textContent=mock.campaigns.length;if(!c)return;
  var h='';mock.campaigns.forEach(function(cp){h+='<div style="padding:16px;background:var(--bg-input);border-radius:10px;margin-bottom:10px;border-left:4px solid #3b82f6;"><div style="display:flex;justify-content:space-between;"><strong>'+cp.name+'</strong><span style="background:#dcfce7;color:#166534;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;">\u2705 Activa</span></div><div style="font-size:12px;color:var(--text-muted);margin-top:6px;">'+cp.type+' | Presupuesto: '+fmtMoney(cp.budget)+'</div></div>';});
  c.innerHTML=h;
}
function renderPricebook2(){
  var c=document.getElementById('priceBookTable'),ti=document.getElementById('pbTotalItems'),am=document.getElementById('pbAvgMarkup'),ca=document.getElementById('pbCategories');
  if(ti)ti.textContent=mock.pricebook.length;
  if(am){var withCost=mock.pricebook.filter(function(p){return p.cost>0;});var avg=withCost.length?withCost.reduce(function(s,p){return s+((p.price-p.cost)/p.cost*100);},0)/withCost.length:0;am.textContent=Math.round(avg)+'%';}
  if(ca){var cats={};mock.pricebook.forEach(function(p){cats[p.cat]=true;});ca.textContent=Object.keys(cats).length;}
  if(!c)return;
  var h='<table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:var(--bg-input);"><th style="padding:8px;text-align:left;">Art\u00EDculo</th><th style="padding:8px;">SKU</th><th style="padding:8px;">Costo</th><th style="padding:8px;">Precio</th><th style="padding:8px;">Margen</th></tr></thead><tbody>';
  mock.pricebook.forEach(function(p){var margin=p.cost>0?Math.round((p.price-p.cost)/p.cost*100):'-';
    h+='<tr style="border-bottom:1px solid var(--border);"><td style="padding:8px;"><strong>'+p.name+'</strong><br><small style="color:var(--text-muted);">'+(p.desc||'')+'</small></td><td style="padding:8px;font-family:monospace;font-size:11px;">'+p.sku+'</td><td style="padding:8px;">'+(p.cost>0?fmtMoney(p.cost):'-')+'</td><td style="padding:8px;font-weight:600;">'+fmtMoney(p.price)+'</td><td style="padding:8px;"><span style="color:'+(typeof margin==='number'&&margin>100?'#16a34a':'#64748b')+';font-weight:600;">'+(typeof margin==='number'?margin+'%':margin)+'</span></td></tr>';});
  h+='</tbody></table>';c.innerHTML=h;
}
function renderPayroll2(){
  var c=document.getElementById('payrollTable');
  var ec=document.getElementById('payEmployeeCount'),pt=document.getElementById('payPeriodTotal'),th=document.getElementById('payTotalHours');
  if(ec)ec.textContent=mock.techs.length+mock.advisors.length;
  var totPay=0,totH=0;mock.payroll.forEach(function(p){totPay+=p.total;totH+=p.hours;});
  if(pt)pt.textContent=fmtMoney(totPay);if(th)th.textContent=totH;
  if(!c)return;
  var h='<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:var(--bg-input);"><th style="padding:10px;text-align:left;">Empleado</th><th style="padding:10px;">Tipo</th><th style="padding:10px;">Horas</th><th style="padding:10px;">Tarifa</th><th style="padding:10px;">Total</th></tr></thead><tbody>';
  mock.payroll.forEach(function(pr){var t=null;for(var i=0;i<mock.techs.length;i++){if(mock.techs[i].id===pr.tech){t=mock.techs[i];break;}}if(!t){for(var j=0;j<mock.advisors.length;j++){if(mock.advisors[j].id===pr.tech){t=mock.advisors[j];break;}}}
    h+='<tr style="border-bottom:1px solid var(--border);"><td style="padding:10px;"><strong>'+(t?t.name:pr.tech)+'</strong></td><td style="padding:10px;">'+(pr.type==='hourly'?'\u23F0 Por Hora':pr.type==='commission'?'\uD83D\uDCB0 Comisi\u00F3n':pr.type)+'</td><td style="padding:10px;">'+pr.hours+'</td><td style="padding:10px;">'+fmtMoney(pr.rate)+'/hr</td><td style="padding:10px;font-weight:600;">'+fmtMoney(pr.total)+'</td></tr>';});
  h+='</tbody></table>';c.innerHTML=h;
}
function populateDash(){
  function el(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
  el('hcpWonJobs',mock.jobs.length);
  var jAmt=0;D.jobs.forEach(function(j){jAmt+=j.amount;});
  el('hcpWonJobsAmount',fmtMoney(jAmt));
  el('hcpActiveServiceCalls',mock.scalls.length);
  el('hcpSCNew',mock.scalls.filter(function(s2){return s2.status==='new';}).length);
  el('hcpActiveAdvisors',mock.advisors.length);
  el('hcpTechsAvailable',mock.techs.length);
  el('hcpTechsOnline',mock.techs.length);
  el('totalTechsCount',mock.techs.length);
  el('totalAdvisorsCount',mock.advisors.length);
  var esl=document.getElementById('allEmployeesStatusList');
  if(esl){var h='';
    mock.techs.forEach(function(t){h+='<div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg-input);border-radius:8px;border-left:3px solid #10b981;"><div style="width:36px;height:36px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">'+t.name.charAt(0)+'</div><div style="flex:1;"><strong style="font-size:13px;">'+t.name+'</strong><br><span style="font-size:11px;color:var(--text-muted);">\uD83D\uDC77 '+t.spec+'</span></div><span style="background:#dcfce7;color:#166534;padding:3px 8px;border-radius:8px;font-size:10px;font-weight:600;">\uD83D\uDFE2 En l\u00EDnea</span></div>';});
    mock.advisors.forEach(function(a){h+='<div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg-input);border-radius:8px;border-left:3px solid #8b5cf6;"><div style="width:36px;height:36px;border-radius:50%;background:#8b5cf6;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">'+a.name.charAt(0)+'</div><div style="flex:1;"><strong style="font-size:13px;">'+a.name+'</strong><br><span style="font-size:11px;color:var(--text-muted);">\uD83C\uDFE0 Home Advisor</span></div><span style="background:#f3e8ff;color:#6d28d9;padding:3px 8px;border-radius:8px;font-size:10px;font-weight:600;">\uD83D\uDFE2 Activa</span></div>';});
    esl.innerHTML=h;}
}

/* ======================== 20 DEMO STEPS ======================== */
function runStep(n){
  return ck().then(function(){
    switch(n){
      case 1:return s1();case 2:return s2();case 3:return s3();case 4:return s4();case 5:return s5();
      case 6:return s6();case 7:return s7();case 8:return s8();case 9:return s9();case 10:return s10();
      case 11:return s11();case 12:return s12();case 13:return s13();case 14:return s14();case 15:return s15();
      case 16:return s16();case 17:return s17();case 18:return s18();case 19:return s19();case 20:return s20();
    }
  });
}

/* STEP 1: Cliente residencial */
function s1(){
  var d=D.clients[0];
  say('\uD83D\uDC4B \u00A1Hola! Soy <strong>Sof\u00EDa</strong>, tu asistente AI. Voy a mostrarte TODO el CRM con datos reales. \u00A1Empecemos creando tu primer cliente!','info');
  return sl(C.stepDelay).then(function(){say('\uD83D\uDCCD Navegando a <strong>Clientes</strong>...','nav');nav('clients');return sl(C.stepDelay);})
  .then(function(){say('\u26A1 Clic en <strong>"+ Nuevo Cliente"</strong>...','action');return clk(document.querySelector('#clients-section [onclick*="showClientForm"]'));})
  .then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F Llenando datos de <strong>Mar\u00EDa Garc\u00EDa</strong> \u2014 residencial, Fontana, CA...','action');return ty(document.getElementById('clientName'),d.name);})
  .then(function(){return sl(100);}).then(function(){return ty(document.getElementById('clientPhone'),d.phone);})
  .then(function(){return sl(100);}).then(function(){return ty(document.getElementById('clientEmail'),d.email);})
  .then(function(){sv(document.getElementById('clientPropertyType'),d.ptype);return sl(100);})
  .then(function(){return ty(document.getElementById('clientAddress'),d.address);})
  .then(function(){return sl(100);}).then(function(){return ty(document.getElementById('clientNotes'),d.notes,18);})
  .then(function(){return sl(C.stepDelay);})
  .then(function(){say('\uD83D\uDCBE Guardando cliente...','action');
    var f=document.getElementById('clientForm');if(f)f.dispatchEvent(new Event('submit',{cancelable:true}));return sl(C.stepDelay);})
  .then(function(){say('\u2705 <strong>Mar\u00EDa Garc\u00EDa</strong> creada \u2014 AC no enfr\u00EDa, servicio urgente.','success');});
}

/* STEP 2: Cliente comercial */
function s2(){
  var d=D.clients[1];
  say('Ahora un cliente <strong>comercial</strong> \u2014 restaurante con problema en walk-in cooler.','info');
  return sl(C.stepDelay).then(function(){nav('clients');return clk(document.querySelector('#clients-section [onclick*="showClientForm"]'));})
  .then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F Registrando <strong>La Michoacana Restaurant</strong>...','action');return ty(document.getElementById('clientName'),d.name);})
  .then(function(){return ty(document.getElementById('clientCompany'),d.company);})
  .then(function(){return ty(document.getElementById('clientPhone'),d.phone);})
  .then(function(){return ty(document.getElementById('clientEmail'),d.email);})
  .then(function(){sv(document.getElementById('clientPropertyType'),d.ptype);return ty(document.getElementById('clientAddress'),d.address);})
  .then(function(){return ty(document.getElementById('clientNotes'),d.notes,15);})
  .then(function(){return sl(C.stepDelay);})
  .then(function(){say('\uD83D\uDCBE Guardando...','action');var f=document.getElementById('clientForm');if(f)f.dispatchEvent(new Event('submit',{cancelable:true}));return sl(C.stepDelay);})
  .then(function(){say('\u2705 <strong>2 clientes</strong> creados \u2014 residencial y comercial. La tabla se actualiza en tiempo real. \uD83D\uDCCA','success');});
}

/* STEP 3: Lead */
function s3(){
  var d=D.lead;
  say('\uD83D\uDCCD Navegando a <strong>Prospectos</strong> \u2014 registrar lead caliente.','nav');
  return sl(C.stepDelay).then(function(){nav('leads');return sl(C.stepDelay);})
  .then(function(){return clk(document.querySelector('#leads-section [onclick*="showLeadForm"]'));}).then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F Registrando <strong>Roberto S\u00E1nchez</strong> \u2014 Furnace nuevo...','action');return ty(document.getElementById('leadName'),d.name);})
  .then(function(){return ty(document.getElementById('leadPhone'),d.phone);})
  .then(function(){return ty(document.getElementById('leadEmail'),d.email);})
  .then(function(){sv(document.getElementById('leadService'),d.service);sv(document.getElementById('leadPropertyType'),d.ptype);return ty(document.getElementById('leadAddress'),d.address);})
  .then(function(){return ty(document.getElementById('leadNotes'),d.notes,15);})
  .then(function(){return sl(C.stepDelay);})
  .then(function(){say('\uD83D\uDCBE Guardando...','action');var f=document.getElementById('leadForm');if(f)f.dispatchEvent(new Event('submit',{cancelable:true}));return sl(C.stepDelay);})
  .then(function(){say('\u2705 Lead <strong>Roberto S\u00E1nchez</strong> \uD83D\uDD25 CALIENTE. Aparece con pin en Google Maps.','success');});
}

/* STEP 4: T\u00e9cnico 1 */
function s4(){
  var d=D.techs[0];
  say('\uD83D\uDCCD Navegando a <strong>T\u00E9cnicos</strong> \u2014 registrar equipo de campo.','nav');
  return sl(C.stepDelay).then(function(){nav('technicians');return sl(C.stepDelay);})
  .then(function(){return clk(document.querySelector('#technicians-section [onclick*="showTechFormInTechSection"]'));}).then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F Registrando <strong>Carlos Mendoza</strong> \u2014 Lead Tech, $35/hr...','action');return ty(document.getElementById('techNameAlt'),d.name);})
  .then(function(){return ty(document.getElementById('techPhoneAlt'),d.phone);})
  .then(function(){return ty(document.getElementById('techEmailAlt'),d.email);})
  .then(function(){sv(document.getElementById('techSpecialtyAlt'),d.spec);return ty(document.getElementById('techVehicleAlt'),d.vehicle);})
  .then(function(){return ty(document.getElementById('techPlateAlt'),d.plate);})
  .then(function(){return sl(C.stepDelay);})
  .then(function(){say('\uD83D\uDCBE Guardando con acceso CRM m\u00F3vil...','action');var f=document.querySelector('#techFormContainerAlt form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true}));return sl(C.stepDelay);})
  .then(function(){say('\u2705 <strong>Carlos Mendoza</strong> registrado \u2014 Ford Transit 2023, placas 8ABC123.','success');});
}

/* STEP 5: T\u00e9cnico 2 */
function s5(){
  var d=D.techs[1];
  say('\u26A1 Segundo t\u00E9cnico \u2014 <strong>Refrigeraci\u00F3n Comercial</strong>.','action');
  return sl(C.stepDelay).then(function(){return clk(document.querySelector('#technicians-section [onclick*="showTechFormInTechSection"]'));}).then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F Registrando <strong>Miguel \u00C1ngel Torres</strong> \u2014 $30/hr...','action');return ty(document.getElementById('techNameAlt'),d.name);})
  .then(function(){return ty(document.getElementById('techPhoneAlt'),d.phone);})
  .then(function(){return ty(document.getElementById('techEmailAlt'),d.email);})
  .then(function(){sv(document.getElementById('techSpecialtyAlt'),d.spec);return ty(document.getElementById('techVehicleAlt'),d.vehicle);})
  .then(function(){return ty(document.getElementById('techPlateAlt'),d.plate);})
  .then(function(){return sl(C.stepDelay);})
  .then(function(){var f=document.querySelector('#techFormContainerAlt form');if(f)f.dispatchEvent(new Event('submit',{cancelable:true}));return sl(C.stepDelay);})
  .then(function(){say('\u2705 <strong>2 t\u00E9cnicos</strong> con veh\u00EDculos, GPS y acceso al CRM desde su celular \uD83D\uDCF1','success');});
}

/* STEP 6: Home Advisor */
function s6(){
  var d=D.advisor;
  say('\uD83D\uDCCD Navegando a <strong>Asesores del Hogar</strong> \u2014 vendedores con comisiones.','nav');
  return sl(C.stepDelay).then(function(){nav('advisors');return sl(C.stepDelay);})
  .then(function(){return clk(document.querySelector('#advisors-section [onclick*="showAdvisorForm"]'));}).then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F <strong>Diana Castillo</strong> \u2014 meta $50K/mes...','action');return ty(document.getElementById('advisorName'),d.name);})
  .then(function(){return ty(document.getElementById('advisorPhone'),d.phone);})
  .then(function(){return ty(document.getElementById('advisorEmail'),d.email);})
  .then(function(){sv(document.getElementById('advisorSpecialty'),d.spec);return ty(document.getElementById('advisorZone'),d.zone);})
  .then(function(){return ty(document.getElementById('advisorGoal'),d.goal);})
  .then(function(){return sl(C.stepDelay);})
  .then(function(){var f=document.getElementById('advisorForm');if(f)f.dispatchEvent(new Event('submit',{cancelable:true}));return sl(C.stepDelay);})
  .then(function(){say('\u2705 <strong>Diana Castillo</strong> registrada. Comisiones: 5%-20% por ganancia del trabajo. \uD83D\uDCB0','success');});
}

/* STEP 7: Trabajo 1 */
function s7(){
  var d=D.jobs[0];
  say('\uD83D\uDCCD Navegando a <strong>Despacho</strong> \u2014 crear trabajos.','nav');
  return sl(C.stepDelay).then(function(){nav('dispatch');return sl(C.stepDelay);})
  .then(function(){return clk(document.querySelector('#dispatch-section [onclick*="showJobForm"]'));}).then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F <strong>AC Repair</strong> \u2014 $850, asignado a Carlos...','action');return ty(document.getElementById('jobTitle'),d.title);})
  .then(function(){sv(document.getElementById('jobServiceType'),d.stype);sv(document.getElementById('jobPriority'),d.priority);return ty(document.getElementById('jobAddress'),d.address);})
  .then(function(){var jd=document.getElementById('jobDate');if(jd){jd.value=today();jd.dispatchEvent(new Event('change'));}popTD('jobTechId');return sl(100);})
  .then(function(){if(mock.techs[0])sv(document.getElementById('jobTechId'),mock.techs[0].id);return ty(document.getElementById('jobNotes'),d.notes,12);})
  .then(function(){return sl(C.stepDelay);})
  .then(function(){var f=document.getElementById('jobForm');if(f)f.dispatchEvent(new Event('submit',{cancelable:true}));return sl(C.stepDelay);})
  .then(function(){say('\u2705 <strong>TM-2026-001</strong> \u2014 AC Repair $850, asignado a Carlos. \uD83D\uDD27','success');});
}

/* STEP 8: Trabajo 2 */
function s8(){
  var d=D.jobs[1];
  say('\u26A1 Segundo trabajo \u2014 <strong>Walk-in Cooler</strong> URGENTE para La Michoacana.','action');
  return sl(C.stepDelay).then(function(){return clk(document.querySelector('#dispatch-section [onclick*="showJobForm"]'));}).then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F Refrigeraci\u00F3n comercial \u2014 $2,200...','action');return ty(document.getElementById('jobTitle'),d.title);})
  .then(function(){sv(document.getElementById('jobServiceType'),d.stype);sv(document.getElementById('jobPriority'),d.priority);return ty(document.getElementById('jobAddress'),d.address);})
  .then(function(){var jd=document.getElementById('jobDate');if(jd){jd.value=today();jd.dispatchEvent(new Event('change'));}popTD('jobTechId');if(mock.techs[1])sv(document.getElementById('jobTechId'),mock.techs[1].id);return ty(document.getElementById('jobNotes'),d.notes,12);})
  .then(function(){return sl(C.stepDelay);})
  .then(function(){var f=document.getElementById('jobForm');if(f)f.dispatchEvent(new Event('submit',{cancelable:true}));return sl(C.stepDelay);})
  .then(function(){say('\u2705 <strong>2 trabajos</strong> activos \u2014 $3,050 revenue. T\u00E9cnicos los ven en su app y el mapa muestra ubicaciones. \uD83D\uDDFA\uFE0F','success');});
}

/* STEP 9: Llamada de Servicio */
function s9(){
  var d=D.scall;
  say('\uD83D\uDCCD Navegando a <strong>Llamadas de Servicio</strong> \u2014 EMERGENCIA.','nav');
  return sl(C.stepDelay).then(function(){nav('servicecalls');return sl(C.stepDelay);})
  .then(function(){return clk(document.querySelector('#servicecalls-section [onclick*="showServiceCallForm"]'));}).then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F Emergencia: <strong>AC no enfr\u00EDa</strong>, Mar\u00EDa Garc\u00EDa...','action');return ty(document.getElementById('scClientName'),d.cname);})
  .then(function(){return ty(document.getElementById('scClientPhone'),d.phone);})
  .then(function(){return ty(document.getElementById('scAddress'),d.addr);})
  .then(function(){return ty(document.getElementById('scProblem'),d.problem,12);})
  .then(function(){sv(document.getElementById('scUrgency'),d.urgency);sv(document.getElementById('scPropertyType'),d.ptype);
    var pd=document.getElementById('scPreferredDate');if(pd)pd.value=today();
    var pt=document.getElementById('scPreferredTime');if(pt)sv(pt,'asap');
    return ty(document.getElementById('scNotes'),d.notes,15);})
  .then(function(){return sl(C.stepDelay);})
  .then(function(){var f=document.getElementById('serviceCallForm');if(f)f.dispatchEvent(new Event('submit',{cancelable:true}));return sl(C.stepDelay);})
  .then(function(){say('\u2705 Llamada registrada <strong style="color:#ef4444;">\uD83D\uDD34 EMERGENCIA</strong>. Lista para despacho.','success');});
}

/* STEP 10: Despacho GPS */
function s10(){
  say('\uD83D\uDCCD Navegando a <strong>Despacho</strong> \u2014 centro de operaciones GPS.','nav');
  return sl(C.stepDelay).then(function(){nav('dispatch');return sl(C.stepDelay);})
  .then(function(){say('Mapa de operaciones:<br>\uD83D\uDE90 <strong>Carlos</strong> \u2192 Fontana (AC Repair)<br>\uD83D\uDE90 <strong>Miguel</strong> \u2192 San Bernardino (Cooler)<br>\uD83D\uDCCD Trabajos con pin en el mapa<br>\uD83D\uDC65 Clientes geolocalizados','info');return sl(C.stepDelay);})
  .then(function(){if(mock.scalls.length>0)mock.scalls[0].status='enroute';
    say('\u26A1 T\u00E9cnicos despachados \u2014 GPS en tiempo real. El cliente recibe link de tracking. \uD83D\uDCCD','action');return sl(C.stepDelay);})
  .then(function(){say('\u2705 <strong>Coordinador de Despacho</strong> controla todo: asignar, re-asignar, monitorear en vivo.','success');});
}

/* STEP 11: Time Clock / N\u00f3mina */
function s11(){
  say('\uD83D\uDCCD Navegando a <strong>N\u00F3mina</strong> \u2014 reloj y c\u00E1lculo de horas.','nav');
  return sl(C.stepDelay).then(function(){nav('payroll');return sl(C.stepDelay);})
  .then(function(){
    mock.payroll.push({id:'pr1',tech:mock.techs[0]?mock.techs[0].id:'Carlos',type:'hourly',hours:42,rate:35,total:1470,ts:new Date().toISOString()});
    mock.payroll.push({id:'pr2',tech:mock.techs[1]?mock.techs[1].id:'Miguel',type:'hourly',hours:38,rate:30,total:1140,ts:new Date().toISOString()});
    mock.payroll.push({id:'pr3',tech:mock.advisors[0]?mock.advisors[0].id:'Diana',type:'commission',hours:0,rate:0,total:457.50,ts:new Date().toISOString()});
    renderPayroll2();return sl(C.stepDelay);})
  .then(function(){say('\u26A1 Clock-In desde celular:<br>\uD83D\uDC77 <strong>Carlos</strong>: 42h \u00D7 $35 = <strong>$1,470</strong><br>\uD83D\uDC77 <strong>Miguel</strong>: 38h \u00D7 $30 = <strong>$1,140</strong><br>\uD83C\uDFE0 <strong>Diana</strong>: Comisi\u00F3n = <strong>$457.50</strong>','action');return sl(C.stepDelay);})
  .then(function(){say('\u2705 N\u00F3mina total: <strong>$3,067.50</strong>. Se exporta a QuickBooks, ADP, Gusto o Square. \uD83D\uDCB3','success');});
}

/* STEP 12: Factura */
function s12(){
  var d=D.invoice;var total=0;d.items.forEach(function(i){total+=i.qty*i.price;});
  say('\uD83D\uDCCD Navegando a <strong>Facturas</strong> \u2014 generar factura profesional.','nav');
  return sl(C.stepDelay).then(function(){nav('invoices');return sl(C.stepDelay);})
  .then(function(){return clk(document.querySelector('#invoices-section [onclick*="showInvoiceForm"]'));}).then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F Factura para AC Repair de Mar\u00EDa Garc\u00EDa...','action');return ty(document.getElementById('invClientName'),d.cname);})
  .then(function(){return ty(document.getElementById('invClientPhone'),'(909) 555-1234');})
  .then(function(){return ty(document.getElementById('invClientEmail'),'maria.garcia@email.com');})
  .then(function(){return ty(document.getElementById('invClientAddress'),'456 Oak St, Fontana, CA');})
  .then(function(){var dd=document.getElementById('invDueDate');if(dd){dd.value=future(30);dd.dispatchEvent(new Event('change'));}return sl(C.stepDelay);})
  .then(function(){say('\uD83D\uDCCB Items:<br>\u2022 Service Call $120<br>\u2022 Capacitor 45/5 MFD \u2014 $85<br>\u2022 Contactor 2P 40A \u2014 $65<br>\u2022 Labor 2hrs \u00D7 $125 \u2014 $250<br><strong>Total: '+fmtMoney(total)+'</strong>','info');return sl(C.stepDelay);})
  .then(function(){mock.invoices.push({id:'dinv1',num:'INV-0001',cname:d.cname,phone:'(909) 555-1234',email:'maria.garcia@email.com',total:total,status:'pending',ts:new Date().toISOString()});
    renderInvoices2();hf('invoiceFormContainer');return sl(C.stepDelay);})
  .then(function(){say('\u2705 <strong>INV-0001</strong> por <strong>'+fmtMoney(total)+'</strong>. Se env\u00EDa por email, WhatsApp o PDF. \uD83D\uDCC4','success');});
}

/* STEP 13: Marcar pagada + 2da factura */
function s13(){
  say('\u26A1 Marcando factura como <strong>PAGADA</strong>...','action');
  return sl(C.stepDelay).then(function(){if(mock.invoices[0])mock.invoices[0].status='paid';renderInvoices2();return sl(C.stepDelay);})
  .then(function(){say('\u2705 INV-0001 ahora <strong style="color:#16a34a;">\u2705 PAGADA</strong>. Ingresos se actualizan en Dashboard y Mi Dinero.','success');return sl(C.stepDelay);})
  .then(function(){mock.invoices.push({id:'dinv2',num:'INV-0002',cname:'La Michoacana Restaurant',phone:'(909) 555-5678',email:'lamichoacana.sb@email.com',total:2200,status:'pending',ts:new Date().toISOString()});
    renderInvoices2();say('\uD83D\uDCCB Tambi\u00E9n <strong>INV-0002</strong> por <strong>$2,200</strong> para La Michoacana \u2014 \uD83D\uDCB0 Pendiente.','info');});
}

/* STEP 14: Gastos */
function s14(){
  say('\uD83D\uDCCD Navegando a <strong>Gastos</strong> \u2014 registro operativo.','nav');
  return sl(C.stepDelay).then(function(){nav('expenses');return sl(C.stepDelay);})
  .then(function(){return clk(document.querySelector('#expenses-section [onclick*="showExpenseForm"]'));}).then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F Gasolina <strong>$287.50</strong> Chevron...','action');
    sv(document.getElementById('expCategory'),D.expense.cat);return ty(document.getElementById('expVendor'),D.expense.vendor);})
  .then(function(){return ty(document.getElementById('expAmount'),D.expense.amount);})
  .then(function(){sv(document.getElementById('expFrequency'),D.expense.freq);sv(document.getElementById('expType'),D.expense.type);
    var ed=document.getElementById('expDate');if(ed)ed.value=today();return sl(C.stepDelay);})
  .then(function(){
    mock.expenses.push({id:'e1',cat:'vehicle_gas',vendor:'Chevron',amount:287.50,type:'variable',ts:today()});
    mock.expenses.push({id:'e2',cat:'general_liability',vendor:'State Farm Insurance',amount:450,type:'fixed',ts:today()});
    mock.expenses.push({id:'e3',cat:'software_crm',vendor:'Trade Master CRM',amount:149.99,type:'fixed',ts:today()});
    mock.expenses.push({id:'e4',cat:'vehicle_payment',vendor:'Ford Motor Credit',amount:650,type:'fixed',ts:today()});
    renderExpenses2();hf('expenseFormContainer');return sl(C.stepDelay);})
  .then(function(){say('\u2705 <strong>4 gastos</strong>: gasolina, seguro, CRM, veh\u00EDculo. Fijos: <strong>$1,249.99</strong> | Variables: <strong>$287.50</strong> | Total: <strong>$1,537.49</strong>','success');});
}

/* STEP 15: Mi Dinero */
function s15(){
  say('\uD83D\uDCCD Navegando a <strong>Mi Dinero</strong> \u2014 resumen financiero.','nav');
  return sl(C.stepDelay).then(function(){nav('mymoney');return sl(C.stepDelay);})
  .then(function(){
    var income=0,pend=0,exp=0;
    mock.invoices.forEach(function(i){if(i.status==='paid')income+=i.total;else pend+=i.total;});
    mock.expenses.forEach(function(e){exp+=e.amount;});
    function el2(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
    el2('moneyIncome',fmtMoney(income));el2('moneyExpenses',fmtMoney(exp));
    el2('moneyProfit',fmtMoney(income-exp));el2('moneyOutstanding',fmtMoney(pend));
    var mc=document.getElementById('moneyChart');
    if(mc)mc.innerHTML='<div style="display:flex;gap:8px;align-items:flex-end;height:160px;padding:20px 0;"><div style="flex:1;text-align:center;"><div style="background:#10b981;height:'+Math.min(income/30,140)+'px;border-radius:6px 6px 0 0;margin:0 auto;width:60%;"></div><div style="font-size:10px;margin-top:4px;color:var(--text-muted);">Ingresos</div><div style="font-size:12px;font-weight:700;color:#10b981;">'+fmtMoney(income)+'</div></div><div style="flex:1;text-align:center;"><div style="background:#ef4444;height:'+Math.min(exp/30,140)+'px;border-radius:6px 6px 0 0;margin:0 auto;width:60%;"></div><div style="font-size:10px;margin-top:4px;color:var(--text-muted);">Gastos</div><div style="font-size:12px;font-weight:700;color:#ef4444;">'+fmtMoney(exp)+'</div></div><div style="flex:1;text-align:center;"><div style="background:#3b82f6;height:'+Math.min((income-exp)/30,140)+'px;border-radius:6px 6px 0 0;margin:0 auto;width:60%;"></div><div style="font-size:10px;margin-top:4px;color:var(--text-muted);">Ganancia</div><div style="font-size:12px;font-weight:700;color:#3b82f6;">'+fmtMoney(income-exp)+'</div></div><div style="flex:1;text-align:center;"><div style="background:#f59e0b;height:'+Math.min(pend/30,140)+'px;border-radius:6px 6px 0 0;margin:0 auto;width:60%;"></div><div style="font-size:10px;margin-top:4px;color:var(--text-muted);">Por Cobrar</div><div style="font-size:12px;font-weight:700;color:#f59e0b;">'+fmtMoney(pend)+'</div></div></div>';
    var mt=document.getElementById('moneyTransactions');
    if(mt){var h='<div style="font-size:12px;">';
      mock.invoices.filter(function(i2){return i2.status==='paid';}).forEach(function(i2){h+='<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);"><span>\uD83D\uDCB5 Factura '+i2.num+' \u2014 '+i2.cname+'</span><span style="color:#10b981;font-weight:600;">+'+fmtMoney(i2.total)+'</span></div>';});
      mock.expenses.forEach(function(e2){h+='<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);"><span>\uD83D\uDCE4 '+e2.vendor+'</span><span style="color:#ef4444;font-weight:600;">-'+fmtMoney(e2.amount)+'</span></div>';});
      h+='</div>';mt.innerHTML=h;}
    return sl(C.stepDelay);})
  .then(function(){
    var income=0,exp=0,pend=0;mock.invoices.forEach(function(i){if(i.status==='paid')income+=i.total;else pend+=i.total;});mock.expenses.forEach(function(e){exp+=e.amount;});
    say('\u2705 <strong>Mi Dinero</strong>:<br>\uD83D\uDCB0 Ingresos: <strong style="color:#10b981;">'+fmtMoney(income)+'</strong><br>\uD83D\uDCE4 Gastos: <strong style="color:#ef4444;">'+fmtMoney(exp)+'</strong><br>\uD83D\uDCCA Ganancia: <strong style="color:#3b82f6;">'+fmtMoney(income-exp)+'</strong><br>\u23F3 Por Cobrar: <strong style="color:#f59e0b;">'+fmtMoney(pend)+'</strong>','success');});
}

/* STEP 16: N\u00f3mina detallada */
function s16(){
  say('\uD83D\uDCCD Regresando a <strong>N\u00F3mina</strong> \u2014 tabla con datos.','nav');
  return sl(C.stepDelay).then(function(){nav('payroll');renderPayroll2();return sl(C.stepDelay);})
  .then(function(){var tot=0;mock.payroll.forEach(function(p){tot+=p.total;});
    say('\u2705 <strong>N\u00F3mina</strong>:<br>\uD83D\uDC77 <strong>Carlos</strong>: 42h \u00D7 $35 = <strong>$1,470</strong><br>\uD83D\uDC77 <strong>Miguel</strong>: 38h \u00D7 $30 = <strong>$1,140</strong><br>\uD83C\uDFE0 <strong>Diana</strong>: Comisi\u00F3n = <strong>$457.50</strong><br>\u2501\u2501\u2501<br>\uD83D\uDCB3 Total: <strong>'+fmtMoney(tot)+'</strong><br><br>Conecta con ADP, Gusto, QuickBooks o Square.','success');});
}

/* STEP 17: Marketing */
function s17(){
  var d=D.campaign;
  say('\uD83D\uDCCD Navegando a <strong>Mercadotecnia</strong> \u2014 Google Ads.','nav');
  return sl(C.stepDelay).then(function(){nav('marketing');return sl(C.stepDelay);})
  .then(function(){return clk(document.querySelector('#marketing-section [onclick*="showCampaignForm"]'));}).then(function(){return sl(300);})
  .then(function(){say('\u270D\uFE0F <strong>"Promo Verano - AC Tune-Up $79"</strong> \u2014 $1,500...','action');return ty(document.getElementById('campName'),d.name);})
  .then(function(){sv(document.getElementById('campType'),d.type);return ty(document.getElementById('campBudget'),d.budget);})
  .then(function(){var cs=document.getElementById('campStart'),ce=document.getElementById('campEnd');if(cs)cs.value=today();if(ce)ce.value=future(60);return ty(document.getElementById('campMessage'),d.msg,10);})
  .then(function(){return sl(C.stepDelay);})
  .then(function(){mock.campaigns.push({id:'dcp1',name:d.name,type:d.type,budget:parseFloat(d.budget),status:'active',ts:new Date().toISOString()});
    renderCampaigns2();hf('campaignFormContainer');return sl(C.stepDelay);})
  .then(function(){say('\u2705 Campa\u00F1a <strong>Google Ads</strong> activa $1,500. Links a Facebook, Yelp, Angi, HomeAdvisor, Thumbtack y m\u00E1s. \uD83D\uDCE3','success');});
}

/* STEP 18: Price Book */
function s18(){
  say('\uD83D\uDCCD Navegando a <strong>Lista de Precios</strong> \u2014 cat\u00E1logo HVAC.','nav');
  return sl(C.stepDelay).then(function(){nav('pricebook');return sl(C.stepDelay);})
  .then(function(){say('\u26A1 Cargando <strong>10 art\u00EDculos</strong> del cat\u00E1logo...','action');return sl(C.stepDelay);})
  .then(function(){mock.pricebook=D.pricebook.map(function(p,i){return{id:'dpb'+i,name:p.name,sku:p.sku,cat:p.cat,unit:p.unit,cost:p.cost,price:p.price,desc:p.desc};});
    renderPricebook2();return sl(C.stepDelay);})
  .then(function(){say('\u2705 <strong>10 art\u00EDculos</strong> con m\u00E1rgenes:<br>\uD83D\uDD27 Capacitor: $12 \u2192 $85 (<strong>608%</strong>)<br>\uD83D\uDD27 Motor Fan: $45 \u2192 $195 (<strong>333%</strong>)<br>\uD83D\uDD27 R-410A/lb: $15 \u2192 $85 (<strong>467%</strong>)<br><br>Al crear factura, seleccionas del cat\u00E1logo y precios se insertan autom\u00E1ticamente.','success');});
}

/* STEP 19: Reportes */
function s19(){
  say('\uD83D\uDCCD Navegando a <strong>Reportes</strong> \u2014 gr\u00E1ficas ejecutivas.','nav');
  return sl(C.stepDelay).then(function(){nav('reports');return sl(C.stepDelay);})
  .then(function(){
    var totalRev=0;mock.invoices.forEach(function(i){totalRev+=i.total;});
    function el3(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
    el3('rptRevenue',fmtMoney(totalRev));el3('rptJobsDone',mock.jobs.length);
    el3('rptNewCustomers',mock.clients.length);el3('rptCloseRate','67%');
    var rc=document.getElementById('rptRevenueChart');
    if(rc){var months=['Ene','Feb','Mar','Abr','May','Jun'];var vals=[4200,5800,3900,7200,6500,totalRev];var mx=Math.max.apply(null,vals);
      var h2='<div style="display:flex;gap:6px;align-items:flex-end;height:180px;padding:20px 10px;">';
      months.forEach(function(m,i){var ht=Math.max(20,(vals[i]/mx)*150);
        h2+='<div style="flex:1;text-align:center;"><div style="background:'+(i===5?'linear-gradient(180deg,#f97316,#ea580c)':'linear-gradient(180deg,#3b82f6,#1e40af)')+';height:'+ht+'px;border-radius:6px 6px 0 0;margin:0 auto;width:70%;"></div><div style="font-size:10px;margin-top:4px;color:var(--text-muted);">'+m+'</div><div style="font-size:10px;font-weight:600;">'+fmtMoney(vals[i])+'</div></div>';});
      h2+='</div>';rc.innerHTML=h2;}
    var bt=document.getElementById('rptByTech');
    if(bt){var h3='';mock.techs.forEach(function(t,i){var rev=i===0?850:2200;
      h3+='<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);"><strong style="min-width:140px;">'+t.name+'</strong><div style="flex:1;background:#e2e8f0;border-radius:4px;height:20px;overflow:hidden;"><div style="background:'+(i===0?'#3b82f6':'#f97316')+';height:100%;width:'+(rev/2200*100)+'%;border-radius:4px;"></div></div><span style="font-size:12px;font-weight:600;min-width:80px;text-align:right;">'+fmtMoney(rev)+'</span></div>';});bt.innerHTML=h3;}
    var bs=document.getElementById('rptBySource');
    if(bs)bs.innerHTML='<div style="font-size:12px;line-height:2.2;">\uD83D\uDCDE Llamada directa: <strong>40%</strong><br>\uD83D\uDD0D Google: <strong>25%</strong><br>\uD83D\uDCD8 Facebook: <strong>15%</strong><br>\uD83E\uDD1D Referidos: <strong>12%</strong><br>\uD83D\uDCF1 Yelp/Angi: <strong>8%</strong></div>';
    var ts2=document.getElementById('rptTopServices');
    if(ts2)ts2.innerHTML='<div style="font-size:12px;line-height:2.2;">1. \uD83D\uDD27 AC Repair \u2014 <strong>$12,450</strong><br>2. \u2744\uFE0F Refrigeraci\u00F3n \u2014 <strong>$8,200</strong><br>3. \uD83D\uDD25 Furnace Install \u2014 <strong>$6,800</strong><br>4. \uD83C\uDF2C\uFE0F Mini-Split \u2014 <strong>$4,500</strong><br>5. \uD83D\uDEE1\uFE0F Maintenance \u2014 <strong>$3,200</strong></div>';
    var bd=document.getElementById('rptByDay');
    if(bd){var days=['Lun','Mar','Mi\u00E9','Jue','Vie','S\u00E1b'];var dv=[5,4,6,5,7,3];var mx2=Math.max.apply(null,dv);
      var h4='<div style="display:flex;gap:6px;align-items:flex-end;height:100px;padding:10px 0;">';
      days.forEach(function(d2,i){h4+='<div style="flex:1;text-align:center;"><div style="background:#8b5cf6;height:'+((dv[i]/mx2)*80)+'px;border-radius:4px 4px 0 0;margin:0 auto;width:60%;opacity:'+(0.5+dv[i]/mx2*0.5)+'"></div><div style="font-size:10px;margin-top:4px;">'+d2+'</div><div style="font-size:10px;font-weight:600;">'+dv[i]+'</div></div>';});
      h4+='</div>';bd.innerHTML=h4;}
    return sl(C.stepDelay);})
  .then(function(){var totalRev=0;mock.invoices.forEach(function(i){totalRev+=i.total;});
    say('\u2705 <strong>Reportes</strong>:<br>\uD83D\uDCB5 Revenue: <strong>'+fmtMoney(totalRev)+'</strong><br>\uD83D\uDD27 Trabajos: <strong>'+mock.jobs.length+'</strong><br>\uD83D\uDC65 Clientes nuevos: <strong>'+mock.clients.length+'</strong><br>\uD83D\uDCC8 Cierre: <strong>67%</strong><br><br>Gr\u00E1ficas mensuales, rendimiento por t\u00E9cnico, fuentes y productividad. Exporta a PDF.','success');});
}

/* STEP 20: Configuraci\u00f3n + Dashboard Final + CTA */
function s20(){
  say('\uD83D\uDCCD \u00DAltimo paso \u2014 <strong>Configuraci\u00F3n</strong> de la empresa.','nav');
  return sl(C.stepDelay).then(function(){nav('settings');return sl(C.stepDelay);})
  .then(function(){say('\u270D\uFE0F Datos de <strong>Rodriguez HVAC LLC</strong>...','action');return ty(document.getElementById('settingsCompanyName'),C.company.name);})
  .then(function(){return ty(document.getElementById('settingsPhone'),C.company.phone);})
  .then(function(){return ty(document.getElementById('settingsEmail'),C.company.email);})
  .then(function(){return ty(document.getElementById('settingsAddress'),C.company.address);})
  .then(function(){return ty(document.getElementById('settingsLicense'),C.company.license);})
  .then(function(){return ty(document.getElementById('settingsBond'),C.company.bond);})
  .then(function(){return ty(document.getElementById('settingsOwnerName'),C.company.owner);})
  .then(function(){return sl(C.stepDelay);})
  .then(function(){say('\u2705 Configuraci\u00F3n completa \u2014 licencia <strong>'+C.company.license+'</strong>, bond, documentos legales (Workers Comp, Liability, W-9).','success');return sl(C.stepDelay);})
  .then(function(){say('\uD83D\uDCCD Regresando al <strong>Dashboard</strong> con TODOS los datos...','nav');nav('dashboard');return sl(C.stepDelay);})
  .then(function(){populateDash();return sl(C.stepDelay);})
  .then(function(){say('\uD83C\uDF89\uD83C\uDF89\uD83C\uDF89 <strong>\u00A1DEMO COMPLETADO!</strong> \uD83C\uDF89\uD83C\uDF89\uD83C\uDF89','success');return sl(800);})
  .then(function(){say('En 20 pasos viste Trade Master CRM con datos REALES:<br>\uD83D\uDC65 <strong>2 clientes</strong> (residencial + comercial)<br>\uD83C\uDFAF <strong>1 lead</strong> caliente<br>\uD83D\uDC77 <strong>2 t\u00E9cnicos</strong> con GPS<br>\uD83C\uDFE0 <strong>1 vendedora</strong> con comisiones<br>\uD83D\uDD27 <strong>2 trabajos</strong> por $3,050<br>\uD83D\uDCDE <strong>1 emergencia</strong><br>\uD83D\uDCC4 <strong>2 facturas</strong> por $2,720<br>\uD83C\uDFE2 <strong>4 gastos</strong> por $1,537<br>\uD83D\uDCE3 <strong>1 campa\u00F1a</strong> Google Ads<br>\uD83D\uDCD2 <strong>10 art\u00EDculos</strong> Price Book<br>\uD83D\uDCB3 <strong>N\u00F3mina</strong> $3,067<br>\uD83D\uDCCA <strong>Reportes</strong> completos','info');return sl(1200);})
  .then(function(){
    var cta=document.createElement('div');
    cta.innerHTML='<div style="padding:16px;text-align:center;"><a href="'+window.location.pathname+'" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;text-decoration:none;border-radius:14px;font-weight:700;font-size:16px;box-shadow:0 6px 20px rgba(249,115,22,0.4);">\uD83D\uDE80 Registrarme en Trade Master CRM</a><p style="margin-top:10px;font-size:12px;color:var(--text-muted);">Plan Free \u2014 10 clientes gratis | Professional $149.99/mes</p><div style="margin-top:12px;"><button onclick="document.getElementById(\'sfRestart\').click()" style="padding:8px 16px;background:#1e3a5f;color:white;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;">\uD83D\uDD04 Ver Demo Otra Vez</button></div></div>';
    document.getElementById('sfChat').appendChild(cta);
    document.getElementById('sfChat').scrollTop=99999;
  });
}

/* ======================== CSS ======================== */
function injectStyles(){
  var st=document.createElement('style');st.textContent=
  '#demoSplash{position:fixed;inset:0;z-index:20000;background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%);display:flex;align-items:center;justify-content:center;transition:opacity .5s,transform .5s;}'+
  '#demoSplash.ds-exit{opacity:0;transform:scale(1.05);}'+
  '.ds-content{text-align:center;color:white;max-width:560px;padding:40px;animation:dsFadeIn .8s ease-out;}'+
  '.ds-btn{padding:18px 48px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border:none;border-radius:16px;font-size:1.15rem;font-weight:700;cursor:pointer;box-shadow:0 8px 30px rgba(249,115,22,0.4);transition:all .3s;}'+
  '.ds-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(249,115,22,0.5);}'+
  '@keyframes dsFadeIn{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}'+
  '#sofiaPanel{position:fixed;bottom:20px;right:20px;width:390px;max-height:70vh;background:var(--bg-card,#1e293b);border:1px solid var(--border,#334155);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.3);z-index:9999;display:flex;flex-direction:column;overflow:hidden;transition:all .3s;}'+
  '.sf-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:linear-gradient(135deg,#1e3a5f,#2d4a6f);cursor:move;border-radius:16px 16px 0 0;flex-shrink:0;}'+
  '.sf-hl{display:flex;align-items:center;gap:10px;}.sf-av{font-size:28px;}.sf-name{font-weight:700;color:white;font-size:14px;display:block;}.sf-role{font-size:11px;color:#94a3b8;}'+
  '.sf-hr{display:flex;gap:4px;}.sf-hb{background:rgba(255,255,255,0.15);border:none;color:white;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:background .2s;}.sf-hb:hover{background:rgba(255,255,255,0.3);}'+
  '.sf-body{flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0 12px 8px;}'+
  '.sf-pbar{height:6px;background:#334155;border-radius:3px;margin:12px 0 4px;overflow:hidden;flex-shrink:0;}.sf-pfill{height:100%;background:linear-gradient(90deg,#f97316,#f59e0b);border-radius:3px;width:0;transition:width .5s;}'+
  '.sf-step{font-size:11px;color:#94a3b8;text-align:center;margin-bottom:8px;flex-shrink:0;}'+
  '.sf-chat{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:4px 0;min-height:120px;max-height:45vh;}'+
  '.sf-msg{display:flex;gap:8px;padding:10px 12px;border-radius:10px;font-size:12.5px;line-height:1.6;animation:sfSlide .3s ease-out;word-break:break-word;}'+
  '.sf-mi{flex-shrink:0;font-size:14px;margin-top:1px;}.sf-mt{flex:1;}'+
  '.sf-info{background:#1e3a5f22;border:1px solid #1e3a5f44;color:var(--text,#cbd5e1);}'+
  '.sf-action{background:#f9731622;border:1px solid #f9731644;color:var(--text,#cbd5e1);}'+
  '.sf-success{background:#10b98122;border:1px solid #10b98144;color:var(--text,#cbd5e1);}'+
  '.sf-nav{background:#8b5cf622;border:1px solid #8b5cf644;color:var(--text,#cbd5e1);}'+
  '.sf-warn{background:#f59e0b22;border:1px solid #f59e0b44;color:var(--text,#cbd5e1);}'+
  '@keyframes sfSlide{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}'+
  '.sf-ctrl{display:flex;gap:6px;padding:10px 12px;border-top:1px solid var(--border,#334155);flex-shrink:0;justify-content:center;}'+
  '.sf-cb{padding:6px 12px;border:1px solid var(--border,#334155);background:var(--bg-input,#0f172a);color:var(--text,#e2e8f0);border-radius:8px;cursor:pointer;font-size:12px;transition:all .2s;}.sf-cb:hover{background:var(--primary,#1e3a5f);color:white;}'+
  '.sf-cp{background:#f97316;color:white;border-color:#f97316;font-weight:600;}.sf-auto{background:#10b981;color:white;border-color:#10b981;font-weight:600;}'+
  '#sfBubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ea580c);color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:9998;box-shadow:0 6px 20px rgba(249,115,22,0.4);font-size:28px;transition:transform .2s;animation:sfPulse 2s infinite;}'+
  '#sfBubble:hover{transform:scale(1.1);}'+
  '@keyframes sfPulse{0%,100%{box-shadow:0 6px 20px rgba(249,115,22,0.4);}50%{box-shadow:0 6px 30px rgba(249,115,22,0.6);}}'+
  '.demo-ripple{position:fixed;width:30px;height:30px;border-radius:50%;background:rgba(249,115,22,0.4);pointer-events:none;z-index:10002;transform:translate(-50%,-50%);animation:dmRip .5s ease-out forwards;}'+
  '@keyframes dmRip{to{width:60px;height:60px;opacity:0;}}'+
  '@media(max-width:640px){#sofiaPanel{width:calc(100% - 16px);right:8px;bottom:8px;left:8px;max-height:55vh;}.sf-chat{max-height:35vh;}}';
  document.head.appendChild(st);
}

/* ======================== INIT ======================== */
function init(){
  injectStyles();bypassAuth();setupMocks();
  showSplash().then(function(){
    createSofia();
    say('\uD83D\uDC4B \u00A1Hola! Soy <strong>Sof\u00EDa</strong>, tu asistente AI de Trade Master CRM.','info');
    return sl(600);
  }).then(function(){
    say('Voy a <strong>OPERAR el CRM completo</strong> \u2014 20 pasos con datos reales de una empresa HVAC en San Bernardino.','info');
    return sl(600);
  }).then(function(){
    say('Usa <strong>\u23E9 Next</strong> paso a paso, o <strong>\u25B6\uFE0F Auto</strong> para ver todo autom\u00E1ticamente.','info');
  });
}

if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{setTimeout(init,500);}
})();
