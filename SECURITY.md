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
| B-3 | Self-contained design pages are not yet covered by the CSP       | Low      | Open — the standalone pages under `docs/design/` carry inline `<script>`/`<style>` and ship without their own policy. A follow-up will extract those assets or add a per-page CSP. |
| B-2 | Google Fonts loaded without Subresource Integrity                | Low      | Open — SRI is impractical for Google's dynamically generated stylesheet. Self-hosting the (OFL-licensed) fonts is the planned mitigation and would also let the CSP drop the external font origins. |
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

## Supported Versions

This is a living documentation repository. Only the `main` branch is deployed,
and security fixes are applied to `main` directly.
