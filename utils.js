import {createHash} from "node:crypto";

export {
    isLowerAlpha, isUpperAlpha, isAlpha, isNumeric, isAlphanumeric, hasSpecialCharacter,
    sha256
}

function isLowerAlpha(str) {
    str.some(char => char === char.toLowerCase())
}

function isUpperAlpha(str) {
    str.some(char => char === char.toUpperCase())
}

function isAlpha(str) {
    return isLowerAlpha(str) || isUpperAlpha(str)
}

function isNumeric(str) {
    return str.some(char => /\d/.test(char))
}

function isAlphanumeric(str) {
    return isAlpha(str) || isNumeric(str)
}

function hasSpecialCharacter(str) {
    return !isAlphanumeric(str)
}

function sha256(token) {
    const hash = createHash("sha256")
        .update(token)
        .digest("base64")

    return hash
}