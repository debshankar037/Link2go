import express from "express";
import dotenv from "dotenv";
import { PinoLogger } from "./pinoLogger/pinoLogger";
import { LinkMiddleware } from "./middleware/middleware";
import { LinkController } from "./controller/LinkController";
import { connectDatabase } from "./db/connection";
import { ErrorResponse } from "./response/error/error";

dotenv.config();

const app = express();

export const logger = new PinoLogger({
    name: "link-shortner-processor",
    console: true,
    level: "info"
});

const PORT = process.env.PORT || 5000;

export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    req.logger = logger;
    next();
});

app.post("/shorten/link",
    LinkMiddleware.linkMetaMiddleware,
    LinkMiddleware.linkStructureMiddleware,
    LinkMiddleware.linkAlreadyShortenedMiddleware,
    asyncHandler(LinkMiddleware.validLinkMiddleware),
    asyncHandler(LinkController.LinkShortner)
);

app.get("/",(req,res)=>{
    res.status(200).json({message:"Welcome to Link Shortner"});
});

app.get("/link2go.io/:code",
    LinkMiddleware.linkMetaMiddleware,
    asyncHandler(LinkMiddleware.verifyCodeMiddleware),
    LinkController.RedirectToOriginal
)

app.use((err, req, res, next) => {
    if (err instanceof ErrorResponse) {
        return res.status(err.statusCode).json({
            error: { code: err.code, message: err.message }
        });
    }
    req.logger?.error?.("unhandled error", { message: err.message });
    res.status(500).json({ error: { message: "Internal server error" } });
});

async function start() {
    await connectDatabase({ logger });
    app.listen(PORT, () => {
        logger.info(`Link Shortner started on port ${PORT}`);
    });
}

start().catch((err) => {
    logger.error("Server failed to start", { message: err.message });
    process.exit(1);
});