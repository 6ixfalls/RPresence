const util = require("./util");
const RPC = require("discord-rpc");
const fetch = require("node-fetch");
const rpc = global.rpc = new RPC.Client({ transport: "ipc" });
const WQL = require("wql-process-monitor");
const ps = require("ps-node");
const log = require("electron-log");
const childprocess = require("child_process");
const { app, Notification, Menu, Tray, shell } = require("electron");
const path = require("path");

let CachedProcess;

async function getGameFromCache(gameid) {
    if (global.setIcons[gameid]) return global.setIcons[gameid];

    try {
        let apiResponse = await fetch("https://api.roblox.com/marketplace/productinfo?assetId=" + gameid);
        if (!apiResponse.ok) { throw new Error("Could not get game info from Roblox API."); }
        let j = await apiResponse.json();
        let obj = {
            name: j.Name,
            by: j.Creator.Name,
            iconkey: global.configJSON.defaultIconKey,
            id: gameid
        };

        global.setIcons[gameid] = obj;
        return obj;
    } catch (e) {
        log.error(e);
        return {
            name: "Unknown Game",
            by: "Unknown",
            iconkey: global.configJSON.defaultIconKey,
            id: gameid
        };
    }
}

/*
async function BeginListener() {
    const processMonitor = WQL.subscribe({
        filterWindowsNoise: true
    });
    log.info("test");

    processMonitor.on("creation", async ([process, pid, filepath]) => {
        if (!global.rpcenabled) return;

        ps.lookup({ pid: pid }, async (err, result) => {
            if (err) {
                log.error(err);
            }

            let proc = result[0];

            if (proc) {
                let cmd = proc.command;

                if (cmd == "RobloxPlayer") {
                    log.info(process, proc);
                    let scriptUrl = util.getScriptUrl(proc.arguments);
                    let placeId;

                    if (scriptUrl == false) {
                        log.info("[Detect:Proc] Couldn't find the script URL");
                        placeId = false;
                        scriptUrl = "";
                    } else {
                        log.info("[Detect:Proc] Script URL", scriptUrl);
                    }
                    if (!scriptUrl.includes("placeId=")) {
                        log.info("[Detect:Proc] Malformed script URL");
                        placeId = false;
                    }
                    placeId = parseInt(scriptUrl.split("placeId=")[1]);
                    if (isNaN(placeId)) {
                        log.info("[Detect:Proc] Malformed script URL");
                        placeId = false;
                    }
                    log.info("[Detect:Proc] Found game ID", placeId);

                    if (!global.configJSON.enabled) {
                        rpc.clearActivity();
                        global.tray.setTitle("");
                        log.info("RPC is disabled!");
                        return;
                    }

                    if (placeId == false) {
                        rpc.clearActivity();
                        global.tray.setTitle("");
                        log.info("[Detect:Proc] Couldn't find script URL");
                    }

                    let game = await getGameFromCache(placeId);

                    log.info("Playing", game.name, "by", game.by);
                    global.tray.setTitle(game.name, "by", game.by);
                    log.info(game);
                    rpc.setActivity({
                        details: game.name,
                        state: `by ${game.by}`,
                        startTimestamp: 0,
                        largeImageKey: game.iconkey,
                        buttons: [
                            {
                                label: "Join Game",
                                url: "https://www.roblox.com/games/" + (game.id || game.iconkey)
                            }
                        ],
                        instance: false
                    });

                    CachedProcess = pid;
                } else {
                    log.info("Started process was not Roblox");
                }
            } else {
                log.info("Could not find process with PID " + pid);
            }
        });
    });

    processMonitor.on("deletion", ([process, pid]) => {
        if (!global.rpcenabled) return;

        if (CachedProcess == pid) {
            CachedProcess = undefined;
            rpc.clearActivity();
            global.tray.setTitle("");
            log.info("[Detect:Proc] Process with PID " + pid + " has been closed");
        }
    });

    log.info("listeners on");
}
*/

async function BeginListener() {
    const process = childprocess.fork(path.join(__dirname, "cominit.js"));

    process.on("message", async (msg) => {
        var data = JSON.parse(msg);
        var process = data.process;
        var pid = data.pid;
        var filepath = data.filepath;
        var proc = data.processInfo;

        if (data.type == "creation") {
            log.info("Roblox process was created");

            if (proc) {
                let cmd = proc.command;

                if (cmd.includes("RobloxPlayerBeta")) {
                    let scriptUrl = util.getScriptUrl(proc.arguments);
                    let placeId;

                    if (scriptUrl == false) {
                        log.info("[Detect:Proc] Couldn't find the script URL");
                        placeId = false;
                        scriptUrl = "";
                    } else {
                        log.info("[Detect:Proc] Script URL", scriptUrl);
                    }
                    if (!scriptUrl.includes("placeId=")) {
                        log.info("[Detect:Proc] Malformed script URL");
                        placeId = false;
                    }
                    placeId = parseInt(scriptUrl.split("placeId=")[1]);
                    if (isNaN(placeId)) {
                        log.info("[Detect:Proc] Malformed script URL");
                        placeId = false;
                    }
                    log.info("[Detect:Proc] Found game ID:", placeId);

                    if (!global.configJSON.enabled) {
                        rpc.clearActivity();
                        global.tray.setTitle("");
                        log.info("RPC is disabled!");
                        return;
                    }

                    if (placeId == false) {
                        rpc.clearActivity();
                        global.tray.setTitle("");
                        log.info("[Detect:Proc] Couldn't find script URL");
                    }

                    let game = await getGameFromCache(placeId);

                    log.info("Playing", game.name, "by", game.by);
                    global.tray.setTitle(game.name, "by", game.by);
                    rpc.setActivity({
                        details: game.name,
                        state: `by ${game.by}`,
                        startTimestamp: 0,
                        largeImageKey: game.iconkey,
                        buttons: [
                            {
                                label: "Join Game",
                                url: "https://www.roblox.com/games/" + (game.id || game.iconkey)
                            }
                        ],
                        instance: false
                    });

                    CachedProcess = pid;
                } else {
                    log.info("Started process was not Roblox");
                }
            } else {
                log.info("Could not find process with PID " + pid);
            }
        } else if (data.type == "deletion") {
            if (CachedProcess == pid) {
                CachedProcess = undefined;
                rpc.clearActivity();
                global.tray.setTitle("");
                log.info("[Detect:Proc] Process with PID " + pid + " has been closed");
            }
        }
    });

    process.on("error", log.error);
    process.on("exit", () => {
        log.info("Process monitor worker exited");

        new Notification({
            title: "RPresence has crashed!",
            body: "Please restart if you would like to continue using it.",
            silent: true
        }).show();

        app.quit();
    });

    global.childprocess = process;
}

module.exports = BeginListener;