const $=s=>document.querySelector(s);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const dec=n=>n.toFixed(2);
const pct=n=>(n>=0?"+":"-")+Math.abs(n*100).toFixed(1)+"%";
// 模拟赛程：d=相对今天的天数
const RAW=[
 [-1,"英超","足球","曼联","利物浦",[3.4,3.5,2.15],[3.2,3.5,2.3],"完场","1-2",[.27,.26,.47],[-0.5,1.9,1.95],[2.5,1.85,2.0]],
 [-1,"NBA","篮球","湖人","勇士",[2.05,0,1.8],[2.2,0,1.7],"完场","112-118",[.47,0,.53],[1.5,1.9,1.9],[228.5,1.9,1.9]],
 [0,"西甲","足球","皇家马德里","巴塞罗那",[2.4,3.5,2.8],[2.5,3.4,2.7],"进行中 63'","1-1",[.38,.27,.35],[0,1.95,1.9],[3.0,1.9,1.95]],
 [0,"德甲","足球","拜仁慕尼黑","多特蒙德",[1.55,4.6,5.2],[1.6,4.4,5.0],"未开赛","",[.62,.2,.18],[-1.5,2.0,1.85],[3.5,1.95,1.9]],
 [0,"意甲","足球","国际米兰","AC米兰",[2.0,3.4,3.7],[2.1,3.3,3.5],"未开赛","",[.45,.28,.27],[-0.5,2.0,1.85],[2.5,1.9,1.95]],
 [0,"NBA","篮球","凯尔特人","热火",[1.55,0,2.5],[1.6,0,2.4],"未开赛","",[.66,0,.34],[-6.5,1.9,1.9],[214.5,1.9,1.9]],
 [0,"NFL","橄榄球","堪萨斯酋长","费城老鹰",[1.9,0,1.95],[1.95,0,1.9],"未开赛","",[.52,0,.48],[-1.5,1.9,1.9],[47.5,1.9,1.9]],
 [1,"英超","足球","阿森纳","曼城",[2.7,3.3,2.55],[2.6,3.3,2.65],"未开赛","",[.36,.27,.37],[0,1.95,1.9],[2.5,1.95,1.9]],
 [1,"法甲","足球","巴黎圣日耳曼","马赛",[1.4,5.0,7.0],[1.45,4.8,6.5],"未开赛","",[.7,.17,.13],[-1.5,1.85,2.0],[3.5,2.0,1.85]],
 [1,"NBA","篮球","掘金","雷霆",[2.2,0,1.7],[2.3,0,1.65],"未开赛","",[.43,0,.57],[3.5,1.9,1.9],[225.5,1.9,1.9]],
 [2,"欧冠","足球","拜仁慕尼黑","皇家马德里",[2.3,3.6,2.9],[2.3,3.5,2.9],"未开赛","",[.39,.27,.34],[0,1.9,1.95],[3.0,1.95,1.9]]
];
let M=[];
const pack=([d,league,sport,h,a,o,op,st,sc,mod,sp,tt,key,time],i)=>{
  const soc=sport==="足球";
  const sides=o?(soc?[0,1,2]:[0,2]):[];
  const imp=sides.map(k=>1/o[k]);const sum=imp.reduce((x,y)=>x+y,0);
  const names=["主胜","平局","客胜"];
  const outs=sides.map((k,j)=>{const fair=imp[j]/sum;const blend=fair+clamp(mod[k]-fair,-.035,.035);
    return{k,label:names[k],team:k===0?h:k===1?"":a,odds:o[k],open:op[k],fair,model:mod[k],ev:blend*o[k]-1,key:i+":ml",pick:names[k]+" "+(k===0?h:k===1?"":a)}});
  const best=outs.length?outs.reduce((p,c)=>c.ev>p.ev?c:p):null;
  const mk=[];const f2=(x,y)=>{const s=1/x+1/y;return[1/x/s,1/y/s]};
  const sg=n=>n>0?"+"+n:""+n;
  if(sp){const [x,y]=f2(sp[1],sp[2]);mk.push({g:"让球",pick:h+" "+sg(sp[0]),odds:sp[1],fair:x},{g:"让球",pick:a+" "+sg(-sp[0]),odds:sp[2],fair:y})}
  if(tt){const [x,y]=f2(tt[1],tt[2]);mk.push({g:"大小球",pick:"大 "+tt[0],odds:tt[1],fair:x},{g:"大小球",pick:"小 "+tt[0],odds:tt[2],fair:y})}
  return{id:i,d,league,sport,h,a,st,sc,outs,best,mk,soc,live:st.startsWith("进行"),done:st==="完场",
    time:time||"—",key:key};
};
let day="all",sport="all",open=null,legs=[],k=2,stake="100",sOpen=false;
const DN={"-3":"大前天","-2":"前天","-1":"昨日","0":"今日","1":"明日","2":"后天","3":"大后天"};
const DAYS=[["all","全部"],[-2,"前天"],[-1,"昨日"],[0,"今日"],[1,"明日"],[2,"后天"]];
const SP=["全部","足球","篮球","橄榄球"];
function base(){return M.filter(m=>sport==="全部"||sport==="all"||m.sport===sport)}
function view(){return base().filter(m=>day==="all"||m.d===day)}
function render(){
  $("#days").innerHTML=DAYS.map(([id,l])=>`<button class="chip" aria-pressed="${day===id}" data-day="${id}">${l} ${id==="all"?base().length:base().filter(m=>m.d===id).length}</button>`).join("");
  $("#sports").innerHTML=SP.map(l=>`<button class="chip" aria-pressed="${(sport==="all"&&l==="全部")||sport===l}" data-sp="${l}">${l}</button>`).join("");
  const v=view(),ok=v.filter(m=>!m.done&&m.best&&m.best.ev>=.02).length;
  const dn=v.filter(m=>m.done).length;
  $("#stats").innerHTML=`<div class="st"><span>场次</span><b class="m">${v.length}</b></div><div class="st"><span>进行中</span><b class="m">${v.filter(m=>m.live).length}</b></div><div class="st"><span>正期望</span><b class="m">${ok}</b></div>`;
  $("#list").innerHTML=v.length?v.map(m=>`<button class="card" data-id="${m.id}">
    <div class="top"><span>${m.sport} · ${m.league}</span><span class="${m.live?"live":""}">${m.st}${m.done?"":""}</span></div>
    <div class="team"><span>${m.h}</span><span class="m">${m.sc?m.sc.split("-")[0]:""}</span></div>
    <div class="team"><span>${m.a}</span><span class="m">${m.sc?m.sc.split("-")[1]:""}</span></div>
    <div class="px">${m.outs.map(o=>`<div class="pc ${o===m.best?"best":""}">${o.label}<b class="m">${dec(o.odds)}</b><span class="m">${dec(o.open)}</span></div>`).join("")}${m.best?`<div class="pc">最优期望<b class="m ev">${pct(m.best.ev)}</b></div>`:`<div class="pc">暂无报价</div>`}</div></button>`).join(""):`<p class="note">这个筛选下没有场次。</p>`;
  renderSlip();
}
function has(key,pick){return legs.some(l=>l.key===key&&l.pick===pick)}
function toggle(l){const i=legs.findIndex(x=>x.key===l.key);
  if(i<0)legs=[...legs,l].slice(0,8);else if(legs[i].pick===l.pick)legs.splice(i,1);else legs[i]=l;
  renderSheet();renderSlip()}
