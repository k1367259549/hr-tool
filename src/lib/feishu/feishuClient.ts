import { FeishuTenantAccessTokenProvider } from "@/lib/feishu/feishuAuth";

export type FeishuClientConfig = {
  tokenProvider: Pick<FeishuTenantAccessTokenProvider, "getTenantAccessToken">;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export class FeishuClientError extends Error {
  readonly code = "FEISHU_CLIENT_ERROR";
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FeishuClientError";
    this.status = status;
  }
}

const defaultFeishuBaseUrl = "https://open.feishu.cn";

export class FeishuClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly tokenProvider: Pick<FeishuTenantAccessTokenProvider, "getTenantAccessToken">;

  constructor(config: FeishuClientConfig) {
    this.baseUrl = (config.baseUrl ?? defaultFeishuBaseUrl).replace(/\/+$/, "");
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.tokenProvider = config.tokenProvider;
  }

  async request<TResponse>(path: string, init: RequestInit = {}): Promise<TResponse> {
    const token = await this.tokenProvider.getTenantAccessToken();
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init.headers
      }
    });
    const payload = (await response.json()) as {
      code?: number;
      msg?: string;
      data?: TResponse;
    };

    if (!response.ok || payload.code !== 0) {
      throw new FeishuClientError(
        payload.msg || `Feishu API request failed with HTTP ${response.status}.`,
        response.status
      );
    }

    return (payload.data ?? {}) as TResponse;
  }
}

