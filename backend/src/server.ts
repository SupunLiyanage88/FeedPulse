import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "feedpulse-backend",
    message: "FeedPulse backend is running. Try GET /health for health checks.",
    timestamp: new Date().toISOString(),
  });
});

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
