---
---


{% include checker.js %}
{% include preamble.js %}
{% include gl-render.js %}


function maybeMain() {
    if (simpleModeForced()) {
        // if fancy mode is enabled but we're forcing simple mode, then hold off
        // on initialization until the screen gets wide enough to get fancy
        requestAnimationFrame(maybeMain);
        return;
    }
    if ($(".contentbox").css("display") == "none") {
        // if we fade the contentbox in, jquery sets the display style for us,
        // but if we resize the window after that then our media query sets
        // display: none again - this check deals with that issue.

        // (we could also just run the fade in css, but then how would we fancy
        // fade when coming from the landing page & fast fade otherwise?)

        $(".contentbox").show();
    }
    main();
}


window.onpageshow = function () {
    initParams(1, 34000);

    if (sessionStorage.getItem('fancyfade') == 'true') {
        $(".contentbox").fadeIn(5100);
        sessionStorage.setItem('fancyfade', false);
    } else {
        $(".contentbox").fadeIn(420);
    }

    if (checkFancyEnabled()) {
        tiler = document.getElementById("tilecanvas").getContext("2d");
        if (!tiler) {
            alert("fuck -- no canvas");  // TODO handle this better
            return;
        }
        resize(tiler.canvas);
        maybeMain();
    }
}
