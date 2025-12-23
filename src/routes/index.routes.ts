import type { FastifyPluginAsync } from "fastify";
import { getConfig } from "../core/config.js";

export const indexRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", async (request, reply) => {
    const protocol = request.headers["x-forwarded-proto"] || request.protocol;
    const host =
      request.headers["x-forwarded-host"] ||
      request.headers.host ||
      request.hostname;
    const config = getConfig();
    const baseUrl = config.publicBaseUrl || `${protocol}://${host}`;
    const badgeBasePath = "/badge/sample";

    return reply.type("text/html").send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Maintenance Badge - GitHub Sponsors Progress Tracking</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="Dynamic SVG badges showing real-time funding progress for GitHub Sponsors">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');

          :root {
            color-scheme: light;
            --bg: #f8f8f5;
            --bg-strong: #0f0f10;
            --ink: #0e0f11;
            --ink-muted: #5b5f66;
            --line: #d7d9de;
            --card: #ffffff;
            --accent: #111111;
            --accent-ghost: #f0f1f3;
            --mono: "IBM Plex Mono", "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
            --display: "Space Grotesk", "IBM Plex Sans", "Segoe UI", sans-serif;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: var(--display);
            line-height: 1.6;
            color: var(--ink);
            background:
              linear-gradient(120deg, rgba(15, 15, 16, 0.08), rgba(15, 15, 16, 0) 60%),
              linear-gradient(0deg, rgba(15, 15, 16, 0.04), rgba(15, 15, 16, 0.04)),
              var(--bg);
            min-height: 100vh;
          }

          body::before {
            content: "";
            position: fixed;
            inset: 0;
            background-image:
              linear-gradient(transparent 23px, rgba(15, 15, 16, 0.06) 24px),
              linear-gradient(90deg, transparent 23px, rgba(15, 15, 16, 0.06) 24px);
            background-size: 24px 24px;
            opacity: 0.25;
            pointer-events: none;
            z-index: -1;
          }

          .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 56px 24px 72px;
          }

          .hero {
            background: var(--card);
            border-radius: 24px;
            padding: 48px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 28px;
            box-shadow: 0 40px 80px rgba(16, 17, 20, 0.12);
            border: 1px solid var(--line);
            position: relative;
            overflow: hidden;
            animation: fade-up 0.6s ease-out;
          }

          .hero::after {
            content: "";
            position: absolute;
            right: -120px;
            top: -120px;
            width: 280px;
            height: 280px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(15, 15, 16, 0.25), transparent 70%);
            opacity: 0.5;
          }

          .pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-family: var(--mono);
            font-size: 12px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 6px 12px;
            border-radius: 999px;
            border: 1px solid var(--line);
            background: var(--accent-ghost);
            color: var(--ink);
          }

          h1 {
            font-size: clamp(2.4rem, 3vw, 3.4rem);
            line-height: 1.1;
            margin: 20px 0 16px;
          }

          .tagline {
            font-size: 1.1rem;
            color: var(--ink-muted);
            margin-bottom: 24px;
            max-width: 520px;
          }

          .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
          }

          .hero-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 16px 0 18px;
            justify-content: flex-start;
            align-items: center;
            padding: 6px 10px 10px;
            width: fit-content;
          }

          .hero-badges img {
            height: 26px;
            max-width: 100%;
          }

          .cta-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-strong);
            color: #ffffff;
            padding: 16px 32px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1.05rem;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 16px 32px rgba(15, 15, 16, 0.22);
            gap: 10px;
          }

            .cta-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 16px 28px rgba(15, 15, 16, 0.25);
            }

            .cta-button svg {
              width: 19px;
              height: 19px;
              display: block;
            }

          .ghost-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 13px 26px;
            border-radius: 10px;
            border: 1px solid var(--line);
            text-decoration: none;
            color: var(--ink);
            font-weight: 600;
            background: #ffffff;
          }

          .terminal {
            background: var(--bg-strong);
            color: #d9dadd;
            border-radius: 16px;
            padding: 24px;
            font-family: var(--mono);
            font-size: 0.9rem;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
          }

          .terminal-header {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
          }

          .terminal-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
          }

          .terminal-line {
            opacity: 0.85;
            margin-bottom: 10px;
          }

          .terminal-line strong {
            color: #ffffff;
          }

          .section {
            margin-top: 56px;
            animation: fade-up 0.8s ease-out;
          }

          .sponsor-banner {
            background: #ffffff;
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 22px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            box-shadow: 0 18px 40px rgba(15, 15, 16, 0.08);
          }

          .sponsor-banner p {
            margin: 0;
            color: var(--ink);
            max-width: 520px;
          }

          .sponsor-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 20px;
            border-radius: 10px;
            background: var(--bg-strong);
            color: #ffffff;
            text-decoration: none;
            font-weight: 600;
            font-family: var(--mono);
          }

          .sponsor-actions {
            display: inline-flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
          }

          .sponsor-ghost {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 11px 18px;
            border-radius: 10px;
            border: 1px solid var(--line);
            text-decoration: none;
            color: var(--ink);
            font-weight: 600;
            background: #ffffff;
            font-family: var(--mono);
            font-size: 0.9rem;
          }

          .section-title {
            font-size: 1.8rem;
            margin-bottom: 20px;
          }

          .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 18px;
          }

          .use-cases {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
          }

          .use-case {
            background: var(--card);
            padding: 20px 22px;
            border-radius: 14px;
            border: 1px solid var(--line);
          }

          .use-case h3 {
            margin-bottom: 8px;
            font-size: 1.05rem;
          }

          .trust-strip {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 16px;
          }

          .trust-pill {
            display: inline-flex;
            align-items: center;
            padding: 8px 12px;
            border-radius: 999px;
            border: 1px solid var(--line);
            background: #ffffff;
            font-family: var(--mono);
            font-size: 0.8rem;
            color: var(--ink);
          }

          .feature {
            background: var(--card);
            padding: 22px;
            border-radius: 16px;
            border: 1px solid var(--line);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .feature:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(15, 15, 16, 0.12);
          }

          .feature h3 {
            margin-bottom: 8px;
            font-size: 1.2rem;
          }

          .how-it-works {
            display: grid;
            gap: 16px;
          }

          .step {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 16px;
            padding: 18px 20px;
            border-radius: 14px;
            background: #ffffff;
            border: 1px solid var(--line);
          }

          .step-number {
            font-family: var(--mono);
            font-weight: 600;
            font-size: 0.9rem;
            color: #ffffff;
            background: var(--bg-strong);
            border-radius: 999px;
            padding: 8px 14px;
            height: fit-content;
          }

          .step-content strong {
            display: block;
            font-size: 1.1rem;
            margin-bottom: 6px;
          }

          .badge-example {
            background: var(--card);
            padding: 28px;
            border-radius: 18px;
            border: 1px solid var(--line);
          }

          .badge-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 12px;
          }

          .badge-card {
            background: #ffffff;
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 20px 16px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            min-height: 110px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .badge-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(15, 15, 16, 0.08);
          }

          .badge-art {
            width: 100%;
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;
          }

          .badge-art img,
          .badge-card img {
            height: auto;
            width: auto;
            max-width: 100%;
            display: block;
            margin: 0;
          }

          .badge-label {
            font-family: var(--mono);
            font-size: 0.8rem;
            color: var(--ink-muted);
            font-weight: 500;
          }

          .badge-note {
            font-family: var(--mono);
            font-size: 0.75rem;
            color: var(--ink-muted);
            margin-top: 6px;
          }

          .embed-heading {
            padding-top: 6px;
          }

          .badge-cta {
            margin-top: 10px;
          }

          code {
            background: #f0f1f3;
            padding: 2px 6px;
            border-radius: 6px;
            font-family: var(--mono);
            font-size: 0.9em;
          }

          .code-block {
            background: #0f0f10;
            color: #f3f4f6;
            padding: 18px;
            border-radius: 12px;
            overflow-x: auto;
            margin-top: 12px;
            font-family: var(--mono);
            font-size: 0.88rem;
          }

          .faq {
            background: var(--card);
            padding: 28px;
            border-radius: 18px;
            border: 1px solid var(--line);
          }

          .faq-list {
            list-style: none;
            padding: 0;
          }

          .faq-item {
            padding: 14px 0;
            border-bottom: 1px dashed var(--line);
          }

          .faq-item:last-child {
            border-bottom: none;
          }

          .faq-item strong {
            display: block;
            margin-bottom: 6px;
          }

          footer {
            text-align: center;
            padding: 40px 20px 20px;
            color: var(--ink-muted);
            font-family: var(--mono);
            font-size: 0.85rem;
          }

          @keyframes fade-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 768px) {
            .container {
              padding: 40px 20px 64px;
            }

            .hero {
              padding: 32px 24px;
            }

            .hero-badges img {
              height: 22px;
            }

            .actions {
              flex-direction: column;
              align-items: stretch;
            }

            .cta-button {
              padding: 14px 24px;
              font-size: 1rem;
            }

            .badge-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }

            .badge-card {
              min-height: 108px;
              padding: 16px;
            }

            .badge-card img {
              max-width: 92%;
              height: 24px;
            }

            .badge-art {
              min-height: 32px;
            }

            .section {
              margin-top: 40px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="hero">
            <div>
              <span class="pill">BUILD STATUS: LIVE</span>
              <h1>Maintenance Badge</h1>
              <p class="tagline">
                Built for maintainers. Turn your funding goals into badges that explain the
                real cost of keeping your project healthy.
              </p>
              <div class="hero-badges">
                <img src="${badgeBasePath}/5000" alt="Example badge 5000">
              </div>
              <div class="actions">
                <a href="/auth/github" class="cta-button">
                  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"></path>
                  </svg>
                  Generate your badge
                </a>
                <a href="#usage" class="ghost-button">See live example</a>
              </div>
            </div>
            <div class="terminal">
              <div class="terminal-header">
                <span class="terminal-dot"></span>
                <span class="terminal-dot"></span>
                <span class="terminal-dot"></span>
              </div>
              <div class="terminal-line">$ curl -I ${baseUrl}/badge/sample/5000</div>
              <div class="terminal-line"><strong>HTTP/1.1 200</strong> image/svg+xml</div>
              <div class="terminal-line">cache-control: public, max-age=3600</div>
              <div class="terminal-line">etag: "a1b2c3d4e5f6g7h8i9"</div>
            </div>
          </div>

          <section class="section">
            <h2 class="section-title">Why maintainers use it</h2>
            <div class="features">
              <div class="feature">
                <h3>Make the ask simple</h3>
                <p>Show a clear goal with progress percentage so users understand how they can help.</p>
              </div>
              <div class="feature">
                <h3>Smart color progression</h3>
                <p>Badge color changes from red → orange → yellow → green → purple as you progress.</p>
              </div>
              <div class="feature">
                <h3>Keep focus on shipping</h3>
                <p>The badge updates itself every 5 minutes, so you don't have to explain it every week.</p>
              </div>
              <div class="feature">
                <h3>Safe by default</h3>
                <p>Tokens are encrypted, scopes are minimal, and access is revocable.</p>
              </div>
            </div>
            <div class="trust-strip" aria-label="Trust signals">
              <span class="trust-pill">No repo access</span>
              <span class="trust-pill">Read-only</span>
              <span class="trust-pill">Revocable</span>
              <span class="trust-pill">Auto-updates</span>
              <span class="trust-pill">Percentage display</span>
            </div>
          </section>

          <section class="section">
            <h2 class="section-title">Color progression</h2>
            <p>Badge color automatically changes based on your funding progress:</p>
            <div class="badge-example" style="margin-top: 16px;">
              <div class="badge-grid">
                <div class="badge-card">
                  <div class="badge-art">
                    <img src="${badgeBasePath}/5000?current=500&style=flat-square" alt="10% progress - red">
                  </div>
                  <div class="badge-label">🔴 10% - Critical</div>
                </div>
                <div class="badge-card">
                  <div class="badge-art">
                    <img src="${badgeBasePath}/5000?current=1500&style=flat-square" alt="30% progress - orange">
                  </div>
                  <div class="badge-label">🟠 30% - Needs attention</div>
                </div>
                <div class="badge-card">
                  <div class="badge-art">
                    <img src="${badgeBasePath}/5000?current=2500&style=flat-square" alt="50% progress - yellow">
                  </div>
                  <div class="badge-label">🟡 50% - Making progress</div>
                </div>
                <div class="badge-card">
                  <div class="badge-art">
                    <img src="${badgeBasePath}/5000?current=4500&style=flat-square" alt="90% progress - green">
                  </div>
                  <div class="badge-label">🟢 90% - Almost there</div>
                </div>
                <div class="badge-card">
                  <div class="badge-art">
                    <img src="${badgeBasePath}/5000?current=8000&style=flat-square" alt="160% progress - purple">
                  </div>
                  <div class="badge-label">🟣 160% - Goal exceeded!</div>
                </div>
              </div>
            </div>
          </section>

          <section class="section">
            <h2 class="section-title">Use cases</h2>
            <div class="use-cases">
              <div class="use-case">
                <h3>README highlight</h3>
                <p>Put the badge next to install steps to show the maintenance goal.</p>
              </div>
              <div class="use-case">
                <h3>Docs footer</h3>
                <p>Surface support options right where users are learning.</p>
              </div>
              <div class="use-case">
                <h3>Project landing</h3>
                <p>Add a funding badge to your homepage or changelog.</p>
              </div>
            </div>
          </section>

          <section class="section">
            <h2 class="section-title">How it works</h2>
            <div class="how-it-works">
              <div class="step">
                <div class="step-number">01</div>
                <div class="step-content">
                  <strong>Connect GitHub Sponsors</strong>
                  Authorize read‑only access to your sponsor totals.
                </div>
              </div>
              <div class="step">
                <div class="step-number">02</div>
                <div class="step-content">
                  <strong>Set your maintenance goal</strong>
                  Pick a monthly target that reflects support, fixes, and roadmap work.
                </div>
              </div>
              <div class="step">
                <div class="step-number">03</div>
                <div class="step-content">
                  <strong>Publish the badge</strong>
                  Add it to your README or docs so users can back you.
                </div>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="sponsor-banner">
              <p>
                This project is free to use. If it helps your maintenance story, consider sponsoring to keep it alive.
              </p>
              <div class="sponsor-actions">
                <a class="sponsor-button" href="https://github.com/sponsors/yourusername" target="_blank">
                  Sponsor this project
                </a>
                <a class="sponsor-ghost" href="https://github.com/yourusername/maintenance-badge" target="_blank">
                  View on GitHub
                </a>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="faq">
              <h2 class="section-title">FAQ</h2>
              <ul class="faq-list">
                <li class="faq-item">
                  <strong>Why do you need OAuth?</strong>
                  OAuth lets the badge read your GitHub Sponsors totals with read‑only access.
                </li>
                <li class="faq-item">
                  <strong>Where do the numbers come from?</strong>
                  They come directly from the GitHub Sponsors API for your account.
                </li>
                <li class="faq-item">
                  <strong>Does it update automatically?</strong>
                  Yes, the badge refreshes about every 5 minutes (longer if rate limits apply).
                </li>
                <li class="faq-item">
                  <strong>Do you store financial data?</strong>
                  No, we only store an encrypted OAuth token so the badge can render.
                </li>
                <li class="faq-item">
                  <strong>Can I revoke access?</strong>
                  Yes, disconnect anytime and the badge will stop updating.
                </li>
              </ul>
            </div>
          </section>

          <section class="section" id="usage">
            <div class="badge-example">
              <h2 class="section-title">Badge examples</h2>
              <p>Use these to communicate your maintenance needs clearly:</p>
              <div class="badge-grid">
                <div class="badge-card">
                  <div class="badge-art">
                    <img src="${badgeBasePath}/5000?style=flat" alt="Flat badge example">
                  </div>
                  <div class="badge-label">flat</div>
                </div>
                <div class="badge-card">
                  <div class="badge-art">
                    <img src="${badgeBasePath}/5000?style=flat-square" alt="Flat-square badge example">
                  </div>
                  <div class="badge-label">flat-square</div>
                </div>
                <div class="badge-card">
                  <div class="badge-art">
                    <img src="${badgeBasePath}/5000?style=for-the-badge" alt="For-the-badge example">
                  </div>
                  <div class="badge-label">for-the-badge</div>
                </div>
              </div>
              <div class="badge-note" style="margin-top: 12px;">Default style is <strong>flat</strong>. Choose the one that matches your project.</div>
              <div class="badge-cta">
                <a href="/auth/github" class="cta-button">Connect to get your badge URL</a>
              </div>
            </div>
          </section>
        </div>

        <footer>
          <p>Open-source badges for sustainable maintenance.</p>
        </footer>
      </body>
      </html>
    `);
  });
};
