import Router from "@koa/router";
import {User, UserAuthProjection} from "../schemas/user.js";
import {hash_password, verify_password} from "../passwords.js";
import jwt from "jsonwebtoken";
import {randomBytes, createHash} from "node:crypto"
import dotenv from "dotenv";
import {Session} from "../schemas/session.js";
import {sha256} from "../utils.js";
import {validatePassword} from "../validation.js";
import mongoose from "mongoose";
import {Debug, Error} from "../Logger.js";

dotenv.config();

export {
    authRouter
}

const authRouter = new Router();


// errors
authRouter.use(async (ctx, next) => {
    try {
        console.log("[USE] ErrorHandler - continue to endpoint")

        let session = await mongoose.startSession()

        ctx.session = session;
        ctx.session.startTransaction()
        await next()
        await ctx.session.commitTransaction()

        ctx.status = ctx.state.response.status
        ctx.message = ctx.state.message
        ctx.body = ctx.state.response.body

        console.log("[USE] ErrorHandler - endpoint returned with no error")
    } catch (err) {
        console.log(`[USE] ErrorHandler - endpoint threw an error - status=${err.status} message=${err.message}`)
        console.log("aborting transaction")
        await ctx.session.abortTransaction()
        ctx.body = undefined
        ctx.status = err.statusCode || 500;
        ctx.message = err.message;
        console.log(`exiting with code - ${ctx.status}`)
    }
})


// token gen
authRouter.use(async (ctx, next) => {
    await next() // login or register

    console.log(`[USE] TokenGenerator - beginning auth token generation - data=${ctx.request.body}`)

    let userId = ctx.state.response.body.userId

    if (!userId) {
        // this shouldnt happen since POST /signup should throw error but just in case
        console.log("NO USER ID")
        ctx.throw(500, "An internal error occurred.")
    }

    // generate access and refresh tokens
    if (ctx.state.response.body.grantAccessToken) {
        let accessToken = jwt.sign({id: userId,}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_TTL})
        ctx.state.response.body["access"] = accessToken
    }
    if (ctx.state.response.body.grantAccessToken) {
        let refreshToken = Buffer.from(randomBytes(256)).toString("base64")
        let refreshTokenHash = sha256(refreshToken)

        let dateCreated = new Date().toISOString()

        // store refresh token
        let session = new Session({
            userId: userId, token: refreshTokenHash, dateCreated
        })

        try {
            await session.save({session: ctx.session})

            ctx.state.response.body["refresh"] = refreshToken
        } catch (err) {
            ctx.throw(500, "An internal error occurred.")
        }
    }
})


// login
authRouter.post("/login", async ctx => {
    const {username, password} = ctx.request.body;

    if (!username || !password) {
        ctx.throw(400, "Please provide username and password in request body.");
    }

    // find by username
    let user = await User.findOne({username}, UserAuthProjection)

    if (!user) {
        // find by email
        user = await User.findOne({email: username}, UserAuthProjection)
    }

    if (!user) {
        //ctx.throw(404, "No user with that username or email.")
        // TODO changed to 401 UNAUTHORIZED to enumerating emails
        ctx.throw(401, "Invalid username or email, or password");
    }

    let isPasswordValid = await verify_password(user.password, password)

    if (!isPasswordValid) {
        ctx.throw(401, "Invalid username or email, or password.")
    }

    ctx.state.response = {
        status: 200,
        body: {
            userId: user.id,
            grantAccessToken: true,
            grantRefreshToken: true,
        }
    }
    console.log("login success. proceeding to token gen with following state")
    console.log(ctx.state)
})


// signup
authRouter.post("/signup", async ctx => {
    console.log("[POST] signup")

    const userBody = ctx.request.body

    Debug(ctx, `userBody=${JSON.stringify(userBody, null, 2)}}`)

    let user = new User(userBody)

    let error = user.validateSync({pathsToSkip: ["id", "dateJoined", "password", "pictureUrl"]})

    let isValid = !error

    if (!isValid) {
        Error(ctx, error)
        ctx.throw(400, "Bad body")
    }

    let userId = crypto.randomUUID()
    user.id = userId

    let passwordHash = await hash_password(user.password)
    user.password = passwordHash

    let dateJoined = new Date().toISOString()
    user.dateJoined = dateJoined

    user.pictureUrl = null

    try {
        Debug(ctx, "Saving User object...")
        console.log(user)
        await user.save({session: ctx.session})
        Debug(ctx, "User object saved...")
    } catch (err) {
        // mongo error code
        Error(ctx, err)
        let code = err.code;

        switch (code) {
            case 11000: // duplicate
                // duplicated field
                let field = Object.keys(err.keyPattern)[0]

                if (field === "id") {
                    // uuid conflict, client should retry immediately
                    ctx.throw(500, "An internal error occurred. Ok to retry immediately.")
                }

                // username or email conflict
                ctx.throw(409, "User with this username or email already exists.")
        }

        // unknown error
        ctx.throw(500, "An internal error occurred.")
    }

    ctx.state.response = {
        status: 201,
        body: {
            userId: userId,
            grantAccessToken: true,
            grantRefreshToken: true,
        }
    }
})


// change password
authRouter.post("/changePassword", async ctx => {
    ctx.throw(501) // TODO move this to data service, use POST /passwordReset instead

    const {username, password, newPassword} = ctx.request.body;

    // TODO impl auto logout on password change

    // find by username
    let user = await User.findOne({username}, UserAuthProjection)

    if (!user) {
        // find by email
        user = await User.findOne({email: username}, UserAuthProjection)
    }

    if (!user) {
        ctx.throw(404, "No user with that username or email.")
    }

    let isPasswordValid = await verify_password(user.password, password)

    if (!isPasswordValid) {
        ctx.throw(401, "Invalid password.") // TODO maybe 403 since identity is known
    }

    let isNewPasswordValid = validatePassword(newPassword)

    if (!isNewPasswordValid) {
        ctx.throw(400, "New password is not valid.")
    }

    ctx.status.response = {
        status: 200,
        message: "Password changed successfully.",
        body: {
            grantAccessToken: false,
            grantRefreshToken: false,
        }
    }
})

authRouter.post("/logout", async ctx => {
    ctx.throw(501) // TODO implement

    const {username, accessToken, refreshToken} = ctx.request.body;

    let removeSession = username && refreshToken

    if (!removeSession) {
        ctx.throw(400)
    }
})

authRouter.post("/passwordReset", async ctx => {
    const {email} = ctx.request.body;

    let count = await User.countDocuments({email})
    let exists = count > 0

    if (exists) {
        // TODO send email
    }

    // always return ACCEPTED
    ctx.status.response = {
        status: 202,
        message: "A password reset code was sent to you if an account with this email exists."
    }
})

authRouter.post("/token", async ctx => {
    const {userId, refreshToken} = ctx.request.body;

    let refreshTokenHash = sha256(refreshToken)

    let user = await User.findOne({id: userId}, UserAuthProjection)
    if (!user) {
        ctx.throw(404, "No user with that username.")
    }

    let session = Session.findOne({userId, token: refreshTokenHash})
    if (!session) {
        ctx.throw(403, "Invalid request.")
    }

    ctx.state.response = {
        status: 200,
        message: "Token granted successfully.",
        body: {userId, grantAccessToken: true, grantRefreshToken: false}
    }
})