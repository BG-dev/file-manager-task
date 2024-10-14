import {displayFail, displayInvalidInput, displayLocation, displayUserOutput} from "../displayService";
import {isAbsolute, join, resolve} from "node:path";
import {readFile} from "node:fs/promises";

const hash = async (dir, file) => {
    const parsedDir = parsePath(dir);
    const parsedFile = parsePath(file);

    if (!parsedFile){
        displayInvalidInput()
        return
    }

    try {
        const filePath = getAbsolutePath(parsedDir, parsedFile);
        const data = await readFile(filePath);
        const hash = crypto.createHash("sha256").update(data).digest("hex");

        displayUserOutput(hash)
        displayLocation(parsedDir)
    } catch (error) {
        displayFail(error.message)
    }
};

const getAbsolutePath = (dir, filePath) => {
    const fullPath = join(filePath);
    return isAbsolute(fullPath) ? fullPath : resolve(dir, fullPath);
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

export default hash;