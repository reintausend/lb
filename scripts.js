/* Luki Becker — Portfolio
   - Feed: expand/collapse (toggle button + title tap) and type filters
     (OR within types; nothing selected = hide all)
   - Blur-in effect for all images while they load (clipped so blur does not bleed)
   - Codea-style overlay: project pages slide in over the feed instead of a
     full page navigation (with history/back support; pages still work standalone)
   - About: contact form opens the mail app via mailto */

(function () {
  "use strict";

  /* ---- Blur-in image loading ---- */

  var BLUR_MS = 400; /* minimum blur duration; keep in sync with CSS transition */

  function clipImage(img) {
    if (img.parentElement && img.parentElement.classList.contains("img-clip")) {
      return;
    }
    var clip = document.createElement("div");
    clip.className = "img-clip";
    img.parentNode.insertBefore(clip, img);
    clip.appendChild(img);
  }

  function blurInImages(root) {
    root.querySelectorAll("img").forEach(function (img) {
      if (img.dataset.blurReady === "true") return;
      img.dataset.blurReady = "true";

      clipImage(img);

      var started = performance.now();
      img.classList.add("img-loading");

      var reveal = function () {
        var elapsed = performance.now() - started;
        var wait = Math.max(0, BLUR_MS - elapsed);
        window.setTimeout(function () {
          img.classList.remove("img-loading");
        }, wait);
      };

      if (img.complete && img.naturalWidth > 0) {
        /* cached images still get the blur-in */
        requestAnimationFrame(function () {
          requestAnimationFrame(reveal);
        });
      } else {
        img.addEventListener("load", reveal, { once: true });
        img.addEventListener("error", reveal, { once: true });
      }
    });
  }

  blurInImages(document);

  /* ---- Feed: expand / collapse ---- */

  function toggleEntry(entry) {
    var expanded = entry.classList.toggle("expanded");
    var toggle = entry.querySelector(".entry-toggle");
    if (toggle) {
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    }
  }

  document.querySelectorAll(".project-entry").forEach(function (entry) {
    var toggle = entry.querySelector(".entry-toggle");
    var title = entry.querySelector(".entry-title");
    if (toggle) {
      toggle.addEventListener("click", function () {
        toggleEntry(entry);
      });
    }
    if (title) {
      title.addEventListener("click", function () {
        toggleEntry(entry);
      });
    }
  });

  /* ---- Contact form (About page; works in overlay too) ---- */

  document.addEventListener("submit", function (event) {
    var contactForm = event.target.closest(".contact-form");
    if (!contactForm) return;
    event.preventDefault();
    var subject = contactForm.querySelector("#contact-subject").value;
    var body = contactForm.querySelector("#contact-body").value;
    window.location.href =
      "mailto:" +
      contactForm.dataset.email +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);
  });

  /* ---- About bio language switch (EN/DE; works in overlay too) ---- */

  document.addEventListener("click", function (event) {
    var btn = event.target.closest(".lang-switch-btn");
    if (!btn) return;
    var root = btn.closest(".about-page");
    if (!root) return;
    var lang = btn.dataset.lang;
    if (!lang) return;

    root.querySelectorAll(".lang-switch-btn").forEach(function (el) {
      var on = el.dataset.lang === lang;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    root.querySelectorAll("[data-lang-panel]").forEach(function (panel) {
      if (panel.dataset.langPanel === lang) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "");
      }
    });
    document.documentElement.lang = lang;
  });

  /* ---- Feed: filters ---- */

  var chips = document.querySelectorAll(".filter-chip");
  if (chips.length > 0) {
    var entries = document.querySelectorAll(".project-entry");

    var selectedValues = function (group) {
      return Array.from(
        document.querySelectorAll(
          '.filter-chip[data-filter-group="' + group + '"].active'
        )
      ).map(function (chip) {
        return chip.dataset.filterValue;
      });
    };

    /* Gradient spans only the selected chip segments (equal thirds).
       Neighbors: blend between those two thirds only.
       Game+Video: solid green | solid pink, middle grey.
       All three: full spectrum across the bar. */
    var typeGradient = function (types) {
      var g = types.indexOf("game") !== -1;
      var a = types.indexOf("audio") !== -1;
      var v = types.indexOf("video") !== -1;
      var G = "var(--color-game)";
      var A = "var(--color-audio)";
      var V = "var(--color-video)";
      var grey = "var(--color-ui)"; /* same as inactive Feed/About tab */
      var t1 = "33.333%";
      var t2 = "66.666%";
      var full =
        "linear-gradient(to right, " + G + " 0%, " + A + " 50%, " + V + " 100%)";

      if (types.length === 0 || (g && a && v)) return full;

      /* Game + Audio: gradient only across first two thirds */
      if (g && a && !v) {
        return (
          "linear-gradient(to right, " +
          G +
          " 0%, " +
          A +
          " " +
          t2 +
          ", " +
          grey +
          " " +
          t2 +
          ", " +
          grey +
          " 100%)"
        );
      }

      /* Audio + Video: gradient only across last two thirds */
      if (a && v && !g) {
        return (
          "linear-gradient(to right, " +
          grey +
          " 0%, " +
          grey +
          " " +
          t1 +
          ", " +
          A +
          " " +
          t1 +
          ", " +
          V +
          " 100%)"
        );
      }

      /* Game + Video: solid colors in outer thirds, no yellow blend */
      if (g && v && !a) {
        return (
          "linear-gradient(to right, " +
          G +
          " 0%, " +
          G +
          " " +
          t1 +
          ", " +
          grey +
          " " +
          t1 +
          ", " +
          grey +
          " " +
          t2 +
          ", " +
          V +
          " " +
          t2 +
          ", " +
          V +
          " 100%)"
        );
      }

      if (g) {
        return (
          "linear-gradient(to right, " +
          G +
          " 0%, " +
          G +
          " " +
          t1 +
          ", " +
          grey +
          " " +
          t1 +
          ", " +
          grey +
          " 100%)"
        );
      }
      if (a) {
        return (
          "linear-gradient(to right, " +
          grey +
          " 0%, " +
          grey +
          " " +
          t1 +
          ", " +
          A +
          " " +
          t1 +
          ", " +
          A +
          " " +
          t2 +
          ", " +
          grey +
          " " +
          t2 +
          ", " +
          grey +
          " 100%)"
        );
      }
      if (v) {
        return (
          "linear-gradient(to right, " +
          grey +
          " 0%, " +
          grey +
          " " +
          t2 +
          ", " +
          V +
          " " +
          t2 +
          ", " +
          V +
          " 100%)"
        );
      }
      return full;
    };

    var applyFilters = function () {
      var types = selectedValues("type");

      entries.forEach(function (entry) {
        var entryTypes = (entry.dataset.type || "").split(" ");
        var typeMatch =
          types.length > 0 &&
          types.some(function (t) {
            return entryTypes.indexOf(t) !== -1;
          });

        entry.classList.toggle("hidden", !typeMatch);
      });

      document.querySelectorAll(".filter-group").forEach(function (group) {
        group.classList.toggle(
          "has-selection",
          group.querySelector(".filter-chip.active") !== null
        );
      });

      var typeGroup = document.querySelector(".filter-group--type");
      if (typeGroup) {
        typeGroup.style.background = typeGradient(types);

        /* Mark contiguous inactive runs so they share one sunken region */
        var typeChips = typeGroup.querySelectorAll(".filter-chip");
        var inactiveRoles = ["inactive-alone", "inactive-start", "inactive-mid", "inactive-end"];
        typeChips.forEach(function (chip) {
          inactiveRoles.forEach(function (role) {
            chip.classList.remove(role);
          });
        });
        var i = 0;
        while (i < typeChips.length) {
          if (typeChips[i].classList.contains("active")) {
            i += 1;
            continue;
          }
          var j = i + 1;
          while (
            j < typeChips.length &&
            !typeChips[j].classList.contains("active")
          ) {
            j += 1;
          }
          var len = j - i;
          if (len === 1) {
            typeChips[i].classList.add("inactive-alone");
          } else {
            typeChips[i].classList.add("inactive-start");
            for (var k = i + 1; k < j - 1; k += 1) {
              typeChips[k].classList.add("inactive-mid");
            }
            typeChips[j - 1].classList.add("inactive-end");
          }
          i = j;
        }
      }
    };

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chip.classList.toggle("active");
        chip.setAttribute(
          "aria-pressed",
          chip.classList.contains("active") ? "true" : "false"
        );
        applyFilters();
      });
    });

    applyFilters();
  }

  /* ---- Page overlay (feed page only) ----
     Project pages open over the feed via fetch + pushState.
     The Feed / About header stays fixed; only the sheet under it slides up.
     About tab switches instantly (no slide) — independent of project animation.
     Browser back or "<" closes the overlay.

     Important: after pushState to about/…, relative URLs like projects/foo/foo.html
     would resolve under about/. Always resolve against the feed page URL. */

  var isFeedPage = document.querySelector(".feed") !== null;

  if (isFeedPage && "fetch" in window) {
    var overlay = document.createElement("div");
    overlay.id = "project-overlay";
    document.body.appendChild(overlay);

    var feedTitle = document.title;
    var feedPageUrl = window.location.href; /* capture before any pushState */
    var CLOSE_MS = 350; /* keep in sync with the CSS transition */
    var lastProjectUrl = null; /* absolute URL; restore after About → Feed */
    var currentOverlayUrl = null; /* absolute URL of whatever is in the overlay */

    /* Avoid browser scroll restoration fighting title alignment on back. */
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    var isAboutUrl = function (url) {
      return /\/about\//i.test(String(url || "")) || /about\.html/i.test(String(url || ""));
    };

    var isLegalUrl = function (url) {
      return /\/legal\//i.test(String(url || "")) || /legal\.html/i.test(String(url || ""));
    };

    var toAbsoluteUrl = function (url) {
      return new URL(url, feedPageUrl).href;
    };

    var rewriteUrls = function (root, baseUrl) {
      ["src", "href"].forEach(function (attr) {
        root.querySelectorAll("[" + attr + "]").forEach(function (el) {
          var value = el.getAttribute(attr);
          if (!value || value.startsWith("#") || value.startsWith("mailto:")) {
            return;
          }
          el.setAttribute(attr, new URL(value, baseUrl).href);
        });
      });
    };

    var setOverlayTitle = function (root) {
      var projectTitle = root.querySelector(".project-title");
      var aboutPage = root.querySelector(".about-page");
      var legalPage = root.querySelector(".legal-page");
      if (projectTitle) {
        document.title = projectTitle.textContent + " — Luki B";
      } else if (aboutPage) {
        document.title = "About — Luki B";
      } else if (legalPage) {
        document.title = "Legal — Luki B";
      }
    };

    var overlaySheet = function () {
      return overlay.querySelector(".overlay-sheet");
    };

    var slideOverlayIn = function () {
      var pane = overlaySheet();
      overlay.classList.remove("instant");
      overlay.classList.remove("is-leaving");
      overlay.style.transition = "";
      overlay.style.transform = "";
      /* Header stays. Pin only the sheet off-screen, then let CSS slide it up. */
      if (pane) {
        pane.style.transition = "none";
        pane.style.transform = "translateY(100%)";
      }
      overlay.classList.add("open");
      document.body.classList.add("overlay-open");
      void overlay.offsetHeight;
      requestAnimationFrame(function () {
        if (pane) {
          pane.style.transition = "";
          pane.style.transform = "";
        }
      });
    };

    var slideOverlayOut = function (done) {
      var pane = overlaySheet();
      overlay.classList.remove("instant");
      overlay.classList.add("is-leaving");
      if (pane) {
        pane.style.transition = "";
        pane.style.transform = "";
      }
      void overlay.offsetHeight;
      overlay.classList.remove("open");
      setTimeout(function () {
        overlay.classList.remove("is-leaving");
        overlay.style.transform = "";
        overlay.style.transition = "";
        if (pane) {
          pane.style.transform = "";
          pane.style.transition = "";
        }
        if (done) done();
      }, CLOSE_MS);
    };

    var openOverlay = function (url, push) {
      var absoluteUrl = toAbsoluteUrl(url);
      var instant = isAboutUrl(absoluteUrl);
      var isLegal = isLegalUrl(absoluteUrl);
      var alreadyOpen = overlay.classList.contains("open");
      /* About opened on top of a project: Feed tab can step back to it */
      var returnTo =
        instant && alreadyOpen && overlay.querySelector(".project-page")
          ? currentOverlayUrl
          : null;

      /* Remember projects only — not About/Legal — for About → Feed restore */
      if (!instant && !isLegal) {
        lastProjectUrl = absoluteUrl;
      }

      fetch(absoluteUrl)
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Overlay fetch failed: " + response.status);
          }
          return response.text();
        })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, "text/html");
          var header = doc.querySelector("header.site-header");
          var sheet = document.createElement("div");
          sheet.className = "overlay-sheet";
          ["main.site-main", "footer.site-footer"].forEach(function (selector) {
            var el = doc.querySelector(selector);
            if (el) sheet.appendChild(el);
          });

          /*
            About: instant swap.
            Project restore while overlay already open (e.g. from About): instant swap.
            Fresh project + Legal always: forced slide-up animation.
          */
          var slideUp = isLegal || (!instant && !alreadyOpen);

          overlay.innerHTML = "";
          if (header) overlay.appendChild(header);
          overlay.appendChild(sheet);
          rewriteUrls(overlay, absoluteUrl);
          sheet.scrollTop = 0;
          blurInImages(overlay);

          if (slideUp) {
            slideOverlayIn();
          } else {
            overlay.classList.remove("is-leaving");
            overlay.classList.add("instant");
            overlay.style.transform = "";
            overlay.style.transition = "";
            sheet.style.transform = "";
            sheet.style.transition = "";
            document.body.classList.add("overlay-open");
            overlay.classList.add("open");
          }

          /* Re-process Instagram embeds when About is loaded into the overlay */
          if (overlay.querySelector(".instagram-media")) {
            var runInstagramEmbed = function () {
              if (window.instgrm && window.instgrm.Embeds) {
                window.instgrm.Embeds.process();
              }
            };
            if (window.instgrm && window.instgrm.Embeds) {
              runInstagramEmbed();
            } else if (!document.getElementById("instagram-embed-js")) {
              var ig = document.createElement("script");
              ig.id = "instagram-embed-js";
              ig.async = true;
              ig.src = "https://www.instagram.com/embed.js";
              ig.onload = runInstagramEmbed;
              document.body.appendChild(ig);
            }
          }

          currentOverlayUrl = absoluteUrl;

          if (push) {
            history.pushState(
              { overlay: absoluteUrl, returnTo: returnTo },
              "",
              absoluteUrl
            );
          }
          setOverlayTitle(overlay);
        })
        .catch(function () {
          window.location.href = absoluteUrl;
        });
    };

    var findFeedEntryForUrl = function (url) {
      if (!url) return null;
      var targetPath;
      try {
        targetPath = new URL(toAbsoluteUrl(url)).pathname;
      } catch (e) {
        return null;
      }
      var links = document.querySelectorAll(".entry-link");
      for (var i = 0; i < links.length; i++) {
        try {
          var linkPath = new URL(
            toAbsoluteUrl(links[i].getAttribute("href"))
          ).pathname;
          if (linkPath === targetPath) {
            return links[i].closest(".project-entry");
          }
        } catch (e) {
          /* skip bad href */
        }
      }
      return null;
    };

    /* Scroll the feed so this entry's title sits at the same viewport Y
       as the project-detail title the user is leaving. */
    var alignFeedTitleTo = function (projectUrl, titleTop) {
      var entry = findFeedEntryForUrl(projectUrl);
      if (!entry || titleTop == null || !isFinite(titleTop)) return;
      var feedTitleEl = entry.querySelector(".entry-title");
      if (!feedTitleEl) return;
      var delta = feedTitleEl.getBoundingClientRect().top - titleTop;
      if (Math.abs(delta) < 1) return;
      window.scrollTo({
        top: window.scrollY + delta,
        left: 0,
        behavior: "auto",
      });
    };

    var closeOverlay = function () {
      var fromAbout = overlay.querySelector(".about-page") !== null;
      var fromProject = overlay.querySelector(".project-page") !== null;
      var projectTitleEl = fromProject
        ? overlay.querySelector(".project-title")
        : null;
      var titleTop = projectTitleEl
        ? projectTitleEl.getBoundingClientRect().top
        : null;
      var projectUrl = fromProject
        ? lastProjectUrl || currentOverlayUrl
        : null;

      document.title = feedTitle;
      document.body.classList.remove("overlay-open");

      /* Align before the slide-out so the matching feed title is already in place. */
      if (fromProject) {
        alignFeedTitleTo(projectUrl, titleTop);
      }

      lastProjectUrl = null;
      currentOverlayUrl = null;

      var finish = function () {
        if (!overlay.classList.contains("open")) {
          overlay.innerHTML = "";
          overlay.classList.remove("instant");
          overlay.classList.remove("is-leaving");
          overlay.style.transform = "";
          overlay.style.transition = "";
        }
      };

      if (fromAbout) {
        overlay.classList.add("instant");
        overlay.classList.remove("open");
        finish();
        return;
      }

      slideOverlayOut(function () {
        /* Re-align after slide in case layout settled while overflow was locked. */
        if (fromProject) {
          alignFeedTitleTo(projectUrl, titleTop);
        }
        finish();
      });
    };

    document.querySelectorAll(".entry-link").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        openOverlay(link.getAttribute("href"), true);
      });
    });

    var aboutLink = document.querySelector('.site-tab[href*="about"]');
    if (aboutLink) {
      aboutLink.addEventListener("click", function (event) {
        event.preventDefault();
        openOverlay(aboutLink.getAttribute("href"), true);
      });
    }

    document.querySelectorAll('.site-footer a[href*="legal"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        openOverlay(link.getAttribute("href"), true);
      });
    });

    overlay.addEventListener("click", function (event) {
      var back = event.target.closest(".project-back");
      var feedTab = event.target.closest('.site-tab[href*="feed"]');
      var aboutTab = event.target.closest('.site-tab[href*="about"]');
      var legalLink = event.target.closest('a[href*="legal"]');

      if (legalLink) {
        event.preventDefault();
        if (overlay.querySelector(".legal-page")) return;
        openOverlay(legalLink.getAttribute("href"), true);
        return;
      }

      if (aboutTab) {
        event.preventDefault();
        if (overlay.querySelector(".about-page")) return;
        openOverlay(aboutTab.getAttribute("href"), true);
        return;
      }

      /* About → Feed tab: restore the project the user left */
      if (feedTab && overlay.querySelector(".about-page") && lastProjectUrl) {
        event.preventDefault();
        /* Pop the About entry so the next back closes to the feed, not the
           same project again */
        if (history.state && history.state.returnTo === lastProjectUrl) {
          history.back();
          return;
        }
        openOverlay(lastProjectUrl, false);
        history.replaceState(
          { overlay: lastProjectUrl },
          "",
          lastProjectUrl
        );
        return;
      }

      if (back || feedTab) {
        event.preventDefault();
        /* From Legal/project, back returns to previous overlay or feed */
        history.back();
      }
    });

    window.addEventListener("popstate", function (event) {
      if (event.state && event.state.overlay) {
        openOverlay(event.state.overlay, false);
      } else {
        /* closeOverlay needs currentOverlayUrl / lastProjectUrl for title align */
        closeOverlay();
        /* Keep URL on the feed page when overlay closes */
        if (!/feed\.html/i.test(window.location.href)) {
          history.replaceState(null, "", feedPageUrl);
        }
      }
    });
  }
})();
