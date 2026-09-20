const PHOTO_SLOTS = [
  ['front','Front',1],['top','Top',2],['left','Left',3],['bottom','Bottom',4],
  ['back','Back',5],['mounting','Mounting',6],['right','Right',7],['remote','Remote',8],
  ['ghosting_photo','Ghosting Test',9],['focus_photo','Focus / VTOP Test',10],
  ['resolution_left','Resolution Test – Left',11],['resolution_center','Resolution Test – Center',12],
  ['resolution_right','Resolution Test – Right',13],['leakage_photo','Light Leakage / Bright Spots',14]
];
const photoData = {};

const $ = id => document.getElementById(id);
function showStatus(msg, error=false){const el=$('status');el.textContent=msg;el.classList.remove('hidden');el.style.background=error?'#b91c1c':'#111827';setTimeout(()=>el.classList.add('hidden'),4500)}

function renderPhotoInputs(){
  $('photoGrid').innerHTML = PHOTO_SLOTS.map(([key,label,num])=>`<div class="photo-card"><div class="preview" id="preview_${key}"><span>No photo</span></div><label>${label}<input type="file" accept="image/*" data-photo="${key}" data-num="${num}"></label><div class="filename" id="name_${key}"></div></div>`).join('');
  document.querySelectorAll('input[data-photo]').forEach(input=>input.addEventListener('change', async e=>{
    const f=e.target.files?.[0]; if(!f) return;
    const key=e.target.dataset.photo; photoData[key]=f;
    const url=URL.createObjectURL(f); $('preview_'+key).innerHTML=`<img src="${url}" alt="${key}">`; $('name_'+key).textContent=f.name;
  }));
}

function n(id){const v=parseFloat($(id).value);return Number.isFinite(v)?v:null}
function fmt(v,d=2){return Number.isFinite(v)?v.toFixed(d):'—'}
function calculate(){
  const ids=['lux_tl','lux_tc','lux_tr','lux_ml','lux_c','lux_mr','lux_bl','lux_bc','lux_br'];
  const vals=ids.map(n); const valid=vals.filter(v=>v!==null);
  const avg=valid.length===9?valid.reduce((a,b)=>a+b,0)/9:null;
  const w=n('screen_width'), h=n('screen_height'), dist=n('throw_distance');
  const wm=w===null?null:w/100, hm=h===null?null:h/100;
  const area=wm!==null&&hm!==null?wm*hm:null;
  const ansi=avg!==null&&area!==null?avg*area:null;
  const center=n('lux_c'); const corners=[n('lux_tl'),n('lux_tr'),n('lux_bl'),n('lux_br')];
  const uniform=center!==null&&corners.every(v=>v!==null)?(corners.reduce((a,b)=>a+b,0)/4)/center*100:null;
  const ratio=dist!==null&&w!==null&&w!==0?dist/w:null;
  $('avg_lux').textContent=fmt(avg,2); $('area_m2').textContent=fmt(area,3); $('ansi').textContent=fmt(ansi,1); $('uniformity').textContent=fmt(uniform,2); $('throw_ratio').textContent=fmt(ratio,2);
  return {avg,area,ansi,uniformity,ratio,w,h,dist};
}
document.querySelectorAll('input').forEach(el=>el.addEventListener('input',calculate));

function val(id){return $(id).value.trim()}
function checked(name, target){return document.querySelector(`input[name="${name}"][value="${target}"]`)?.checked}
function escXml(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}

function fitImageToPng(file, width=900, height=650){
  return new Promise((resolve,reject)=>{
    const img=new Image(); const url=URL.createObjectURL(file);
    img.onload=()=>{const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);const scale=Math.min(width/img.naturalWidth,height/img.naturalHeight);const dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;ctx.drawImage(img,(width-dw)/2,(height-dh)/2,dw,dh);URL.revokeObjectURL(url);c.toBlob(b=>b?resolve(b.arrayBuffer()):reject(new Error('Could not convert image')), 'image/png');};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read image'))}; img.src=url;
  });
}

async function replaceText(xml, replacements){
  for(const [token,value] of Object.entries(replacements)) xml=xml.split(token).join(escXml(value));
  return xml;
}

