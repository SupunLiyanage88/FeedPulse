"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 5000;
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "feedpulse-backend",
        timestamp: new Date().toISOString(),
    });
});
app.listen(port, () => {
    console.log(`FeedPulse backend running on http://localhost:${port}`);
});
