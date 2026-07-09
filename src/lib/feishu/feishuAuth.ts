export type FeishuAuthConfig = {
  appId: string;
  appSecret: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
};

type TenantAccessTokenResponse = {
  code?: number;
  msg?: string;
  tenant_access_token?: string;
  expire?: number;
};

const defaultFeishuBaseUrl = "https://open.feishu.cn";
const tokenCacheSkewMs = 60_000;

export class FeishuAuthError extends Error {
  readonly code: "CONFIG_ERROR" | "FEISHU_AUTH_ERROR";

  constructor(code: "CONFIG_ERROR" | "FEISHU_AUTH_ERROR", message: string) {
    super(message);
    this.name = "FeishuAuthError";
    this.code = code;
  }
}

export class FeishuTenantAccessTokenProvider {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => Date;
  private cachedToken: { token: string; expiresAtMs: number } | null = null;

  constructor(config: FeishuAuthConfig) {
    this.assertConfig(config);

    this.appId = config.appId.trim();
    this.appSecret = config.appSecret.trim();
    this.baseUrl = (config.baseUrl ?? defaultFeishuBaseUrl).replace(/\/+$/, "");
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.now = config.now ?? (() => new Date());
  }

  async getTenantAccessToken(): Promise<string> {
    const cached = this.cachedToken;
    const nowMs = this.now().getTime();

    if (cached && cached.expiresAtMs - tokenCacheSkewMs > nowMs) {
      return cached.token;
    }

    const response = await this.fetchImpl(
      `${this.baseUrl}/open-apis/auth/v3/tenant_access_token/internal`,
      {
        body: JSON.stringify({
          app_id: this.appId,
          app_secret: this.appSecret
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );

    const payload = (await response.json()) as TenantAccessTokenResponse;

    if (!response.ok || payload.code !== 0 || !payload.tenant_access_token) {
      throw new FeishuAuthError(
        "FEISHU_AUTH_ERROR",
        payload.msg || `Feishu tenant_access_token request failed with HTTP ${response.status}.`
      );
    }

    const expiresInSeconds = Math.max(1, payload.expire ?? 7200);

    this.cachedToken = {
      expiresAtMs: nowMs + expiresInSeconds * 1000,
      token: payload.tenant_access_token
    };

    return payload.tenant_access_token;
  }

  private assertConfig(config: FeishuAuthConfig): void {
    if (!config.appId.trim()) {
      throw new FeishuAuthError("CONFIG_ERROR", "FEISHU_APP_ID is required.");
    }

    if (!config.appSecret.trim()) {
      throw new FeishuAuthError("CONFIG_ERROR", "FEISHU_APP_SECRET is required.");
    }
  }
}

export function createFeishuAuthConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  options: Pick<FeishuAuthConfig, "fetchImpl" | "now"> = {}
): FeishuAuthConfig {
  return {
    appId: env.FEISHU_APP_ID ?? "",
    appSecret: env.FEISHU_APP_SECRET ?? "",
    fetchImpl: options.fetchImpl,
    now: options.now
  };
}

