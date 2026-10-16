function combos(a,n){if(n===0)return[[]];if(a.length<n)return[];const[h,...r]=a;return[...combos(r,n-1).map(c=>[h,...c]),...combos(r,n)]}
function renderSlip(){
  const n=legs.length,kk=clamp(k,1,Math.max(n,1));
  const rows=combos(legs,kk).map(c=>({o:c.reduce((a,l)=>a*l.odds,1),p:c.reduce((a,l)=>a*l.prob,1)}));
  const s=Math.max(0,Number(stake)||0);
  const ev=rows.length?rows.reduce((a,r)=>a+r.o*r.p,0)/rows.length-1:0;
  const lab=kk===1?"单关":kk+"串1";
  const real=legs.filter(l=>!l.custom),same=new Set(real.map(l=>l.mid)).size<real.length;
  const ae=document.activeElement&&document.activeElement.id;
  $("#slip").innerHTML=`<div><button class="sh" id="sh" aria-expanded="${sOpen}"><span>串关单 · ${n} 项</span><span class="m note" style="margin:0">${n?lab+" · 期望 "+pct(ev):"点开可自填角球等玩法"} ${sOpen?"▾":"▴"}</span></button>
  ${sOpen?`<div class="sb">${n?legs.map((l,i)=>`<div class="leg"><div>${l.pick}<small>${l.match} · ${l.market}</small></div><b class="m">${dec(l.odds)}</b><button class="x" data-rm="${i}" aria-label="移除">×</button></div>`).join(""):`<p class="note">在比赛详情里点“加入串关”，或在下面自填。</p>`}
   ${n?`<div class="row">${Array.from({length:n},(_,i)=>i+1).map(v=>`<button class="chip" aria-pressed="${v===kk}" data-k="${v}">${v===1?"单关":v+"串1"}</button>`).join("")}</div>
   <div class="cl"><input id="stake" inputmode="decimal" value="${stake}" style="width:90px" aria-label="每注金额"><div class="note m" style="margin:0;align-self:center">${rows.length} 注 · 总投入 ${(s*rows.length).toFixed(0)} · ${rows.length===1?"综合赔率 "+dec(rows[0].o)+" · 公平命中率 "+(rows[0].p*100).toFixed(1)+"%":"全中返还 "+(rows.reduce((a,r)=>a+r.o,0)*s).toFixed(0)}</div></div>
   ${rows.length===1?`<p class="note m">全中返还 ${(rows[0].o*s).toFixed(0)}</p>`:""}${same?`<p class="note">同一场的多项彼此相关，概率相乘会失真，庄家也常不接受同场串。</p>`:""}`:""}
   <div class="cl"><input id="cn" placeholder="自填，如 曼联 角球大 9.5" style="flex:1"><input id="co" placeholder="赔率" inputmode="decimal" style="width:76px"><button class="chip" id="ca" style="background:var(--ac);color:var(--acfg)">添加</button></div>
   <p class="note">期望按去水公平概率相乘估算（假设各项独立）。自填玩法没有去水数据，按赔率隐含概率计，不含任何边际。最多 8 项。</p>
   ${n?`<button class="btn" id="clr" style="width:auto;padding:0 14px;border:0;text-decoration:underline;color:var(--mu)">清空串关单</button>`:""}</div>`:""}</div>`;
  if(ae==="stake"){const e=$("#stake");if(e){e.focus();e.setSelectionRange(99,99)}}
}
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-day],[data-sp],[data-id],[data-leg],[data-rm],[data-k],#cl,#bd,#sh,#ca,#clr");if(!t)return;
  const d=t.dataset;
  if(d.day!==undefined){day=d.day==="all"?"all":Number(d.day);render()}
  else if(d.sp){sport=d.sp==="全部"?"all":d.sp;render()}
  else if(d.id!==undefined){open=Number(d.id);renderSheet()}
  else if(t.id==="cl"||(t.id==="bd"&&e.target===t)){open=null;renderSheet()}
  else if(d.leg){const m=M[open],[ty,j]=d.leg.split(":");
    if(ty==="ml"){const o=m.outs.find(o=>o.k===Number(j));toggle({key:m.key+":ml",mid:m.key,match:m.h+" 对 "+m.a,market:m.soc?"胜平负":"胜负",pick:o.pick,odds:o.odds,prob:o.fair})}
    else{const x=m.mk[Number(j)];toggle({key:m.key+":"+x.g,mid:m.key,match:m.h+" 对 "+m.a,market:x.g,pick:x.pick,odds:x.odds,prob:x.fair})}}
  else if(d.rm!==undefined){legs.splice(Number(d.rm),1);renderSlip()}
  else if(d.k){k=Number(d.k);renderSlip()}
  else if(t.id==="sh"){sOpen=!sOpen;renderSlip()}
  else if(t.id==="clr"){legs=[];renderSlip()}
  else if(t.id==="ca"){const nm=$("#cn").value.trim(),od=Number($("#co").value);if(nm&&od>1){legs=[...legs,{key:"c"+Date.now(),mid:"c",match:"自填",market:"自填",pick:nm,odds:od,prob:1/od,custom:true}].slice(0,8);renderSlip()}}
});
document.addEventListener("input",e=>{if(e.target.id==="stake"){stake=e.target.value;renderSlip()}});
