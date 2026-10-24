const crypto=require('crypto');
function createGame(level=1){
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};let seed=level*7919;
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const w=9,h=7,floor=new Set([0]),stack=[0];
 while(stack.length){const p=stack.at(-1),x=p%w,y=Math.floor(p/w);const choices=shuffle([[2,0],[-2,0],[0,2],[0,-2]].filter(([dx,dy])=>x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&!floor.has(p+dx+dy*w)));if(!choices.length){stack.pop();continue;}const [dx,dy]=choices[0];floor.add(p+dx/2+dy*w/2);floor.add(p+dx+dy*w);stack.push(p+dx+dy*w);}
 const spots=shuffle([...floor].filter(i=>i!==0)),count=3+Math.floor(level/20);
 return{level,w,h,walls:Array.from({length:w*h},(_,i)=>i).filter(i=>!floor.has(i)),roots:spots.slice(0,count),buds:spots.slice(count,count*2),rocks:spots.slice(count*2,count*2+5+Math.floor(level/10)),players:[0,0],directions:[1,1],won:false};
}
function nearby(p,w,h){return [p,...(p%w?[p-1]:[]),...(p%w<w-1?[p+1]:[]),...(p>=w?[p-w]:[]),...(p<w*(h-1)?[p+w]:[])];}
function act(game,slot,action){
 if(game.won)return game;const p=game.players[slot],offset={up:-game.w,down:game.w,left:-1,right:1}[action];
 if(offset){game.directions[slot]=offset;const next=p+offset;if(nearby(p,game.w,game.h).includes(next)&&!game.walls.includes(next)&&!game.rocks.includes(next)){game.players[slot]=next;if(slot===0)game.roots=game.roots.filter(i=>i!==next);}}
 else if(action==='power'){
  if(slot===0){const next=p+game.directions[slot];if(nearby(p,game.w,game.h).includes(next))game.rocks=game.rocks.filter(i=>i!==next);}
  else game.buds=game.buds.filter(i=>!nearby(p,game.w,game.h).includes(i));
 }
 game.won=!game.roots.length&&!game.buds.length;return game;
}
module.exports={createGame,act,nearby};
