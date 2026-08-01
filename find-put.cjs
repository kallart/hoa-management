const fs = require('fs');
const content = fs.readFileSync('backend/src/server.ts', 'utf8');
const startIndex = content.indexOf("app.put('/api/properties/:id'");
if (startIndex !== -1) {
  fs.writeFileSync('server-put-route.txt', content.substring(startIndex, startIndex + 1000));
} else {
  fs.writeFileSync('server-put-route.txt', 'NOT FOUND');
}
