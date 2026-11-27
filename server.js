// server.js — чат реального часу на WebSocket + Express
const path = require("path");
const http = require("http");
const express = require("express");
const { WebSocketServer } = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;

// Статичні файли клієнта (сторінка чату)
app.use(express.static(path.join(__dirname, "public")));

// Спільний HTTP-сервер для Express та WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let online = 0;

// Розсилання повідомлення всім підключеним клієнтам
function broadcast(data) {
    const payload = JSON.stringify(data);
    for (const client of wss.clients) {
        if (client.readyState === client.OPEN) client.send(payload);
    }
}

// Обробка подій з'єднання
wss.on("connection", (ws) => {
    online++;
    ws.username = "Анонім";
    console.log(`🔌 Нове підключення. Онлайн: ${online}`);

    // Повідомити всіх про нову кількість учасників
    broadcast({ type: "system", text: "Новий учасник приєднався", online });

    // Подія: отримано повідомлення від клієнта
    ws.on("message", (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch {
            return; // ігноруємо некоректний JSON
        }

        if (msg.type === "join") {
            ws.username = (msg.username || "Анонім").slice(0, 32);
            broadcast({ type: "system", text: `${ws.username} у чаті`, online });
        } else if (msg.type === "chat") {
            broadcast({
                type: "chat",
                username: ws.username,
                text: String(msg.text || "").slice(0, 500),
                time: new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
            });
        }
    });

    // Подія: клієнт від'єднався
    ws.on("close", () => {
        online--;
        console.log(`❌ Відключення. Онлайн: ${online}`);
        broadcast({ type: "system", text: `${ws.username} вийшов з чату`, online });
    });

    ws.on("error", (err) => console.error("WS error:", err.message));
});

server.listen(PORT, () => console.log(`🚀 Чат-сервер: http://localhost:${PORT}`));
