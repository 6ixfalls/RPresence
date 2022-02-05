export function getTicket(arg: string[]) {
    var lastArg;
    for (let argument of arg) {
        if (lastArg == "-t") {
            return argument;
        }

        lastArg = argument;
    }
    return false;
}
export function getScriptUrl(arg: string[]) {
    for (let argument of arg) {
        if (argument.startsWith("https://") && argument.includes("placeId=")) {
            return argument;
        }
    }
    return false;
}

export function getSecurityCookie(arg: string[]) {
    for (let argument of arg) {
        if (
            argument.startsWith(".ROBLOSECURITY=") &&
            argument.includes("HttpOnly")
        ) {
            return argument.split(";")[0];
        }
    }
    return false;
}
