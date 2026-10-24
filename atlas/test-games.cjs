const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/games.js','utf8');
const pure=source.slice(source.indexOf('const heroes='),source.indexOf('let hero='))+source.slice(source.indexOf('function rng('),source.indexOf('function completeStage('));
const ctx={structuredClone};vm.createContext(ctx);vm.runInContext(pure+';globalThis.api={makeLevel,neighbors};',ctx);const {makeLevel,neighbors}=ctx.api;
for(const id of ['worm','dragon','cloud','octopus']){
 const seen=new Set();for(let n=1;n<=100;n++)for(let stage=1;stage<=8;stage++){
  const g=makeLevel(id,n,stage),sorted=set=>[...set].sort((a,b)=>a-b);
  const fingerprint=JSON.stringify(id==='cloud'?[g.w,g.h,g.cards]:id==='octopus'?[g.w,g.h,g.cells]:[g.w,g.h,sorted(g.walls),sorted(g.items),sorted(g.rocks)]);
  assert(!seen.has(fingerprint),'Duplicate '+id+' '+n+' '+stage);seen.add(fingerprint);
 }
}
console.log('PASS: all 800 layouts per game are unique; 3,200 unique challenges total.');
for(const hero of ['worm','dragon','cloud','octopus'])for(let n=1;n<=100;n++)for(let stage=1;stage<=8;stage++){
 const g=makeLevel(hero,n,stage);assert.equal(g.stage,stage);if(n===100){assert.equal(g.w,11);assert.equal(g.h,11);}
 if(hero==='cloud'){const counts=new Map();for(const card of g.cards)if(card!==null)counts.set(card,(counts.get(card)||0)+1);assert([...counts.values()].every(n=>n===2));if(n===100){assert.equal(counts.size,60);assert.equal(g.cards.length,121);assert.equal(g.cards.filter(x=>x===null).length,1);}}
 else if(hero==='octopus'){for(const i of g.solution)neighbors(i,g.w,g.h).forEach(j=>g.cells[j]=!g.cells[j]);assert(g.cells.every(Boolean));}
 else{const seen=new Set([0]),queue=[0];for(let i=0;i<queue.length;i++)for(const next of neighbors(queue[i],g.w,g.h).slice(1))if(!g.walls.has(next)&&!seen.has(next)){seen.add(next);queue.push(next);}for(const item of g.items)assert(seen.has(item));}
}
console.log('PASS: all 3,200 stages valid and solvable; all final fields 11x11; final memory has 60 pairs and one non-playing stone.');
function element(tag){return {tag,style:{},options:[],dataset:{},classList:{add(){},toggle(){}},append(el){if(el.tag==='option')this.options.push(el)},replaceChildren(){},setAttribute(){},addEventListener(){},querySelectorAll(){return []}};}
const els=new Map();const document={querySelector(s){if(!els.has(s))els.set(s,element());return els.get(s)},querySelectorAll(){return []},createElement:element};
const mock={structuredClone,document,location:{hash:'#worm'},history:{replaceState(){}},localStorage:{getItem(){return '{}'},setItem(){}}};vm.createContext(mock);
vm.runInContext(source+`
for(const id of Object.keys(heroes))for(let n=1;n<=100;n++){
 hero=id;level=n;start();
 for(let stage=1;stage<=8;stage++){
  if(state.stage!==stage||finished)throw Error('Premature stage transition');
  if(id==='cloud'){
   const pairs={};state.cards.forEach((symbol,i)=>{if(symbol!==null)(pairs[symbol]??=[]).push(i)});for(const [a,b] of Object.values(pairs)){flip(a);flip(b);}
  }else if(id==='octopus'){
   for(const i of [...state.solution]){light(i);if(finished||state.stage!==stage)break;}
  }else{
   let guard=0;
   while(!finished&&state.stage===stage){
    if(++guard>2000)throw Error('Ground loop');const target=state.items.values().next().value;
    const queue=[state.player],prev=new Map([[state.player,null]]);
    for(let q=0;q<queue.length;q++)for(const next of neighbors(queue[q],state.w,state.h).slice(1))if(!state.walls.has(next)&&!prev.has(next)){prev.set(next,queue[q]);queue.push(next);}
    const route=[];for(let at=target;at!==state.player;at=prev.get(at))route.unshift(at);
    for(const next of route){const d=next-state.player,dir=d===1?'right':d===-1?'left':d===state.w?'down':'up';move(dir);while(!finished&&state.stage===stage&&state.player!==next){power();move(dir);}if(finished||state.stage!==stage)break;}
    if(id==='dragon')while(!finished&&state.stage===stage&&state.items.has(target))power();
   }
  }
  if(stage<8){if(finished||state.stage!==stage+1||!document.querySelector('#next').disabled)throw Error('Next level unlocked before eight trials');}
 }
 if(!finished||!completed[id+':'+n])throw Error('No final victory '+id+' '+n);
}
`,mock);
console.log('PASS: played all 3,200 stages through real game actions; level completion only after stage eight.');
