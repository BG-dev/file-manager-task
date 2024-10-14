import {
    displayFail, displayFileCreated, displayFileExist, displayFileProcessed, displayFileRenamed,
    displayInvalidCommand,
    displayInvalidInput,
    displayLocation,
    displayUnable
} from "../displayService.js";
import { dirname, isAbsolute, join, resolve, parse } from "node:path";
import * as os from "node:os";
import {access, readdir, stat, readFile, writeFile, rename, unlink, rm} from "node:fs/promises";
import rl from "../../utils/inputInterface.js";
import {EOL} from "os";
import {createReadStream, createWriteStream} from "node:fs";

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

    const fullPath = join(parsedPath);
    const distPath = isAbsolute(fullPath) ? fullPath : resolve(currentDir, fullPath);
    try {
        const exist = await isPathExist(distPath)
        if (!exist) {
            displayFail(`${distPath} - doesn't exist!`)
            return currentDir;
        }

        currentDir = distPath;
        displayLocation(currentDir)
    } catch (error) {
        displayFail(`${"n"} - doesn't exist!`)
    }
    return currentDir;
}

export async function ls() {
    const parsedPath = parsePath(currentDir);

    try {
        const fsObjects = await readdir(parsedPath);
        const statPromises = fsObjects.map(async (fsObject) => {
            try {
                const stats = await stat(join(parsedPath, fsObject));
                const type = stats.isDirectory() ? "directory" : "file";
                return {
                    name: fsObject,
                    type,
                };
            } catch {
                return { name: fsObject, type: "Unknown" };
            }
        });

        const fsObjectsInfo = await Promise.all(statPromises);

        const sortedFsObjects = fsObjectsInfo.sort((a, b) => {
            if (a.type === b.type) {
                return a.name.localeCompare(b.name);
            }
            return a.type === "directory" ? -1 : 1;
        });

        console.table(sortedFsObjects, ["name", "type"]);
        displayLocation(parsedPath)
    } catch (error) {
        displayFail("")
    }
}

export async function cat(filePath) {
    const parsedPath = parsePath(currentDir);
    const parsedFile = parsePath(filePath);

    if (!parsedFile){
        displayInvalidInput();
        return
    }
    const filePathAbsolute = getAbsolutePath(parsedPath, parsedFile)

    try {
        const stats = await stat(filePathAbsolute);
        if (!stats.isFile()){
            displayUnable();
            return
        }

        const data = await readFile(filePathAbsolute, { encoding: "utf-8", flag: "r" });
        const lines = data.split(os.EOL);
        const wrappedLines = lines.flatMap((line) => wrapText(line, 90));
        const dataFramed = `┌${"─".repeat(93)}┐\n${wrappedLines.map((row) => `│ ${row.padEnd(90)} │`).join(EOL)}\n└${"─".repeat(93)}┘`;
        console.log(dataFramed);
    } catch (error) {
        displayFail(error.message)
    } finally {
        displayLocation(parsedPath)
    }
}

export const add = async (file) => {
    const parsedDir = parsePath(currentDir);
    const parsedFile = parsePath(file);

    if (!parsedFile){
        displayInvalidInput()
        return
    }

    try {
        const dirContent = await readdir(parsedDir);
        if (dirContent.includes(parsedFile)){
            displayFileExist()
            return
        }

        await writeFile(getAbsolutePath(parsedDir, parsedFile), "");
        displayFileCreated(parsedFile)
    } catch (error) {
        displayFail(error.message)
    } finally {
        displayLocation(parsedDir)
    }
};

export const rn = async (filePath, newFileName) => {
    if (!filePath || !newFileName) {
        displayInvalidInput()
    }
    const parsedFilePath = parsePath(filePath);
    const { dir: fileDir, base: oldFileName } = parse(parsedFilePath);
    const absoluteOldPath = getAbsolutePath(currentDir, fileDir, oldFileName);
    const absoluteNewPath = getAbsolutePath(currentDir, fileDir, newFileName);

    try {
        const exist = await isPathExist(absoluteOldPath);
        if (!exist) {
            throw new Error(`File ${oldFileName} does not exist`);
        }

        await rename(absoluteOldPath, absoluteNewPath);
        displayFileRenamed(newFileName)
    } catch (error) {
        displayFail(error.message)
        return;
    }
    displayLocation(currentDir)
};

const copyFile = (srcPath, destPath) => {
    return new Promise((resolve, reject) => {
        const readable = createReadStream(srcPath);
        const writable = createWriteStream(destPath);

        readable.pipe(writable);

        writable.on("close", resolve);
        writable.on("error", (error) => {
            readable.destroy();
            displayFail(error.message)
        });

        readable.on("error", (error) => {
            writable.destroy();
            displayFail(error.message)
        });
    });
};

