import { describe, expect, it, vi } from "vitest";
import { FeishuTenantAccessTokenProvider } from "@/lib/feishu/feishuAuth";

type FetchImpl = typeof fetch;

function createTokenResponse(token: string, expire = 7200): Response {
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        code: 0,
        expire,
        msg: "ok",
        tenant_access_token: token
      };
    }
  } as Response;
}

describe("FeishuTenantAccessTokenProvider", () => {
  it("fetches tenant_access_token for internal app credentials", async () => {
    const fetchMock = vi.fn(async () => createTokenResponse("tenant-token-1"));
    const fetchImpl = fetchMock as unknown as FetchImpl;
    const provider = new FeishuTenantAccessTokenProvider({
      appId: "cli_test",
      appSecret: "app-secret",
      baseUrl: "https://open.feishu.test",
      fetchImpl
    });

    await expect(provider.getTenantAccessToken()).resolves.toBe("tenant-token-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://open.feishu.test/open-apis/auth/v3/tenant_access_token/internal",
      expect.objectContaining({
        body: JSON.stringify({
          app_id: "cli_test",
          app_secret: "app-secret"
        }),
        method: "POST"
      })
    );
  });

  it("caches tenant_access_token until near expiry", async () => {
    const nowValues = [
      new Date("2026-07-09T10:00:00.000Z"),
      new Date("2026-07-09T10:01:00.000Z")
    ];
    const now = vi.fn(() => nowValues.shift() ?? new Date("2026-07-09T10:01:00.000Z"));
    const fetchMock = vi.fn(async () => createTokenResponse("cached-token", 7200));
    const fetchImpl = fetchMock as unknown as FetchImpl;
    const provider = new FeishuTenantAccessTokenProvider({
      appId: "cli_test",
      appSecret: "app-secret",
      fetchImpl,
      now
    });

    await expect(provider.getTenantAccessToken()).resolves.toBe("cached-token");
    await expect(provider.getTenantAccessToken()).resolves.toBe("cached-token");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
