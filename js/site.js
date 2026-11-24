/* H2O 게임 — 하위 페이지 공용: 위 메뉴 · 사진 크게 보기 · 소식 그리기 */
(()=>{
const nav=document.querySelector('.nav');
const onS=()=>nav&&nav.classList.toggle('solid',scrollY>24);onS();addEventListener('scroll',onS,{passive:true});

/* 사진 크게 보기 — .ph[data-big] 를 누르면. 같은 [data-gal] 묶음 안에서 앞뒤로 */
const lb=document.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
lb.innerHTML='<img alt=""><p></p><button class="x" aria-label="닫기">×</button><button class="pv" aria-label="앞 사진">‹</button><button class="nx" aria-label="다음 사진">›</button>';
document.body.append(lb);
const lbImg=lb.querySelector('img'),lbCap=lb.querySelector('p');
let list=[],idx=0,back=null;
function show(i){idx=(i+list.length)%list.length;const el=list[idx];lbImg.src=el.dataset.big;lbImg.alt=el.dataset.cap||'';lbCap.textContent=el.dataset.cap||'';
  lb.querySelector('.pv').style.display=lb.querySelector('.nx').style.display=list.length>1?'':'none'}
function open(el){const grp=el.closest('[data-gal]')||document;list=[...grp.querySelectorAll('.ph[data-big]')];back=el;show(list.indexOf(el));
  lb.classList.add('open');document.body.classList.add('lb-open');lb.querySelector('.x').focus({preventScroll:true})}
function close(){lb.classList.remove('open');document.body.classList.remove('lb-open');if(back)back.focus({preventScroll:true})}
document.querySelectorAll('.ph[data-big]').forEach(p=>{p.tabIndex=0;p.setAttribute('role','button');p.setAttribute('aria-label',(p.dataset.cap||'사진')+' 크게 보기')});
document.addEventListener('click',e=>{const p=e.target.closest('.ph[data-big]');if(p)open(p)});
document.addEventListener('keydown',e=>{
  if(lb.classList.contains('open')){if(e.key==='Escape')close();else if(e.key==='ArrowLeft')show(idx-1);else if(e.key==='ArrowRight')show(idx+1);return}
  if(e.key==='Enter'&&document.activeElement&&document.activeElement.matches('.ph[data-big]'))open(document.activeElement)});
lb.addEventListener('click',e=>{if(e.target.closest('.pv'))show(idx-1);else if(e.target.closest('.nx'))show(idx+1);else if(e.target===lb||e.target.closest('.x'))close()});

/* 차례 칸 — 내려서 위 메뉴 밑으로 지나가면 단추들이 오른쪽 세로 목록으로 하나씩 날아가 붙고, 다시 올라오면 제자리로.
   오른쪽 목록을 눌러 이동 · 지금 읽는 절 표시. 900 이하 화면에선 그대로, 움직임 줄이기 설정이면 날지 않고 바로 */
const src=document.querySelector('.toc,.pick[data-dock]');
if(src){
  const links=[...src.querySelectorAll('a[href^="#"]')];
  const dock=document.createElement('nav');dock.className='toc-dock';dock.setAttribute('aria-label','차례');
  links.forEach(a=>{const it=document.createElement('a');it.href=a.getAttribute('href');it.append(document.createElement('i'));const sp=document.createElement('span');sp.textContent=a.textContent;it.append(sp);dock.append(it)});
  document.body.append(dock);
  const items=[...dock.children],secs=links.map(a=>document.querySelector(a.getAttribute('href')));
  const wide=matchMedia('(min-width:901px)'),calm=matchMedia('(prefers-reduced-motion:reduce)');
  const c0=getComputedStyle(links[0]),chip={borderColor:c0.borderTopColor,backgroundColor:c0.backgroundColor},bare={borderColor:'rgba(255,255,255,0)',backgroundColor:'rgba(255,255,255,0)'};
  let docked=false,gen=0;
  const stop=els=>els.forEach(e=>e.getAnimations({subtree:true}).forEach(a=>a.cancel()));
  function settle(){stop(items);stop(links);src.classList.remove('fly');dock.classList.toggle('show',docked);dock.classList.toggle('panel',docked);src.classList.toggle('gone',docked)}
  /* 내릴 땐 오른쪽 목록 단추가, 올릴 땐 본래 단추가 지금 보이는 자리에서 제자리로 날아감 → 끝자리는 늘 정확 */
  function fly(want,anim){
    if(want===docked)return;docked=want;const g=++gen;
    if(!anim||calm.matches){settle();return}
    const from=(want?links:items).map(e=>e.getBoundingClientRect());
    settle();
    const movers=want?items:links;
    if(!want)src.classList.add('fly');
    const nat=movers.map(e=>e.getBoundingClientRect()),done=[];
    movers.forEach((m,k)=>{
      const f=from[k],n=nat[k],d=(want?k:movers.length-1-k)*26;
      done.push(m.animate([Object.assign({transform:`translate(${f.left-n.left}px,${f.top-n.top}px)`},want?chip:bare),Object.assign({transform:'none'},want?bare:chip)],
        {duration:640,delay:d,easing:'cubic-bezier(.2,.75,.15,1)',fill:'backwards'}).finished);
      if(want)done.push(m.firstElementChild.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:300,delay:d+380,easing:'ease-out',fill:'backwards'}).finished);
    });
    Promise.all(done).then(()=>{if(g===gen)src.classList.remove('fly')},()=>{});
  }
  let ticking=false;
  function check(anim){
    ticking=false;
    const top=src.getBoundingClientRect().top;
    fly(wide.matches&&(docked?top<96:top<72),anim);
    if(!docked)return;
    let cur=0;const line=innerHeight*.38;
    secs.forEach((s,k)=>{if(s&&s.getBoundingClientRect().top<line)cur=k});
    if(innerHeight+scrollY>=document.documentElement.scrollHeight-4)cur=secs.length-1;
    items.forEach((it,k)=>it.classList.toggle('on',k===cur));
  }
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(()=>check(true))}},{passive:true});
  addEventListener('resize',()=>check(false));
  check(false);
}

/* 소식 — data=[{v,g:[[소제목,[줄…]]]}] 를 접는 칸으로. 처음 first 개, 「더 보기」마다 20 개씩 */
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY=/^(F\d{0,2}|[A-Z0-9?]|Enter|Esc|Tab|Shift|Ctrl|Space)$/;
const line=s=>esc(s).replace(/\[([^\]]{1,24})\]/g,(m,k)=>KEY.test(k)?`<kbd>${k}</kbd>`:`「${k}」`);
window.renderNews=(el,data,first=10,label='판')=>{
  let shown=0;
  const box=document.createElement('div');box.className='news';el.append(box);
  const row=document.createElement('div');row.className='more-row';
  const btn=document.createElement('button');btn.className='btn';row.append(btn);el.append(row);
  function add(n){const part=data.slice(shown,shown+n);
    box.insertAdjacentHTML('beforeend',part.map((e,i)=>`<details${shown+i===0?' open':''}><summary><b>${esc(e.v)}</b><span>${esc(e.g.map(x=>x[0]).join(' · '))}</span></summary><div class="nb">`+
      e.g.map(([t,ls])=>`<h4>${esc(t)}</h4><ul>${ls.map(l=>`<li>${line(l)}</li>`).join('')}</ul>`).join('')+`</div></details>`).join(''));
    shown+=part.length;const left=data.length-shown;
    row.style.display=left>0?'':'none';btn.textContent=`이전 소식 더 보기 (남은 ${left}${label})`}
  btn.onclick=()=>add(20);add(first);
};
})();
