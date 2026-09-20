
const W="http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const state={units:[], ageing:{}, summary:{}, packaging:[], workmanship:[], measurements:{}};

const tests=[
 "Ghosting","Auto Focus","Auto Keystone","Built-in Speaker","USB Video Playback",
 "HDMI Video Playback","Mirror phone","Mirror laptop","Bluetooth speaker connection","Wifi Connectivity"
];
const rows=[
 "Lumens","Ghosting","Auto Focus","Auto Keystone","Built-in Speaker","USB Video Playback",
 "HDMI Video Playback","Mirror phone","Mirror laptop","Bluetooth speaker connection","Wifi Connectivity"
];
const lotBands=[
 [2,8,{I:"A",II:"A",III:"B"}],[9,15,{I:"A",II:"B",III:"C"}],[16,25,{I:"B",II:"C",III:"D"}],
 [26,50,{I:"C",II:"D",III:"E"}],[51,90,{I:"C",II:"E",III:"F"}],[91,150,{I:"D",II:"F",III:"G"}],
 [151,280,{I:"E",II:"G",III:"H"}],[281,500,{I:"F",II:"H",III:"J"}],[501,1200,{I:"G",II:"J",III:"K"}],
 [1201,3200,{I:"H",II:"K",III:"L"}],[3201,10000,{I:"J",II:"L",III:"M"}],
 [10001,35000,{I:"K",II:"M",III:"N"}],[35001,150000,{I:"L",II:"N",III:"P"}],
 [150001,500000,{I:"M",II:"P",III:"Q"}],[500001,Infinity,{I:"N",II:"Q",III:"R"}]
];
const sampleByCode={A:2,B:3,C:5,D:8,E:13,F:20,G:32,H:50,J:80,K:125,L:200,M:315,N:500,P:800,Q:1250,R:2000};
const acRe={
  2:{major:[0,1],minor:[0,1]},3:{major:[0,1],minor:[0,1]},5:{major:[0,1],minor:[1,2]},
  8:{major:[0,1],minor:[1,2]},13:{major:[1,2],minor:[1,2]},20:{major:[1,2],minor:[2,3]},
  32:{major:[2,3],minor:[3,4]},50:{major:[3,4],minor:[5,6]},80:{major:[5,6],minor:[7,8]},
  125:{major:[7,8],minor:[10,11]},200:{major:[10,11],minor:[14,15]},
  315:{major:[14,15],minor:[21,22]},500:{major:[21,22],minor:[21,22]},
  800:{major:[21,22],minor:[21,22]},1250:{major:[21,22],minor:[21,22]},
  2000:{major:[21,22],minor:[21,22]}
};

function $(id){return document.getElementById(id)}
function val(id){return $(id)?.value??""}
function setVal(id,v){if($(id))$(id).value=v}
function esc(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function showToast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2500)}

function sampling(){
  const lot=parseInt(val("orderQty"),10);
  const level=val("level");
  if(!lot||lot<2){$("codeLetter").textContent="—";$("sampleSize").textContent="—";$("majorAcRe").textContent="—";$("minorAcRe").textContent="—";$("aqlStatus").textContent="Enter the batch quantity to calculate the AQL plan.";return null}
  const band=lotBands.find(x=>lot>=x[0]&&lot<=x[1]);
  if(!band){return null}
  const code=band[2][level], n=sampleByCode[code], ar=acRe[n]||{major:[21,22],minor:[21,22]};
  $("codeLetter").textContent=code;$("sampleSize").textContent=n;
  $("majorAcRe").textContent=`${ar.major[0]} / ${ar.major[1]}`;
  $("minorAcRe").textContent=`${ar.minor[0]} / ${ar.minor[1]}`;
  $("criticalAcRe").textContent="0 / 1";
  return {code,n,major:ar.major,minor:ar.minor};
}

