import {arch, cpus, homedir, userInfo} from "node:os";
import {displayFail, displayInvalidInput, displayLocation, displayUserOutput} from "../displayService.js";

const osOptions = {
    "--EOL": getEOL,
    "--cpus": getCPUS,
    "--homedir": getHomeDir,
    "--username": getUsername,
    "--architecture": getArchitecture,
};

function getEOL() {
    displayUserOutput(JSON.stringify(EOL))
}

function getCPUS() {
    const cpuInfo = cpus().map((cpu, index) => ({
        Core: index + 1,
        Model: cpu.model,
        "Clock Rate (GHz)": (cpu.speed / 1000).toFixed(2),
    }));
    console.log(
        `Overall amount of CPUs: ${cpuInfo.length}`,
    );
    console.table(cpuInfo);
}

function getHomeDir() {
    const homeDir = homedir();
    displayUserOutput(homeDir)
}

function getUsername() {
    const username = userInfo({ encoding: "utf-8" }).username;
    username
        ? displayUserOutput(`System User name: ${username}`)
        : displayFail("Unable to retrieve username");
}

function getArchitecture() {
    const architecture = arch();
    displayUserOutput(`Node.js binary architecture: ${architecture}`);
}

async function osInfo(currentDir, file) {
    const [parsedFile] = parsePath(file);

    try {
        const operation = osOptions[parsedFile];
        if (operation) {
            await operation();
            displayLocation(currentDir)
        } else {
            displayInvalidInput()
        }
    } catch (error) {
        displayFail(error.message)
    }
}

const parsePath = (path) => {
    if (typeof path !== "string") {
        return null;
    }

    const formattedPath = path.replace(/%/g, " ");

    const regex = /(["'])(.*?)\1|(\S+)/g;
    const matches = [...formattedPath.matchAll(regex)].map((match) =>
        (match[2] || match[3] || "").replace(/\\ /g, " ")
    );

    if (matches.length === 0) return null;
    return matches.join(" ");
};

export default osInfo;