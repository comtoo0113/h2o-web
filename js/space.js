/* H2O 게임즈 — 하위 페이지 바탕: 성운 결 · 별 · 가끔 얼음 유성 · 필름 결.
   홈 원기둥 그림에서 떼어 옴(원기둥 · 행성 · 혜성은 뺌). 움직임 줄이기 설정이면 한 장만 그림. */
(()=>{
const sky=document.createElement('div');sky.className='sky';sky.setAttribute('aria-hidden','true');
sky.innerHTML='<div class="mesh"><i style="--c:var(--c1)"></i><i style="--c:var(--c2)"></i><i style="--c:var(--c3)"></i><i style="--c:var(--c5)"></i></div><canvas id="neb"></canvas><canvas class="fx" id="stars"></canvas><div class="vig"></div>';
const grain=document.createElement('div');grain.className='grain';grain.setAttribute('aria-hidden','true');
document.body.prepend(sky);document.body.append(grain);

const neb=sky.querySelector('#neb'),cvs=sky.querySelector('#stars'),g=cvs.getContext('2d');
let W=0,H=0,DPR=1;
const css=getComputedStyle(document.documentElement);
const rgb=k=>{const h=css.getPropertyValue('--'+k).trim();return [1,3,5].map(i=>parseInt(h.substr(i,2),16))};
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const lerp=(a,b,t)=>a+(b-a)*t, mixc=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const sstep=(e0,e1,x)=>{const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return t*t*(3-2*t)};
let seed=29;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const pick=w=>{let r=rnd()*w.reduce((a,b)=>a+b,0);for(let i=0;i<w.length;i++){r-=w[i];if(r<=0)return i}return w.length-1};
const RAD=Math.PI/180, small=innerWidth<700;

/* 값 노이즈 */
function hash(x,y){let h=(Math.imul(x,374761393)+Math.imul(y,668265263)+1013)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y,o){let s=0,a=.5,f=1,n=0;for(let i=0;i<o;i++){s+=a*vnoise(x*f,y*f);n+=a;f*=2.03;a*=.5}return s/n}
const LX=.62,LY=-.58;

/* 빛 번짐 그림 */
const SPR={};
function spr(c){const k=c.join();if(SPR[k])return SPR[k];const s=document.createElement('canvas');s.width=s.height=64;const q=s.getContext('2d'),gr=q.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.1,rgba(c,.85));gr.addColorStop(.3,rgba(c,.26));gr.addColorStop(.6,rgba(c,.06));gr.addColorStop(1,rgba(c,0));q.fillStyle=gr;q.fillRect(0,0,64,64);return SPR[k]=s}
const SPK={};
function spike(c){const k=c.join();if(SPK[k])return SPK[k];const s=document.createElement('canvas');s.width=s.height=64;const q=s.getContext('2d');
  for(const v of [0,1]){const gr=v?q.createLinearGradient(32,0,32,64):q.createLinearGradient(0,32,64,32);gr.addColorStop(0,rgba(c,0));gr.addColorStop(.5,rgba(c,.9));gr.addColorStop(1,rgba(c,0));q.fillStyle=gr;v?q.fillRect(31.4,0,1.2,64):q.fillRect(0,31.4,64,1.2)}return SPK[k]=s}
function sp(img,x,y,d,a){g.globalAlpha=a;g.drawImage(img,x-d/2,y-d/2,d,d)}

/* 성운 결 — 한 번만(낮은 해상도로 그려 늘림) */
function drawNebula(){
  const w=Math.max(8,Math.round(W*1.1/3)),h=Math.max(8,Math.round(H*1.1/3));neb.width=w;neb.height=h;
  const q=neb.getContext('2d'),im=q.createImageData(w,h),D=im.data,sc=3.4/Math.max(w,h*1.6);
  const A=rgb('c1'),Bc=rgb('c5'),Cc=rgb('c2'),DK=[12,5,24];
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
    const x=i*sc,y=j*sc,qx=fbm(x+1.7,y+9.2,4),qy=fbm(x+8.3,y+2.8,4),n=fbm(x+2.3*qx,y+2.3*qy,5),m=fbm(x*1.6+5.1,y*1.6+1.3,3);
    const a=sstep(.5,.82,n)*.26;
    let col=mixc(A,Bc,sstep(.35,.68,m));col=mixc(col,Cc,sstep(.55,.82,qx)*.55);col=mixc(col,[255,244,255],sstep(.72,.92,n)*.4);
    const lane=sstep(.075,0,Math.abs(n-.43))*sstep(.4,.7,m)*.08;
    const at=a+lane*(1-a),k=(j*w+i)*4;
    if(at<.003){D[k+3]=0;continue}
    for(let c=0;c<3;c++)D[k+c]=(col[c]*a*(1-lane)+DK[c]*lane)/at;
    D[k+3]=at*255;
  }
  q.putImageData(im,0,0);
}

