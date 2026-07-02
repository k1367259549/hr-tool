import { successResponse } from "@/utils/apiResponse";
import pkg from "../../../../package.json";

type VersionData = {
  version: string;
  commit: string;
  buildTime: string;
};

export async function GET(): Promise<Response> {
  const data: VersionData = {
    version: pkg.version ?? "unknown",
    commit: process.env.GIT_COMMIT ?? "unknown",
    buildTime: process.env.BUILD_TIME ?? "unknown",
  };
  return successResponse<VersionData>(data);
}
