import type { NextRequest } from "next/server";
import { searchService } from "@/services/search.service";
import type { SearchResponse } from "@/types/search";
import { handleApiError, successResponse } from "@/utils/apiResponse";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const results = await searchService.search(request.nextUrl.searchParams.get("q"));

    return successResponse<SearchResponse>(results);
  } catch (error) {
    return handleApiError(error);
  }
}
