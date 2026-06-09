# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this repository, please report it responsibly.

**Do not open a public issue.** Instead, email [security@sigmadigital.co.za](mailto:security@sigmadigital.co.za) with:

1. A description of the vulnerability.
2. Steps to reproduce (or a proof of concept).
3. The potential impact.

We will acknowledge receipt within 48 hours and aim to provide a fix or mitigation plan within 7 days for confirmed issues.

## Scope

This repository is a **static documentation site** built with [Lume](https://lume.land/) and deployed to GitHub Pages. It has no authentication, no user input processing, no API surface, and no sensitive data at runtime.

The primary security concerns are:

- **Supply-chain integrity** of the build pipeline (Deno modules, Lume SSG).
- **Content integrity** of deployed static assets.
- **Preventing injection** via contributed markdown content (mitigated by PR review).

## Security Audit Summary (June 2026)

A Mode 1 (static code review) frontend security audit was performed against the repository. Key findings:

### Posture

The site has an **extremely small attack surface**. No exploitable vulnerabilities were identified. All findings are defense-in-depth / best-practice recommendations.

### Findings (by priority)

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| B-4 | Deno lockfile disabled (`"lock": false` in `deno.json`) — build deps not integrity-verified | Low | Open |
| B-1 | No Content-Security-Policy configured | Low | Open |
| B-2 | No Subresource Integrity on Google Fonts stylesheet (impractical due to dynamic generation) | Low | Open |
| B-5 | `{{ content \|> safe }}` trusts rendered markdown (by design; mitigated by PR review) | Low | Accepted |

### Recommendations

1. **Enable Deno lockfile** — remove `"lock": false` from `deno.json` and commit `deno.lock`.
2. **Add a CSP meta tag** to `_includes/layouts/base.vto`:
   ```
   default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com;
   font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none';
   frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none';
   ```
3. **Consider self-hosting fonts** to eliminate the external Google Fonts dependency.

## Supported Versions

This is a living documentation repository. Only the `main` branch is deployed. Security fixes are applied to `main` directly.
