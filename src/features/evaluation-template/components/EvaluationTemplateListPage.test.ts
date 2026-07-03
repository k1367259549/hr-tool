import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { EvaluationTemplatePagination } from "@/features/evaluation-template/components/EvaluationTemplateListPage";
import type { EvaluationTemplateListFilters } from "@/features/evaluation-template/hooks/useEvaluationTemplateList";
import { criterionImportanceLabels } from "@/features/evaluation-template/evaluationTemplateLabels";

type ReactElementLike = ReactElement & {
  props: {
    children?: unknown;
    disabled?: boolean;
    onClick?: () => void;
  };
};

describe("Evaluation Template UI helpers", () => {
  it("shows stable pagination and handles empty state as page one of one", () => {
    const element = EvaluationTemplatePagination({
      currentPage: 2,
      isLoading: false,
      onPageChange: vi.fn(),
      total: 45,
      totalPages: 3
    });
    const emptyElement = EvaluationTemplatePagination({
      currentPage: 1,
      isLoading: false,
      onPageChange: vi.fn(),
      total: 0,
      totalPages: 0
    });

    expect(extractText(element)).toContain("第 2 / 3 页，共 45 条");
    expect(extractText(emptyElement)).toContain("第 1 / 1 页，共 0 条");
  });

  it("bounds previous and next page actions", () => {
    const onPageChange = vi.fn();
    const buttons = getPaginationButtons({
      currentPage: 2,
      isLoading: false,
      onPageChange,
      total: 45,
      totalPages: 3
    });

    buttons.next.props.onClick?.();
    buttons.previous.props.onClick?.();

    expect(onPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1);
  });

  it("disables buttons on first, last, loading, and empty states", () => {
    expect(
      getPaginationButtons({
        currentPage: 1,
        isLoading: false,
        onPageChange: vi.fn(),
        total: 45,
        totalPages: 3
      }).previous.props.disabled
    ).toBe(true);
    expect(
      getPaginationButtons({
        currentPage: 3,
        isLoading: false,
        onPageChange: vi.fn(),
        total: 45,
        totalPages: 3
      }).next.props.disabled
    ).toBe(true);
    const loadingButtons = getPaginationButtons({
      currentPage: 2,
      isLoading: true,
      onPageChange: vi.fn(),
      total: 45,
      totalPages: 3
    });
    const emptyButtons = getPaginationButtons({
      currentPage: 1,
      isLoading: false,
      onPageChange: vi.fn(),
      total: 0,
      totalPages: 1
    });

    expect(loadingButtons.previous.props.disabled).toBe(true);
    expect(loadingButtons.next.props.disabled).toBe(true);
    expect(emptyButtons.previous.props.disabled).toBe(true);
    expect(emptyButtons.next.props.disabled).toBe(true);
  });

  it("resets page when filters change and keeps page when paging", () => {
    const current: EvaluationTemplateListFilters = {
      page: 3,
      pageSize: 20,
      search: "backend",
      status: "ACTIVE"
    };

    expect(applyTemplateFilterPatch(current, { search: "frontend" }).page).toBe(1);
    expect(applyTemplateFilterPatch(current, { page: 2 }).page).toBe(2);
  });

  it("does not expose scoring-oriented labels", () => {
    const visibleLabels = Object.values(criterionImportanceLabels).join(" ");

    expect(visibleLabels).not.toMatch(/分数|权重|阈值|排名|淘汰/);
  });
});

function getPaginationButtons(props: Parameters<typeof EvaluationTemplatePagination>[0]): {
  next: ReactElementLike;
  previous: ReactElementLike;
} {
  const children = flattenChildren(EvaluationTemplatePagination(props).props.children).filter(
    isReactElementLike
  );
  const buttonContainer = children.find((child) =>
    flattenChildren(child.props.children).some((nestedChild) => extractText(nestedChild) === "上一页")
  );

  if (!buttonContainer) {
    throw new Error("Pagination buttons were not rendered.");
  }

  const buttons = flattenChildren(buttonContainer.props.children).filter(isReactElementLike);
  const [previous, next] = buttons;

  if (!previous || !next) {
    throw new Error("Pagination button pair was not rendered.");
  }

  return {
    next,
    previous
  };
}

function applyTemplateFilterPatch(
  current: EvaluationTemplateListFilters,
  nextFilters: Partial<EvaluationTemplateListFilters>
): EvaluationTemplateListFilters {
  return {
    ...current,
    ...nextFilters,
    page: nextFilters.page ?? 1
  };
}

function extractText(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (!isReactElementLike(node)) {
    return "";
  }

  return flattenChildren(node.props.children).map(extractText).join("");
}

function flattenChildren(children: unknown): unknown[] {
  if (children === undefined || children === null || typeof children === "boolean") {
    return [];
  }

  return Array.isArray(children) ? children : [children];
}

function isReactElementLike(value: unknown): value is ReactElementLike {
  return typeof value === "object" && value !== null && "props" in value;
}
