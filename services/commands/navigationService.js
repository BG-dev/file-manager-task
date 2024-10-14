import {displayFail, displayInvalidCommand, displayLocation} from "../displayService.js";
import { dirname, isAbsolute, join, resolve } from "node:path";
import * as os from "node:os";
import {access} from "node:fs/promises";

let currentDir = os.homedir()

export async function cd(path) {
    const parsedPath = parsePath(path);

    if (!parsedPath) {
        displayInvalidCommand()
        return currentDir;
    }

    if (parsedPath === "..") {
        const sourceDir = dirname(currentDir);
        if (sourceDir !== currentDir) {
            currentDir = sourceDir;
        }
        displayLocation(currentDir)
        return currentDir;
    }

    const fullPath = join(...parsedPath);
    const distPath = isAbsolute(fullPath) ? fullPath : resolve(currentDir, fullPath);
    try {
        if (!(await access(distPath))) {
            displayFail(`${distPath} - doesn't exist!`)
            return currentDir;
        }

        currentDir = distPath;
        displayLocation(currentDir)
    } catch (error) {
        displayFail(`${distPath} - doesn't exist!`)
    }
    return currentDir;
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

const __absolute = (dir, ...filePath) => {
    const fullPath = join(...filePath);
    return isAbsolute(fullPath) ? fullPath : resolve(dir, fullPath);
};