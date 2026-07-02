import { describe, expect, it } from "vitest";
import { createSemanticChunks, createStructureChunks } from "@/utils/resumeChunking";

describe("resumeChunking", () => {
  it("creates structure and semantic chunks from resume text", () => {
    const structureChunks = createStructureChunks(`
个人信息
张三 / 北京

工作经历
负责招聘流程推进，与业务 leader 沟通候选人筛选标准。

技能
SQL, TypeScript, AI 工具使用
`);
    const semanticChunks = createSemanticChunks(structureChunks);

    expect(structureChunks.some((chunk) => chunk.chunkType === "Experience")).toBe(true);
    expect(structureChunks[0]?.chunkId).toContain("structure");
    expect(semanticChunks.length).toBeGreaterThan(0);
    expect(semanticChunks.some((chunk) => chunk.evidenceChunkIds.length > 0)).toBe(true);
  });
});
