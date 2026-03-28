import { error } from "console";
import {
    LinkAlreadyExists,
    InvalidLinkStructure,
    LinkNotFound,
    ErrorResponse
} from "../response/error/error.js";
import { randomUUID } from "crypto";

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
            if(url.includes(domain)){
                req.logger.error(`url ${url} already shortened`);
                throw new LinkAlreadyExists(`link ${url} already shortened`);
            }
            next();
        } catch (error) {
            if(error instanceof ErrorResponse){
                throw error;
            }
            req.logger.error(`error occured while checking link ${req.meta.url} already shortened or not ${error.message}`)
            next(new ErrorResponse("processing",`error occured while checking link ${req.meta.url} already shortened or not ${error.message}`));
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
}