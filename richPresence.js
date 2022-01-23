const util = require("./util");
const RPC = require("discord-rpc");
const fetch = require("node-fetch");
const rpc = global.rpc = new RPC.Client({ transport: "ipc" });
const WQL = require("wql-process-monitor");
const ps = require("ps-node");
const log = require("electron-log");
const childprocess = require("child_process");
const { app, Notification, Menu, Tray, shell, powerSaveBlocker } = require("electron");
const path = require("path");
const express = require("express");
const { json } = require("body-parser");

let CachedProcess;
let joinButtonRetry;
let CachedIcons = {};

async function getGameFromCache(gameid) {
    if (CachedIcons[gameid]) return CachedIcons[gameid];

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

        if (j.IconImageAssetId && j.IconImageAssetId != 0) {
            obj.iconkey = "https://assetdelivery.roblox.com/v1/asset?id=" + j.IconImageAssetId;
        }

        CachedIcons[gameid] = obj;
        return obj;
    } catch (e) {
        log.error(e.message);
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

                    var redeem = await fetch('https://auth.roblox.com/v1/authentication-ticket/redeem', { method: 'POST', headers: { "RBXAuthenticationNegotiation": "https://github.com/6ixfalls/RPresence", "Content-Type": "application/json" }, body: JSON.stringify({ authenticationTicket: util.getTicket(proc.arguments) }) });
                    var ROBLOSECURITY = util.getSecurityCookie(redeem.headers.raw()['set-cookie']);
                    var userId = await fetch(`https://users.roblox.com/v1/users/authenticated`, { headers: { Cookie: ROBLOSECURITY } });
                    var userData = await userId.json();

                    var startTimestamp = + new Date();

                    joinButtonRetry = setInterval(async () => {
                        var gameInfoHeaders = { 'Content-Type': "application/json" };

                        if (global.configJSON.bypassPrivacy) {
                            gameInfoHeaders['Cookie'] = ROBLOSECURITY;
                        }

                        var gameInfo = await fetch(`https://presence.roblox.com/v1/presence/users`, {
                            method: 'POST',
                            headers: gameInfoHeaders,
                            body: `{"userIds":[${userData.id}]}`
                        });
                        var gameInfoResponse = await gameInfo.json();

                        if (gameInfoResponse.userPresences) {
                            var gameInfoData = gameInfoResponse.userPresences[0];

                            if (gameInfoData.gameId && gameInfoData.lastLocation) {
                                game = await getGameFromCache(gameInfoData.placeId);

                                rpc.setActivity({
                                    details: gameInfoData.lastLocation,
                                    state: `by ${game.by}`,
                                    startTimestamp: startTimestamp,
                                    largeImageKey: game.iconkey,
                                    buttons: [{
                                        label: "Join Game",
                                        url: `https://xiva.xyz/RPresence/?placeID=${gameInfoData.rootPlaceId}&gameInstanceID=${gameInfoData.gameId}&gameName=${encodeURIComponent(gameInfoData.lastLocation)}`
                                    }],
                                    instance: false
                                });

                                log.info("Generated InstantJoin URL: " + `https://xiva.xyz/RPresence/?placeID=${gameInfoData.rootPlaceId}&gameInstanceID=${gameInfoData.gameId}&gameName=${encodeURIComponent(gameInfoData.lastLocation)}`);

                                clearInterval(joinButtonRetry);
                            }
                        }
                    }, 10000);

                    rpc.setActivity({
                        details: game.name,
                        state: `by ${game.by}`,
                        startTimestamp: startTimestamp,
                        largeImageKey: game.iconkey,
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
                clearInterval(joinButtonRetry);
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

    // Roblox Studio Plugin Support
    let app = express();

    app.use(json());

    app.post('/update', async (req, res) => {
        var data = req.body;
        var gameName = data.name;
        var gameId = data.gameId;
        var game;

        if (gameId) {
            game = await getGameFromCache(gameId);
        }

        if (game) {
            rpc.setActivity({
                details: game.name,
                state: `by ${game.by}`,
                startTimestamp: + new Date(),
                largeImageKey: game.iconkey,
                instance: false
            });
        } else {
            rpc.setActivity({
                details: gameName,
                state: `Unpublished Game`,
                startTimestamp: + new Date(),
                largeImageKey: global.configJSON.defaultIconKey,
                instance: false
            });
        }

        res.sendStatus(200);
    });

    app.get('/clear', (req, res) => {
        rpc.clearActivity();

        res.sendStatus(200);
    });

    app.listen(2043);
}

module.exports = BeginListener;