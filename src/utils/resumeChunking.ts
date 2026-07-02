import type {
  ResumeChunkType,
  ResumeSemanticChunk,
  ResumeStructureChunk
} from "@/types/candidateUnderstanding";

const sectionMatchers: Array<{
  type: ResumeChunkType;
  patterns: RegExp[];
}> = [
  {
    type: "Personal Information",
    patterns: [/^(个人信息|基本信息|联系方式|personal information|contact)$/i]
  },
  {
    type: "Education",
    patterns: [/^(教育经历|教育背景|学历|education)$/i]
  },
  {
    type: "Experience",
    patterns: [/^(工作经历|工作经验|职业经历|experience|work experience|employment)$/i]
  },
  {
    type: "Projects",
    patterns: [/^(项目经历|项目经验|projects?|project experience)$/i]
  },
  {
    type: "Skills",
    patterns: [/^(技能|专业技能|技能清单|skills?|technical skills)$/i]
  },
  {
    type: "Certificates",
    patterns: [/^(证书|资格证书|认证|certificates?|certifications?)$/i]
  },
  {
    type: "Languages",
    patterns: [/^(语言|语言能力|languages?)$/i]
  },
  {
    type: "Achievements",
    patterns: [/^(成就|荣誉|获奖|achievements?|awards?)$/i]
  }
];

const semanticMatchers: Array<{
  type: string;
  keywords: string[];
}> = [
  { type: "Leadership", keywords: ["leader", "leadership", "manager", "管理", "带领", "负责人"] },
  { type: "AI Experience", keywords: ["ai", "llm", "gpt", "人工智能", "大模型", "机器学习"] },
  { type: "Recruitment Experience", keywords: ["recruit", "招聘", "候选人", "面试", "猎头"] },
  { type: "Product Experience", keywords: ["product", "产品", "需求", "用户", "roadmap"] },
  { type: "Communication", keywords: ["communication", "沟通", "协作", "跨部门", "stakeholder"] },
  { type: "Project Management", keywords: ["project", "项目管理", "推进", "交付", "timeline"] },
  { type: "Technical Skills", keywords: ["typescript", "java", "python", "sql", "技术", "开发"] },
  { type: "Domain Knowledge", keywords: ["industry", "domain", "行业", "业务", "领域"] }
];

export function createStructureChunks(text: string): ResumeStructureChunk[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const chunks: ResumeStructureChunk[] = [];
  let currentType: ResumeChunkType = "Other";
  let currentStartLine = 1;
  let currentLines: string[] = [];
  let currentConfidence = 0.55;

  lines.forEach((line, index) => {
    const matchedType = detectSectionType(line);

    if (matchedType) {
      pushStructureChunk(chunks, currentType, currentLines, currentStartLine, index, currentConfidence);
      currentType = matchedType;
      currentStartLine = index + 1;
      currentLines = [];
      currentConfidence = 0.9;
      return;
    }

    currentLines.push(line);
  });

  pushStructureChunk(chunks, currentType, currentLines, currentStartLine, lines.length, currentConfidence);

  if (chunks.length === 0) {
    return [
      {
        chunkId: "structure-other-1",
        chunkType: "Other",
        confidence: 0.5,
        content: lines.join("\n"),
        sourceLocation: `lines 1-${lines.length}`
      }
    ];
  }

  return chunks.map((chunk, index) => ({
    ...chunk,
    chunkId: `structure-${slugify(chunk.chunkType)}-${index + 1}`
  }));
}

export function createSemanticChunks(structureChunks: ResumeStructureChunk[]): ResumeSemanticChunk[] {
  const semanticChunks = semanticMatchers
    .map((matcher, index) => {
      const matchingChunks = structureChunks.filter((chunk) =>
        matcher.keywords.some((keyword) => chunk.content.toLowerCase().includes(keyword.toLowerCase()))
      );

      if (matchingChunks.length === 0) {
        return null;
      }

      return {
        chunkId: `semantic-${slugify(matcher.type)}-${index + 1}`,
        chunkType: matcher.type,
        confidence: Math.min(0.95, 0.65 + matchingChunks.length * 0.08),
        content: summarizeSemanticContent(matchingChunks),
        evidenceChunkIds: matchingChunks.map((chunk) => chunk.chunkId)
      };
    })
    .filter((chunk): chunk is ResumeSemanticChunk => chunk !== null);

  if (semanticChunks.length > 0) {
    return semanticChunks;
  }

  const fallbackChunk = structureChunks[0];

  return fallbackChunk
    ? [
        {
          chunkId: "semantic-domain-knowledge-1",
          chunkType: "Domain Knowledge",
          confidence: 0.45,
          content: truncateText(fallbackChunk.content, 800),
          evidenceChunkIds: [fallbackChunk.chunkId]
        }
      ]
    : [];
}

function detectSectionType(line: string): ResumeChunkType | null {
  const normalizedLine = line.replace(/[:：]/g, "").trim();

  for (const matcher of sectionMatchers) {
    if (matcher.patterns.some((pattern) => pattern.test(normalizedLine))) {
      return matcher.type;
    }
  }

  return null;
}

function pushStructureChunk(
  chunks: ResumeStructureChunk[],
  chunkType: ResumeChunkType,
  lines: string[],
  startLine: number,
  endLine: number,
  confidence: number
): void {
  if (lines.length === 0) {
    return;
  }

  chunks.push({
    chunkId: "",
    chunkType,
    confidence,
    content: lines.join("\n"),
    sourceLocation: `lines ${startLine}-${Math.max(startLine, endLine)}`
  });
}

function summarizeSemanticContent(chunks: ResumeStructureChunk[]): string {
  return truncateText(
    chunks
      .map((chunk) => `[${chunk.chunkType}] ${chunk.content}`)
      .join("\n\n"),
    1200
  );
}

function truncateText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
