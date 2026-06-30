import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGetRequest,
  createJsonRequest,
  createMemoryLogRepository,
  readApiJson,
  resetTestDb,
  type MockLogRepository
} from "../setup/testDb";
import type { RecruitLog } from "@/types/log";

vi.mock("@/repositories/log.repository", () => ({
  logRepository: logRepositoryMock
}));

const logRepositoryMock: MockLogRepository = createMemoryLogRepository();

describe("RecruitLog API", () => {
  beforeEach(() => {
    resetTestDb();
    Object.assign(logRepositoryMock, createMemoryLogRepository());
  });

  it("POST /api/log creates a recruit log", async () => {
    const { POST } = await import("@/app/api/log/route");

    const response = await POST(
      createJsonRequest("http://localhost/api/log", {
        date: "2026-01-01",
        position: "Frontend Engineer",
        resumeCount: 20,
        screenCount: 10
      }) as never
    );
    const json = await readApiJson<RecruitLog>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data?.id).toBe("00000000-0000-4000-8000-000000000001");
    expect(json.data?.resumeCount).toBe(20);
    expect(logRepositoryMock.create).toHaveBeenCalledTimes(1);
  });

  it("GET /api/log lists recruit logs", async () => {
    const { GET, POST } = await import("@/app/api/log/route");

    await POST(createJsonRequest("http://localhost/api/log", { date: "2026-01-01" }) as never);

    const response = await GET(createGetRequest("http://localhost/api/log") as never);
    const json = await readApiJson<RecruitLog[]>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data?.[0]?.date).toBe("2026-01-01T00:00:00.000Z");
  });

  it("PUT /api/log/:id updates a recruit log", async () => {
    const logRoute = await import("@/app/api/log/route");
    const idRoute = await import("@/app/api/log/[id]/route");

    const createResponse = await logRoute.POST(
      createJsonRequest("http://localhost/api/log", { date: "2026-01-01", resumeCount: 20 }) as never
    );
    const createdJson = await readApiJson<RecruitLog>(createResponse);
    const id = createdJson.data?.id ?? "";

    const response = await idRoute.PUT(
      createJsonRequest(`http://localhost/api/log/${id}`, { resumeCount: 25 }) as never,
      {
        params: Promise.resolve({ id })
      }
    );
    const json = await readApiJson<RecruitLog>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.resumeCount).toBe(25);
    expect(logRepositoryMock.update).toHaveBeenCalledWith(id, expect.objectContaining({ resumeCount: 25 }));
  });

  it("DELETE /api/log/:id deletes a recruit log", async () => {
    const logRoute = await import("@/app/api/log/route");
    const idRoute = await import("@/app/api/log/[id]/route");

    const createResponse = await logRoute.POST(
      createJsonRequest("http://localhost/api/log", { date: "2026-01-01" }) as never
    );
    const createdJson = await readApiJson<RecruitLog>(createResponse);
    const id = createdJson.data?.id ?? "";

    const response = await idRoute.DELETE(createGetRequest(`http://localhost/api/log/${id}`) as never, {
      params: Promise.resolve({ id })
    });
    const listResponse = await logRoute.GET(createGetRequest("http://localhost/api/log") as never);
    const listJson = await readApiJson<RecruitLog[]>(listResponse);

    expect(response.status).toBe(200);
    expect(listJson.data).toHaveLength(0);
    expect(logRepositoryMock.delete).toHaveBeenCalledWith(id);
  });
});
