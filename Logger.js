export {
    Debug,
    Error,
    Info,
    Log
}

function Debug(ctx, ...messages) {
    console.log(`debug:[${ctx.method.toUpperCase()}] ${ctx.route} ${messages}`)
}

function Error(ctx, ...messages) {
    console.log(`error:[${ctx.method.toUpperCase()}] ${ctx.route} ${messages}`)
}

function Info(ctx, ...messages) {
    console.log(`info:[${ctx.method.toUpperCase()}] ${ctx.route} ${messages}`)
}

function Log(ctx, ...messages) {
    console.log(`[${ctx.method.toUpperCase()}] ${ctx.route} ${messages}`)
}