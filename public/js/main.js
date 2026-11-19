/* baw.haus interactions. Plain JavaScript, no libraries.
   1. Opening and closing projects (with the thumbnail growing into the full image)
   2. Project links (baw.haus/#project-id)
   3. Images: full-size viewer on desktop and mobile */

(function () {
  var projects = Array.prototype.slice.call(document.querySelectorAll(".project"));
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var DURATION = 520;
  var EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";

  function all(root, selector) {
    return Array.prototype.slice.call(root.querySelectorAll(selector));
  }

  /* 1. Opening and closing projects */
  function setOpen(project, open) {
    project.classList.toggle("is-open", open);
    var button = project.querySelector(".project-toggle");
    button.setAttribute("aria-expanded", String(open));
    var cover = project.querySelector(".project-image a.zoom");
    if (cover) {
      if (open) cover.removeAttribute("tabindex"); else cover.tabIndex = -1;
    }
    all(project, ".project-body, .project-gallery").forEach(function (el) {
      el.hidden = !open;
    });
  }

  // Measure the image, switch layouts, measure again, then grow or shrink
  // the image from its old size to its new one. Only the image is animated:
  // the words either stay put (beside the image on computers) or are carried
  // down by the image as it grows (below it on phones), so moving them as
  // well would push them up over the image.
  function animateLayout(project, open, done) {
    var moving = all(project, ".project-image");
    var image = project.querySelector(".project-image");
    // Switch off the hover transition so the measurements are exact
    project.classList.add("is-animating");
    void project.offsetWidth;
    var before = moving.map(function (el) { return el.getBoundingClientRect(); });
    var startHeight = project.getBoundingClientRect().height;

    setOpen(project, open);

    var after = moving.map(function (el) { return el.getBoundingClientRect(); });
    var endHeight = project.getBoundingClientRect().height;
    var timing = { duration: DURATION, easing: EASE };
    var animations = [];

    project.style.overflow = "hidden";
    animations.push(project.animate(
      [{ height: startHeight + "px" }, { height: endHeight + "px" }], timing));

    moving.forEach(function (el, i) {
      var a = before[i];
      var b = after[i];
      var shift = "translate(" + (a.left - b.left) + "px, " + (a.top - b.top) + "px)";
      if (el === image) {
        animations.push(el.animate([
          { width: a.width + "px", height: a.height + "px", transform: shift },
          { width: b.width + "px", height: b.height + "px", transform: "none" }
        ], timing));
      } else if (a.left !== b.left || a.top !== b.top) {
        animations.push(el.animate([{ transform: shift }, { transform: "none" }], timing));
      }
    });

    if (open) {
      all(project, ".project-body, .project-gallery").forEach(function (el) {
        animations.push(el.animate(
          [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }],
          { duration: DURATION, easing: EASE, delay: DURATION * 0.35, fill: "backwards" }));
      });
    }

    function finish() {
      project.style.overflow = "";
      project.classList.remove("is-animating");
      done();
    }
    Promise.all(animations.map(function (a) { return a.finished; })).then(finish, finish);
  }

  function toggle(project, open) {
    if (project.classList.contains("is-open") === open || project.dataset.busy) return;

    // The page never scrolls by itself here and the address never changes,
    // so scrolling while a project opens is never interrupted.
    if (reduceMotion.matches || typeof project.animate !== "function") {
      setOpen(project, open);
      return;
    }

    project.dataset.busy = "true";
    var run = function () {
      animateLayout(project, open, function () {
        delete project.dataset.busy;
      });
    };

    if (open) {
      run();
      return;
    }
    // Closing: fade the text and gallery out first, then shrink back
    var fades = all(project, ".project-body, .project-gallery").map(function (el) {
      return el.animate([{ opacity: 1 }, { opacity: 0 }],
        { duration: 180, easing: "ease-out", fill: "forwards" });
    });
    function finishFade() {
      run();
      fades.forEach(function (f) { f.cancel(); });
    }
    Promise.all(fades.map(function (f) { return f.finished; })).then(finishFade, finishFade);
  }

  projects.forEach(function (project) {
    setOpen(project, false);
    project.querySelector(".project-toggle").disabled = false;
    project.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!project.classList.contains("is-open")) {
        // Anywhere on a closed entry opens it
        event.preventDefault();
        toggle(project, true);
      } else if (event.target.closest(".project-toggle, .plus")) {
        // The title or the × closes an open entry
        event.preventDefault();
        toggle(project, false);
      }
    });
  });

  // While the page scrolls, entries passing under a still pointer don't
  // react to it (see .is-scrolling in style.css)
  var root = document.documentElement;
  var scrollTimer;
  window.addEventListener("scroll", function () {
    if (!root.classList.contains("is-scrolling")) root.classList.add("is-scrolling");
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () { root.classList.remove("is-scrolling"); }, 160);
  }, { passive: true });

  /* 2. Project links: baw.haus/#its-id opens that project */
  function openFromHash() {
    var id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); }
    catch (_) { return; }
    if (!id) return;
    var target = document.getElementById(id);
    if (target && target.classList.contains("project")) {
      target.hidden = false;
      setOpen(target, true);
      target.scrollIntoView({ block: "start" });
    }
  }
  openFromHash();
  window.addEventListener("hashchange", openFromHash);

  /* 3. Images: full-size viewer on desktop and mobile. */
  var lightbox = document.querySelector(".lightbox");
  var canZoom = lightbox && typeof lightbox.showModal === "function";
  var lightboxImg = canZoom ? lightbox.querySelector("img") : null;
  all(document, ".zoom").forEach(function (link) {
    link.addEventListener("click", function (event) {
      var project = link.closest(".project");
      if (project && !project.classList.contains("is-open")) return; // opens the project instead
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !canZoom) return;
      event.preventDefault();
      var img = link.querySelector("img");
      lightboxImg.hidden = false;
      lightboxImg.src = link.getAttribute("href");
      lightboxImg.alt = img ? img.alt : "";
      lightbox.showModal();
    });
  });
  if (canZoom) {
    lightbox.addEventListener("close", function () {
      lightboxImg.hidden = true;
      lightboxImg.removeAttribute("src");
    });
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox || event.target.closest(".lightbox-close")) {
        lightbox.close();
      }
    });
  }
})();
