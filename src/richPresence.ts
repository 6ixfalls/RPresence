import { app, Notification, Menu, Tray } from "electron";
import * as util from "./util";
import axios from "axios";
import log from "electron-log";
import childprocess from "child_process";
import path from "path";
import express from "express";
import { json } from "body-parser";
import type, { Client } from "discord-rpc";

let CachedProcess: number;
let joinButtonRetry: NodeJS.Timeout;
let CachedIcons: {
    [key: string]: { name: string; by: string; iconkey: string; id: number };
} = {};

async function getGameFromCache(gameid: number) {
    if (CachedIcons[gameid]) return CachedIcons[gameid];

    try {
        let apiResponse = await axios.get(
            "https://api.roblox.com/marketplace/productinfo?assetId=" + gameid
        );
        if (apiResponse.status != 200) {
            throw new Error("Could not get game info from Roblox API.");
        }
        let j: any = await apiResponse.data;
        let obj = {
            name: j.Name,
            by: j.Creator.Name,
            iconkey: global.configJSON.defaultIconKey,
            id: gameid,
        };

        if (j.IconImageAssetId && j.IconImageAssetId != 0) {
            obj.iconkey =
                "https://assetdelivery.roblox.com/v1/asset?id=" +
                j.IconImageAssetId;
        }

        CachedIcons[gameid] = obj;
        return obj;
    } catch (e) {
        log.error(e.message);
        return {
            name: "Unknown Game",
            by: "Unknown",
            iconkey: global.configJSON.defaultIconKey,
            id: gameid,
        };
    }
}

export async function BeginListener() {
    const process = childprocess.fork(path.join(__dirname, "cominit.js"));

    process.on("message", async (msg) => {
        var data = JSON.parse(msg.toString());
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
                    let placeId: number | false;

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
                        global.rpc.clearActivity();
                        global.tray.setTitle("");
                        log.info("Rich Presence is disabled!");
                        return;
                    }

                    if (placeId == false) {
                        global.rpc.clearActivity();
                        global.tray.setTitle("");
                        log.info("[Detect:Proc] Couldn't find script URL");
                        return;
                    }

                    let game = await getGameFromCache(placeId);

                    log.info("Playing", game.name, "by", game.by);
                    global.tray.setTitle(game.name + " by " + game.by);

                    var redeem = await axios.post(
                        "https://auth.roblox.com/v1/authentication-ticket/redeem",
                        {
                            authenticationTicket: util.getTicket(
                                proc.arguments
                            ),
                        },
                        {
                            headers: {
                                RBXAuthenticationNegotiation:
                                    "https://github.com/6ixfalls/RPresence",
                                "Content-Type": "application/json",
                            },
                        }
                    );
                    var ROBLOSECURITY = util.getSecurityCookie(
                        redeem.headers["set-cookie"]
                    );

                    if (ROBLOSECURITY != false) {
                        var userId = await axios.get(
                            `https://users.roblox.com/v1/users/authenticated`,
                            { headers: { Cookie: ROBLOSECURITY } }
                        );
                        var userData: any = userId.data;

                        var startTimestamp = +new Date();

                        joinButtonRetry = setInterval(async () => {
                            var gameInfoHeaders: any = {
                                "Content-Type": "application/json",
                            };

                            if (global.configJSON.bypassPrivacy) {
                                gameInfoHeaders["Cookie"] = ROBLOSECURITY;
                            }

                            var gameInfo: any = await axios.post(
                                `https://presence.roblox.com/v1/presence/users`,
                                { userIds: [userData.id] },
                                {
                                    headers: gameInfoHeaders,
                                }
                            );
                            var gameInfoResponse = gameInfo.data;

                            if (gameInfoResponse.userPresences) {
                                var gameInfoData =
                                    gameInfoResponse.userPresences[0];

                                if (
                                    gameInfoData.gameId &&
                                    gameInfoData.lastLocation
                                ) {
                                    game = await getGameFromCache(
                                        gameInfoData.placeId
                                    );

                                    let joinURL;

                                    if (
                                        global.configJSON.joinLinkMode ==
                                        "rogold"
                                    ) {
                                        joinURL = `https://sixfalls.me/RPresence/?placeID=${
                                            gameInfoData.rootPlaceId
                                        }&gameInstanceID=${
                                            gameInfoData.gameId
                                        }&gameName=${encodeURIComponent(
                                            gameInfoData.lastLocation
                                        )}`;
                                    } else {
                                        var inviteData = await axios.get(
                                            `https://ropro.io/api/createInvite.php?universeid=${gameInfoData.universeId}&serverid=${gameInfoData.gameId}`,
                                            {
                                                responseType: "text",
                                                headers: {
                                                    From: "https://github.com/6ixfalls/RPresence", // tell ropro api that api is from us (optional but why not)
                                                },
                                            }
                                        );

                                        joinURL = inviteData.data;
                                    }

                                    global.rpc.setActivity({
                                        details: gameInfoData.lastLocation,
                                        state: `by ${game.by}`,
                                        startTimestamp: startTimestamp,
                                        largeImageKey: game.iconkey,
                                        buttons: [
                                            {
                                                label: "Join Game",
                                                url: joinURL,
                                            },
                                        ],
                                        instance: false,
                                    });

                                    log.info(
                                        "Generated InstantJoin URL: " + joinURL
                                    );

                                    clearInterval(joinButtonRetry);
                                }
                            }
                        }, 10000);
                    }

                    global.rpc.setActivity({
                        details: game.name,
                        state: `by ${game.by}`,
                        startTimestamp: startTimestamp,
                        largeImageKey: game.iconkey,
                        instance: false,
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
                global.rpc.clearActivity();
                global.tray.setTitle("");
                log.info(
                    "[Detect:Proc] Process with PID " + pid + " has been closed"
                );
            }
        }
    });

    process.on("error", log.error);
    process.on("exit", () => {
        log.info("Process monitor worker exited");

        new Notification({
            title: "RPresence has crashed!",
            body: "Please restart if you would like to continue using it.",
            silent: true,
        }).show();

        app.quit();
    });

    // Roblox Studio Plugin Support
    let expApp = express();

    expApp.use(json());

    expApp.post("/update", async (req, res) => {
        var data = req.body;
        var gameName = data.name;
        var gameId = data.gameId;
        var game;

        if (gameId) {
            game = await getGameFromCache(gameId);
        }

        if (game) {
            global.rpc.setActivity({
                details: game.name,
                state: `by ${game.by}`,
                startTimestamp: +new Date(),
                largeImageKey: game.iconkey,
                instance: false,
            });
        } else {
            global.rpc.setActivity({
                details: gameName,
                state: `Unpublished Game`,
                startTimestamp: +new Date(),
                largeImageKey: global.configJSON.defaultIconKey,
                instance: false,
            });
        }

        res.sendStatus(200);
    });

    expApp.get("/clear", (req, res) => {
        global.rpc.clearActivity();

        res.sendStatus(200);
    });

    expApp.listen(2043);
}