export const cp = async (filePath, destDir) => {
    try {
        const parsedDir = parsePath(currentDir);
        const parsedFilePath = parsePath(filePath);
        const parsedDestDir = parsePath(destDir);

        if (!parsedFilePath || !parsedDestDir){
            displayInvalidInput()
            return
        }

        await fileOperationsHandler(
            parsedDir,
            parsedFilePath,
            parsedDestDir,
            copyFile,
        );
    } catch (error) {
        console.error("Error copying file:", error.message);
    }
};

const moveFile = (srcPath, destPath) => {
    return new Promise((resolve, reject) => {
        const readable = createReadStream(srcPath);
        const writable = createWriteStream(destPath);

        readable.pipe(writable);

        writable.on("close", async () => {
            try {
                await unlink(srcPath);
                resolve();
            } catch (error) {
                reject(error.message);
            }
        });

        writable.on("error", (error) => {
            readable.destroy();
            displayFail(error.message)
        });

        readable.on("error", (error) => {
            writable.destroy();
            displayFail(error.message)
        });
    });
};

export const mv = async (dir, filePath, destDir) => {
    const parsedDir = parsePath(dir);
    const parsedFilePath = parsePath(filePath);
    const parsedDestDir = parsePath(destDir);
    try {
        await fileOperationsHandler(
            parsedDir,
            parsedFilePath,
            parsedDestDir,
            moveFile,
            {
                operationName: "Move",
            },
        );
    } catch (error) {
        displayFail(error.message)
    }
};

const removeRecursively = async (path) => {
    const pathStats = await stat(path);

    if (pathStats.isDirectory()) {
        const files = await readdir(path);
        for (const file of files) {
            const filePath = join(path, file);
            await removeRecursively(filePath);
        }
    }
    await rm(path);
};

export const rmCommand = async (dir, filePath) => {
    const parsedDir = parsePath(dir);
    const parsedFilePath = parsePath(filePath);

    try {
        const fullPath = join(parsedDir, parsedFilePath);
        await removeRecursively(fullPath);
        displayFileProcessed("Delete", parsedFilePath)
    } catch (error) {
        displayFail(error.message)
    }
};

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

const isPathExist = async (path) => {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
};

const getAbsolutePath = (dir, filePath) => {
    const fullPath = join(filePath);
    return isAbsolute(fullPath) ? fullPath : resolve(dir, fullPath);
}

const wrapText = (text, width) => {
    const regex = new RegExp(`(.{1,${width}})(\\s|$)|(.{1,${width}})`, "g");
    return text.match(regex) || [];
};

const fileOperationsHandler = async (
    dir,
    filePath,
    destDir,
    operation,
    options = { operationName: "Processed", validateDest: true },
) => {
    try {
        const fullSrcPath = getAbsolutePath(dir, filePath);
        const fullDestDir = getAbsolutePath(dir, destDir);
        const { base: fileName } = parse(filePath);
        const fullDestPath = join(fullDestDir, fileName);

        if (options.validateDest) {
            const pathsValid = await validatePaths(fullSrcPath, fullDestDir);
            if (!pathsValid) return;
        }

        const overwrite = await confirmOverwrite(fullDestPath, fileName);
        if (!overwrite) {
            console.log(
                `Operation cancelled. ${fileName} was not overwritten`,
            );
            displayLocation(dir)
            return;
        }

        await operation(fullSrcPath, fullDestPath);
        displayFileProcessed(options.operationName, fileName)
        displayLocation(dir)
    } catch (error) {
        displayFail(error.message)
    }
};

const validatePaths = async (srcPathStr, destDirStr) => {
    const srcPath = parsePath(srcPathStr);
    const destDir = parsePath(destDirStr);

    const srcExists = await isPathExist(srcPath);
    if (!srcExists) {
        displayFail(`Source file ${srcPath} does not exist.`)
        return false;
    }

    const destExists = await isPathExist(destDir);
    if (!destExists) {
        displayFail(`Destination directory ${destDir} does not exist.`)
        return false;
    }

    const stats = await stat(destDir);
    if (!stats.isDirectory()) {
        displayFail(`${destDir} is not a directory`)
        return false;
    }

    return true;
};

const confirmOverwrite = async (destPath, fileName) => {
    const fileExists = await isPathExist(destPath);
    if (fileExists) {
        rl.pause();
        const answer = await askUser(rewrite(fileName));
        rl.resume();

        if (answer.toLowerCase() === "y") return true;
        if (answer.toLowerCase() === "n") return false;

        displayFail("Invalid input. Please enter 'y' or 'n'.")
        return await confirmOverwrite(destPath, fileName);
    }
    return true;
};

const askUser = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
};

const rewrite= (fileName) =>
    `${fileName} already exists. Would you like to re-write it? (y/N): `