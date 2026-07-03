import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { ResumePagination } from "@/features/resume-library/components/ResumeLibraryPage";
import { formatFileSize } from "@/features/resume-library/resumeLibraryLabels";

type ReactElementLike = ReactElement & {
  props: {
    children?: unknown;
    disabled?: boolean;
    onClick?: () => void;
  };
};

describe("Resume Library UI helpers", () => {
  it("formats file sizes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });

  it("shows stable pagination text", () => {
    const element = ResumePagination({
      currentPage: 2,
      isLoading: false,
      onPageChange: vi.fn(),
      total: 45,
      totalPages: 3
    });

    expect(extractText(element)).toContain("第 2 / 3 页，共 45 条");
  });

  it("disables previous on first page and next on last page", () => {
    const firstPageButtons = getPaginationButtons({
      currentPage: 1,
      isLoading: false,
      onPageChange: vi.fn(),
      total: 45,
      totalPages: 3
    });
    const lastPageButtons = getPaginationButtons({
      currentPage: 3,
      isLoading: false,
      onPageChange: vi.fn(),
      total: 45,
      totalPages: 3
    });

    expect(firstPageButtons.previous.props.disabled).toBe(true);
    expect(firstPageButtons.next.props.disabled).toBe(false);
    expect(lastPageButtons.previous.props.disabled).toBe(false);
    expect(lastPageButtons.next.props.disabled).toBe(true);
  });

  it("disables both buttons while loading or empty", () => {
    const loadingButtons = getPaginationButtons({
      currentPage: 2,
      isLoading: true,
      onPageChange: vi.fn(),
      total: 45,
      totalPages: 3
    });
    const emptyElement = ResumePagination({
      currentPage: 1,
      isLoading: false,
      onPageChange: vi.fn(),
      total: 0,
      totalPages: 0
    });
    const emptyButtons = getPaginationButtonsFromElement(emptyElement);

    expect(loadingButtons.previous.props.disabled).toBe(true);
    expect(loadingButtons.next.props.disabled).toBe(true);
    expect(extractText(emptyElement)).toContain("第 1 / 1 页，共 0 条");
    expect(emptyButtons.previous.props.disabled).toBe(true);
    expect(emptyButtons.next.props.disabled).toBe(true);
  });

  it("keeps page navigation bounded", () => {
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
});

function getPaginationButtons(props: Parameters<typeof ResumePagination>[0]): {
  next: ReactElementLike;
  previous: ReactElementLike;
} {
  return getPaginationButtonsFromElement(ResumePagination(props));
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
