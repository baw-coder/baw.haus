/* baw.haus interactions. Plain JavaScript, no libraries.
   1. Opening and closing projects (with the thumbnail growing into the full image)
   2. Project links (baw.haus/#project-id)
   3. Hero video pause button
   4. Lightbox for full-size images */

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
    project.querySelector(".project-toggle").setAttribute("aria-expanded", String(open));
    all(project, ".project-body, .project-gallery, .close").forEach(function (el) {
      el.hidden = !open;
    });
  }

  // Measure where things are, switch layouts, measure again, then animate
  // each piece from its old place and size to its new one.
  function animateLayout(project, open, done) {
    var moving = all(project, ".project-image, .project-text");
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

    Promise.all(animations.map(function (a) { return a.finished; })).then(function () {
      project.style.overflow = "";
      project.classList.remove("is-animating");
      done();
    });
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
    Promise.all(fades.map(function (f) { return f.finished; })).then(function () {
      run();
      fades.forEach(function (f) { f.cancel(); });
    });
  }

  projects.forEach(function (project) {
    project.addEventListener("click", function (event) {
      if (!project.classList.contains("is-open")) {
        // Anywhere on a closed entry opens it
        event.preventDefault();
        toggle(project, true);
      } else if (event.target.closest(".project-toggle, .plus, .close")) {
        event.preventDefault();
        // The phone-only Close button sits at the bottom of a long project,
        // so take the reader back to the project's top as it closes
        if (event.target.closest(".close")) {
          project.scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" });
          project.querySelector(".project-toggle").focus({ preventScroll: true });
        }
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
    var id = decodeURIComponent(window.location.hash.slice(1));
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

  /* 3. Hero video: the pause button appears only once the video plays */
  var video = document.getElementById("hero-video");
  var videoToggle = document.querySelector(".video-toggle");
  if (video && videoToggle) {
    if (reduceMotion.matches) {
      video.removeAttribute("autoplay");
      video.pause();
    }
    var syncToggle = function () {
      videoToggle.hidden = false;
      videoToggle.classList.toggle("is-paused", video.paused);
      videoToggle.setAttribute("aria-label", video.paused ? "Play video" : "Pause video");
    };
    video.addEventListener("loadeddata", syncToggle);
    video.addEventListener("play", syncToggle);
    video.addEventListener("pause", syncToggle);
    videoToggle.addEventListener("click", function () {
      if (video.paused) video.play(); else video.pause();
    });
  }

  /* 4. Lightbox: click an image in an open project to see it full size */
  var lightbox = document.querySelector(".lightbox");
  if (lightbox && typeof lightbox.showModal === "function") {
    var lightboxImg = lightbox.querySelector("img");
    all(document, ".zoom").forEach(function (link) {
      link.addEventListener("click", function (event) {
        var project = link.closest(".project");
        if (project && !project.classList.contains("is-open")) return; // opens the project instead
        event.preventDefault();
        var img = link.querySelector("img");
        lightboxImg.src = link.getAttribute("href");
        lightboxImg.alt = img ? img.alt : "";
        lightbox.showModal();
      });
    });
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox || event.target.closest(".lightbox-close")) {
        lightbox.close();
      }
    });
  }
})();
