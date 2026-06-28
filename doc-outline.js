/**
 * <doc-outline> — sticky document-outline sidebar web component.
 *
 * Reads headings from the host page DOM and renders an "On this page"
 * navigation with scroll-spy highlighting. Ported from the nanisca /
 * content-collider component; behaviour is identical, but the shadow DOM is
 * built with createElement + textContent (instead of innerHTML) so there's no
 * injection surface, and the sticky `top` / `max-height` clear the playbook's
 * fixed header via --header-height. Self-contained: Shadow DOM, no deps. It
 * themes off five CSS custom properties (with dark fallbacks) provided by the
 * host page — see styles.css.
 *
 * Usage:
 *   <doc-outline></doc-outline>
 *   <doc-outline selector=".prose h2, .prose h3"></doc-outline>
 *
 * Attributes:
 *   selector  — CSS selector for headings (default: "h2, h3")
 *
 * Viewport-gated: hidden below 1100px; a sticky 240px column above it.
 * Only headings that already have an `id` are listed.
 */
const STYLES = `
  :host { display: none; }
  @media (min-width: 1100px) {
    :host {
      display: block;
      position: sticky;
      top: calc(var(--header-height, 60px) + 1.5rem);
      width: 240px;
      min-width: 240px;
      max-height: calc(100vh - var(--header-height, 60px) - 3rem);
      overflow-y: auto;
      padding: 0 0 1rem 0;
      font-size: 0.8rem;
      line-height: 1.6;
    }
    :host::-webkit-scrollbar { width: 3px; }
    :host::-webkit-scrollbar-track { background: transparent; }
    :host::-webkit-scrollbar-thumb {
      background: var(--color-border, #334155);
      border-radius: 3px;
    }
  }
  .title {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-heading, #f1f5f9);
    margin-bottom: 0.75rem;
    padding-left: 0.75rem;
  }
  a {
    display: block;
    color: var(--color-dim, #64748b);
    text-decoration: none;
    padding: 0.2rem 0.75rem;
    border-left: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
  }
  a:hover { color: var(--color-accent-hover, #a5b4fc); }
  a.active {
    color: var(--color-accent, #818cf8);
    border-left-color: var(--color-accent, #818cf8);
  }
  a[data-level="3"] {
    padding-left: 1.5rem;
    font-size: 0.75rem;
  }
`;

class DocOutline extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._active = null;
    this._links = [];
    this._ids = [];
    this._onScroll = this._onScroll.bind(this);
  }

  connectedCallback() {
    const selector = this.getAttribute("selector") || "h2, h3";
    const headings = Array.from(document.querySelectorAll(selector)).filter(
      (el) => el.id,
    );
    if (headings.length === 0) return;

    const root = this.shadowRoot;
    // Apply styles via a constructable stylesheet so a strict Content-Security-
    // Policy (style-src 'self', no 'unsafe-inline') doesn't block them — an
    // injected <style> element is treated as inline and would be refused.
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(STYLES);
      root.adoptedStyleSheets = [sheet];
    } catch {
      // Engines without constructable stylesheets: fall back to a <style>
      // element (left unstyled if a CSP blocks it, but the links still work).
      const style = document.createElement("style");
      style.textContent = STYLES;
      root.appendChild(style);
    }

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = "On this page";
    root.appendChild(title);

    this._links = [];
    for (const el of headings) {
      const level = parseInt(el.tagName.substring(1), 10);
      const a = document.createElement("a");
      a.setAttribute("href", "#" + el.id);
      a.dataset.level = String(level);
      a.textContent = el.textContent || "";
      root.appendChild(a);
      this._links.push(a);
    }

    this._ids = this._links.map((a) => a.getAttribute("href").slice(1));
    window.addEventListener("scroll", this._onScroll, { passive: true });
    this._onScroll();
  }

  disconnectedCallback() {
    window.removeEventListener("scroll", this._onScroll);
  }

  _onScroll() {
    let current = null;
    for (let i = 0; i < this._ids.length; i++) {
      const el = document.getElementById(this._ids[i]);
      if (el && el.getBoundingClientRect().top <= 100) current = this._ids[i];
    }
    if (current !== this._active) {
      this._active = current;
      for (const a of this._links) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + current);
      }
    }
  }
}

customElements.define("doc-outline", DocOutline);
