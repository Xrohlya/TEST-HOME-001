'use strict';
const $=s=>document.querySelector(s);
const FIRE_DRAGON_SVG=`<svg class="fire-dragon" width="100%" height="100%" viewBox="0 0 80 80" role="img" aria-label="Красный дракон Огнекрыл"><ellipse cx="40" cy="72" rx="29" ry="5" fill="#4b272338"/><path d="M26 39 5 13 8 53 29 56M51 37 74 11 71 51 49 56" fill="#bd3a32" stroke="#792e30" stroke-width="2"/><path d="m9 20 14 25-13 5m59-30-14 25 14 3" fill="#ef9951"/><path d="M27 59Q9 53 8 67q11 9 24 0" fill="#bb3b32"/><ellipse cx="41" cy="53" rx="18" ry="20" fill="#d84a35"/><ellipse cx="42" cy="57" rx="9" ry="14" fill="#f6bb66"/><path d="m26 26-2-17 13 10m11 0 12-12-5 22" fill="#f2b95f"/><ellipse cx="41" cy="28" rx="21" ry="17" fill="#df503a"/><circle cx="33" cy="26" r="5" fill="#fff0bd"/><circle cx="51" cy="26" r="5" fill="#fff0bd"/><circle cx="34" cy="27" r="2.5" fill="#482b2b"/><circle cx="50" cy="27" r="2.5" fill="#482b2b"/><path d="M34 38q10 6 18-1" stroke="#7e3030" stroke-width="3" fill="none"/><path d="m31 70-8 4m29-4 8 4" stroke="#b73d33" stroke-width="7" stroke-linecap="round"/></svg>`;
const heroes={worm:{name:'Землерой',emoji:'🪱',title:'Землерой ищет корни',world:'ПОДЗЕМНЫЕ ТОННЕЛИ',help:'Собери все корни 🌱. Подойди к камню, повернись к нему и нажми «🔥 Огонь». Стрелки — движение, пробел — способность.',power:'🔥 Огонь'},dragon:{name:'Мохопых',emoji:'🐉',title:'Мохопых будит сад',world:'ВОЛШЕБНЫЙ ЛЕС',help:'Разбуди все бутоны 🌰! Подойди к ним и нажми «🌼 Цветочное дыхание»: оно превращает все соседние бутоны в цветы. Стрелки — движение, пробел — способность.',power:'🌼 Цветочное дыхание'},cloud:{name:'Облакрыл',emoji:'🦄',title:'Облакрыл собирает сны',world:'ОБЛАЧНАЯ ПАМЯТЬ',help:'Находи одинаковые сны: открой две карточки. Совпавшая пара останется открытой. Если они разные, запомни их и открой следующую карточку.'},octopus:{name:'Булькозвёзд',emoji:'🐙',title:'Булькозвёзд зажигает звёзды',world:'ЛУННОЕ ОЗЕРО',help:'Зажги все подводные звёзды ⭐. Нажатие меняет свет выбранной клетки и её соседей сверху, снизу, слева и справа. «💡 Подсказка» покажет полезный ход.'},fire:{name:'Огнекрыл',emoji:'🐲',title:'Огнекрыл и огненные кристаллы',world:'ВУЛКАНИЧЕСКИЕ ОСТРОВА',help:'Собери все кристаллы 💎. Взлетай, чтобы пересекать лаву 🌋. Каменные стены нельзя пересечь даже в полёте. Повернись к камню и нажми «Огненное дыхание», чтобы расплавить его.',power:'🔥 Огненное дыхание'}};
let hero='worm',level=1,state,finished=false,completed={};
try{completed=JSON.parse(localStorage.getItem('atlas-games-eight-v2')||'{}')||{};if(typeof completed!=='object'||Array.isArray(completed))completed={};}catch{}
function rng(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function shuffle(items,random){for(let i=items.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}
function neighbors(i,w,h){return [i,...(i%w?[i-1]:[]),...(i%w<w-1?[i+1]:[]),...(i>=w?[i-w]:[]),...(i<w*(h-1)?[i+w]:[])];}
const stageCatalog=new Map(),stageFingerprints=new Map();
function stageFingerprint(id,g){
 if(id==='cloud')return JSON.stringify([g.w,g.h,g.cards]);
 if(id==='octopus')return JSON.stringify([g.w,g.h,g.cells]);
 const sorted=set=>[...set].sort((a,b)=>a-b);
 return JSON.stringify([g.w,g.h,sorted(g.walls),sorted(g.items),sorted(g.rocks),g.lava?[...g.lava].sort((a,b)=>a-b):[]]);
}
function makeLevel(id,n,stage=1){
 if(!stageCatalog.has(id)){stageCatalog.set(id,[]);stageFingerprints.set(id,new Set());}
 const catalog=stageCatalog.get(id),seen=stageFingerprints.get(id),index=(n-1)*8+stage-1;
 while(catalog.length<=index){
  const levelNumber=Math.floor(catalog.length/8)+1,stageNumber=catalog.length%8+1;let candidate,fingerprint,attempt=0;
  do{candidate=buildStage(id,levelNumber,stageNumber,attempt++);fingerprint=stageFingerprint(id,candidate);if(attempt>10000)throw Error('Не удалось создать новое испытание');}while(seen.has(fingerprint));
  candidate.stage=stageNumber;seen.add(fingerprint);catalog.push(candidate);
 }
 return structuredClone(catalog[index]);
}
function buildStage(id,n,stage,salt=0){
 const random=rng(n*7919+Object.keys(heroes).indexOf(id)*104729+(stage-1)*1000003+salt*2654435761),w=n===100?11:9,h=n===100?11:7;
 if(id==='worm'||id==='dragon'||id==='fire'){
  // Carve a connected maze: every target has a route from the entrance.
  const floor=new Set([0]),stack=[0];
  while(stack.length){const p=stack[stack.length-1],x=p%w,y=Math.floor(p/w);
   const choices=shuffle([[2,0],[-2,0],[0,2],[0,-2]].filter(([dx,dy])=>x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&!floor.has(p+dx+dy*w)),random);
   if(!choices.length){stack.pop();continue;}const [dx,dy]=choices[0],next=p+dx+dy*w;floor.add(p+dx/2+dy*w/2);floor.add(next);stack.push(next);
  }
  // Early levels have more shortcuts; later levels need careful route planning.
  const walls=new Set(Array.from({length:w*h},(_,i)=>i).filter(i=>!floor.has(i)));
  for(const i of shuffle([...walls],random).slice(0,Math.max(0,12-Math.floor(n/8)))){walls.delete(i);floor.add(i);}
  const spots=shuffle([...floor].filter(i=>i!==0),random),count=n===100?(id==='fire'?Math.min(28,spots.length):id==='worm'?Math.min(35,spots.length):spots.length):5+Math.floor(n/8),items=new Set(spots.slice(0,count));
  const rocks=new Set(id!=='dragon'?spots.slice(count,n===100?(id==='fire'?spots.length-14:spots.length):count+5+Math.floor(n/7)):[]);
  const strength=1+Math.floor((n-1)/35);
  const lava=new Set(id==='fire'?shuffle(spots.filter(i=>!items.has(i)&&!rocks.has(i)),random).slice(0,4+Math.floor(n/10)):[]);
  return{w,h,player:0,dir:1,items,walls,rocks,lava,flying:false,rockHp:new Map([...rocks].map(i=>[i,n===100?9:1+Math.floor(random()*strength)])),budHp:new Map([...items].map(i=>[i,n===100?9:1+Math.floor(random()*strength)])),bloom:new Set(),target:count,moves:0};
 }
 if(id==='cloud'){
  const count=n===100?60:4+Math.floor((n-1)/7),pool=['🌙','⭐','🌈','☁️','🪐','💎','🎈','🦋','🌸','🍀','☀️','❄️','🍎','🚀','🎵','🐚','🍄','⚡','🐱','🐶','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐞','🦗','🕷','🦂','🐢','🐍','🦎','🐙','🦑','🦀','🐠','🐟','🐬','🐳','🦈','🐊','🐘','🦒','🦓','🦔'];
  const symbols=shuffle(pool,random).slice(0,count),cards=shuffle([...symbols,...symbols],random);
  if(n===100)cards.splice(60,0,null);
  return{w:n===100?11:count>10?6:4,h:n===100?11:Math.ceil(count*2/(count>10?6:4)),cards,opened:[],matched:new Set(),moves:0,mistakes:0,maxMistakes:n===100?3:Math.max(4,Math.ceil(count*(1.8-n/100)))};
 }
 const size=n===100?11:3+Math.floor((n-1)/25),cells=Array(size*size).fill(true),solution=new Set();
 for(const i of shuffle(Array.from({length:cells.length},(_,i)=>i),random).slice(0,1+Math.floor(random()*(cells.length-1)))){neighbors(i,size,size).forEach(j=>cells[j]=!cells[j]);solution.add(i);}
 if(cells.every(Boolean)){neighbors(0,size,size).forEach(j=>cells[j]=!cells[j]);solution.has(0)?solution.delete(0):solution.add(0);}
 return{w:size,h:size,cells,solution,moves:0,maxMoves:solution.size+(n===100?0:Math.max(3,12-Math.floor(n/10))),hints:n===100?0:Math.max(1,3-Math.floor(n/35))};
}

function completeStage(){if(state.stage<8){const nextStage=state.stage+1;start(nextStage);message('✦ Испытание пройдено! Уровень '+level+', испытание '+nextStage+' из 8.');}else saveWin();}
function message(text){$('#status').textContent=text;}
function lose(text){finished=true;$('#next').disabled=true;message(text+' Нажми «Заново» и попробуй ещё!');render();}
function saveWin(){if(finished)return;finished=true;completed[hero+':'+level]=true;try{localStorage.setItem('atlas-games-eight-v2',JSON.stringify(completed));}catch{}$('#next').disabled=level===100;message(level===100?'🏆 Уровень 100 пройден! Можно выбрать другого героя или вернуться к другим уровням.':'🎉 Уровень пройден! Переходи к следующему.');updateProgress();}
function updateProgress(){const count=Array.from({length:100},(_,i)=>completed[hero+':'+(i+1)]).filter(Boolean).length;$('#progress').textContent='Уровень '+level+' / 100 · Испытание '+state.stage+' / 8 · Пройдено: '+count;for(const option of $('#level').options)option.textContent=option.value+(completed[hero+':'+option.value]?' ✓':'');}
function start(stage=1){state=makeLevel(hero,level,stage);finished=false;$('#title').textContent=heroes[hero].title;$('#world').textContent=heroes[hero].world+(level===100?' · СЛОЖНОСТЬ 9000':'');$('#instructions').textContent='В каждом уровне 8 испытаний. На 100-м уровне поле 11 × 11. '+heroes[hero].help+' '+(level===100?'Режим 9000: плотный лабиринт, по 9 попаданий на камень или бутон; в памяти — только 3 ошибки; в звёздах — ни одного лишнего хода и без подсказок. ':'')+(hero==='fire'?'Взлетай над лавой кнопкой «🪽 Взлететь» или клавишей G. Камни плавятся огнём. ':hero==='worm'?'Тёмные стены непроходимы. Крепким камням нужно несколько огненных плевков.':hero==='dragon'?'Обходи колючие заросли. Крепкие бутоны требуют нескольких цветочных дыханий.':hero==='cloud'?'Ошибок можно сделать не больше '+state.maxMistakes+'. Запоминай открытые сны!':'На этот уровень: '+state.maxMoves+' ходов и '+state.hints+' подсказок.');$('#controls').hidden=hero==='cloud'||hero==='octopus';$('#power').textContent=heroes[hero].power||'';$('#next').disabled=true;$('#level').value=level;message('Уровень '+level+', испытание '+state.stage+' из 8. Приключение начинается!');updateProgress();render();}
function render(){
 const b=$('#board');b.replaceChildren();b.style.gridTemplateColumns='repeat('+state.w+',1fr)';b.className=(hero==='cloud'?'memory':hero==='octopus'?'lights':'')+(level===100?' final-grid':'');
 const total=hero==='cloud'?state.cards.length:state.w*state.h;
 for(let i=0;i<total;i++){
  const tile=document.createElement(hero==='cloud'||hero==='octopus'?'button':'div');tile.className='tile';
  if(hero==='cloud'&&state.cards[i]===null){tile.textContent='🌙';tile.disabled=true;tile.setAttribute('aria-label','Лунный камень — здесь нет пары');}
  else if(hero==='cloud'){const visible=state.opened.includes(i)||state.matched.has(i);tile.textContent=visible?state.cards[i]:'✦';tile.setAttribute('aria-label',visible?'Сон: '+state.cards[i]:'Открыть сон '+(i+1));tile.classList.toggle('matched',state.matched.has(i));tile.disabled=state.matched.has(i)||finished;tile.addEventListener('click',()=>flip(i));}
  else if(hero==='octopus'){tile.textContent=state.cells[i]?'⭐':'·';tile.classList.toggle('on',state.cells[i]);tile.setAttribute('aria-label','Звезда '+(i+1)+(state.cells[i]?' горит':' погашена'));tile.disabled=finished;tile.addEventListener('click',()=>light(i));}
  else if(i===state.player){tile.textContent=heroes[hero].emoji;tile.classList.add('player');if(hero==='worm')tile.classList.add('eye');if(hero==='fire'){tile.innerHTML=FIRE_DRAGON_SVG;tile.classList.toggle('flying',state.flying);}tile.setAttribute('aria-label',heroes[hero].name);}
  else if(state.walls.has(i)){tile.textContent=hero==='worm'?'⬛':'🌵';tile.setAttribute('aria-label','Непроходимое препятствие');}
  else if(state.lava?.has(i)){tile.textContent='🌋';tile.classList.add('lava');tile.setAttribute('aria-label','Лава — взлети, чтобы пересечь');}
  else if(state.rocks.has(i))tile.textContent='🪨'+(state.rockHp.get(i)>1?state.rockHp.get(i):'');
  else if(state.items.has(i))tile.textContent=hero==='fire'?'💎':hero==='worm'?'🌱':'🌰'+(state.budHp.get(i)>1?state.budHp.get(i):'');
  else if(state.bloom.has(i)){tile.textContent='🌼';tile.classList.add('flower');}
  b.append(tile);
 }
 $('#score').textContent=hero==='cloud'?'Пары: '+state.matched.size/2+' / '+state.cards.filter(card=>card!==null).length/2+' · Ошибки: '+state.mistakes+' / '+state.maxMistakes:hero==='octopus'?'Звёзды: '+state.cells.filter(Boolean).length+' / '+state.cells.length+' · Ходы: '+state.moves+' / '+state.maxMoves:(hero==='fire'?'Кристаллы: ':hero==='worm'?'Корни: ':'Цветы: ')+(state.target-state.items.size)+' / '+state.target;
 $('#fly').hidden=hero!=='fire';$('#fly').textContent=state.flying?'🪽 Приземлиться':'🪽 Взлететь';$('#fly').disabled=finished;
 if(hero==='octopus'){$('#controls').hidden=false;$('#controls').querySelectorAll('[data-dir]').forEach(el=>el.hidden=true);$('#power').textContent='💡 Подсказка ('+state.hints+')';$('#power').disabled=finished||!state.hints;}else{$('#controls').querySelectorAll('[data-dir]').forEach(el=>el.hidden=false);$('#power').disabled=finished;}
}
function move(dir){if(finished||!['worm','dragon','fire'].includes(hero))return;const offsets={up:-state.w,down:state.w,left:-1,right:1};state.dir=offsets[dir];const next=state.player+state.dir;
 if(next<0||next>=state.w*state.h||(dir==='left'&&state.player%state.w===0)||(dir==='right'&&state.player%state.w===state.w-1)){message('Край карты! Выбери другое направление.');return;}
 if(state.walls.has(next)){message('Этот путь закрыт. Ищи проход в лабиринте!');return;}
 if(hero==='fire'&&state.lava.has(next)&&!state.flying){message('🌋 Здесь лава! Нажми «Взлететь», чтобы пролететь над ней.');return;}
 if(state.rocks.has(next)){message('Камень преграждает путь. Нажми «🔥 Огонь»!');return;}
 state.player=next;state.moves++;if((hero==='worm'||hero==='fire')&&state.items.delete(next))message(hero==='fire'?'💎 Огненный кристалл найден!':'Хрум! Вкусный корень найден.');else message(hero==='fire'?'Лети над лавой, собирай 💎 и плавь камни огнём!':hero==='dragon'?'Рядом с бутоном нажми «Цветочное дыхание».':'Ищи корни 🌱 и разбивай камни!');render();if(!state.items.size)completeStage();
}
function power(){if(finished)return;if(hero==='octopus'){if(!state.hints){message('Подсказки закончились. Попробуй решить самостоятельно!');return;}state.hints--;const i=state.solution.values().next().value;render();message('💡 Нажми на звезду в строке '+(Math.floor(i/state.w)+1)+', столбце '+(i%state.w+1)+'.');return;}
 if(hero==='worm'||hero==='fire'){const p=state.player,d=state.dir,next=p+d;const valid=next>=0&&next<state.w*state.h&&!(d===-1&&p%state.w===0)&&!(d===1&&p%state.w===state.w-1);if(valid&&state.rocks.has(next)){const hp=state.rockHp.get(next)-1;state.rockHp.set(next,hp);if(!hp)state.rocks.delete(next);message(hp?'🔥 Крепкий камень! Осталось попаданий: '+hp:'🔥 Камень разбит! Путь свободен.');}else message('🔥 Повернись к соседнему камню, чтобы разбить его.');}
 if(hero==='dragon'){let count=0;neighbors(state.player,state.w,state.h).forEach(i=>{if(state.items.has(i)){const hp=state.budHp.get(i)-1;state.budHp.set(i,hp);if(!hp){state.items.delete(i);state.bloom.add(i);count++;}}});message(count?'🌼 Цветочное дыхание пробудило цветы: '+count+'!':'🌿 Подойди к бутону или подыши ещё раз: крепкие бутоны раскрываются не сразу.');}render();if(state.items&&!state.items.size)completeStage();
}
function flip(i){if(finished||state.cards[i]===null||state.matched.has(i)||state.opened.includes(i))return;if(state.opened.length===2)state.opened=[];state.opened.push(i);
 if(state.opened.length===2){state.moves++;const [a,b]=state.opened;if(state.cards[a]===state.cards[b]){state.matched.add(a);state.matched.add(b);state.opened=[];message('🌈 Пара снов найдена!');}else{state.mistakes++;message('Разные сны! Ошибки: '+state.mistakes+' / '+state.maxMistakes+'. Запомни карточки.');}}else message('Найди такой же сон!');render();if(state.matched.size===state.cards.filter(card=>card!==null).length)completeStage();else if(state.mistakes>=state.maxMistakes)lose('☁️ Сны разлетелись: закончились попытки.');}
function light(i){if(finished)return;neighbors(i,state.w,state.h).forEach(j=>state.cells[j]=!state.cells[j]);state.solution.has(i)?state.solution.delete(i):state.solution.add(i);state.moves++;message('🐙 Свет изменился! Зажги все звёзды.');render();if(state.cells.every(Boolean))completeStage();else if(state.moves>=state.maxMoves)lose('🌊 Ходы закончились.');}
for(const [id,h] of Object.entries(heroes)){const b=document.createElement('button');b.textContent=h.emoji+' '+h.name;b.dataset.hero=id;b.addEventListener('click',()=>selectHero(id));$('#heroes').append(b);}
for(let i=1;i<=100;i++){const option=document.createElement('option');option.value=i;option.textContent=i;$('#level').append(option);}
function selectHero(id){hero=id;level=1;document.querySelectorAll('[data-hero]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.hero===id)));try{history.replaceState(null,'','#'+id);}catch{}start();}
$('#level').addEventListener('change',()=>{level=Number($('#level').value);start();});$('#restart').addEventListener('click',()=>start(state.stage));$('#next').addEventListener('click',()=>{if(finished&&level<100){level++;start();}});$('#power').addEventListener('click',power);document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('click',()=>move(b.dataset.dir)));
$('#board').addEventListener('keydown',e=>{if(e.code==='KeyG'&&hero==='fire'){e.preventDefault();toggleFlight();return;}const dir={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key];if(['worm','dragon','fire'].includes(hero)&&(dir||e.code==='Space')){e.preventDefault();dir?move(dir):power();}});
function toggleFlight(){if(finished||hero!=='fire')return;if(state.flying&&state.lava.has(state.player)){message('Нельзя приземлиться в лаву. Сначала долети до земли!');return;}state.flying=!state.flying;render();message(state.flying?'🪽 Огнекрыл взлетел! Теперь можно пересекать лаву.':'Огнекрыл приземлился.');}
$('#fly').addEventListener('click',toggleFlight);
const requested=location.hash.slice(1);selectHero(heroes[requested]?requested:'worm');
