import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, readApiJson } from "../setup/testDb";

vi.mock("@/services/review.service", async () => {
  const actual = await vi.importActual<typeof import("@/services/review.service")>(
    "@/services/review.service"
  );

  return {
    ReviewServiceError: actual.ReviewServiceError,
    reviewService: reviewServiceMock
  };
});

const reviewServiceMock = {
  generateReview: vi.fn()
};

describe("AI Review API error handling", () => {
  beforeEach(() => {
    reviewServiceMock.generateReview.mockReset();
  });

  it("POST /api/review/generate returns validation error without AI call", async () => {
    const { POST } = await import("@/app/api/review/generate/route");

    const response = await POST(
      createJsonRequest("http://localhost/api/review/generate", {}) as never
    );
    const json = await readApiJson<null>(response);

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe("VALIDATION_ERROR");
    expect(reviewServiceMock.generateReview).not.toHaveBeenCalled();
  });

  it("POST /api/review/generate maps AI failures to standard API error", async () => {
    const { ReviewServiceError } = await import("@/services/review.service");

    reviewServiceMock.generateReview.mockRejectedValue(
      new ReviewServiceError("AI_ERROR", "AI review generation failed.")
    );

    const { POST } = await import("@/app/api/review/generate/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/review/generate", {
        date: "2026-01-01"
      }) as never
    );
    const json = await readApiJson<null>(response);

    expect(response.status).toBe(502);
    expect(json.success).toBe(false);
    expect(json.error).toEqual({
      code: "AI_ERROR",
      message: "AI review generation failed."
    });
    expect(reviewServiceMock.generateReview).toHaveBeenCalledWith({
      date: "2026-01-01"
    });
  });
});
