function Debug(ctx, ...messages) {
    console.debug(`debug:[${ctx.method.toUpperCase()}] ${ctx.route} ${messages}`)
}

function Error(ctx, ...messages) {
    console.error(`error:[${ctx.method.toUpperCase()}] ${ctx.route} ${messages}`)
}

function Info(ctx, ...messages) {
    console.info(`info:[${ctx.method.toUpperCase()}] ${ctx.route} ${messages}`)
}

function Log(ctx, ...messages) {
    console.error(`[${ctx.method.toUpperCase()}] ${ctx.route} ${messages}`)
}