---
---


{% include checker.js %}
{% include preamble.js %}
{% include gl-render.js %}


window.onpageshow = function () {
    initParams(0, 11000);

    $("#greeting").fadeIn(170, "linear");
    $("#enter").click(function () {
        $("#greeting").fadeOut(3200);
        $("#enter").fadeOut(2600);
        $(params).animate({
            warp: warp_med,
            fadein: 1
        }, {
            queue: false,
            duration: 8100,
            complete: function () {
                sessionStorage.setItem('fancyfade', true);
                window.location.href = './blog.html';
            }
        });
    }).mouseenter(function () {
        if (params.fadein === 0) {  // if fade-in animation hasn't started
            $(params).animate({warp: warp_max}, {queue: false, duration: 1700});
        }
    }).mouseleave(function () {
        if (params.fadein === 0) {  // if fade-in animation hasn't started
            $(params).animate({warp: warp_min}, {queue: false, duration: 1700});
        }
    }).fadeIn(170, "linear");

    if (checkFancyEnabled()) {
        main();
    }
}
