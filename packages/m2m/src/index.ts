export class MachineClient {
  private readonly apiUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  // Internal Cache State
  private accessToken: string | null = null;
  private tokenExpirationTime = 0;

  constructor(config: { apiUrl: string; clientId: string; clientSecret: string }) {
    this.apiUrl = config.apiUrl;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  /**
   * Retrieve a valid JWT Token. Fetch a new one if missing or expiring soon.
   * @private
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    // CACHE HIT: Token is valid for at least 60 more seconds
    if (this.accessToken && now < this.tokenExpirationTime - 60_000) {
      return this.accessToken;
    }

    // CACHE MISS: Fetch new token
    console.warn(`[${this.clientId}] Requesting new M2M Access Token...`);

    const response = await fetch(`${this.apiUrl}/api/internal/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to authenticate ${this.clientId}: ${response.status} ${errText}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.tokenExpirationTime = now + data.expires_in * 1000;

    return this.accessToken;
  }

  /**
   * A generic, authenticated fetch wrapper.
   * This replaces specific domain logic so the package remains purely about M2M Auth.
   *
   * @param endpoint
   * @param options
   */
  async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAccessToken();

    // Merge the Authorization header with any other headers passed in
    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`[M2M Client] API Error at ${endpoint}: ${response.status} ${errText}`);
    }

    return response.json();
  }
}
