require("source-map-support").install();

import { app, Notification, Menu, Tray, MenuItem } from "electron";
import os from "os";
import fs from "fs";
import { BeginListener } from "./richPresence";
import log from "electron-log";
import { Client } from "discord-rpc";
import { fillMissing } from "object-fill-missing-keys";

declare global {
    namespace NodeJS {
        interface Global {
            configJSON: any;
            rpc?: Client;
            tray?: Tray;
        }
    }
}

const clientId = "626092891667824688";
const rpc = (global.rpc = new Client({ transport: "ipc" }));

log.info("Loading RPresence!");

const configFile = require("path").join(os.homedir(), "rpresence_config.json");

let defaultConfigJSON = {
    defaultIconKey: "logo_shiny", // logo_old, logo_red, logo_shiny
    enabled: true,
    studioEnabled: true,
    bypassPrivacy: false,
    joinLinkMode: "rogold", // rogold, ropro, roblox
};

let configJSON: any = defaultConfigJSON;

if (fs.existsSync(configFile)) {
    try {
        let contents = fs.readFileSync(configFile);
        configJSON = global.configJSON = fillMissing(
            JSON.parse(contents.toString()),
            defaultConfigJSON
        );
        log.info(configJSON);
    } catch (e) {
        log.error("Failed to parse config file: ", e);
    }
}
function saveConfig() {
    fs.writeFileSync(configFile, JSON.stringify(configJSON));
}

let tray: Tray, contextMenu: Menu;

async function exit() {
    try {
        await rpc.clearActivity();
        tray.destroy();
    } catch (e) { }
    process.kill(process.pid);
}

function handleRadioClick(menuItem: MenuItem) {
    switch (menuItem.label) {
        case "RoGold":
            configJSON.joinLinkMode = "rogold";
            break;
        case "RoPro":
            configJSON.joinLinkMode = "ropro";
            break;
        case "Roblox":
            configJSON.joinLinkMode = "roblox";
            break;
    }

    log.info("Switching to " + configJSON.joinLinkMode + " method");
    saveConfig();
}

rpc.on("ready", async () => {
    BeginListener();

    new Notification({
        title: "RPresence is ready!",
        body: "Welcome, " + rpc.user.username + "!",
        silent: true,
    }).show();
    log.info("Connected to Discord");
    contextMenu = Menu.buildFromTemplate([
        {
            label: "Enable",
            type: "checkbox",
            checked: configJSON.enabled,
            click: function () {
                log.info("Toggling enabled");
                configJSON.enabled = !configJSON.enabled;
                contextMenu.items[0].checked = configJSON.enabled;
                saveConfig();
            },
        },
        {
            label: "Bypass Privacy Settings",
            type: "checkbox",
            checked: configJSON.bypassPrivacy,
            click: function () {
                log.info("Toggling privacy bypass");
                configJSON.bypassPrivacy = !configJSON.bypassPrivacy;
                contextMenu.items[1].checked = configJSON.bypassPrivacy;
                saveConfig();
            },
        },
        {
            type: "submenu",
            label: "Invite Link Mode",
            submenu: [
                {
                    label: "Roblox",
                    type: "radio",
                    checked: configJSON.joinLinkMode == "roblox",
                    click: handleRadioClick,
                },
                {
                    label: "RoGold",
                    type: "radio",
                    checked: configJSON.joinLinkMode == "rogold",
                    click: handleRadioClick,
                },
                {
                    label: "RoPro",
                    type: "radio",
                    checked: configJSON.joinLinkMode == "ropro",
                    click: handleRadioClick,
                },
            ],
        },
        { type: "separator" },
        { label: "Quit", click: exit },
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
        if (os.platform() == "win32") {
            logo = "ico/logo.ico";
        }
        try {
            tray = global.tray = new Tray(logo);
        } catch (e) {
            tray = global.tray = new Tray(app.getAppPath() + "/" + logo);
        }
        contextMenu = Menu.buildFromTemplate([{ label: "Quit", click: exit }]);
        tray.setToolTip("RPresence");
        tray.setContextMenu(contextMenu);

        log.info("Connecting to Discord...");
        tray.setTitle("Connecting to Discord...");
        rpc.login({ clientId }).catch((e) => {
            log.error(
                "Failed to connect to Discord... ",
                e,
                "Will try again in 15 seconds"
            );
            new Notification({
                title: "RPresence failed to connect to Discord",
                body: "Trying again in 15 seconds!",
                silent: true,
            }).show();
            setTimeout(go, 15000);
        });
    } catch (e) {
        log.error(e, ". Trying again in 15 seconds");
        new Notification({
            title: "RPresence failed to load",
            body: "Trying again in 15 seconds!",
            silent: true,
        }).show();
        setTimeout(go, 15000);
    }
}

app.on("ready", go);
app.on("before-quit", exit);
process.on("uncaughtException", log.error);
