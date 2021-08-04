const WQL = require("wql-process-monitor");
const ps = require("ps-node");
const find = require("find-process");
const log = require("electron-log");
const { info } = require("electron-log");

const processMonitor = WQL.subscribe({
    filterWindowsNoise: true,
    filter: ["RobloxPlayerBeta.exe"],
    whitelist: true
});

processMonitor.on("creation", async ([proc, pid, filepath]) => {
    var dataTable = {
        type: "creation",
        process: proc,
        pid: pid,
        filepath: filepath
    }

    log.info("Process started");

    /*
    ps.lookup({ pid: pid }, async (err, result) => {
        if (err) {
            log.error(err);
        }

        dataTable.processInfo = result[0];
        process.send(JSON.stringify(dataTable));
    });*/

    find('pid', pid).then((list) => {
        if (list.length > 1) {
            log.error("Multiple Roblox processes running!");
        }

        dataTable.processInfo = list[0];
        var cmd = dataTable.processInfo.cmd.split(" ");
        dataTable.processInfo.command = cmd.shift();
        dataTable.processInfo.arguments = cmd;

        process.send(JSON.stringify(dataTable));
    }).catch((err) => {
        log.error(err);
    });
});

processMonitor.on("deletion", ([proc, pid]) => {
    var dataTable = {
        type: "deletion",
        process: proc,
        pid: pid
    }
    process.send(JSON.stringify(dataTable));
});

log.info("Listeners initiated");

function keepalive() {
    setInterval(keepalive, 1000 * 60 * 60);
}

keepalive();