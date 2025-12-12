import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";

const app = express();

app.use(cors({
    origin: "http://127.0.0.1:5500",
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());

// Статика
app.use('/css', express.static(path.join('.', 'css')));
app.use('/js', express.static(path.join('.', 'js')));
app.use(express.static(path.join('.', 'public'))); // <-- public для HTML

// Бот
const BOT_TOKEN = "8234484342:AAFJbf4L_MtrjMA8JsbkMP04ERynY4Iyn_g";
const CHAT_ID = 713172111;

// Маршруты API
app.post("/sendPromo", async (req, res) => {
    const { promo } = req.body;
    if (!promo) return res.status(400).send("No promo code");
    const message = `Победа! Промокод выдан: ${promo}`;
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: CHAT_ID, text: message })
        });
        res.send("Promo sent!");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error sending promo");
    }
});

app.post("/sendLoss", async (req, res) => {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: CHAT_ID, text: "Проигрыш" })
        });
        res.send("Loss sent");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error sending loss");
    }
});

// Сервер
app.listen(3000, () => console.log("Server running on port 3000"));