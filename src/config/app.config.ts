import packageJson from "../../package.json";
import { envConfig } from "@/config/env.config";
import type { AppConfig } from "@/types/config";

export const appConfig: AppConfig = {
  appName: "HR Daily AI",
  appVersion: packageJson.version,
  environment: envConfig.nodeEnv,
  databaseProvider: "PostgreSQL",
  deployment: "Docker Compose",
  configurationMode: "Read-only V1"
};
