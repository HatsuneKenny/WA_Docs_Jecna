const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const PORT = 8080;

// Slouží statické soubory z adresáře 'public'
app.use(express.static("public"));

// Vytvoření HTTP serveru
const server = http.createServer(app);

// Nastavení WebSocket serveru
const wss = new WebSocket.Server({ server });

// WebSocket logika
wss.on("connection", (ws) => {
    console.log("Nový WebSocket klient připojen.");

    ws.on("message", (message) => {
        console.log("Přijatá zpráva od klienta:", message);

        // Distribuce zprávy všem klientům
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on("close", () => {
        console.log("Klient odpojen.");
    });
});

// Server naslouchá na všech IP adresách
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server běží na http://0.0.0.0:${PORT}`);
});