function renderSummary(){
 const desc=["Quantity","Packaging and Labeling","Product Description","Measurements","On-site Tests","Test After Ageing for 2 hours"];
 $("summaryRows").innerHTML=desc.map((d,i)=>`<tr><td>${i+1}</td><td>${d}</td><td><select id="sum-${i}"><option></option><option>Pass</option><option>Hold</option><option>Fail</option></select></td><td><input id="sumr-${i}"></td></tr>`).join("");
}
function renderPackaging(){
 const d=["Master Carton","Gift Box","Shipping Marks","Barcode / SN","User Manual, Warranty card","Remote"];
 $("packRows").innerHTML=d.map((x,i)=>`<tr><td>${x}</td><td><input id="packf-${i}"></td><td><select id="packr-${i}"><option></option><option>OK</option><option>NOT OK</option></select></td><td><input id="packn-${i}"></td></tr>`).join("");
}
function renderWorkmanship(){
 $("workRows").innerHTML=Array.from({length:6},(_,i)=>`<tr><td><input id="workd-${i}"></td><td><input id="workc-${i}" type="number" min="0" value="0"></td><td><input id="workma-${i}" type="number" min="0" value="0"></td><td><input id="workmi-${i}" type="number" min="0" value="0"></td></tr>`).join("");
}
function renderAgeing(){
 $("ageingRows").innerHTML=tests.map((x,i)=>`<div class="ageing-row"><strong>${x}</strong><div class="toggle" data-age="${i}"><button data-v="OK">OK</button><button data-v="NOT OK">NOT OK</button></div></div>`).join("");
 $("ageingRows").querySelectorAll(".toggle").forEach(g=>g.querySelectorAll("button").forEach(b=>b.onclick=()=>toggleButton(g,b)));
}
function toggleButton(group,button){
 group.querySelectorAll("button").forEach(x=>x.classList.remove("active-ok","active-bad"));
 const v=button.dataset.v;button.classList.add(v==="OK"?"active-ok":"active-bad");
 if(group.dataset.unit!==undefined){state.units[+group.dataset.unit].tests[group.dataset.test]=v}
 if(group.dataset.age!==undefined){state.ageing[group.dataset.age]=v}
}
function parseRange(){
 const m=val("brightnessRange").replace(/,/g,"").match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)/i);
 if(m)return [+m[1],+m[2]];
 const one=val("brightnessRange").match(/(\d+(?:\.\d+)?)/);
 return one?[+one[1],Infinity]:null;
}
function lumenClass(v){
 const n=parseFloat(v),r=parseRange();
 if(!r||!Number.isFinite(n))return "";
 return n<r[0]||n>r[1]?"bad":"good";
}
function renderInspection(){
 const s=sampling(); const n=s?.n||0;
 state.units=Array.from({length:n},(_,i)=>state.units[i]||{lumens:"",tests:{}});
 const grid=$("inspectionGrid");grid.innerHTML="";
 state.units.forEach((u,i)=>{
   const card=document.createElement("div");card.className="unit-card";
   card.innerHTML=`<div class="unit-title">Unit ${i+1}</div>`;
   const lum=document.createElement("div");lum.className="test-row";
   lum.innerHTML=`<label>Lumens</label><input class="lumens-input ${lumenClass(u.lumens)}" id="lum-${i}" type="number" step="0.1" placeholder="ANSI">`;
   card.appendChild(lum);
   tests.forEach((t,j)=>{
     const row=document.createElement("div");row.className="test-row";
     row.innerHTML=`<label>${t}</label><div class="toggle" data-unit="${i}" data-test="${j}"><button data-v="OK">OK</button><button data-v="NOT OK">NOT OK</button></div>`;
     card.appendChild(row);
   });
   grid.appendChild(card);
   const inp=card.querySelector(`#lum-${i}`);
   inp.value=u.lumens||"";inp.addEventListener("input",e=>{u.lumens=e.target.value;e.target.className=`lumens-input ${lumenClass(e.target.value)}`});
   card.querySelectorAll(".toggle").forEach(g=>g.querySelectorAll("button").forEach(b=>b.onclick=()=>toggleButton(g,b)));
   tests.forEach((_,j)=>{if(u.tests[j]){const g=card.querySelector(`[data-test="${j}"]`);const b=[...g.querySelectorAll("button")].find(x=>x.dataset.v===u.tests[j]);if(b)toggleButton(g,b)}});
 });
}
function updateQtyDelta(){const a=parseFloat(val("qtyOrder")),b=parseFloat(val("qtyObserved"));setVal("qtyDelta",Number.isFinite(a)&&Number.isFinite(b)?(b-a):"")}
function updateAql(){
 const s=sampling(); if(!s){$("finalResult").textContent="—";return}
 const c=+val("foundCritical")||0,m=+val("foundMajor")||0,mi=+val("foundMinor")||0;
 const pass=c<=0&&m<=s.major[0]&&mi<=s.minor[0];
 const box=$("aqlStatus");box.className="aql-box "+(pass?"pass":"fail");
 box.textContent=`AQL ${pass?"PASS":"FAIL"} — Critical ${c}/0 allowed; Major ${m}/${s.major[0]} allowed; Minor ${mi}/${s.minor[0]} allowed.`;
 $("finalResult").className="aql-box "+(pass?"pass":"fail");$("finalResult").textContent=box.textContent;
}
function collectSummary(){
 return Array.from({length:6},(_,i)=>({result:val(`sum-${i}`),remarks:val(`sumr-${i}`)}));
}
function collectPack(){return Array.from({length:6},(_,i)=>({findings:val(`packf-${i}`),result:val(`packr-${i}`),notes:val(`packn-${i}`)}))}
function collectWork(){return Array.from({length:6},(_,i)=>({desc:val(`workd-${i}`),critical:+val(`workc-${i}`)||0,major:+val(`workma-${i}`)||0,minor:+val(`workmi-${i}`)||0}))}
function getTextNodes(el){return [...el.getElementsByTagNameNS(W,"t")]}
function cellText(cell,text){
 const ts=getTextNodes(cell);if(!ts.length){const p=cell.getElementsByTagNameNS(W,"p")[0]||cell.appendChild(document.createElementNS(W,"p"));const r=document.createElementNS(W,"r"),t=document.createElementNS(W,"t");t.textContent=text;r.appendChild(t);p.appendChild(r);return}
 ts.forEach((t,i)=>t.textContent=i===0?String(text??""):"");
}
function cellShade(cell,color){
 let pr=cell.getElementsByTagNameNS(W,"tcPr")[0];if(!pr){pr=document.createElementNS(W,"tcPr");cell.insertBefore(pr,cell.firstChild)}
 let shd=pr.getElementsByTagNameNS(W,"shd")[0];if(!shd){shd=document.createElementNS(W,"shd");pr.appendChild(shd)}
 shd.setAttributeNS(W,"w:fill",color);shd.setAttributeNS(W,"w:val","clear");
}
function rowsOf(tbl){return [...tbl.getElementsByTagNameNS(W,"tr")]}
function cellsOf(row){return [...row.children].filter(x=>x.namespaceURI===W&&x.localName==="tc")}
function setResultCell(cell,v){
 cellShade(cell,"FFFFFF");
 cellText(cell,v||"");
 if(v==="OK"||v==="Pass")cellText(cell,"✓ OK");
 if(v==="NOT OK"||v==="Fail")cellText(cell,"✗ NOT OK");
}
function updateOnSiteTables(body,n){
 let tbls=[...body.getElementsByTagNameNS(W,"tbl")];
 const base=tbls[10], ageing=tbls.find((t,i)=>i===14);
 // Remove all four existing on-site tables and their intervening paragraphs.
 let current=base;
 const toRemove=[];
 while(current && current!==ageing){
   toRemove.push(current); current=current.nextElementSibling;
 }
 // Include all siblings after base until ageing, which are the 4 tables + page-break paragraphs.
 let node=base;
 while(node && node!==ageing){const next=node.nextElementSibling;node.parentNode.removeChild(node);node=next;}
 // Recompute ageing because removal doesn't remove it.
 const source=base.cloneNode(true);
 const pages=Math.max(1,Math.ceil(n/20));
 let insertBefore=ageing;
 for(let page=0;page<pages;page++){
   if(page>0){
     const bp=document.createElementNS(W,"p"),r=document.createElementNS(W,"r"),br=document.createElementNS(W,"br");
     br.setAttributeNS(W,"w","type","page");r.appendChild(br);bp.appendChild(r);insertBefore.parentNode.insertBefore(bp,insertBefore);
   }
   const tbl=source.cloneNode(true);
   const rs=rowsOf(tbl);
   const start=page*20;
   for(let c=0;c<21;c++){
     const unit=start+c;
     cellText(cellsOf(rs[0])[c], unit<n?String(unit+1):"");
   }
   for(let r=1;r<rs.length;r++){
     const cells=cellsOf(rs[r]);
     for(let c=1;c<21;c++){
       const unit=start+c-1;
       let text="";
       if(unit<n){
         const u=state.units[unit];
         if(r===1) text=u.lumens||"";
         else {const v=u.tests[r-2];text=v==="OK"?"✓":v==="NOT OK"?"✗":""}
       }
       cellText(cells[c],text);
       if(r===1 && unit<n && lumenClass(state.units[unit].lumens)==="bad") cellShade(cells[c],"FFC7CE");
       else cellShade(cells[c],"FFFFFF");
     }
   }
   insertBefore.parentNode.insertBefore(tbl,insertBefore);
 }
}
function replaceHeader(xml,doc){
 const hs=[...xml.querySelectorAll("w\\:tbl")];
 if(!hs.length)return;
 const cells=[...hs[0].querySelectorAll("w\\:tr")].flatMap(r=>[...r.children].filter(c=>c.localName==="tc"));
 if(cells.length>=6){
   cellText(cells[3],`REPORT NUMBER: ${val("reportNumber")}`);
   cellText(cells[4],`Inspection Date: ${val("inspectionDate")}`);
   cellText(cells[5],`PI Number: ${val("piNumber")||val("orderPi")}`);
 }
}
async function generateDocx(){
 const s=sampling(); if(!s){showToast("Enter a valid batch/order quantity first.");return}
 if(s.n>200){showToast("This template supports up to 200 units per report.");return}
 const response=await fetch("template.docx");if(!response.ok)throw new Error("Template could not be loaded.");
 const zip=await JSZip.loadAsync(await response.arrayBuffer());
 const parser=new DOMParser(), serializer=new XMLSerializer();
 const xml=parser.parseFromString(await zip.file("word/document.xml").async("string"),"application/xml");
 const body=xml.getElementsByTagNameNS(W,"body")[0];
 const tables=[...body.getElementsByTagNameNS(W,"tbl")];

 // General information
 cellText(cellsOf(rowsOf(tables[0])[0])[1],val("supplier"));
 cellText(cellsOf(rowsOf(tables[0])[1])[1],val("factoryLocation"));
 cellText(cellsOf(rowsOf(tables[0])[2])[1],`General Level ${val("level")}`);
 cellText(cellsOf(rowsOf(tables[0])[3])[1],`Critical ${val("aqlCritical")}, Major ${val("aqlMajor")}, Minor ${val("aqlMinor")}`);
 cellText(cellsOf(rowsOf(tables[0])[4])[1],val("inspector"));
 cellText(cellsOf(rowsOf(tables[0])[5])[1],val("approvedBy"));

 // Order details
 let r=rowsOf(tables[1])[1],c=cellsOf(r);
 [val("orderPi")||val("piNumber"),val("itemNo"),val("productDescription"),val("orderQty"),val("declaredQty"),String(s.n)].forEach((x,i)=>cellText(c[i],x));

 // Summary
 const sums=collectSummary(); rowsOf(tables[2]).slice(1).forEach((rr,i)=>{const cc=cellsOf(rr);setResultCell(cc[2],sums[i].result);cellText(cc[5],sums[i].remarks)});
 // AQL
 const ar=rowsOf(tables[3]); const crit=+val("foundCritical")||0,maj=+val("foundMajor")||0,min=+val("foundMinor")||0;
 cellText(cellsOf(ar[2])[1],String(0));cellText(cellsOf(ar[2])[2],String(s.major[0]));cellText(cellsOf(ar[2])[3],String(s.minor[0]));
 cellText(cellsOf(ar[3])[1],String(crit));cellText(cellsOf(ar[3])[2],String(maj));cellText(cellsOf(ar[3])[3],String(min));
 const aqlPass=crit<=0&&maj<=s.major[0]&&min<=s.minor[0];
 cellText(cellsOf(ar[4])[1],aqlPass?"PASS":"FAIL");cellText(cellsOf(ar[4])[2],"");cellText(cellsOf(ar[4])[3],"");

 // Remarks
 const remarkRows=rowsOf(tables[4]);const remarkLines=(val("remarks")||"").split(/\n/);
 remarkRows.forEach((rr,i)=>{const cc=cellsOf(rr);cellText(cc[1],remarkLines[i]||"")});

 // Quantity
 const q=rowsOf(tables[5]);let qc=cellsOf(q[1]);[val("qtyItem")||"Projector",val("qtyOrder"),val("qtyObserved"),val("qtyDelta")].forEach((x,i)=>cellText(qc[i],x));
 qc=cellsOf(q[2]);[ "Total",val("qtyOrder"),val("qtyObserved"),val("qtyDelta")].forEach((x,i)=>cellText(qc[i],x));

 // Packaging
 const packs=collectPack();rowsOf(tables[6]).slice(1).forEach((rr,i)=>{const cc=cellsOf(rr);cellText(cc[1],packs[i].findings);setResultCell(cc[2],packs[i].result);cellText(cc[3],packs[i].notes)});

 // Workmanship
 const works=collectWork();const wb=rowsOf(tables[8]);works.forEach((w,i)=>{const cc=cellsOf(wb[i]);cellText(cc[0],w.desc);cellText(cc[1],w.critical);cellText(cc[2],w.major);cellText(cc[3],w.minor)});

 // Measurement
 const mt=rowsOf(tables[9]);const measKeys=["mc-size-spec","mc-size-meas","mc-size-result","mc-weight-spec","mc-weight-meas","mc-weight-result","gb-size-spec","gb-size-meas","gb-size-result","gb-weight-spec","gb-weight-meas","gb-weight-result"];
 const meas={};measKeys.forEach(k=>meas[k]=document.querySelector(`[data-meas="${k}"]`)?.value||"");
 [["mc",2],["gb",3]].forEach(([prefix,ri])=>{const cc=cellsOf(mt[ri]);const vals=[meas[`${prefix}-size-spec`],meas[`${prefix}-size-meas`],meas[`${prefix}-size-result`],meas[`${prefix}-weight-spec`],meas[`${prefix}-weight-meas`],meas[`${prefix}-weight-result`]];vals.forEach((x,j)=>cellText(cc[j+1],x))});

 // On-site
 updateOnSiteTables(body,s.n);

 // Ageing
 const age=rowsOf(tables[14]);rowsOf(tables[14]).slice(1).forEach((rr,i)=>{const cc=cellsOf(rr),v=state.ageing[i]||"";cellText(cc[1],v==="OK"?"✓ OK":v==="NOT OK"?"✗ NOT OK":"");cellText(cc[2],"");cellText(cc[3],"")});

 zip.file("word/document.xml",serializer.serializeToString(xml));
 // Header
 const hx=parser.parseFromString(await zip.file("word/header1.xml").async("string"),"application/xml");
 const ht=[...hx.getElementsByTagNameNS(W,"tbl")][0];
 if(ht){
   const hc=[...ht.getElementsByTagNameNS(W,"tr")][1].children.filter(x=>x.localName==="tc");
   if(hc.length>=3){cellText(hc[0],`REPORT NUMBER: ${val("reportNumber")}`);cellText(hc[1],`Inspection Date: ${val("inspectionDate")}`);cellText(hc[2],`PI Number: ${val("piNumber")||val("orderPi")}`);}
   zip.file("word/header1.xml",serializer.serializeToString(hx));
 }
 const out=await zip.generateAsync({type:"blob",compression:"STORE"});
 const a=document.createElement("a");a.href=URL.createObjectURL(out);
 const safe=(val("reportNumber")||"Projector_PSI").replace(/[^a-z0-9_-]+/gi,"_");
 a.download=`${safe}.docx`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
 showToast("Word report generated.");
}

