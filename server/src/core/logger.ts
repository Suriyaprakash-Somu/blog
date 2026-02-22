import pino from "pino";
import { env } from "../common/env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === "development" && env.LOG_PRETTY
      ? { target: "pino-pretty" }
      : undefined,
  base: {
    env: env.NODE_ENV,
  },
});
