# baw.haus

Portfolio site for Blake Austin Walter. Plain HTML, CSS and a little JavaScript: no framework, no build step. Cloudflare serves everything in `public/`.

## What's where

```
wrangler.jsonc        Cloudflare settings (the Worker name must match the dashboard)
public/index.html     The whole page, in commented blocks
public/css/style.css  Colors, type and spacing (edit :root at the top)
public/js/main.js     Opening projects, project links, video button, image viewer
public/img/<project>/ Images, one folder per project
public/video/         Video files (add hero-loop.mp4 here)
public/cv/            CV PDF (add blake-austin-walter-cv.pdf here)
public/robots.txt     Blocks AI crawlers
public/_headers       Tells search engines not to index the site
```

## Editing the page

Each section of `index.html` starts with a comment like `<!-- BLOCK: project | One North Quay -->`. To reorder, cut a whole block (from its comment down to its closing `</article>`) and paste it elsewhere.

To add a project, copy any project block and change:

- `id="..."`: a short name with hyphens. It becomes the project's link, for example `baw.haus/#one-north-quay`.
- The main image in `<figure class="project-image">`. It shows as a strip in the list and in full when the project opens. Set `style="--ratio: 1600 / 1200"` on the figure to the image's width and height. To choose which part shows in the strip, add `style="object-position: 50% 80%"` to the `<img>` (left-right %, top-bottom %).
- The title, location and role, and the one-line description. The description becomes the first line of the text when the project opens.
- The text, facts and credit in `<div class="project-body">`.
- The images under it in `<div class="project-gallery">`, as rows (see below).

### Images under a project

Each `<div class="g-row">` is one line of pictures. Pictures in a row share a height and split the width by their shape, so one picture fills the row, two share it, three share it, and so on. Mix rows however you like.

```html
<div class="g-row">
  <figure class="tile" style="--r: 1600 / 1067">
    <a class="zoom" href="img/project/file.jpg"><img src="img/project/file.jpg" alt="What the image shows" loading="lazy"></a>
    <figcaption class="credit">Image: Who made it</figcaption>
  </figure>
  <p class="note">A short annotation. It takes a quarter of the row.</p>
</div>
```

`--r` is the picture's width / height in pixels. A `<p class="note">` anywhere in a row adds an annotation beside the pictures. Gray hatched boxes (`<div class="tile ph">`) mark pictures still to add.

Image credits go in `<figcaption class="credit">` inside the image's figure. They stay hidden until someone hovers over the image (on phones they always show). Leave the line out for your own work.

Type is three sizes only, set at the top of `css/style.css`: `--heading`, `--body` and `--caption`.

The darkness of the background is `--bg-darken` at the top of `css/style.css` (0 = full color, 1 = black).

## Images and video

- Images: JPEG, about 2,000 px on the long edge, quality about 80. Name files by what they show (`one-north-quay-public-realm.jpg`), never by internal document names.
- Only use images that are already public, and credit them.
- Hero video: save it as `public/video/hero-loop.mp4` (H.264, silent, under 25 MiB). Until it's there, the still image shows.
- Each file must be under 25 MiB (Cloudflare's limit).

## Putting it online (Cloudflare)

1. In Cloudflare: Workers & Pages → Create application → Get started next to Import a repository.
2. Choose GitHub, then `baw-coder/baw.haus`.
3. Name the Worker `baw-haus` (it must match `name` in `wrangler.jsonc`), then Save and Deploy.
4. The site appears at a `workers.dev` address you can share.

After that, every change pushed to `main` goes live automatically.

## Using baw.haus as the address

Worker → Domains & Routes → Add → Custom Domain → `baw.haus`. Cloudflare can't add it while an old CNAME record for that name exists, so delete the Squarespace records first. Don't touch the MX records: they run your email.
