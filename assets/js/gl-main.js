---
---


{% include checker.js %}
{% include preamble.js %}
{% include gl-render.js %}


window.onpageshow = function () {
    initParams(1, 5100);

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
        main();
    }
}
