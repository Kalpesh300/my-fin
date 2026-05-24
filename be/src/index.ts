import "dotenv/config";

import express, { type Request, type Response } from "express";

import { env } from "./config/env.js";

const app = express();
const port = env.PORT;

app.use(express.json());

app.get("/health", (_request: Request, response: Response) => {
  response.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Backend server is running on port ${port}.`);
});
