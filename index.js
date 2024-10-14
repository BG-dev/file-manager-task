import * as os from "os";
import handleUserInput from "./services/commandsService.js";
import { displayGreating, displayLocation } from "./services/displayService.js";
import { setState, getState } from "./state.js";

function main() {
    const args = process.argv.slice(2);
    const homedir = os.homedir();
    if (args.length > 0 && args[0].startsWith("--username=")) {
        setState({ username: args[0].split("=")[1] });
    }
    displayGreating(getState().username);
    displayLocation(homedir);
    handleUserInput();
}

main();
