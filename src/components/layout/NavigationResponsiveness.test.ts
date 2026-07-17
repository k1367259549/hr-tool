import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("mobile navigation containment", () => {
  it("keeps the primary navigation within its scroll container", () => {
    const source = readSource("src/components/layout/Sidebar.tsx");

    expect(source).toContain("min-w-0 max-w-full gap-1 overflow-x-auto");
    expect(source).toContain("shrink-0 items-center gap-3 whitespace-nowrap");
  });

  it("keeps Feishu navigation from expanding the page on small screens", () => {
    const source = readSource("src/modules/feishu/components/FeishuShell.tsx");

    expect(source).toContain("grid min-w-0 max-w-full gap-6");
    expect(source).toContain("flex min-w-0 max-w-full gap-2 overflow-x-auto");
    expect(source).toContain("min-w-fit shrink-0 items-center gap-3 whitespace-nowrap");
  });
});
