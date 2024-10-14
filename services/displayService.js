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

export function displayInvalidInput() {
    console.log(`Invalid input ${EOL}`)
}

export function displayUnable() {
    console.log(`Unable to perform command ${EOL}`)
}

export function displayFileExist(){
    console.log(`File already exist ${EOL}`)
}

export function displayFileCreated(file){
    console.log(`File ${file} created successfully ${EOL}`)
}

export function displayFileRenamed(file){
    console.log(`File ${file} renamed successfully ${EOL}`)
}

export function displayFileProcessed (operation, file){
    console.log(`${operation} on ${file} was successful`)
}

export function displayUserOutput(option){
    console.log(option)
}
