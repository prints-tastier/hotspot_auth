import mongoose from "mongoose";

export {
    Session,
}

const sessionSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    dateCreated: {
        type: Date,
        required: true,
        unique: true,
    }
})

const Session = mongoose.model("Session", sessionSchema, "Sessions");