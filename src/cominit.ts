const WQL = require("wql-process-monitor");
import find from "find-process";
import log from "electron-log";

const processMonitor = WQL.subscribe({
    filterWindowsNoise: true,
    filter: ["RobloxPlayerBeta.exe"],
    whitelist: true,
});

type DataTable = {
    type: string;
    process: string;
    pid: number;
    filepath: string;
    processInfo?: any;
};

processMonitor.on(
    "creation",
    async ([proc, pid, filepath]: [
        proc: string,
        pid: number,
        filepath: string
    ]) => {
        var dataTable: DataTable = {
            type: "creation",
            process: proc,
            pid: pid,
            filepath: filepath,
        };

        log.info("Process started");

        find("pid", pid)
            .then((list) => {
                if (list.length > 1) {
                    log.error("Multiple Roblox processes running!");
                }

                dataTable.processInfo = list[0];
                var cmd = dataTable.processInfo.cmd.split(" ");
                dataTable.processInfo.command = cmd.shift();
                dataTable.processInfo.arguments = cmd;

                process.send(JSON.stringify(dataTable));
            })
            .catch((err) => {
                log.error(err);
            });
    }
);

processMonitor.on("deletion", ([proc, pid]: [proc: string, pid: number]) => {
    var dataTable = {
        type: "deletion",
        process: proc,
        pid: pid,
    };
    process.send(JSON.stringify(dataTable));
});

log.info("Listeners initiated");

function keepalive() {
    setInterval(keepalive, 1000 * 60 * 60);
}

keepalive();
