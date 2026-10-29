// Compatibility entry point for the existing free Render service.
const {createServer}=require('../../racing/multiplayer/server.cjs');
const server=createServer();server.listen(Number(process.env.PORT)||10000,'0.0.0.0');
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
