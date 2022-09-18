"use strict";
exports.__esModule = true;
var discord_rpc_1 = require("discord-rpc");
var clientId = "626092891667824688";
var rpc = new discord_rpc_1.Client({ transport: "websocket" });
await Neutralino.debug.log("");
function setTray() {
    var tray = {
        icon: "/ico/logo.png",
        menuItems: [
            { id: "VERSION", text: "Get version" },
            { id: "SEP", text: "-" },
            { id: "QUIT", text: "Quit" }
        ]
    };
    Neutralino.os.setTray(tray);
}
function onTrayMenuItemClicked(event) {
    switch (event.detail.id) {
        case "VERSION":
            Neutralino.os.showMessageBox("Version information", "Neutralinojs server: v" + NL_VERSION + " | Neutralinojs client: v" + NL_CVERSION);
            break;
        case "QUIT":
            Neutralino.app.exit();
            break;
    }
}
function onWindowClose() {
    Neutralino.app.exit();
}
function onURLClicked(e) {
    console.log("c");
    e.preventDefault();
    Neutralino.os.open(e.target.href);
}
Array.from(document.getElementsByClassName("a")).forEach(function (element) { return element.addEventListener('click', onURLClicked); });
Neutralino.init();
Neutralino.events.on("trayMenuItemClicked", onTrayMenuItemClicked);
Neutralino.events.on("windowClose", onWindowClose);
setTray();
