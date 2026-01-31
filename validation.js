import dotenv from "dotenv";

dotenv.config();

export {
    validateUsername,
    validateName,
    validateEmail,
    validatePassword
}


// TODO write tests
function validateUsername(username) {
    let usernameRegex = new RegExp(process.env.USERNAME_REGEX);

    let lengthValid = username.length >= process.env.USERNAME_MIN_LENGTH &&
        username.length <= process.env.USERNAME_MAX_LENGTH;

    let formatValid = usernameRegex.test(username);

    return lengthValid && formatValid;
}

function validateName(username) {
    let lengthValid = username.length <= process.env.NAME_MAX_LENGTH;

    return lengthValid
}

function validateEmail(email) {
    return true // TODO implement
}

function validatePassword(password) {
    let chars = [...password]

    let hasLower = chars.some(char => char === char.toLowerCase());
    let hasUpper = chars.some(char => char === char.toUpperCase());
    let hasDigit = chars.some(char => /\d/.test(char));
    let hasSpecialCharacter = chars.some(char => /[^a-zA-Z0-9]/.test(char));

    return hasLower && hasUpper && hasDigit && hasSpecialCharacter;
}

validatePassword("Password&1")