function renderSheet(){
  const m=M[open];if(!m){$("#sheet").innerHTML="";return}
  const mkt=m.soc?"胜平负":"胜负";
  $("#sheet").innerHTML=`<div class="sheet" id="bd"><div role="dialog" aria-modal="true">
   <div class="top"><span>${m.sport} · ${m.league} · ${DN[m.d]||""} ${m.time}</span><button class="x" id="cl" aria-label="关闭">×</button></div>
   <h2 style="margin:4px 0 0;font-size:20px">${m.h} 对 ${m.a}</h2><div class="top" style="margin-top:4px"><span>${m.st} ${m.sc}</span></div>
   ${m.outs.map(o=>{const on=has(m.key+":ml",o.pick);return`<div class="oc ${o===m.best?"best":""}"><div style="display:flex;justify-content:space-between"><span>${o.label} ${o.team}</span><span class="m ${o===m.best&&o.ev>0?"ev":""}">${pct(o.ev)}</span></div>
    <div class="m top" style="margin-top:6px"><span>即时 ${dec(o.odds)}</span><span>开盘 ${dec(o.open)}</span><span>公平 ${(o.fair*100).toFixed(1)}%</span><span>模型 ${(o.model*100).toFixed(1)}%</span></div>
    <button class="btn" aria-pressed="${on}" data-leg="ml:${o.k}">${on?"已在串关单":"加入串关"}</button></div>`}).join("")}
   <p class="note" style="margin-top:14px">让球 · 大小球，点一下加入串关</p>
   <div class="g2">${m.mk.map((x,j)=>{const on=has(m.key+":"+x.g,x.pick);return`<button class="btn" aria-pressed="${on}" data-leg="mk:${j}">${x.g} ${x.pick} @${dec(x.odds)}</button>`}).join("")}</div>
  </div></div>`;
}
