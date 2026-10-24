const crypto=require('crypto');
function createGame(level=1,teamSize=2,roles=null,solo=false){
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};let seed=level*7919;
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const w=20,h=20,floor=new Set([0]),stack=[0];
 while(stack.length){const p=stack.at(-1),x=p%w,y=Math.floor(p/w);const choices=shuffle([[2,0],[-2,0],[0,2],[0,-2]].filter(([dx,dy])=>x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&!floor.has(p+dx+dy*w)));if(!choices.length){stack.pop();continue;}const [dx,dy]=choices[0];floor.add(p+dx/2+dy*w/2);floor.add(p+dx+dy*w);stack.push(p+dx+dy*w);}
 const spots=shuffle([...floor].filter(i=>i!==0)),count=3+Math.floor(level/20);
 return{solo,level,w,h,walls:Array.from({length:w*h},(_,i)=>i).filter(i=>!floor.has(i)),roots:solo?[]:spots.slice(0,count),buds:solo?[]:spots.slice(count,count*2),rocks:spots.slice(count*2,count*2+5+Math.floor(level/10)),roles:roles||Array.from({length:teamSize},(_,i)=>i%2===0?'worm':'dragon'),teleportUsed:Array(teamSize).fill(false),notes:spots.slice(-4),health:Array(teamSize).fill(3),zombies:spots.filter(i=>i%w+Math.floor(i/w)>=6&&!spots.slice(count*2,count*2+5+Math.floor(level/10)).includes(i)).slice(0,9+Math.floor((level-1)/25)),lost:false,event:'',players:Array(teamSize).fill(0),directions:Array(teamSize).fill(1),won:false};
}
function nearby(p,w,h){return [p,...(p%w?[p-1]:[]),...(p%w<w-1?[p+1]:[]),...(p>=w?[p-w]:[]),...(p<w*(h-1)?[p+w]:[])];}
function act(game,slot,action,target){
 if(game.won||game.lost||game.health[slot]<=0)return game;game.event='';const role=game.roles[slot];const p=game.players[slot],offset={up:-game.w,down:game.w,left:-1,right:1}[action];
 if(action==='hit'){const range=nearby(p,game.w,game.h),before=game.zombies.length;game.zombies=game.zombies.filter(i=>!range.includes(i));game.event=before>game.zombies.length?'👊 Игрок '+(slot+1)+' прогнал зомби!':'👊 Зомби слишком далеко. Подойди к нему поближе.';}
 else if(action==='teleport'&&role==='vereti'&&!game.teleportUsed[slot]&&Number.isInteger(target)&&target>=0&&target<game.w*game.h&&!game.walls.includes(target)&&!game.rocks.includes(target)&&!game.players.includes(target)&&!game.zombies.includes(target)){game.players[slot]=target;game.teleportUsed[slot]=true;game.notes=game.notes.filter(i=>i!==target);}
 else if(offset){game.directions[slot]=offset;const next=p+offset;if(nearby(p,game.w,game.h).includes(next)&&!game.walls.includes(next)&&(!game.rocks.includes(next)||role==='vereti')){game.players[slot]=next;if(role==='vereti'){game.rocks=game.rocks.filter(i=>i!==next);game.notes=game.notes.filter(i=>i!==next);}if(role==='worm')game.roots=game.roots.filter(i=>i!==next);}}
 else if(action==='power'){
  if(role==='worm'){const next=p+game.directions[slot];if(nearby(p,game.w,game.h).includes(next))game.rocks=game.rocks.filter(i=>i!==next);}
  else if(role==='dragon')game.buds=game.buds.filter(i=>!nearby(p,game.w,game.h).includes(i));
 }
 game.won=game.solo?game.zombies.length===0:!game.roots.length&&!game.buds.length;return game;
}
module.exports={createGame,act,nearby};
function botStep(game){
 if(game.won||game.lost||game.health[1]<=0)return false;
 if(game.zombies.some(i=>nearby(game.players[1],game.w,game.h).includes(i))){act(game,1,'hit');return true;}
 if(!game.buds.length)return false;
 const start=game.players[1],around=nearby(start,game.w,game.h);
 if(game.buds.some(i=>around.includes(i))){act(game,1,'power');return true;}
 const queue=[start],prev=new Map([[start,null]]);let target;
 for(let q=0;q<queue.length;q++){
  const p=queue[q];if(game.buds.some(i=>nearby(p,game.w,game.h).includes(i))){target=p;break;}
  for(const i of nearby(p,game.w,game.h).slice(1))if(!prev.has(i)&&!game.walls.includes(i)&&!game.rocks.includes(i)){prev.set(i,p);queue.push(i);}
 }
 if(target===undefined)return false;
 let next=target;while(prev.get(next)!==start)next=prev.get(next);
 const d=next-start;act(game,1,d===1?'right':d===-1?'left':d===game.w?'down':'up');return true;
}
module.exports.botStep=botStep;

function stepZombies(game,active=game.players.map(()=>true)){
 if(game.won||game.lost)return false;
 let changed=false;const damaged=new Set();
 for(let z=0;z<game.zombies.length;z++){
  const start=game.zombies[z],queue=[start],prev=new Map([[start,null]]);let target, victim;
  for(let q=0;q<queue.length;q++){
   const p=queue[q],range=nearby(p,game.w,game.h);
   const slot=game.players.findIndex((pos,i)=>game.health[i]>0&&active[i]&&range.includes(pos));
   if(slot>=0){target=p;victim=slot;break;}
   for(const i of range.slice(1))if(!prev.has(i)&&!game.walls.includes(i)&&!game.rocks.includes(i)&&!game.zombies.some((other,index)=>index!==z&&other===i)){prev.set(i,p);queue.push(i);}
  }
  if(target===undefined)continue;
  if(target===start){if(!damaged.has(victim)){game.health[victim]=Math.max(0,game.health[victim]-1);damaged.add(victim);game.event='🧟 Зомби ударил игрока '+(victim+1)+'! Осталось жизней: '+game.health[victim]+'.';changed=true;}}
  else{let next=target;while(prev.get(next)!==start)next=prev.get(next);game.zombies[z]=next;changed=true;}
 }
 game.lost=game.health.every(h=>h===0);return changed;
}
module.exports.stepZombies=stepZombies;
