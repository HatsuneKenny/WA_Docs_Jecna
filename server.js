const express = require("express");
const { WebSocketServer } = require("ws");

const app = express();
const PORT = 8080;

// Statické soubory (klientská část)
app.use(express.static("public"));

// WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Uchovávání uživatelů a dat
let clients = {};
let documentText = "";

// Připojení klientů
wss.on("connection", (ws, req) => {
    const userId = Date.now();
    clients[userId] = ws;

    console.log(`Uživatel připojen: ${userId}`);

    // Odeslání aktuálního stavu dokumentu
    ws.send(JSON.stringify({ type: "init", text: documentText, users: Object.keys(clients) }));

    // Zpracování zpráv od klientů
    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.type === "text-update") {
            documentText = data.text;
            // Distribuce změn všem klientům
            Object.values(clients).forEach(client => {
                client.send(JSON.stringify({ type: "text-update", text: documentText }));
            });
        }

        if (data.type === "cursor-update") {
            Object.values(clients).forEach(client => {
                client.send(JSON.stringify({ type: "cursor-update", userId, cursor: data.cursor }));
            });
        }
    });

    // Odpojení klienta
    ws.on("close", () => {
        console.log(`Uživatel odpojen: ${userId}`);
        delete clients[userId];
        // Informace pro ostatní
        Object.values(clients).forEach(client => {
            client.send(JSON.stringify({ type: "user-disconnect", userId }));
        });
    });
});

// Spojení HTTP serveru s WebSocket
const server = app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});
server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
    });
});
