import { FastifyPluginAsync } from 'fastify';
import { GitHubOAuthService } from '../services/oauth.service.js';
import { TokenStorageService } from '../services/token-storage.service.js';
import { randomBytes } from 'crypto';

// In-memory state storage (en producción usar Redis)
const pendingStates = new Map<string, { createdAt: number }>();

// Limpiar states expirados cada 5 minutos
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [state, data] of pendingStates.entries()) {
    if (data.createdAt < fiveMinutesAgo) {
      pendingStates.delete(state);
    }
  }
}, 5 * 60 * 1000);

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize services inside the plugin (after config is loaded)
  const oauthService = new GitHubOAuthService();
  const tokenStorage = new TokenStorageService();
  // Iniciar OAuth flow
  fastify.get('/auth/github', async (_request, reply) => {
    const state = randomBytes(32).toString('hex');
    pendingStates.set(state, { createdAt: Date.now() });

    const authUrl = oauthService.getAuthorizationUrl(state);
    return reply.redirect(authUrl);
  });

  // GitHub OAuth callback
  fastify.get('/auth/github/callback', async (request, reply) => {
    const { code, state } = request.query as { code?: string; state?: string };

    // Validar state
    if (!state || !pendingStates.has(state)) {
      return reply.code(400).send({ error: 'Invalid or expired state parameter' });
    }
    pendingStates.delete(state);

    if (!code) {
      return reply.code(400).send({ error: 'No authorization code provided' });
    }

    try {
      // Intercambiar código por token
      const tokenData = await oauthService.exchangeCodeForToken(code);

      // Obtener info del usuario
      const user = await oauthService.getUserInfo(tokenData.access_token);

      // Guardar token encriptado
      await tokenStorage.saveUserToken({
        githubUsername: user.login,
        githubUserId: user.id.toString(),
        accessToken: tokenData.access_token,
        scope: tokenData.scope,
      });

      // Redirect a página de éxito con badge URL
      const protocol = request.headers['x-forwarded-proto'] || request.protocol;
      const host = request.headers['x-forwarded-host'] || request.hostname;
      const badgeBaseUrl = `${protocol}://${host}/badge/github/${user.login}`;
      const defaultGoal = 5000;
      const badgeUrl = `${badgeBaseUrl}/${defaultGoal}`;

      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Successful</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');

            body {
              font-family: "Space Grotesk", "Segoe UI", sans-serif;
              margin: 0;
              min-height: 100vh;
              background:
                radial-gradient(circle at top right, rgba(15, 15, 16, 0.12), transparent 45%),
                linear-gradient(120deg, rgba(15, 15, 16, 0.06), rgba(15, 15, 16, 0) 60%),
                #f8f8f5;
              color: #0e0f11;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 40px 20px;
            }

            .card {
              background: #ffffff;
              border-radius: 22px;
              border: 1px solid #d7d9de;
              box-shadow: 0 30px 80px rgba(15, 15, 16, 0.15);
              padding: 36px;
              max-width: 640px;
              width: 100%;
              text-align: left;
            }

            .success {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 6px 12px;
              border-radius: 999px;
              background: #eef5ef;
              color: #2f6d3b;
              font-weight: 600;
              font-size: 0.9rem;
            }

            h1 {
              font-size: clamp(1.9rem, 2.6vw, 2.4rem);
              margin: 18px 0 10px;
            }

            p {
              margin: 0 0 14px;
              color: #4b4f57;
              line-height: 1.6;
            }

            code {
              background: #f0f1f3;
              padding: 14px 16px;
              border-radius: 10px;
              display: block;
              margin: 16px 0;
              font-size: 0.9rem;
              word-break: break-all;
              font-family: "IBM Plex Mono", "SFMono-Regular", Menlo, Consolas, monospace;
            }

            .code-block {
              position: relative;
            }

            .copy-button {
              position: absolute;
              top: 10px;
              right: 10px;
              padding: 6px 10px;
              border-radius: 8px;
              border: 1px solid #d7d9de;
              background: #ffffff;
              font-size: 0.75rem;
              font-weight: 600;
              cursor: pointer;
            }

            .copy-button:active {
              transform: translateY(1px);
            }
            .badge-preview {
              margin: 20px 0 12px;
              padding: 16px;
              background: #f0f1f3;
              border-radius: 12px;
              display: flex;
              justify-content: center;
            }

            h3 {
              margin: 18px 0 8px;
              font-size: 1.05rem;
            }

            .style-options {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin: 10px 0 18px;
            }

            .style-button {
              border: 1px solid #d7d9de;
              background: #ffffff;
              border-radius: 999px;
              padding: 6px 12px;
              font-size: 0.75rem;
              font-weight: 600;
              cursor: pointer;
              font-family: "IBM Plex Mono", "SFMono-Regular", Menlo, Consolas, monospace;
              transition: all 0.2s ease;
            }

            .style-button:hover {
              border-color: #0f0f10;
              transform: translateY(-1px);
            }

            .style-button.active {
              background: #0f0f10;
              color: #ffffff;
              border-color: #0f0f10;
            }

            .actions {
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
              margin-top: 18px;
            }

            .button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 12px 18px;
              border-radius: 10px;
              text-decoration: none;
              font-weight: 600;
              font-size: 0.95rem;
              border: 1px solid #d7d9de;
              color: #0e0f11;
              background: #ffffff;
            }

            .button-primary {
              background: #0f0f10;
              color: #ffffff;
              border-color: #0f0f10;
            }

            .meta {
              font-family: "IBM Plex Mono", "SFMono-Regular", Menlo, Consolas, monospace;
              font-size: 0.75rem;
              color: #6a6f78;
              margin-top: 6px;
              line-height: 1.5;
            }

            .goal-control {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              align-items: center;
              margin: 6px 0 16px;
            }

            .goal-control input {
              border: 1px solid #d7d9de;
              border-radius: 10px;
              padding: 10px 12px;
              font-size: 0.9rem;
              min-width: 160px;
              font-family: "IBM Plex Mono", "SFMono-Regular", Menlo, Consolas, monospace;
            }

            @media (max-width: 640px) {
              .card {
                padding: 28px;
              }
              .actions {
                flex-direction: column;
                align-items: stretch;
              }
              .goal-control {
                flex-direction: column;
                align-items: stretch;
              }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="success">Connected successfully</div>
            <h1>Your badge is ready</h1>
            <p>Your GitHub account <strong>@${user.login}</strong> is connected. Share your badge anywhere.</p>

            <h3>Badge URL</h3>
            <div class="code-block">
              <code id="badge-url">${badgeUrl}</code>
              <button class="copy-button" type="button" data-copy="badge-url">Copy</button>
            </div>

            <div class="badge-preview">
              <img id="badge-preview" src="${badgeUrl}" alt="Maintenance Badge">
            </div>
            <div class="meta">Set your monthly goal to generate the right badge. Color changes based on progress: 🔴 &lt;20% → 🟠 20-40% → 🟡 40-80% → 🟢 80-150% → 🟣 &gt;150%</div>

            <div class="goal-control">
              <label for="goal-input"><strong>Goal amount</strong></label>
              <input id="goal-input" type="number" min="1" step="1" value="${defaultGoal}">
            </div>

            <h3>Quick styles</h3>
            <div class="style-options" role="group" aria-label="Badge styles">
              <button class="style-button active" type="button" data-style="flat">flat</button>
              <button class="style-button" type="button" data-style="flat-square">flat-square</button>
              <button class="style-button" type="button" data-style="for-the-badge">for-the-badge</button>
            </div>

            <h3>README snippet</h3>
            <div class="code-block">
              <code id="readme-snippet">[![Maintenance](${badgeUrl})](https://github.com/sponsors/${user.login})</code>
              <button class="copy-button" type="button" data-copy="readme-snippet">Copy</button>
            </div>

            <div class="actions">
              <a class="button button-primary" href="/">Back to home</a>
              <a class="button" href="https://github.com/sponsors/${user.login}" target="_blank">
                View your Sponsors page
              </a>
            </div>
          </div>
          <script>
            const baseBadgeUrl = "${badgeBaseUrl}";
            const defaultGoal = ${defaultGoal};
            const sponsorsUrl = "https://github.com/sponsors/${user.login}";
            const preview = document.getElementById('badge-preview');
            const badgeUrlCode = document.getElementById('badge-url');
            const snippetCode = document.getElementById('readme-snippet');
            const goalInput = document.getElementById('goal-input');

            function getGoal() {
              const value = Number.parseInt(goalInput.value, 10);
              return Number.isFinite(value) && value > 0 ? value : defaultGoal;
            }

            function updateBadge(style) {
              const goal = getGoal();
              const urlBase = baseBadgeUrl + '/' + goal;
              const url = style === 'flat' ? urlBase : urlBase + '?style=' + style;
              preview.src = url;
              badgeUrlCode.textContent = url;
              snippetCode.textContent = '[![Maintenance](' + url + ')](' + sponsorsUrl + ')';
            }

            document.querySelectorAll('.style-button').forEach((button) => {
              button.addEventListener('click', () => {
                document.querySelectorAll('.style-button').forEach((btn) => {
                  btn.classList.toggle('active', btn === button);
                });
                updateBadge(button.getAttribute('data-style'));
              });
            });

            goalInput.addEventListener('input', () => {
              const active = document.querySelector('.style-button.active');
              updateBadge(active ? active.getAttribute('data-style') : 'flat');
            });

            document.querySelectorAll('[data-copy]').forEach((button) => {
              button.addEventListener('click', async () => {
                const targetId = button.getAttribute('data-copy');
                const target = document.getElementById(targetId);
                if (!target) return;
                try {
                  await navigator.clipboard.writeText(target.textContent || '');
                  const original = button.textContent;
                  button.textContent = 'Copied';
                  setTimeout(() => {
                    button.textContent = original;
                  }, 1500);
                } catch (error) {
                  button.textContent = 'Failed';
                }
              });
            });
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      request.log.error({ error }, 'OAuth callback failed');
      return reply.code(500).send({ error: 'OAuth authorization failed' });
    }
  });

  // Revocar acceso
  fastify.post('/auth/revoke', async (request, reply) => {
    const { username } = request.body as { username?: string };

    if (!username) {
      return reply.code(400).send({ error: 'Username required' });
    }

    try {
      await tokenStorage.deleteUserToken(username);
      return reply.send({ success: true, message: 'Access revoked' });
    } catch (error) {
      request.log.error({ error, username }, 'Failed to revoke access');
      return reply.code(500).send({ error: 'Failed to revoke access' });
    }
  });

  // Check auth status
  fastify.get('/auth/status/:username', async (request, reply) => {
    const { username } = request.params as { username: string };

    const hasToken = await tokenStorage.hasToken(username);

    return reply.send({
      username,
      authorized: hasToken,
    });
  });
};
