import express, { type Express } from "express";
import cors from "cors";
import "dotenv/config";

import { healthRouter } from "./routes/health.js";
import { peopleRouter } from "./routes/people.js";
import { departmentsRouter } from "./routes/departments.js";
import { projectsRouter } from "./routes/projects.js";
import { productsRouter } from "./routes/products.js";
import { suppliersRouter } from "./routes/suppliers.js";
import { locationsRouter } from "./routes/locations.js";
import { rolesRouter } from "./routes/roles.js";
import { searchRouter } from "./routes/search.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { graphRouter } from "./routes/graph.js";
import { verifyConnection, closeDriver } from "./db/driver.js";

const PORT = Number(process.env["PORT"] ?? 3000);
const CORS_ORIGIN = process.env["CORS_ORIGIN"] ?? "http://localhost:5173";

const app: Express = express();

app.use(
  cors({
    origin: CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", peopleRouter);
app.use("/api", departmentsRouter);
app.use("/api", projectsRouter);
app.use("/api", productsRouter);
app.use("/api", suppliersRouter);
app.use("/api", locationsRouter);
app.use("/api", rolesRouter);
app.use("/api", searchRouter);
app.use("/api", dashboardRouter);
app.use("/api", graphRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "NotFound", message: "Route not found" });
});

// Central error handler
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ) => {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[error]", err);
    res.status(500).json({ error: "InternalServerError", message });
  },
);

async function start(): Promise<void> {
  try {
    await verifyConnection();
    console.log("[db] CognoDB connection verified");
  } catch (err) {
    console.error("[db] Could not reach CognoDB:", err);
    console.error("[db] Continuing — /api/health will report unreachable.");
  }

  const server = app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[server] ${signal} received, shutting down...`);
    server.close(() => {
      void closeDriver().then(() => process.exit(0));
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void start();
