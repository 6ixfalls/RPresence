const fetch = require("node-fetch");
const { app, Notification, Menu, Tray, shell } = require("electron");
const os = require("os");
const fs = require("fs");
const BeginListener = require("./richPresence");
const log = require("electron-log");

const clientId = "626092891667824688";

log.info("Loading RPresence!");
const configFile = require("path").join(os.homedir(), "rpresence_config.json");
let configCorrupt = false;
let configJSON = global.configJSON = {
    defaultIconKey: "logo_shiny", // logo_old, logo_red, logo_shiny
    enabled: true,
    studioEnabled: true,
    bypassPrivacy: false,
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
            },
        },
        {
            label: "Bypass Privacy Settings", type: "checkbox", checked: configJSON.bypassPrivacy, click: function () {
                log.info("Toggling privacy bypass");
                configJSON.bypassPrivacy = !configJSON.bypassPrivacy;
                contextMenu.items[1].checked = configJSON.bypassPrivacy;
                saveConfig();
            }
        },
        { type: "separator" },
        { label: "Quit", click: exit }
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