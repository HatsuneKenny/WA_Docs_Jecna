const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let documentContent = ""; // Sdílený text dokumentu
let clients = {}; // Ukládá data o připojených uživatelích

wss.on("connection", (ws) => {
  // Připojení nového uživatele
  const userId = Date.now(); // Jednoduché ID
  clients[userId] = { cursor: { x: 0, y: 0 } };
  
  // Poslat počáteční stav dokumentu a seznam uživatelů
  ws.send(JSON.stringify({ type: "init", content: documentContent, users: Object.keys(clients) }));

  // Zprávy od klienta
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    
    switch (data.type) {
      case "textUpdate":
        documentContent = data.content;
        broadcast({ type: "textUpdate", content: documentContent });
        break;

      case "cursorMove":
        clients[userId].cursor = data.cursor;
        broadcast({ type: "cursorUpdate", userId, cursor: data.cursor });
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  });

  // Odpojení uživatele
  ws.on("close", () => {
    delete clients[userId];
    broadcast({ type: "userDisconnect", userId });
  });
});

// Rozesílání zpráv všem klientům
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

app.use(express.static("public"));

server.listen(8080, () => {
  console.log("Server běží na http://0.0.0.0:8080");
});
