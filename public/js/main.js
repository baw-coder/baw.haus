/* baw.haus interactions. Plain JavaScript, no libraries.
   1. Filter buttons   2. Close buttons in project panels
   3. Project links (baw.haus/#project-id)   4. Hero video pause button
   5. Lightbox for full-size images */

(function () {
  var projects = document.querySelectorAll(".project");

  /* 1. Filters: each project's data-tags lists its categories */
  var filterButtons = document.querySelectorAll(".filters button");
  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var filter = button.dataset.filter;
      filterButtons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === button));
      });
      projects.forEach(function (project) {
        var tags = (project.dataset.tags || "").split(" ");
        project.hidden = !(filter === "all" || tags.indexOf(filter) !== -1);
      });
    });
  });

  /* 2. "Close" at the bottom of a project panel */
  document.querySelectorAll(".project .close").forEach(function (button) {
    button.addEventListener("click", function () {
      var project = button.closest(".project");
      var summary = project.querySelector("summary");
      project.open = false;
      if (summary.getBoundingClientRect().top < 0) {
        summary.scrollIntoView({ block: "start" });
      }
      summary.focus({ preventScroll: true });
    });
  });

  /* 3. Project links: opening a project puts its id in the address bar,
        and visiting baw.haus/#its-id opens it */
  function openFromHash() {
    var id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    var target = document.getElementById(id);
    if (target && target.classList.contains("project")) {
      target.hidden = false;
      target.open = true;
      target.scrollIntoView({ block: "start" });
    }
  }
  openFromHash();
  window.addEventListener("hashchange", openFromHash);

  projects.forEach(function (project) {
    project.addEventListener("toggle", function () {
      if (project.open && project.id) {
        history.replaceState(null, "", "#" + project.id);
      }
    });
  });

  /* 4. Hero video: the pause button appears only once the video plays */
  var video = document.getElementById("hero-video");
  var toggle = document.querySelector(".video-toggle");
  if (video && toggle) {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      video.removeAttribute("autoplay");
      video.pause();
    }
    var syncToggle = function () {
      toggle.hidden = false;
      toggle.classList.toggle("is-paused", video.paused);
      toggle.setAttribute("aria-label", video.paused ? "Play video" : "Pause video");
    };
    video.addEventListener("loadeddata", syncToggle);
    video.addEventListener("play", syncToggle);
    video.addEventListener("pause", syncToggle);
    toggle.addEventListener("click", function () {
      if (video.paused) video.play(); else video.pause();
    });
  }

  /* 5. Lightbox: click a project image to see it full size */
  var lightbox = document.querySelector(".lightbox");
  if (lightbox && typeof lightbox.showModal === "function") {
    var lightboxImg = lightbox.querySelector("img");
    document.querySelectorAll(".zoom").forEach(function (link) {
      link.addEventListener("click", function (event) {
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
