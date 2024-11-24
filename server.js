const WebSocket = require("ws");
const http = require("http");
const express = require("express");
const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let documentContent = ""; // Text dokumentu
const clients = {}; // Klienti a jejich kurzory

// Statické soubory (např. index.html)
app.use(express.static(__dirname));

// WebSocket logika
wss.on("connection", (ws) => {
  let userName = "Anonymous"; // Přednastavené jméno uživatele
  const userId = Date.now(); // Unikátní ID pro uživatele

  // Umožníme klientovi poslat jméno při připojení
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "setUserName") {
        userName = data.userName; // Nastavení uživatelského jména
        clients[userId] = { userName, cursor: { x: 0, y: 0 }, ws: ws };
        ws.send(
          JSON.stringify({
            type: "init",
            content: documentContent,
            users: Object.keys(clients).map(id => clients[id].userName),
          })
        );
      }

      if (data.type === "textUpdate") {
        documentContent = data.content; // Aktualizace obsahu dokumentu
        broadcast({ type: "textUpdate", content: documentContent }, ws);
      } else if (data.type === "cursorMove") {
        clients[userId].cursor = data.cursor; // Aktualizace pozice kurzoru
        broadcast({ type: "cursorUpdate", userId, cursor: data.cursor }, ws);
      }
    } catch (err) {
      console.error("Chyba při zpracování zprávy:", err);
    }
  });

  // Při odpojení klienta
  ws.on("close", () => {
    delete clients[userId];
    broadcast({ type: "userDisconnect", userId });
  });
});

// Funkce pro vysílání zpráv všem klientům kromě odesílatele
function broadcast(data, excludeWs) {
  wss.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Spuštění serveru
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server běží na http://0.0.0.0:${PORT}`);
});