async function generate(){
  try{
    const calc=calculate();
    if(!val('supplier')||!val('factory_model')){showStatus('Please enter the supplier and model number.',true);return;}
    if(calc.ansi!==null && !Number.isFinite(calc.ansi)){showStatus('Please check the brightness and screen measurements.',true);return;}
    showStatus('Building Word report…');
    const response=await fetch('template.docx');
    if(!response.ok) throw new Error('Template could not be loaded. Please host this folder or upload the template in the website version.');
    const zip=await JSZip.loadAsync(await response.arrayBuffer());
    let xml=await zip.file('word/document.xml').async('string');
    const projectionSize=(calc.w!==null&&calc.h!==null)?`${fmt(calc.w,1)}x${fmt(calc.h,1)} CM`:'';
    const brightness=calc.ansi!==null?`${fmt(calc.ansi,0)} ANSI. ${fmt(calc.uniformity,2)}% Uniformity`:'';
    const replacements={
      '{{supplier}}':val('supplier'),'{{factory_model}}':val('factory_model'),'{{moq}}':val('moq'),'{{fob_price}}':val('fob_price'),'{{currency}}':val('currency'),
      '{{native_resolution}}':val('native_resolution'),'{{lcd_size}}':val('lcd_size'),'{{brightness_ansi}}':brightness,'{{throw_ratio}}':calc.ratio!==null?`${fmt(calc.dist,0)}/${fmt(calc.w,0)} = ${fmt(calc.ratio,2)}:1`:'',
      '{{projection_size}}':projectionSize,'{{keystone_focus}}':val('keystone_focus'),'{{mainboard}}':val('mainboard'),'{{ram_rom}}':val('ram_rom'),'{{cpu}}':val('cpu'),'{{gpu}}':val('gpu'),'{{os_ui}}':val('os_ui'),'{{wifi_bt}}':val('wifi_bt'),'{{ports}}':val('ports'),'{{speaker}}':val('speaker'),'{{power_consumption}}':val('power_consumption'),'{{lens_optical}}':val('lens_optical'),'{{video_support}}':val('video_support'),'{{bt_remote}}':val('bt_remote'),'{{firmware}}':val('firmware'),
      '{{cast_android}}':val('cast_android'),'{{cast_windows}}':val('cast_windows'),'{{cast_ios}}':val('cast_ios'),'{{cast_mac}}':val('cast_mac'),'{{ott_youtube}}':val('ott_youtube'),'{{ott_other}}':val('ott_other'),
      '{{ghosting_remarks}}':val('ghosting_remarks'),'{{focus_remarks}}':val('focus_remarks'),'{{resolution_remarks}}':val('resolution_remarks'),'{{leakage_remarks}}':val('leakage_remarks'),
      '{{final_eval1}}':val('final_eval1'),'{{final_eval2}}':val('final_eval2'),'{{tested_by}}':val('tested_by'),'{{test_date}}':val('test_date'),
      '{{lcd_option}}':'LCD','{{dlp_option}}':'DLP','{{other_option}}':'Other: __________','{{entry_option}}':'Entry','{{mid_option}}':'Mid','{{premium_option}}':'Premium',
      '{{SYM_1}}':val('product_type')==='LCD'?'0052':'00A3','{{SYM_2}}':val('product_type')==='DLP'?'0052':'00A3','{{SYM_3}}':val('product_type')==='Other'?'0052':'00A3',
      '{{SYM_4}}':val('target_segment')==='Entry'?'0052':'00A3','{{SYM_5}}':val('target_segment')==='Mid'?'0052':'00A3','{{SYM_6}}':val('target_segment')==='Premium'?'0052':'00A3',
      '{{PASS_1}}':'Pass','{{FAIL_1}}':'Fail','{{PASS_2}}':'Pass','{{FAIL_2}}':'Fail','{{PASS_3}}':'Pass','{{FAIL_3}}':'Fail','{{PASS_4}}':'Pass','{{FAIL_4}}':'Fail',
      '{{SYM_7}}':checked('ghosting','pass')?'0052':'00A3','{{SYM_8}}':checked('ghosting','fail')?'0052':'00A3',
      '{{SYM_9}}':checked('focus','pass')?'0052':'00A3','{{SYM_10}}':checked('focus','fail')?'0052':'00A3',
      '{{SYM_11}}':checked('resolution','pass')?'0052':'00A3','{{SYM_12}}':checked('resolution','fail')?'0052':'00A3',
      '{{SYM_13}}':checked('leakage','pass')?'0052':'00A3','{{SYM_14}}':checked('leakage','fail')?'0052':'00A3'
    };
    xml=await replaceText(xml,replacements); zip.file('word/document.xml',xml);
    for(const [key,,num] of PHOTO_SLOTS){if(photoData[key]){const buf=await fitImageToPng(photoData[key]);zip.file(`word/media/image${num}.png`,buf);}}
    const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});
    const safeModel=(val('factory_model')||'Projector').replace(/[^a-z0-9_-]+/gi,'_'); const date=val('test_date')||new Date().toISOString().slice(0,10);
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Projector_Test_Report_${safeModel}_${date}.docx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    showStatus('Word report generated.');
  }catch(e){console.error(e);showStatus(e.message||'Could not generate the report.',true)}
}

function resetForm(){if(!confirm('Clear all entered data and uploaded photos?'))return;document.querySelectorAll('input,textarea').forEach(el=>{if(el.type==='radio') el.checked=el.value==='pass';else el.value='';});Object.keys(photoData).forEach(k=>delete photoData[k]);renderPhotoInputs();calculate();}
$('generate').addEventListener('click',generate);$('generateTop').addEventListener('click',generate);$('reset').addEventListener('click',resetForm);renderPhotoInputs();calculate();
