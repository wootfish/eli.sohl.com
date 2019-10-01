---
---


{% include checker.js %}
{% include preamble.js %}
{% include gl-render.js %}


window.onpageshow = function () {
    initParams(0);

    $("#greeting").fadeIn(170, "linear");
    $("#enter").click(function () {
        $("#greeting").fadeOut(2600);
        $("#enter").fadeOut(2300);
        $(params).animate({
            warp: warp_med,
            fadein: 1
        }, {
            queue: false,
            duration: 3400,
            complete: function () {
                sessionStorage.setItem('t', params.t);
                sessionStorage.setItem('fancyfade', true);
                window.location.href = './blog.html';
            }
        });
    }).mouseenter(function () {
        $(params).animate({warp: warp_max}, {queue: false, duration: 3400});
    }).mouseleave(function () {
        $(params).animate({warp: warp_min}, {queue: false, duration: 3400});
    }).fadeIn(170, "linear");

    if (checkFancyEnabled()) {
        main();
    }
}
