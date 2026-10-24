const assert=require('node:assert/strict');const {createGame,act,nearby}=require(__dirname+'/engine.cjs');
for(let n=1;n<=100;n++){
 const g=createGame(n);const moveTo=(target,slot)=>{const seen=new Map([[g.players[slot],null]]),queue=[g.players[slot]];for(let q=0;q<queue.length;q++)for(const i of nearby(queue[q],g.w,g.h).slice(1)){if(!g.walls.includes(i)&&!seen.has(i)){seen.set(i,queue[q]);queue.push(i);}}assert(seen.has(target));const path=[];for(let i=target;i!==g.players[slot];i=seen.get(i))path.unshift(i);for(const i of path){const d=i-g.players[slot],dir=d===1?'right':d===-1?'left':d===g.w?'down':'up';act(g,slot,dir);if(g.players[slot]!==i){assert.equal(slot,0);act(g,slot,'power');act(g,slot,dir);}assert.equal(g.players[slot],i);}};
 // Worm clears every rock, then collects roots; dragon completes the shared objective.
 for(const rock of [...g.rocks])moveTo(rock,0);for(const root of [...g.roots])moveTo(root,0);assert.equal(g.won,false);
 for(const bud of [...g.buds]){if(!g.buds.includes(bud))continue;moveTo(bud,1);act(g,1,'power');}assert(g.won);
}
console.log('PASS: all 100 co-op mazes reachable and winnable only through both heroes.');
const {botStep}=require(__dirname+'/engine.cjs');
for(let n=1;n<=100;n++){
 const g=createGame(n);g.rocks=[];g.roots=[];let steps=0;
 while(!g.won&&steps++<10000)botStep(g);
 assert(g.won,'Bot must finish buds on level '+n);
}
console.log('PASS: bot finds and opens every bud across all 100 mazes.');
{
 const g=createGame(1,3,['worm','dragon','vereti']);g.walls=[];g.rocks=[1];g.notes=[1,3];g.roots=[40];g.buds=[41];
 act(g,2,'right');assert.equal(g.players[2],1);assert(!g.rocks.includes(1));assert(!g.notes.includes(1));
 g.walls=[2];act(g,2,'teleport',2);assert(!g.teleportUsed[2]);act(g,2,'teleport',0);assert(!g.teleportUsed[2]);
 act(g,0,'teleport',3);assert.equal(g.players[0],0);
 act(g,2,'teleport',3);assert.equal(g.players[2],3);assert(g.teleportUsed[2]);assert(!g.notes.includes(3));
 act(g,2,'teleport',4);assert.equal(g.players[2],3);g.roles[2]='worm';g.roles[2]='vereti';act(g,2,'teleport',4);assert.equal(g.players[2],3);
 const next=createGame(2,3,g.roles);assert(!next.teleportUsed[2]);assert.equal(next.roles[2],'vereti');
 console.log('PASS: Vereti eats rocks and notes; teleport rejects occupied cells, works once, survives role switches and resets on the next level.');
}
{
 const {stepZombies}=require(__dirname+'/engine.cjs');
 const g=createGame(1,2);g.walls=[];g.rocks=[];g.players=[0,62];g.zombies=[1,9];
 assert.deepEqual(g.health,[3,3]);stepZombies(g);assert.equal(g.health[0],2,'Two zombies cause at most one damage per tick');
 stepZombies(g);stepZombies(g);assert.equal(g.health[0],0);act(g,0,'right');assert.equal(g.players[0],0,'Downed player cannot move');
 g.players[1]=1;g.zombies=[2];g.health[1]=3;act(g,1,'hit');assert.equal(g.zombies.length,0,'Adjacent punch defeats zombie');
 g.zombies=[60];act(g,1,'hit');assert.equal(g.zombies.length,1,'Punch cannot reach distant zombie');
 const previous=g.zombies[0];stepZombies(g);assert.notEqual(g.zombies[0],previous,'Zombie follows living player');
 g.zombies=[2];g.players[1]=1;g.health[1]=1;stepZombies(g);assert(g.lost,'All players down ends level');
 const reset=createGame(1,2,g.roles);assert.deepEqual(reset.health,[3,3]);assert(!reset.lost);
 const blocked=createGame(1,1);blocked.players=[0];blocked.walls=[1,9];blocked.rocks=[];blocked.zombies=[2];const hp=blocked.health[0];stepZombies(blocked);assert.equal(blocked.health[0],hp,'Cannot attack through walls');
 console.log('PASS: three lives, damage cap, pursuit, walls, nearby punch, downed players, team defeat and reset.');
}
{
 for(let level=1;level<=100;level++){
  const g=createGame(level,1,null,true);assert(g.solo);assert.equal(g.health[0],3);assert(g.zombies.length>0);
  act(g,0,'power');assert(!g.won,'Solo requires defeating zombies, not empty team objectives');
  for(const target of [...g.zombies]){
   if(!g.zombies.includes(target))continue;
   const queue=[g.players[0]],prev=new Map([[g.players[0],null]]);
   for(let q=0;q<queue.length;q++)for(const p of nearby(queue[q],g.w,g.h).slice(1))if(!g.walls.includes(p)&&!prev.has(p)){prev.set(p,queue[q]);queue.push(p);}
   assert(prev.has(target));const route=[];for(let p=target;p!==g.players[0];p=prev.get(p))route.unshift(p);
   for(const p of route){const d=p-g.players[0],dir=d===1?'right':d===-1?'left':d===g.w?'down':'up';act(g,0,dir);if(g.players[0]!==p){act(g,0,'power');act(g,0,dir);}}
   act(g,0,'hit');
  }
  assert(g.won,'Solo map '+level+' is completable');
 }
 console.log('PASS: 100 solo levels; three lives; movement without allies; victory requires defeating all zombies.');
}
{
 const totals=new Set();
 for(const solo of [false,true])for(let level=1;level<=100;level++){
  const g=createGame(level,3,null,solo);assert.equal(g.w,20);assert.equal(g.h,20);
  assert(g.zombies.length>=9&&g.zombies.length<=12);totals.add(g.zombies.length);
  assert.equal(new Set(g.zombies).size,g.zombies.length);
  for(const p of g.zombies){assert(p>=0&&p<400);assert(!g.walls.includes(p));assert(!g.rocks.includes(p));assert(!g.players.includes(p));}
 }
 assert.deepEqual([...totals].sort((a,b)=>a-b),[9,10,11,12]);
 const g=createGame(1,1,null,true);g.walls=[];g.rocks=[];g.players[0]=19;act(g,0,'right');assert.equal(g.players[0],19,'No horizontal row wrapping on a 20-wide board');act(g,0,'down');assert.equal(g.players[0],39);
 console.log('PASS: 20x20 maps, 9–12 distinct accessible zombies across 100 solo and team levels, and correct movement boundaries.');
}
