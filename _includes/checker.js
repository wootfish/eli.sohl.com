function checkJSEnabled() {
    var enabled = localStorage.getItem("enabled");

    if (enabled === null) {
        enableJS();
        return true;
    }

    if (enabled === "true") {
        return true;
    }

    return false;
}


function enableJS() {
    localStorage.setItem("enabled", true);
    location.reload();
}


function disableJS() {
    localStorage.setItem("enabled", false);
    location.reload();
}


if (checkJSEnabled()) {
    $("body").removeClass("nojs")
}
