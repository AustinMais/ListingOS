# Embed ListingOS

Use the `/embed` route for a transparent background when embedding in an iframe.

---

## Copy-paste for your webpage

**Option 1:** Paste this before `</body>` on any HTML page. Replace the URL with your deployed ListingOS URL.

```html
<!-- ListingOS - paste before </body> -->
<iframe
  src="https://YOUR-LISTINGOS-URL.vercel.app/embed"
  style="position:fixed;bottom:0;right:0;width:440px;height:720px;border:none;background:transparent;z-index:9999;"
  title="ListingOS | Intelligent Real Estate"
></iframe>
```

**Option 2:** Use a script tag — add the script before `</body>`. Update the `data-src` attribute with your ListingOS URL.

```html
<!-- ListingOS - paste before </body> -->
<script>
(function() {
  var url = 'https://YOUR-LISTINGOS-URL.vercel.app/embed';
  var iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.style.cssText = 'position:fixed;bottom:0;right:0;width:440px;height:720px;border:none;background:transparent;z-index:9999;';
  iframe.title = 'ListingOS | Intelligent Real Estate';
  document.body.appendChild(iframe);
})();
</script>
```

---

## Iframe embed code (reference)

Replace `https://your-listingos-domain.com` with your deployed URL (e.g. `https://listing-os.vercel.app`).

```html
<iframe
  src="https://your-listingos-domain.com/embed"
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
  title="ListingOS | Intelligent Real Estate"
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
    src="https://your-listingos-domain.com/embed"
    style="
      position: absolute;
      bottom: 0;
      right: 0;
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
    "
    title="ListingOS | Intelligent Real Estate"
  ></iframe>
</div>
```
