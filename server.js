const WebSocket = require("ws");
const http = require("http");
const express = require("express");
const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let documentContent = ""; // Text dokumentu
const clients = {}; // Klienti a jejich kurzory

const userNames = ["BigBoy", "LittlePookie", "CoolCat", "SmartCookie", "FastFingers"]; // Přednastavená jména
let userIndex = 0; // Index pro přiřazování jmen

// Statické soubory (např. index.html)
app.use(express.static(__dirname));

// WebSocket logika
wss.on("connection", (ws) => {
  const userId = Date.now(); // Unikátní ID pro uživatele
  const userName = userNames[userIndex % userNames.length]; // Přiřadí jméno z pole
  userIndex++; // Zvyšuje index pro dalšího uživatele

  console.log(`Uživatel připojen: ${userName}`);
  clients[userId] = { userName, cursor: { x: 0, y: 0 }, ws: ws };

  // Poslat počáteční data klientovi
  ws.send(
    JSON.stringify({
      type: "init",
      content: documentContent,
      users: Object.values(clients).map(client => client.userName), // Seznam připojených uživatelů s jmény
    })
  );

  // Příjem zpráv od klienta
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "textUpdate") {
        documentContent = data.content; // Aktualizace obsahu dokumentu
        broadcast({ type: "textUpdate", content: documentContent }, ws);
      } else if (data.type === "cursorMove") {
        clients[userId].cursor = data.cursor; // Aktualizace pozice kurzoru
        broadcast(
          { type: "cursorUpdate", userId, cursor: data.cursor },
          ws
        );
      }
    } catch (err) {
      console.error("Chyba při zpracování zprávy:", err);
    }
  });

  // Při odpojení klienta
  ws.on("close", () => {
    console.log(`Uživatel odpojen: ${userName}`);
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
