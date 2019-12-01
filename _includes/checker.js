function checkFancyEnabled() {
    var enabled = localStorage.getItem("enabled");

    if (enabled === null) {
        enableFancy();
        return true;
    }

    if (enabled === "true") {
        return true;
    }

    return false;
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
