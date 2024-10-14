import * as os from "os";
import { cd, ls, cat, add, rn, cp, mv, rmCommand } from "../services/commands/navigationService.js";
import osInfo from "../services/commands/osService.js";
import {hash} from "node:crypto";

let dir = os.homedir();

export const commands = {
    up: async () => (dir = await cd("..")),
    cd: async (path) => (dir = await cd(path)),
    ls: async () => await ls(),
    cat: async (filePath) => cat(filePath),
    add: async (file) => add(file),
    rn: async (filePath, newFileName) => await rn(filePath, newFileName),
    cp: async (filePath, file) => await cp(filePath, file),
    mv: async (filePath, destDir) => await mv(filePath, destDir),
    rm: async (filePath) => await rmCommand(filePath),
    os: async (file) => osInfo(file),
    hash: async (file) => hash(file),
    compress: async (filePath, destPath) => compress(filePath, destPath),
    decompress: async (filePath, destPath) => decompress(filePath, destPath),
};
