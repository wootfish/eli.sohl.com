function checkFancyEnabled() {
    var enabled = localStorage.getItem("enabled");

    if (enabled === null) {
        disableFancy();
        return true;
    }

    return (enabled === "true");
}


function enableFancy() {
    localStorage.setItem("enabled", true);
    location.reload();
}


function disableFancy() {
    localStorage.setItem("enabled", false);
    location.reload();
}


document.body.classList.remove("nojs");
if (checkFancyEnabled()) {
    $("body").removeClass("nofancy")
}
