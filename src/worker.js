/* baw.haus: public assets, with indexing disabled.
   The old password gate and its cookie, login handler and password fingerprint
   have been removed. This worker does not require any SITE_PASSWORD secret.

   Search engines receive X-Robots-Tag headers as well as the matching meta
   robots instruction in public/index.html. noindex is not access control.
*/
const ROBOTS = "noindex, nofollow, noimageindex, noarchive, nosnippet";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Old password-form URLs should not remain accessible or bookmarked.
    if (url.pathname === "/__enter") {
      return new Response(null, {
        status: 308,
        headers: {
          Location: "/",
          "Cache-Control": "no-store",
          "X-Robots-Tag": ROBOTS,
        },
      });
    }

    const response = await env.ASSETS.fetch(request);
    const out = new Response(response.body, response);
    out.headers.set("X-Robots-Tag", ROBOTS);
    if (url.pathname.startsWith("/fonts/")) {
      out.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }
    return out;
  },
};
