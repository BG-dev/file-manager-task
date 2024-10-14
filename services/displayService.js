import { EOL } from "os";

export function displayGreating(username) {
    console.log(`${EOL}Welcome to the File Manager, ${username}!`);
}

export function displayGoodbye(username) {
    console.log(`${EOL}Thank you for using File Manager, ${username}, goodbye!`);
}

export function displayLocation(location) {
    console.log(`${EOL}You are currently in ${location}`);
}

export function displayInvalidCommand() {
    console.log(`Invalid command ${EOL}`);
}

export function displayFail(message) {
    console.log(`Operation failed: ${message}${EOL}`)
}