/* 별: 작은 별(색 넷으로 묶음) + 밝은 별 몇 */
const TW=[[255,255,255],[206,222,255],[255,234,212],[228,214,255]];
const stars=TW.map(()=>[]);
for(let i=0;i<(small?320:700);i++){const r=rnd();stars[pick([.55,.2,.12,.13])].push({x:rnd(),y:rnd(),d:r<.62?.06:r<.9?.14:.28,s:.55+Math.pow(rnd(),3)*1.05,a:.12+Math.pow(rnd(),1.6)*.55,tw:rnd()<.35?.6+rnd()*2.2:0,ph:rnd()*6.3})}
const bright=[];for(let i=0;i<(small?6:12);i++)bright.push({x:rnd(),y:rnd(),d:.1+rnd()*.2,s:9+rnd()*13,a:.35+rnd()*.35,c:TW[pick([.5,.25,.12,.13])],f:.5+rnd()*1.2,ph:rnd()*6.3,spk:rnd()<.5});

/* 얼음 유성 */
const ice=[];let nextIce=2.5;
function spawnIce(){
  const fromL=rnd()<.5,ang=(fromL?14+rnd()*22:166-rnd()*22)*RAD,sp0=180+rnd()*160,s=2.6+rnd()*2.6;
  const n=7+Math.floor(rnd()*3),verts=[];for(let i=0;i<n;i++)verts.push([i/n*6.283+(rnd()-.5)*.5,.62+rnd()*.45]);
  ice.push({x:fromL?-60:W+60,y:H*(.06+rnd()*.5),vx:Math.cos(ang)*sp0,vy:Math.sin(ang)*sp0,s,verts,rot:rnd()*6.28,vr:(rnd()-.5)*3,sh:[],emit:0});
}
function stepIce(dt){
  nextIce-=dt;if(nextIce<=0){spawnIce();nextIce=4+rnd()*6}
  for(let i=ice.length-1;i>=0;i--){const m=ice[i];m.x+=m.vx*dt;m.y+=m.vy*dt;m.rot+=m.vr*dt;
    const inside=m.x>-120&&m.x<W+120&&m.y<H+120;
    if(inside){m.emit+=dt*m.s*10;while(m.emit>=1){m.emit--;m.sh.push({x:m.x+(rnd()-.5)*m.s,y:m.y+(rnd()-.5)*m.s,vx:m.vx*.1+(rnd()-.5)*44,vy:m.vy*.1+(rnd()-.5)*44,l:0,L:.5+rnd()*.9,z:.5+rnd()*1.2,tw:rnd()*6.3,c:rnd()<.6?[255,255,255]:[196,232,255]})}}
    for(let j=m.sh.length-1;j>=0;j--){const q=m.sh[j];q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.985;q.vy*=.985;q.l+=dt;if(q.l>=q.L)m.sh.splice(j,1)}
    if(!inside&&!m.sh.length)ice.splice(i,1)}
}
function drawIce(m,t){
  const v=Math.hypot(m.vx,m.vy),ux=m.vx/v,uy=m.vy/v,px=-uy,py=ux,s=m.s,dim=.8,Lt=s*28;
  g.globalCompositeOperation='lighter';
  for(const q of m.sh){const u=q.l/q.L,a=Math.pow(1-u,1.2)*.75*dim,z=q.z*(1-u*.5);
    g.globalAlpha=a;g.fillStyle=rgba(q.c,1);g.beginPath();g.moveTo(q.x,q.y-z);g.lineTo(q.x+z*.7,q.y);g.lineTo(q.x,q.y+z);g.lineTo(q.x-z*.7,q.y);g.fill();
    if(Math.sin(t*9+q.tw)>.93){g.globalAlpha=a*.9;g.fillRect(q.x-z*3,q.y-.3,z*6,.6);g.fillRect(q.x-.3,q.y-z*3,.6,z*6)}}
  const tail=(w,len,a0,a1)=>{const tx=m.x-ux*len,ty=m.y-uy*len,gr=g.createLinearGradient(m.x,m.y,tx,ty);gr.addColorStop(0,rgba([232,246,255],a0*dim));gr.addColorStop(.35,rgba([150,200,250],a1*dim));gr.addColorStop(1,rgba([147,197,253],0));
    g.globalAlpha=1;g.fillStyle=gr;g.beginPath();g.moveTo(m.x+px*w,m.y+py*w);g.lineTo(tx,ty);g.lineTo(m.x-px*w,m.y-py*w);g.arc(m.x,m.y,w,Math.atan2(-py,-px),Math.atan2(py,px),false);g.fill()};
  tail(s*2.6,Lt*1.25,.16,.06);tail(s*1.05,Lt,.6,.2);
  sp(spr([170,214,255]),m.x,m.y,s*9,.5*dim);sp(spr([255,255,255]),m.x,m.y,s*3.2,.85*dim);
  g.globalCompositeOperation='source-over';g.globalAlpha=dim;
  const pts=m.verts.map(([a,r])=>[m.x+Math.cos(a+m.rot)*s*r,m.y+Math.sin(a+m.rot)*s*r]);
  const gr=g.createLinearGradient(m.x+LX*s,m.y+LY*s,m.x-LX*s,m.y-LY*s);gr.addColorStop(0,'#f4fbff');gr.addColorStop(.45,'#a9d3f5');gr.addColorStop(1,'#33507e');
  g.fillStyle=gr;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();
  g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=.6;g.stroke();
  g.globalAlpha=1;
}

