function parseEv(ev,lg,from,to){
 const t=Date.parse(ev.date);if(!(t>=from&&t<=to))return null;
 const c=ev.competitions&&ev.competitions[0];if(!c)return null;
 const cs=c.competitors||[];const H=cs.find(x=>x.homeAway==="home")||cs[0],A=cs.find(x=>x.homeAway==="away")||cs[1];if(!H||!A)return null;
 const ty=(c.status&&c.status.type)||{},live=ty.state==="in",done=ty.state==="post"||ty.completed===true;
 const clk=c.status&&c.status.displayClock;
 const st=live?"进行中"+(clk&&clk!=="0:00"?" "+clk:""):done?"完场":"未开赛";
 const sc=(live||done)?(Number(H.score)||0)+"-"+(Number(A.score)||0):"";
 const soc=lg[0]==="soccer",o=c.odds&&c.odds[0];
 const q=side=>{const n=o&&o.moneyline&&o.moneyline[side];
  const cl=am((n&&n.close&&n.close.odds)??(n&&n.odds)),op=am(n&&n.open&&n.open.odds);let cur=cl??op;
  if(cur==null){const f=side==="home"?o&&o.homeTeamOdds:side==="away"?o&&o.awayTeamOdds:o&&o.drawOdds;cur=am(f&&f.moneyLine);return cur==null?null:[a2d(cur),a2d(cur)]}
  return[a2d(cur),a2d(op==null?cur:op)]};
 let o3=null,p3=null;
 if(o){const qs=(soc?["home","draw","away"]:["home","away"]).map(q);
  if(qs.every(Boolean)){o3=soc?[qs[0][0],qs[1][0],qs[2][0]]:[qs[0][0],0,qs[1][0]];p3=soc?[qs[0][1],qs[1][1],qs[2][1]]:[qs[0][1],0,qs[1][1]]}}
 const rec=x=>{const r=(x.records||[]).find(r=>r.type==="total")||(x.records||[])[0];return r&&r.summary||null};
 let mod=[0,0,0];
 if(o3){const imp=o3.map(v=>v?1/v:0),s=imp.reduce((a,b)=>a+b,0),fair=imp.map(v=>v/s);
  mod=(rec(H)||rec(A))?mp(soc,rec(H),rec(A)):fair}
 const ps=o&&o.pointSpread,tt0=o&&o.total;
 const sh=lg2(ps&&ps.home),sa=lg2(ps&&ps.away),ov=lg2(tt0&&tt0.over),un=lg2(tt0&&tt0.under);
 const nm=x=>zt((x.team&&(x.team.displayName||x.team.name))||"未知");
 return[dIdx(t)-dIdx(Date.now()),lg[1],lg[2],nm(H),nm(A),o3,p3,st,sc,mod,sh&&sa?[sh[0],sh[1],sa[1]]:null,ov&&un?[ov[0],ov[1],un[1]]:null,lg[3]+":"+ev.id,tdf.format(new Date(t)),t]}
let real=false;
async function loadReal(){
 const now=Date.now(),from=now-72*36e5,to=now+76*36e5,ymd=t=>new Date(t).toISOString().slice(0,10).replace(/-/g,"");
 const range=ymd(from-12*36e5)+"-"+ymd(to+12*36e5);
 const res=await Promise.all(LG.map(async lg=>{try{
  const r=await fetch("https://site.api.espn.com/apis/site/v2/sports/"+lg[0]+"/"+lg[1]+"/scoreboard?dates="+range+"&limit=300",{signal:AbortSignal.timeout(8000)});
  if(!r.ok)return null;const j=await r.json();
  return(j.events||[]).map(e=>parseEv(e,[lg[0],lg[2],lg[3],lg[1]],from,to)).filter(Boolean)}catch(e){return null}}));
 if(res.every(x=>x===null))return null;
 return res.flat().filter(Boolean).sort((a,b)=>a[14]-b[14]);
}
async function refresh(){
 const keep=open!=null&&M[open]?M[open].key:null;
 let rows=null;try{rows=await loadReal()}catch(e){}
 if(rows){real=true;M=rows.map((x,i)=>pack(x,i));
  $("#tag").textContent="实时数据 · 更新于 "+tdf.format(new Date())+(M.length?"":" · 这几天没有赛事")}
 else if(!real){M=RAW.map((x,i)=>pack([...x,"m"+i,undefined],i));$("#tag").textContent="模拟数据 · 无法连接公开接口"}
 else return;
 open=keep==null?null:M.findIndex(m=>m.key===keep);if(open<0)open=null;
 render();renderSheet();
}
refresh();
setInterval(()=>{const a=document.activeElement;if(document.hidden||(a&&a.tagName==="INPUT"))return;refresh()},30000);
