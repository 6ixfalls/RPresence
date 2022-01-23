const ps = require("ps-node");
const activeWindow = require("active-window");

function getProcesses(args) {
    return new Promise((a, r) => ps.lookup(args, (err, data) => (err ? r : a)(data)));
}

function getTicket(arg) {
    var lastArg;
    for (let argument of arg) {
        if (lastArg == "-t") {
            return argument;
        }

        lastArg = argument;
    }
    return false;
}
function getScriptUrl(arg) {
    for (let argument of arg) {
        if (argument.startsWith("https://") && argument.includes("placeId=")) {
            return argument;
        }
    }
    return false;
}
function getSecurityCookie(arg) {
    for (let argument of arg) {
        if (argument.startsWith(".ROBLOSECURITY=") && argument.includes("HttpOnly")) {
            return argument.split(";")[0];
        }
    }
    return false;
}
function getActiveWindow() {
    return new Promise((a, r) => activeWindow.getActiveWindow(a, 0, 0));
}

module.exports = { getProcesses, getTicket, getScriptUrl, getSecurityCookie, getActiveWindow };