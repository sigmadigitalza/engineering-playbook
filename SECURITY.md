# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this repository, please report it
responsibly.

**Please do not open a public issue.** Instead, email
[security@sigmadigital.co.za](mailto:security@sigmadigital.co.za) with:

1. A description of the vulnerability.
2. Steps to reproduce, or a proof of concept.
3. The potential impact.

We aim to acknowledge receipt within 48 hours and to provide a fix or mitigation
plan within 7 days for confirmed issues.

## Scope

This repository is a **static documentation site** built with
[Lume](https://lume.land/) and deployed to GitHub Pages. It has no
authentication, no user-input processing, no API surface, and no sensitive data
at runtime.

The realistic security concerns are therefore:

- **Supply-chain integrity** of the build pipeline (Deno modules, the Lume
  static-site generator).
- **Content integrity** of the deployed static assets.
- **Injection via contributed content** — Markdown is rendered and trusted by
  design; this is mitigated by pull-request review.

## Security posture (audited June 2026)

A static code review of the front end found **no exploitable vulnerabilities**.
The attack surface is intentionally minimal; the findings below are
defence-in-depth / best-practice items.

| #   | Finding                                                          | Severity | Status                                                                                                          |
| --- | --------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| B-4 | Build dependencies were not integrity-pinned (`"lock": false`)   | Low      | **Resolved** — lockfile enabled and `deno.lock` committed.                                                     |
| B-1 | No Content-Security-Policy                                       | Low      | **Resolved** — a strict CSP `<meta>` is emitted on every layout-rendered page in production builds (see below). |
| B-3 | Self-contained design pages were not covered by the CSP          | Low      | **Resolved** — the standalone `docs/design/` pages now carry their own CSP `<meta>`. Because they embed inline demo `<script>`/`<style>`, that policy permits `'unsafe-inline'` for script and style while keeping the rest strict (no external scripts, `object-src`/`frame-src 'none'`, `base-uri 'self'`). |
| B-2 | Google Fonts loaded without Subresource Integrity                | Low      | Accepted — the Google Fonts origins are explicitly allow-listed in the CSP (`style-src`/`font-src`), not wildcarded, and SRI is impractical for Google's dynamically generated stylesheet. Self-hosting the (OFL-licensed) fonts would remove the third-party dependency but is not currently planned. |
| B-5 | Rendered Markdown is trusted (`\|> safe`)                        | Low      | Accepted — by design; mitigated by PR review.                                                                  |

### Content-Security-Policy

Production pages rendered through the site layout ship with:

```
default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none';
object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'none';
upgrade-insecure-requests
```

It is delivered as a `<meta http-equiv>` tag because GitHub Pages does not allow
custom response headers; consequently `frame-ancestors` and reporting directives
are unavailable. The policy is emitted for production builds only — the local
development server's live-reload tooling relies on inline scripts that a strict
policy would block.

The self-contained design pages under `docs/design/` carry a companion policy
that additionally allows `'unsafe-inline'` for their embedded demo `<script>` and
`<style>`; every other directive matches the strict policy above.

## Supported Versions

This is a living documentation repository. Only the `main` branch is deployed,
and security fixes are applied to `main` directly.
