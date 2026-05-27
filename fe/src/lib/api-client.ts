import axios from "axios";
import { z } from "zod";

const apiEnvSchema = z.object({
  VITE_API_BASE_URL: z.string().url().default("http://localhost:3000"),
});

const apiEnv = apiEnvSchema.parse(import.meta.env);

const apiClient = axios.create({
  baseURL: apiEnv.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-user-id": "demo-user",
  },
});

export { apiClient };