function loadExample(){
 setVal("reportNumber","PSI-2026-001");setVal("inspectionDate",new Date().toISOString().slice(0,10));setVal("piNumber","PI-1001");
 setVal("supplier","HTP");setVal("factoryLocation","Shenzhen, China");setVal("inspector","Kanishk Karhana");setVal("approvedBy","");
 setVal("orderPi","PI-1001");setVal("itemNo","PJT-01");setVal("productDescription","Projector");setVal("orderQty",1000);setVal("declaredQty",1000);
 setVal("brightnessRange","700-850");setVal("qtyOrder",1000);setVal("qtyObserved",1000);updateQtyDelta();
 setVal("foundCritical",0);setVal("foundMajor",1);setVal("foundMinor",2);
 sampling();renderInspection();
 state.units.forEach((u,i)=>{u.lumens= i===0?752:"";u.tests={0:"OK",1:"OK",2:"OK",3:"OK",4:"OK",5:"OK",6:"OK",7:"OK",8:"OK",9:"OK"}});
 renderInspection();updateAql();showToast("Example loaded.");
}
function init(){
 renderSummary();renderPackaging();renderWorkmanship();renderAgeing();
 setVal("inspectionDate",new Date().toISOString().slice(0,10));
 $("orderQty").addEventListener("input",()=>{sampling();renderInspection();updateAql()});
 $("level").addEventListener("change",()=>{sampling();renderInspection();updateAql()});
 ["foundCritical","foundMajor","foundMinor","aqlCritical","aqlMajor","aqlMinor"].forEach(id=>$(id).addEventListener("input",updateAql));
 $("qtyOrder").addEventListener("input",updateQtyDelta);$("qtyObserved").addEventListener("input",updateQtyDelta);
 $("brightnessRange").addEventListener("input",()=>renderInspection());
 $("loadDemo").onclick=loadExample;$("generate").onclick=()=>generateDocx().catch(e=>{console.error(e);showToast("Could not generate the Word report.");});
 sampling();renderInspection();updateAql();
}
init();
