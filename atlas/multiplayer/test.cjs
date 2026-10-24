const assert=require('node:assert/strict');const {createGame,act,nearby}=require(__dirname+'/engine.cjs');
for(let n=1;n<=100;n++){
 const g=createGame(n);const moveTo=(target,slot)=>{const seen=new Map([[g.players[slot],null]]),queue=[g.players[slot]];for(let q=0;q<queue.length;q++)for(const i of nearby(queue[q],9,7).slice(1)){if(!g.walls.includes(i)&&!seen.has(i)){seen.set(i,queue[q]);queue.push(i);}}assert(seen.has(target));const path=[];for(let i=target;i!==g.players[slot];i=seen.get(i))path.unshift(i);for(const i of path){const d=i-g.players[slot],dir=d===1?'right':d===-1?'left':d===9?'down':'up';act(g,slot,dir);if(g.players[slot]!==i){assert.equal(slot,0);act(g,slot,'power');act(g,slot,dir);}assert.equal(g.players[slot],i);}};
 // Worm clears every rock, then collects roots; dragon completes the shared objective.
 for(const rock of [...g.rocks])moveTo(rock,0);for(const root of [...g.roots])moveTo(root,0);assert.equal(g.won,false);
 for(const bud of [...g.buds]){if(!g.buds.includes(bud))continue;moveTo(bud,1);act(g,1,'power');}assert(g.won);
}
console.log('PASS: all 100 co-op mazes reachable and winnable only through both heroes.');
const {botStep}=require(__dirname+'/engine.cjs');
for(let n=1;n<=100;n++){
 const g=createGame(n);g.rocks=[];g.roots=[];let steps=0;
 while(!g.won&&steps++<1000)botStep(g);
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
