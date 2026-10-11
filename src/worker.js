/* baw.haus front door. Cloudflare runs this before every request
   (run_worker_first in wrangler.jsonc).

   While LOCKED is true, visitors see a password page until they enter the
   password. After that a cookie keeps them in for 30 days.

   - To open the site to everyone: set LOCKED to false and push.
   - To change the password without editing code: in Cloudflare, open the
     Worker → Settings → Variables and Secrets → Add, type Secret, name
     SITE_PASSWORD. It replaces the password below. Everyone has to enter
     the new one.

   The password is stored only as a SHA-256 fingerprint, never as text.
   This also sets the headers that keep the site out of search engines. */

const LOCKED = true;
const PASSWORD_SHA256 = "0e6a8e0b849ed9b064c5a25e1ee5592f427e3eb9d250e42069ce46147d00e8d4";

const COOKIE = "baw_pass";
const THIRTY_DAYS = 60 * 60 * 24 * 30;
const LOGIN_PATH = "/__enter";

// Files anyone can load: the password page needs the fonts and icon, and
// link previews (LinkedIn, iMessage) need the share image.
const OPEN = [/^\/robots\.txt$/, /^\/fonts\//, /^\/img\/ui\//];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (!LOCKED || OPEN.some((re) => re.test(path))) {
      return serve(request, env, path);
    }

    const expected = env.SITE_PASSWORD ? await sha256(env.SITE_PASSWORD) : PASSWORD_SHA256;
    const token = await sha256("baw.haus|" + expected);

    // The form's address on its own (a refresh after a wrong password) goes home
    if (path === LOGIN_PATH && request.method !== "POST") {
      return new Response(null, { status: 303, headers: { Location: "/", "Cache-Control": "no-store" } });
    }

    if (path === LOGIN_PATH && request.method === "POST") {
      const form = await request.formData();
      const next = safeNext(form.get("next"));
      if ((await sha256(String(form.get("password") || ""))) === expected) {
        return new Response(null, {
          status: 303,
          headers: {
            Location: next,
            "Set-Cookie": `${COOKIE}=${token}; Path=/; Max-Age=${THIRTY_DAYS}; HttpOnly; Secure; SameSite=Lax`,
            "Cache-Control": "no-store",
          },
        });
      }
      return loginPage(next, true, 401);
    }

    if (readCookie(request, COOKIE) === token) {
      return serve(request, env, path, true);
    }

    // Pages get the password form; anything else (an image, a script) is refused
    const wantsPage = (request.headers.get("Accept") || "").includes("text/html");
    if (wantsPage) return loginPage(path + url.search, false, 200);
    return new Response("Password required", { status: 401, headers: baseHeaders() });
  },
};

// Hand the request to the site's files and add the site-wide headers
async function serve(request, env, path, isPrivate) {
  const res = await env.ASSETS.fetch(request);
  const out = new Response(res.body, res);
  out.headers.set("X-Robots-Tag", "noindex, noimageindex");
  if (path.startsWith("/fonts/")) {
    // Fonts never change once published, so browsers can keep them
    out.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (isPrivate) {
    // Password-protected files are never stored by shared caches
    out.headers.set("Cache-Control", "private, no-cache");
  }
  return out;
}

function baseHeaders() {
  return {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, noimageindex",
  };
}

async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

// Only ever send people back to a page on this site
function safeNext(value) {
  const next = String(value || "/");
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function loginPage(next, failed, status) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Blake Austin Walter, AIA</title>
<meta name="robots" content="noindex, noimageindex">
<meta name="description" content="Architect and filmmaker. Associate Principal at KPF in London.">
<meta property="og:title" content="Blake Austin Walter, AIA">
<meta property="og:description" content="Architect and filmmaker. Associate Principal at KPF in London.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://baw.haus/">
<meta property="og:image" content="https://baw.haus/img/ui/share.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://baw.haus/img/ui/share.jpg">
<link rel="icon" href="/img/ui/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/img/ui/touch-icon.png">
<style>
@font-face { font-family: "Jost"; src: url("/fonts/jost-latin-300-normal.woff2") format("woff2"); font-weight: 300; font-display: swap; }
@font-face { font-family: "Jost"; src: url("/fonts/jost-latin-500-normal.woff2") format("woff2"); font-weight: 500; font-display: swap; }
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-tap-highlight-color: transparent; }
body {
  margin: 0; min-height: 100svh; display: grid; place-items: center;
  padding: 24px max(20px, 5vw);
  background: #04050c url("/img/ui/grain.png"); background-size: 160px 160px;
  color: #f3efe9; font: 300 clamp(18px, 0.45vw + 12.8px, 21px)/1.8 "Jost", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
main { width: min(100%, 26em); }
h1 { margin: 0 0 0.5em; font: 500 clamp(30px, 2vw, 48px)/1.15 "Jost", system-ui, sans-serif; }
p { margin: 0; }
form { margin-top: 1.6em; display: flex; gap: 10px; }
label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
input {
  flex: 1; min-width: 0; padding: 0.55em 0.8em; border: 0; border-radius: 0;
  background: rgba(243, 239, 233, 0.08); color: inherit; font: inherit;
}
button {
  padding: 0.55em 1.1em; border: 0; border-radius: 0; cursor: pointer;
  background: #f3efe9; color: #04050c; font: 500 1em/1.8 "Jost", system-ui, sans-serif;
}
input:focus-visible, button:focus-visible { outline: 2px solid #f3efe9; outline-offset: 3px; }
.error { margin-top: 0.8em; font-size: 15px; }
</style>
</head>
<body>
<main>
  <h1>Blake Austin Walter, AIA</h1>
  <p>This site is private for now. Please enter the password.</p>
  <form method="post" action="${LOGIN_PATH}">
    <input type="hidden" name="next" value="${escapeHtml(next)}">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" placeholder="Password" required autofocus>
    <button type="submit">Enter</button>
  </form>
  ${failed ? '<p class="error" role="alert">That password didn\'t work. Please try again.</p>' : ""}
</main>
<script>
  // Keep a project link (#one-north-quay) through the password step
  if (location.hash) document.querySelector('[name="next"]').value += location.hash;
</script>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, noimageindex",
    },
  });
}