function draw(t,dt){
  g.globalAlpha=1;g.globalCompositeOperation='source-over';g.clearRect(0,0,W,H);
  g.globalCompositeOperation='lighter';
  const drift=scrollY*.5+t*3; /* 아래로 읽어 내려가면 별이 느리게 따라 올라감 */
  for(let ti=0;ti<4;ti++){g.fillStyle=rgba(TW[ti],1);for(const s of stars[ti]){let y=(s.y*H-drift*s.d)%H;if(y<0)y+=H;g.globalAlpha=s.tw?s.a*(.7+.3*Math.sin(t*s.tw+s.ph)):s.a;g.fillRect(s.x*W,y,s.s,s.s)}}
  for(const b of bright){let y=(b.y*H-drift*b.d)%H;if(y<0)y+=H;const a=b.a*(.8+.2*Math.sin(t*b.f+b.ph));sp(spr(b.c),b.x*W,y,b.s,a);if(b.spk)sp(spike(b.c),b.x*W,y,b.s*2.2,a*.45)}
  if(dt>0){stepIce(dt);for(const m of ice)drawIce(m,t)}
  g.globalAlpha=1;g.globalCompositeOperation='source-over';
}

function resize(){DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cvs.width=W*DPR;cvs.height=H*DPR;g.setTransform(DPR,0,0,DPR,0,0);drawNebula()}

/* 필름 결 */
(()=>{const c=document.createElement('canvas');c.width=c.height=180;const q=c.getContext('2d'),im=q.createImageData(180,180);
  for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255|0;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}
  q.putImageData(im,0,0);grain.style.backgroundImage=`url(${c.toDataURL()})`})();

const still=matchMedia('(prefers-reduced-motion: reduce)').matches||/still/.test(location.hash);
let last=performance.now(),T=0,rzT=0,lastSY=-1;
resize();draw(0,0);
addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(()=>{resize();draw(T,0)},150)});
if(still){addEventListener('scroll',()=>draw(T,0),{passive:true});return}
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(!document.hidden&&!document.body.classList.contains('lb-open')){T+=dt;draw(T,dt)}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
