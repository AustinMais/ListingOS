# Embed Site Concierge

Use the `/embed` route for a transparent background when embedding in an iframe.

Set `CLIENT_NAME` in your environment (e.g. `Austin Mais`) to customize the concierge for each SaaS deployment.

---

## Copy-paste for your webpage

**Option 1:** Paste this before `</body>` on any HTML page. Replace the URL with your deployed assistant URL.

```html
<!-- Site Concierge - paste before </body> -->
<iframe
  src="https://YOUR-ASSISTANT-URL.vercel.app/embed"
  style="position:fixed;bottom:0;right:0;width:440px;height:720px;border:none;background:transparent;z-index:9999;"
  title="Chat Assistant"
></iframe>
```

**Option 2:** Use a script tag — add the script before `</body>`. Update the `data-src` attribute with your assistant URL.

```html
<!-- Site Concierge - paste before </body> -->
<script>
(function() {
  var url = 'https://YOUR-ASSISTANT-URL.vercel.app/embed';
  var iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.style.cssText = 'position:fixed;bottom:0;right:0;width:440px;height:720px;border:none;background:transparent;z-index:9999;';
  iframe.title = 'Chat Assistant';
  document.body.appendChild(iframe);
})();
</script>
```

---

## Iframe embed code (reference)

Replace `https://your-assistant-domain.com` with your deployed URL (e.g. `https://automated-assistant.vercel.app`).

```html
<iframe
  src="https://your-assistant-domain.com/embed"
  style="
    position: fixed;
    bottom: 0;
    right: 0;
    width: 440px;
    height: 720px;
    border: none;
    background: transparent;
    z-index: 9999;
  "
  title="Chat Assistant"
></iframe>
```

## Dimensions

- **Width:** 440px (fits the 420px panel + margin)
- **Height:** 720px (fits the 640px panel + 8px gap + 48px icon + margin)
- **Position:** Fixed to bottom-right corner

## Transparency

- Use the `/embed` URL (not `/`) so the page background is transparent.
- The iframe itself uses `background: transparent`.
- Content behind the iframe will show through except where the chatbot (icon + panel) is drawn.

## Optional: Inline in page

To embed in a specific container instead of fixed to the corner:

```html
<div style="position: relative; width: 440px; height: 720px;">
  <iframe
    src="https://your-assistant-domain.com/embed"
    style="
      position: absolute;
      bottom: 0;
      right: 0;
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
    "
    title="Chat Assistant"
  ></iframe>
</div>
```
