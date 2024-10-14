import rl from "../utils/inputInterface.js";
import { displayGoodbye, displayInvalidCommand } from "./displayService.js";
import { getState } from "../state.js";
import { commands } from "../utils/commands.js";

export default function handleUserInput() {
    rl.on("line", async (line) => {
        const [command, ...args] = line.split(" ");
        if (command === ".exit") {
            displayGoodbye(getState().username);
            rl.close();
            return;
        }
        console.log(command);
        const commandOperation = commands[command];
        if (commandOperation) {
            await commandOperation(...args);
        } else {
            displayInvalidCommand();
        }
        rl.prompt();
    });

    rl.on("SIGINT", () => {
        displayGoodbye(getState().username);
        rl.close();
    });
}
