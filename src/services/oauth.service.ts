import { getConfig } from '../core/config.js';
import { getLogger } from '../core/logger.js';

interface GitHubOAuthToken {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  login: string;
  id: number;
  name: string;
  email: string;
}

export class GitHubOAuthService {
  private logger = getLogger();

  private getConfig() {
    return getConfig();
  }

  getAuthorizationUrl(state: string): string {
    const config = this.getConfig();
    const params = new URLSearchParams({
      client_id: config.github.oauth.clientId,
      redirect_uri: config.github.oauth.callbackUrl,
      scope: 'read:user read:org',
      state,
      allow_signup: 'true',
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<GitHubOAuthToken> {
    const config = this.getConfig();
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.github.oauth.clientId,
        client_secret: config.github.oauth.clientSecret,
        code,
      }),
    });

    if (!response.ok) {
      this.logger.error({ status: response.status }, 'Failed to exchange code for token');
      throw new Error('Failed to exchange OAuth code for token');
    }

    const data: GitHubOAuthToken = await response.json();

    if (!data.access_token) {
      throw new Error('No access token in GitHub response');
    }

    return data;
  }

  async getUserInfo(accessToken: string): Promise<GitHubUser> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Maintenance-Badge',
      },
    });

    if (!response.ok) {
      this.logger.error({ status: response.status }, 'Failed to fetch user info');
      throw new Error('Failed to fetch GitHub user info');
    }

    return response.json();
  }
}
