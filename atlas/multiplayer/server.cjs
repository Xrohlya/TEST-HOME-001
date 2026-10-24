const http=require('http'),crypto=require('crypto');const {createGame,act,botStep}=require('./engine.cjs');
const rooms=new Map(),limits=new Map();const origin='https://xrohlya.github.io';
function token(){return crypto.randomBytes(24).toString('hex');}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST,GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
const server=http.createServer(async(req,res)=>{
 if(req.method==='OPTIONS')return send(res,204,{});
 if(req.url==='/health'&&req.method==='GET')return send(res,200,{ok:true});
 if(req.method!=='POST'||req.url!=='/api')return send(res,404,{error:'Страница не найдена'});
 if(req.headers.origin&&req.headers.origin!==origin&&process.env.ALLOW_LOCAL!=='1')return send(res,403,{error:'Источник не разрешён'});
 const ip=req.socket.remoteAddress;let rate=limits.get(ip);if(!rate||Date.now()-rate.since>1000){rate={since:Date.now(),count:0};limits.set(ip,rate);}if(++rate.count>100)return send(res,429,{error:'Слишком много запросов. Подожди немного.'});
 try{
 let body='';for await(const chunk of req){body+=chunk;if(body.length>2048)return send(res,413,{error:'Слишком большой запрос'});}const data=JSON.parse(body);
 if(data.type==='create'){
  if(rooms.size>=500)return send(res,503,{error:'Все комнаты заняты. Попробуй позже.'});
  let code;do{code=crypto.randomBytes(4).toString('hex').toUpperCase();}while(rooms.has(code));
  const auth=token();rooms.set(code,{tokens:[auth],seen:[Date.now()],updated:Date.now(),version:0,game:createGame(1,1)});return send(res,200,{code,token:auth,slot:0});
 }
 const code=String(data.code||'').toUpperCase(),room=rooms.get(code);if(!room)return send(res,404,{error:'Комната не найдена или закрылась. Создай новую.'});
 if(data.type==='join'){const auth=token(),slot=room.tokens.length;room.tokens.push(auth);room.seen.push(Date.now());room.game.players.push(0);room.game.directions.push(1);room.updated=Date.now();room.version++;return send(res,200,{code,token:auth,slot});}
 const slot=room.tokens.indexOf(data.token);if(slot<0||!data.token)return send(res,403,{error:'Войди в комнату снова.'});room.seen[slot]=Date.now();room.updated=Date.now();
 if(data.type==='bot'){
  if(slot!==0)return send(res,403,{error:'Бота может позвать создатель комнаты.'});
  if(room.tokens.length>1)return send(res,409,{error:'Союзник уже в комнате.'});
  room.tokens[1]='bot:'+token();room.game.players.push(0);room.game.directions.push(1);room.seen.push(Date.now());room.bot=true;room.version++;
 }else if(data.type==='move'){
  if(!room.tokens[1])return send(res,409,{error:'Сначала дождись второго игрока.'});
  if(!['up','down','left','right','power'].includes(data.action))return send(res,400,{error:'Неизвестное действие'});
  act(room.game,slot,data.action);room.version++;
 }else if(data.type==='next'){
  if(room.game.won&&room.game.level<100){room.game=createGame(room.game.level+1,room.tokens.length);room.version++;}
 }else if(data.type!=='state')return send(res,400,{error:'Неизвестный запрос'});
 if(room.bot){room.seen[1]=Date.now();if(botStep(room.game))room.version++;}
 return send(res,200,{bot:!!room.bot,game:room.game,version:room.version,partner:room.tokens.length>1,teamSize:room.tokens.length,online:room.seen.map(t=>Date.now()-t<15000)});
 }catch{return send(res,400,{error:'Не удалось прочитать запрос'});}
});
const cleanup=setInterval(()=>{for(const [code,r] of rooms)if(Date.now()-r.updated>30*60*1000)rooms.delete(code);limits.clear();},60000);cleanup.unref();
server.listen(Number(process.env.PORT)||10000,'0.0.0.0');process.on('SIGTERM',()=>{clearInterval(cleanup);server.close(()=>process.exit(0));});
