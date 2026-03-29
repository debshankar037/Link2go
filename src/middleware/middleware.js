import {
    LinkAlreadyExists,
    InvalidLinkStructure,
    LinkNotFound,
    InvalidShortLink,
    ErrorResponse
} from "../response/error/error";
import { randomUUID } from "crypto";
import { logger } from "..";
import { URLEncoderDecoder } from "../core/encoder/URLEncoderDecoder";
import { checkIfCodeValid } from "../db/mongoQueryOperations";

export class LinkMiddleware {

    static linkMetaMiddleware = (req, res, next) => {
        req.meta ??= {};

        req.meta.requestId = req.headers["x-request-id"] || randomUUID();
        req.meta.startTime = Date.now();
        req.meta.method = req.method;
        req.meta.ip = req.ip;
        req.meta.userAgent = req.headers["user-agent"];

        res.on("finish", () => {
            const duration = Date.now() - req.meta.startTime;
            req.logger?.info("request completed", {
                requestId: req.meta.requestId,
                method: req.meta.method,
                url: req.meta.originalUrl,
                status: res.statusCode,
                duration
            });
        });

        next();
    };

    // Validate the URL structure
    static linkStructureMiddleware = (req, res, next) => {
        const link = req?.body?.link;
        if (!link) {
            return next(new InvalidLinkStructure("No link provided"));
        }

        try {
            const url = new URL(link);
            req.meta ??= {};
            req.meta.originalUrl = url; // store as URL object
            next();
        } catch (error) {
            req.logger?.error("invalid link structure", { link, err: error.message });
            next(new InvalidLinkStructure(`Link ${link} is invalid. Please provide a valid link.`));
        }
    };


    // Middleware: reject URLs already pointing to your shortener
    static linkAlreadyShortenedMiddleware = (req, res, next) => {
        try {
            const target = req?.meta?.originalUrl;
            if (!(target instanceof URL)) {
                return next(new ErrorResponse("processing", "Request meta not initialized"));
            }
            const domain = process.env.SHORTENER_DOMAIN || "link2go.io";
            const url = target.href;
            if (url.includes(domain)) {
                req.logger?.error?.(`url ${url} already shortened`);
                return next(
                    new LinkAlreadyExists(`link ${url} already shortened`)
                );
            }
            next();
        } catch (err) {
            if (err instanceof ErrorResponse) {
                return next(err);
            }
            req.logger?.error?.(
                `error checking shortener domain for ${req?.meta?.originalUrl?.href}`,
                { err: err.message }
            );
            next(
                new ErrorResponse(
                    "processing",
                    `error checking link: ${err.message}`
                )
            );
        }
    };

    // Optionally: lightweight HEAD request to check URL exists
    static validLinkMiddleware = async (req, res, next) => {
        try {
            const url = req?.meta?.originalUrl;
            if (!url) {
                return next(new ErrorResponse("processing", "Request meta not initialized"));
            }

            const headResponse = await fetch(url.href, { method: "HEAD" });
            if (!headResponse.ok) {
                req.logger?.warn("link HEAD check failed", {
                    url: url.href,
                    status: headResponse.status
                });
                return next(new LinkNotFound(`Link ${url.href} not found or unreachable`));
            }
            next();
        } catch (error) {
            req.logger?.error("link validation failed", {
                url: req?.meta?.originalUrl?.href,
                err: error.message
            });
            next(new ErrorResponse("processing", `Failed to validate link: ${error.message}`));
        }
    };

    static verifyCodeMiddleware = async (req, res, next) =>{
        try {
            const code = req.params?.code;
            if(!code){
                logger.error(`Invalid request to redirect given invalid code ${code}`);
                throw new ErrorResponse("invalid",`Received invalid code ${code} in the param`);
            }
            const id = URLEncoderDecoder.decode(code);
            if(!id){
                logger.error(`Failed to decode the code ${code}`);
                throw new ErrorResponse("processing",`Failed to decode the code ${code}`);
            }
            const doc = await checkIfCodeValid(id);
            if(doc && doc.originalUrl){
                req.meta.url = doc.originalUrl;
            }else{
                return next(new InvalidShortLink(`code ${code} present in short link is invalid`));
            }
            next();
        }catch(error){
            if(error instanceof ErrorResponse){
                return next(error);
            }
            logger.error(`error while verifying code validity - ${error.message}`);
            next(new ErrorResponse("processing", `Failed to validate link: ${error.message}`));
        }
    }
}