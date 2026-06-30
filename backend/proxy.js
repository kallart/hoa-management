const net = require('net');

const LOCAL_PORT = 54322;
const REMOTE_HOST = 'db.aitnaalqfpzbggbcsqqc.supabase.co';
const REMOTE_PORT = 5432;

const server = net.createServer((localSocket) => {
  const remoteSocket = new net.Socket();
  
  remoteSocket.connect(REMOTE_PORT, REMOTE_HOST, () => {
    localSocket.pipe(remoteSocket);
    remoteSocket.pipe(localSocket);
  });

  localSocket.on('error', (err) => console.error('Local error:', err));
  remoteSocket.on('error', (err) => console.error('Remote error:', err));
});

server.listen(LOCAL_PORT, () => {
  console.log(`TCP proxy running on 127.0.0.1:${LOCAL_PORT}`);
});
