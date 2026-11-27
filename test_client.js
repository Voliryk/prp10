// test_client.js — консольна перевірка WebSocket-сервера двома клієнтами
const WebSocket = require("ws");
const URL = "ws://localhost:3000";
const wait = ms => new Promise(r => setTimeout(r, ms));

function makeClient(name) {
    const ws = new WebSocket(URL);
    ws.on("message", raw => {
        const m = JSON.parse(raw);
        if (m.type === "system") console.log(`[${name}] 🔔 система: ${m.text} (онлайн: ${m.online})`);
        else if (m.type === "chat") console.log(`[${name}] 💬 ${m.username} (${m.time}): ${m.text}`);
    });
    return new Promise(res => ws.on("open", () => res(ws)));
}

(async () => {
    console.log("Підключення двох клієнтів до", URL);
    const artem = await makeClient("Artem");
    await wait(150);
    const olena = await makeClient("Olena");
    await wait(150);

    artem.send(JSON.stringify({ type: "join", username: "Artem" }));
    olena.send(JSON.stringify({ type: "join", username: "Olena" }));
    await wait(200);

    console.log("\n--- Обмін повідомленнями ---");
    artem.send(JSON.stringify({ type: "chat", text: "Привіт усім!" }));
    await wait(200);
    olena.send(JSON.stringify({ type: "chat", text: "Привіт, Артеме! Як справи?" }));
    await wait(200);
    artem.send(JSON.stringify({ type: "chat", text: "Чудово, тестую WebSocket 😉" }));
    await wait(300);

    console.log("\n--- Olena виходить ---");
    olena.close();
    await wait(300);

    artem.close();
    await wait(200);
    console.log("\n✅ Тест завершено.");
    process.exit(0);
})();
