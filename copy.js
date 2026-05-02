// Adds a copy-to-clipboard button to every <pre> code block in the prose body.
// Wraps each <pre> in a positioned container so the button can sit absolutely
// in the top-right corner without disturbing layout flow.
(function () {
  const blocks = document.querySelectorAll("article.prose pre");

  for (const pre of blocks) {
    const code = pre.querySelector("code");
    if (!code) continue;

    const wrap = document.createElement("div");
    wrap.className = "code-block";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.setAttribute("aria-label", "Copy code to clipboard");
    btn.textContent = "Copy";

    btn.addEventListener("click", async () => {
      const text = code.innerText;
      let ok = false;

      // Preferred path — async clipboard API.
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          ok = true;
        } catch (_err) {
          // fall through to execCommand fallback
        }
      }

      // Fallback for older browsers and contexts where the async API is
      // blocked (some sandboxed iframes, file://, headless test runners).
      if (!ok) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        try {
          ok = document.execCommand("copy");
        } catch (_err) {
          ok = false;
        }
        document.body.removeChild(ta);
      }

      btn.textContent = ok ? "Copied" : "Failed";
      if (ok) btn.classList.add("is-copied");
      setTimeout(() => {
        btn.textContent = "Copy";
        btn.classList.remove("is-copied");
      }, 1500);
    });

    wrap.appendChild(btn);
  }
})();
