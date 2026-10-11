# baw.haus

Portfolio site for Blake Austin Walter. Plain HTML, CSS and a little JavaScript: no framework, no build step. Cloudflare serves everything in `public/`, through a small Worker (`src/worker.js`) that adds the password page.

## What's where

```
wrangler.jsonc        Cloudflare settings (the Worker name must match the dashboard)
src/worker.js         Password page, and the headers that keep search engines out
public/index.html     The whole page, in commented blocks
public/css/style.css  Colors, type and spacing (edit :root at the top)
public/js/main.js     Opening projects, project links, video button, image viewer
public/fonts/         Jost light, medium and semibold, hosted with the site (free; license in OFL.txt)
public/img/<project>/ Images, one folder per project
public/video/         Video files (add hero-loop.mp4 here)
public/cv/            CV PDF (add blake-austin-walter-cv.pdf here)
public/img/ui/share.jpg  The picture shown when the link is shared (LinkedIn, Slack, iMessage)
public/robots.txt     Blocks AI crawlers
```

## Editing the page

Each section of `index.html` starts with a comment like `<!-- BLOCK: project | One North Quay -->`. To reorder, cut a whole block (from its comment down to its closing `</article>`) and paste it elsewhere.

To add a project, copy any project block and change:

- `id="..."`: a short name with hyphens. It becomes the project's link, for example `baw.haus/#one-north-quay`.
- The main image in `<figure class="project-image">`. It fills the wide 2/3 column: a strip in the list, the whole picture when the project opens. Set `style="--ratio: 1600 / 1200"` on the figure to the image's width and height. To choose which part shows in the strip, add `style="object-position: 50% 80%"` to the `<img>` (left-right %, top-bottom %).
- The title and the description in `<div class="project-text">`. Each project has only these two pieces of text. The description's first line (`project-blurb`) shows in the list; start it with your role in bold, `<strong>Facade lead.</strong>`, and say where the project is in the sentence after it.
- The rest of the description and the facts in `<div class="project-body">`, which shows when the project opens.
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

Image credits go in `<figcaption class="credit">` inside the image's figure. They stay hidden until someone hovers over the image; on phones, tapping the image shows its credit. Clicking an image on a computer opens it full size; phones skip that, since images there are already full width. Leave the line out for your own work.

Type is four styles in one color, set at the top of `css/style.css`: `--heading`, `--body`, bold body (`<strong>`, weight `--bold`) and `--caption`, all in `--text`. Headings and body text grow with the window.

The page runs on one grid: a wide column (2/3) and a narrow one (1/3). Projects and contact put the picture in the wide column; the hero flips it; the CV's third column lines up with the project text. The gap between columns is `--gap`, the page edges `--gutter`.

The darkness of the background is `--bg-darken` at the top of `css/style.css` (0 = full color, 1 = black).

## Images and video

- Images: JPEG, about 2,000 px on the long edge, quality about 80. Name files by what they show (`one-north-quay-public-realm.jpg`), never by internal document names.
- Only use images that are already public, and credit them.
- Hero video: save it as `public/video/hero-loop.mp4` (H.264, silent, under 25 MiB). Until it's there, the still image shows.
- Each file must be under 25 MiB (Cloudflare's limit).

## Password

While the site is being finished, visitors see a password page first. Once in, a cookie keeps them in for 30 days. The fonts, icons, share picture and robots.txt stay open so the page and link previews work.

- **Open the site to everyone:** in `src/worker.js`, change `const LOCKED = true;` to `false` and push.
- **Change the password:** in Cloudflare, Worker → Settings → Variables and Secrets → Add, type Secret, name `SITE_PASSWORD`, value the new password. It overrides the one in the code, and everyone has to enter the new one.

The password is stored in the code only as a SHA-256 fingerprint. The password page only guards the website: while this GitHub repository is public, anyone can still read its files on GitHub.

## Putting it online (Cloudflare)

1. In Cloudflare: Workers & Pages → Create application → Get started next to Import a repository.
2. Choose GitHub, then `baw-coder/baw.haus`.
3. Name the Worker `baw-haus` (it must match `name` in `wrangler.jsonc`), then Save and Deploy.
4. The site appears at a `workers.dev` address you can share.

After that, every change pushed to `main` goes live automatically.

## Using baw.haus as the address

Worker → Domains & Routes → Add → Custom Domain → `baw.haus`. Cloudflare can't add it while an old CNAME record for that name exists, so delete the Squarespace records first. Don't touch the MX records: they run your email.
