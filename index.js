const fetch = require("node-fetch");
const { app, Notification, Menu, Tray, shell } = require("electron");
const os = require("os");
const fs = require("fs");
const BeginListener = require("./richPresence");
const log = require("electron-log");

const clientId = "626092891667824688";

log.info("Loading RPresence!");
const configFile = require("path").join(os.homedir(), "rblxrp_config.json");
let configCorrupt = false;
let configJSON = global.configJSON = {
    defaultIconKey: "logo_shiny", // logo_old, logo_red, logo_shiny
    enabled: true,
    studioEnabled: true
};
if (fs.existsSync(configFile)) {
    try {
        let contents = fs.readFileSync(configFile);
        configJSON = global.configJSON = JSON.parse(contents);
        log.info(configJSON);
    } catch (e) {
        configCorrupt = e.message;
    }
}
function saveConfig() {
    fs.writeFileSync(configFile, JSON.stringify(configJSON));
}

let tray, contextMenu;

async function exit() {
    try { await global.rpc.clearActivity(); } catch (e) { }
    process.kill(process.pid);
}

async function menu(item) {
    item.checked = true;
    configJSON.defaultIconKey = item.id;
    for (let i in global.setIcons) {
        if (global.setIcons[i].iconkey == "logo_shiny" || global.setIcons[i].iconkey == "logo_red" || global.setIcons[i].iconkey == "logo_old") {
            global.setIcons[i].iconkey = configJSON.defaultIconKey;
        }
    }
    global.lastPresense = false; // force presense update
    saveConfig();
}

function getVersion() {
    if (fs.existsSync("./package.json")) {
        try {
            let file = JSON.parse(fs.readFileSync("./package.json").toString());
            if (file.version) {
                return file.version + " ";
            } else {
                return "";
            }
        } catch (e) { return ""; }
    } else {
        return "";
    }
}

global.rpc.on("ready", async () => {
    BeginListener();

    new Notification({
        title: "RPresence is ready!",
        body: "Welcome, " + global.rpc.user.username + "!",
        silent: true
    }).show();
    log.info("Connected to Discord");
    contextMenu = Menu.buildFromTemplate([
        {
            label: "Enable", type: "checkbox", checked: configJSON.enabled, click: function () {
                log.info("Toggling enabled");
                configJSON.enabled = !configJSON.enabled;
                contextMenu.items[0].checked = configJSON.enabled;
                saveConfig();
            }
        },
        /* { label: "Studio Enabled", type: "checkbox", checked: configJSON.studioEnabled, click: function() {
            log.info("Toggling studioEnabled");
            configJSON.studioEnabled = !configJSON.studioEnabled;
            contextMenu.items[0].checked = configJSON.studioEnabled;
            saveConfig();
        } },*/
        {
            label: "Default game icon",
            type: "submenu",
            submenu: [
                { label: "Shiny", id: "logo_shiny", type: "radio", checked: configJSON.defaultIconKey == "logo_shiny", click: menu },
                { label: "Red", id: "logo_red", checked: configJSON.defaultIconKey == "logo_red", type: "radio", click: menu },
                { label: "Old 'R' Logo", id: "logo_old", checked: configJSON.defaultIconKey == "logo_old", type: "radio", click: menu }
            ]
        },
        { type: "separator" },
        { label: "Quit", click: exit }
        // { label: "rblxRP " + getVersion() + "by theLMGN", enabled: false },
        /* {
            label: "GitHub", click: function () {
                shell.openExternal("https://github.com/thelmgn/rblxrp");
            }
        },
        { type: "separator" }, */
        // { label: "Quit", click: exit }
    ]);
    tray.setContextMenu(contextMenu);
    tray.setToolTip("RPresence");
    tray.setTitle("");
});

async function go() {
    try {
        app.setAppUserModelId("RPresence");

        try {
            app.dock.hide();
        } catch (e) { }
        let logo = "ico/logo_white.png";
        if (os.platform() == "win32") { logo = "ico/logo.ico"; }
        try {
            tray = global.tray = new Tray(logo);
        } catch (e) {
            tray = global.tray = new Tray(app.getAppPath() + "/" + logo);
        }
        contextMenu = Menu.buildFromTemplate([
            { label: "Quit", click: exit }
        ]);
        tray.setToolTip("RPresence");
        tray.setContextMenu(contextMenu);

        log.info("Downloading configuration...");
        tray.setTitle("Downloading config...");
        let req = await fetch("https://gist.githubusercontent.com/theLMGN/3799b5cb7b0328be7a13860e46832b0e/raw/9f73d30f4e6369ef976234eb99ed8207363d24ea/rblxrp_config.json");
        if (!req.ok) { throw new Error("not ok!"); }
        let j = await req.json();
        global.setIcons = j.games;
        log.info("Downloaded configuration!");

        log.info("Connecting to Discord...");
        tray.setTitle("Connecting to Discord...");
        global.rpc.login({ clientId }).catch((e) => {
            log.error("Failed to connect to Discord... ", e, "Will try again in 15 seconds");
            new Notification({
                title: "RPresence failed to connect to Discord",
                body: "Trying again in 15 seconds!",
                silent: true
            }).show();
            setTimeout(go, 15000);
        });
    } catch (e) {
        log.error(e, ". Trying again in 15 seconds");
        new Notification({
            title: "RPresence failed to load",
            body: "Trying again in 15 seconds!",
            silent: true
        }).show();
        setTimeout(go, 15000);
    }
}

app.on("ready", go);
process.on("uncaughtException", log.error);