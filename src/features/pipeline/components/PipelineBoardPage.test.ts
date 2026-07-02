import { describe, expect, it, vi } from "vitest";
import { PipelinePagination } from "@/features/pipeline/components/PipelineBoardPage";
import type { ApplicationListFilters } from "@/features/pipeline/hooks/useApplicationList";

type ReactElementLike = {
  props: {
    children?: unknown;
    disabled?: boolean;
    onClick?: () => void;
  };
};

describe("PipelinePagination", () => {
  it("shows current page, total pages, and total records", () => {
    const element = PipelinePagination({
      currentPage: 2,
      isLoading: false,
      onPageChange: vi.fn(),
      total: 45,
      totalPages: 3
    });

    expect(extractText(element)).toContain("第 2 / 3 页，共 45 条");
  });

  it("disables previous on the first page and keeps next enabled", () => {
    const buttons = getPaginationButtons({
      currentPage: 1,
      isLoading: false,
      onPageChange: vi.fn(),
      total: 45,
      totalPages: 3
    });

    expect(buttons.previous.props.disabled).toBe(true);
    expect(buttons.next.props.disabled).toBe(false);
  });

  it("keeps previous enabled and disables next on the last page", () => {
    const buttons = getPaginationButtons({
      currentPage: 3,
      isLoading: false,
      onPageChange: vi.fn(),
      total: 45,
      totalPages: 3
    });

    expect(buttons.previous.props.disabled).toBe(false);
    expect(buttons.next.props.disabled).toBe(true);
  });

  it("moves to the next page without clearing active filters", () => {
    const setFilters = vi.fn();
    const filters: ApplicationListFilters = {
      jobProfileId: "job-1",
      owner: "alice",
      page: 2,
      pageSize: 20,
      search: "backend",
      stage: "PHONE_SCREEN",
      status: "open"
    };
    const buttons = getPaginationButtons({
      currentPage: filters.page,
      isLoading: false,
      onPageChange: (page) => setFilters({ page }),
      total: 45,
      totalPages: 3
    });

    buttons.next.props.onClick?.();

    expect(setFilters).toHaveBeenCalledWith({
      page: 3
    });
    expect(filters.search).toBe("backend");
    expect(filters.stage).toBe("PHONE_SCREEN");
  });

  it("moves to the previous page", () => {
    const onPageChange = vi.fn();
    const buttons = getPaginationButtons({
      currentPage: 2,
      isLoading: false,
      onPageChange,
      total: 45,
      totalPages: 3
    });

    buttons.previous.props.onClick?.();

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("resets page to one when a filter changes", () => {
    const current: ApplicationListFilters = {
      jobProfileId: "",
      owner: "",
      page: 3,
      pageSize: 20,
      search: "",
      stage: "",
      status: "open"
    };
    const nextFilters: Partial<ApplicationListFilters> = {
      search: "frontend"
    };

    expect(applyPipelineFilterPatch(current, nextFilters).page).toBe(1);
  });

  it("disables both buttons while loading", () => {
    const buttons = getPaginationButtons({
      currentPage: 2,
      isLoading: true,
      onPageChange: vi.fn(),
      total: 45,
      totalPages: 3
    });

    expect(buttons.previous.props.disabled).toBe(true);
    expect(buttons.next.props.disabled).toBe(true);
  });

  it("keeps empty result pagination at page one of one", () => {
    const element = PipelinePagination({
      currentPage: 1,
      isLoading: false,
      onPageChange: vi.fn(),
      total: 0,
      totalPages: 0
    });
    const buttons = getPaginationButtonsFromElement(element);

    expect(extractText(element)).toContain("第 1 / 1 页，共 0 条");
    expect(buttons.next.props.disabled).toBe(true);
  });
});

function getPaginationButtons(props: Parameters<typeof PipelinePagination>[0]): {
  next: ReactElementLike;
  previous: ReactElementLike;
} {
  return getPaginationButtonsFromElement(PipelinePagination(props));
}

function getPaginationButtonsFromElement(element: ReactElementLike): {
  next: ReactElementLike;
  previous: ReactElementLike;
} {
  const children = flattenChildren(element.props.children).filter(isReactElementLike);
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

function applyPipelineFilterPatch(
  current: ApplicationListFilters,
  nextFilters: Partial<ApplicationListFilters>
): ApplicationListFilters {
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

  const items = Array.isArray(children) ? children : [children];

  return items;
}

function isReactElementLike(value: unknown): value is ReactElementLike {
  return typeof value === "object" && value !== null && "props" in value;
}
