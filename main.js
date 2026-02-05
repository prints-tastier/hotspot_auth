import Koa from 'koa';
import {bodyParser} from "@koa/bodyparser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import {authRouter} from "./routes/auth.js";

dotenv.config();
console.log("DB conn str", process.env.MONGO_URI);
await mongoose.connect(process.env.MONGO_URI)


const app = new Koa()
app.use(bodyParser())

// logger
app.use(async (ctx, next) => {
    // TODO impl

    await next()
})

// authorisation
app.use(async (ctx, next) => {
    // TODO no auth needed
    await next();
})

app.use(authRouter.routes())

app.listen(3000)

