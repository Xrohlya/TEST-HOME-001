'use strict';
const $=s=>document.querySelector(s);
const heroes={worm:{name:'Землерой',emoji:'🪱',title:'Землерой ищет корни',world:'ПОДЗЕМНЫЕ ТОННЕЛИ',help:'Собери все корни 🌱. Подойди к камню, повернись к нему и нажми «🔥 Огонь». Стрелки — движение, пробел — способность.',power:'🔥 Огонь'},dragon:{name:'Мохопых',emoji:'🐉',title:'Мохопых будит сад',world:'ВОЛШЕБНЫЙ ЛЕС',help:'Разбуди все бутоны 🌰! Подойди к ним и нажми «🌼 Цветочное дыхание»: оно превращает все соседние бутоны в цветы. Стрелки — движение, пробел — способность.',power:'🌼 Цветочное дыхание'},cloud:{name:'Облакрыл',emoji:'🦄',title:'Облакрыл собирает сны',world:'ОБЛАЧНАЯ ПАМЯТЬ',help:'Находи одинаковые сны: открой две карточки. Совпавшая пара останется открытой. Если они разные, запомни их и открой следующую карточку.'},octopus:{name:'Булькозвёзд',emoji:'🐙',title:'Булькозвёзд зажигает звёзды',world:'ЛУННОЕ ОЗЕРО',help:'Зажги все подводные звёзды ⭐. Нажатие меняет свет выбранной клетки и её соседей сверху, снизу, слева и справа. «💡 Подсказка» покажет полезный ход.'}};
let hero='worm',level=1,state,finished=false,completed={};
try{completed=JSON.parse(localStorage.getItem('atlas-games-v1')||'{}')||{};if(typeof completed!=='object'||Array.isArray(completed))completed={};}catch{}
function rng(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function shuffle(items,random){for(let i=items.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}
function neighbors(i,w,h){return [i,...(i%w?[i-1]:[]),...(i%w<w-1?[i+1]:[]),...(i>=w?[i-w]:[]),...(i<w*(h-1)?[i+w]:[])];}
function makeLevel(id,n){
 const random=rng(n*7919+Object.keys(heroes).indexOf(id)*104729),w=9,h=7;
 if(id==='worm'||id==='dragon'){
  const spots=shuffle(Array.from({length:w*h-1},(_,i)=>i+1),random),count=4+Math.floor(n/10);
  return{w,h,player:0,dir:1,items:new Set(spots.slice(0,count)),rocks:new Set(id==='worm'?spots.slice(count,count+8+Math.floor(n/4)):[]),bloom:new Set(),target:count,moves:0};
 }
 if(id==='cloud'){
  const count=4+Math.floor((n-1)/20),symbols=shuffle(['🌙','⭐','🌈','☁️','🪐','💎','🎈','🦋','🌸','🍀','☀️','❄️'],random).slice(0,count);
  return{w:4,h:Math.ceil(count*2/4),cards:shuffle([...symbols,...symbols],random),opened:[],matched:new Set(),moves:0};
 }
 const size=3+Math.floor((n-1)/34),cells=Array(size*size).fill(true),solution=new Set();
 for(const i of shuffle(Array.from({length:cells.length},(_,i)=>i),random).slice(0,2+Math.floor(n/7))){neighbors(i,size,size).forEach(j=>cells[j]=!cells[j]);solution.add(i);}
 if(cells.every(Boolean)){neighbors(0,size,size).forEach(j=>cells[j]=!cells[j]);solution.has(0)?solution.delete(0):solution.add(0);}
 return{w:size,h:size,cells,solution,moves:0};
}
function message(text){$('#status').textContent=text;}
function saveWin(){if(finished)return;finished=true;completed[hero+':'+level]=true;try{localStorage.setItem('atlas-games-v1',JSON.stringify(completed));}catch{}$('#next').disabled=level===100;message(level===100?'🏆 Уровень 100 пройден! Можно выбрать другого героя или вернуться к другим уровням.':'🎉 Уровень пройден! Переходи к следующему.');updateProgress();}
function updateProgress(){const count=Array.from({length:100},(_,i)=>completed[hero+':'+(i+1)]).filter(Boolean).length;$('#progress').textContent='Уровень '+level+' / 100 · Пройдено: '+count;for(const option of $('#level').options)option.textContent=option.value+(completed[hero+':'+option.value]?' ✓':'');}
function start(){state=makeLevel(hero,level);finished=false;$('#title').textContent=heroes[hero].title;$('#world').textContent=heroes[hero].world;$('#instructions').textContent=heroes[hero].help;$('#controls').hidden=hero==='cloud'||hero==='octopus';$('#power').textContent=heroes[hero].power||'';$('#next').disabled=true;$('#level').value=level;message('Уровень '+level+'. Приключение начинается!');updateProgress();render();}
function render(){
 const b=$('#board');b.replaceChildren();b.style.gridTemplateColumns='repeat('+state.w+',1fr)';b.className=hero==='cloud'?'memory':hero==='octopus'?'lights':'';
 const total=hero==='cloud'?state.cards.length:state.w*state.h;
 for(let i=0;i<total;i++){
  const tile=document.createElement(hero==='cloud'||hero==='octopus'?'button':'div');tile.className='tile';
  if(hero==='cloud'){const visible=state.opened.includes(i)||state.matched.has(i);tile.textContent=visible?state.cards[i]:'✦';tile.setAttribute('aria-label',visible?'Сон: '+state.cards[i]:'Открыть сон '+(i+1));tile.classList.toggle('matched',state.matched.has(i));tile.disabled=state.matched.has(i)||finished;tile.addEventListener('click',()=>flip(i));}
  else if(hero==='octopus'){tile.textContent=state.cells[i]?'⭐':'·';tile.classList.toggle('on',state.cells[i]);tile.setAttribute('aria-label','Звезда '+(i+1)+(state.cells[i]?' горит':' погашена'));tile.disabled=finished;tile.addEventListener('click',()=>light(i));}
  else if(i===state.player){tile.textContent=heroes[hero].emoji;tile.classList.add('player');if(hero==='worm')tile.classList.add('eye');tile.setAttribute('aria-label',heroes[hero].name);}
  else if(state.rocks.has(i))tile.textContent='🪨';
  else if(state.items.has(i))tile.textContent=hero==='worm'?'🌱':'🌰';
  else if(state.bloom.has(i)){tile.textContent='🌼';tile.classList.add('flower');}
  b.append(tile);
 }
 $('#score').textContent=hero==='cloud'?'Пары: '+state.matched.size/2+' / '+state.cards.length/2:hero==='octopus'?'Звёзды: '+state.cells.filter(Boolean).length+' / '+state.cells.length:(hero==='worm'?'Корни: ':'Цветы: ')+(state.target-state.items.size)+' / '+state.target;
 if(hero==='octopus'){$('#controls').hidden=false;$('#controls').querySelectorAll('[data-dir]').forEach(el=>el.hidden=true);$('#power').textContent='💡 Подсказка';}else $('#controls').querySelectorAll('[data-dir]').forEach(el=>el.hidden=false);
}
function move(dir){if(finished||!['worm','dragon'].includes(hero))return;const offsets={up:-state.w,down:state.w,left:-1,right:1};state.dir=offsets[dir];const next=state.player+state.dir;
 if(next<0||next>=state.w*state.h||(dir==='left'&&state.player%state.w===0)||(dir==='right'&&state.player%state.w===state.w-1)){message('Край карты! Выбери другое направление.');return;}
 if(state.rocks.has(next)){message('Камень преграждает путь. Нажми «🔥 Огонь»!');return;}
 state.player=next;state.moves++;if(hero==='worm'&&state.items.delete(next))message('Хрум! Вкусный корень найден.');else message(hero==='dragon'?'Рядом с бутоном нажми «Цветочное дыхание».':'Ищи корни 🌱 и разбивай камни!');render();if(!state.items.size)saveWin();
}
function power(){if(finished)return;if(hero==='octopus'){const i=state.solution.values().next().value;message('💡 Нажми на звезду в строке '+(Math.floor(i/state.w)+1)+', столбце '+(i%state.w+1)+'.');return;}
 if(hero==='worm'){const p=state.player,d=state.dir,next=p+d;const valid=next>=0&&next<state.w*state.h&&!(d===-1&&p%state.w===0)&&!(d===1&&p%state.w===state.w-1);message(valid&&state.rocks.delete(next)?'🔥 Камень разбит! Путь свободен.':'🔥 Повернись к соседнему камню, чтобы разбить его.');}
 if(hero==='dragon'){let count=0;neighbors(state.player,state.w,state.h).forEach(i=>{if(state.items.delete(i)){state.bloom.add(i);count++;}});message(count?'🌼 Цветочное дыхание пробудило цветы: '+count+'!':'Подойди поближе к бутону 🌰.');}render();if(state.items&&!state.items.size)saveWin();
}
function flip(i){if(finished||state.matched.has(i)||state.opened.includes(i))return;if(state.opened.length===2)state.opened=[];state.opened.push(i);
 if(state.opened.length===2){state.moves++;const [a,b]=state.opened;if(state.cards[a]===state.cards[b]){state.matched.add(a);state.matched.add(b);state.opened=[];message('🌈 Пара снов найдена!');}else message('Запомни эти сны и открой следующую карточку.');}else message('Найди такой же сон!');render();if(state.matched.size===state.cards.length)saveWin();}
function light(i){if(finished)return;neighbors(i,state.w,state.h).forEach(j=>state.cells[j]=!state.cells[j]);state.solution.has(i)?state.solution.delete(i):state.solution.add(i);state.moves++;message('🐙 Свет изменился! Зажги все звёзды.');render();if(state.cells.every(Boolean))saveWin();}
for(const [id,h] of Object.entries(heroes)){const b=document.createElement('button');b.textContent=h.emoji+' '+h.name;b.dataset.hero=id;b.addEventListener('click',()=>selectHero(id));$('#heroes').append(b);}
for(let i=1;i<=100;i++){const option=document.createElement('option');option.value=i;option.textContent=i;$('#level').append(option);}
function selectHero(id){hero=id;level=1;document.querySelectorAll('[data-hero]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.hero===id)));try{history.replaceState(null,'','#'+id);}catch{}start();}
$('#level').addEventListener('change',()=>{level=Number($('#level').value);start();});$('#restart').addEventListener('click',start);$('#next').addEventListener('click',()=>{if(finished&&level<100){level++;start();}});$('#power').addEventListener('click',power);document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('click',()=>move(b.dataset.dir)));
$('#board').addEventListener('keydown',e=>{const dir={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key];if(['worm','dragon'].includes(hero)&&(dir||e.code==='Space')){e.preventDefault();dir?move(dir):power();}});
const requested=location.hash.slice(1);selectHero(heroes[requested]?requested:'worm');
