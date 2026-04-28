import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import router from "./routes";

const app: Express = express();

// Trust the Replit proxy so rate-limiter & req.ip see the real client.
app.set("trust proxy", 1);

// ── Security & performance middleware ──────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // SPA owns its own CSP
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));

// ── Rate limiting ──────────────────────────────────────────────────────────
// Generous default for read traffic; the indexer & write endpoints get tighter caps.
const generalLimiter = rateLimit({
  windowMs: 60_000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});
const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", generalLimiter);
app.use("/api/battles", (req, _res, next) => (req.method === "POST" ? writeLimiter(req, _res, next) : next()));

app.use("/api", router);

// ── 404 + error handlers ───────────────────────────────────────────────────
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled API error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
