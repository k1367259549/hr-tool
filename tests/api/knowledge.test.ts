import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGetRequest,
  createJsonRequest,
  createKnowledge,
  createMemoryKnowledgeRepository,
  readApiJson,
  resetTestDb,
  type MockKnowledgeRepository
} from "../setup/testDb";
import type { Knowledge } from "@/types/knowledge";

vi.mock("@/repositories/knowledge.repository", () => ({
  knowledgeRepository: knowledgeRepositoryMock
}));

const knowledgeRepositoryMock: MockKnowledgeRepository = createMemoryKnowledgeRepository();

describe("Knowledge API", () => {
  beforeEach(() => {
    resetTestDb();
    Object.assign(knowledgeRepositoryMock, createMemoryKnowledgeRepository());
  });

  it("POST /api/knowledge creates a knowledge entry", async () => {
    const { POST } = await import("@/app/api/knowledge/route");

    const response = await POST(
      createJsonRequest("http://localhost/api/knowledge", {
        content: "Send a follow-up message within 24 hours.",
        source: "USER",
        tags: ["interview", "follow-up"],
        title: "Interview follow-up template",
        type: "TEMPLATE"
      }) as never
    );
    const json = await readApiJson<Knowledge>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data?.title).toBe("Interview follow-up template");
    expect(knowledgeRepositoryMock.create).toHaveBeenCalledWith({
      content: "Send a follow-up message within 24 hours.",
      source: "USER",
      tags: ["interview", "follow-up"],
      title: "Interview follow-up template",
      type: "TEMPLATE"
    });
  });

  it("GET /api/knowledge lists knowledge entries", async () => {
    Object.assign(
      knowledgeRepositoryMock,
      createMemoryKnowledgeRepository([
        createKnowledge({
          tags: ["interview"],
          title: "Interview follow-up template",
          type: "TEMPLATE"
        }),
        createKnowledge({
          tags: ["sourcing"],
          title: "Sourcing note",
          type: "NOTE"
        })
      ])
    );
    const { GET } = await import("@/app/api/knowledge/route");

    const response = await GET(createGetRequest("http://localhost/api/knowledge") as never);
    const json = await readApiJson<Knowledge[]>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
  });

  it("GET /api/knowledge supports type, tag, and keyword filters", async () => {
    Object.assign(
      knowledgeRepositoryMock,
      createMemoryKnowledgeRepository([
        createKnowledge({
          content: "Follow up after interview quickly.",
          tags: ["interview"],
          title: "Interview follow-up template",
          type: "TEMPLATE"
        }),
        createKnowledge({
          content: "Search candidate channels.",
          tags: ["sourcing"],
          title: "Sourcing note",
          type: "NOTE"
        })
      ])
    );
    const { GET } = await import("@/app/api/knowledge/route");

    const response = await GET(
      createGetRequest(
        "http://localhost/api/knowledge?type=TEMPLATE&tag=interview&keyword=follow"
      ) as never
    );
    const json = await readApiJson<Knowledge[]>(response);

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data?.[0]?.title).toBe("Interview follow-up template");
    expect(knowledgeRepositoryMock.findMany).toHaveBeenCalledWith({
      keyword: "follow",
      tag: "interview",
      type: "TEMPLATE"
    });
  });
});
