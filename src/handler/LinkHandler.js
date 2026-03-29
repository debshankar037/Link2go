import { ValidResponse } from "../response/validResponse/response";
import { ErrorResponse } from "../response/error/error";
import { URLEncoderDecoder } from "../core/encoder/URLEncoderDecoder";
import { createURLEntryInDB } from "../db/mongoQueryOperations";
import mongoose from "mongoose";

export class LinkProcessor {
    static LinkShortner = async (link, logger) => {
        try {
            // Convert link to string if URL object
            const href = link instanceof URL ? link.href : String(link);
            const base =
                process.env.SHORTENER_BASE_URL || "http://localhost:5000";
            const _id = new mongoose.Types.ObjectId();
            logger.debug(`Created ${_id} for storing creating short code for the link ${href}`);
            const code = URLEncoderDecoder.encode(_id);
            logger?.info?.(`Generated code ${code} for id ${_id.toString}`);
            if (!code) {
                logger?.error?.("Failed to generate short code", { href });
                throw new ErrorResponse(
                    "processing",
                    `Failed to generate short code for the link ${href}`
                );
            }
            const shortURL = `${stripTrailingSlash(base)}/link2go.io/${code}`;
            logger?.info?.('Constructed shortURL:', shortURL);
            const insertResult = await createURLEntryInDB(shortURL,_id,href);
            console.log(insertResult);
            if(insertResult?.shortUrl && insertResult?.shortUrl !== shortURL){
                logger.info(`short url already existed for the given url ${href}`);
                return insertResult.shortUrl;
            }
            return shortURL;
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error(`Failed to shorten link : ${error.message}`);
            throw new ErrorResponse(
                "processing",
                `Failed to shorten link: ${error.message}`
            );
        }
    };
}

// Helper to strip trailing slashes
export const stripTrailingSlash = (url) => {
    return url.replace(/\/+$/, "");
};

// Handler for Express route
export const LinkShortnerHandler = async (req, res) => {
    try {
        const logger = req.logger;
        const url = req.meta.originalUrl;

        if (!url) {
            logger?.error("Error getting URL from meta", req.meta);
            throw new ErrorResponse("processing", "Request meta not initialized");
        }
        const shortURL = await LinkProcessor.LinkShortner(url, logger);
        const response = new ValidResponse("SUCCESS", { shortURL });
        return res.status(response.statusCode).json(response.toJSON());
    } catch (error) {
        if (error instanceof ErrorResponse) {
            throw error;
        }
        req.logger?.error("Error shortening link", req.meta);
        throw new ErrorResponse(
            "processing",
            `Error shortening the link: ${error.message}`
        );
    }
};

export const RedirectToOriginalHandler = async (req, res) => {
    try {
        const originalUrl = req.meta?.url;

        if (!originalUrl) {
            logger.error(`error attaching original Url to the requst meta for request ${req}`)
            throw new ErrorResponse("processing","error attaching original Url to the requst meta");
        }
        try {
            new URL(originalUrl);
        } catch {
            logger.error(`stored mal structured original url in db ${originalUrl}`);
            throw new ErrorResponse("processing",`stored mal structured original url in db ${originalUrl}`);
        }
        return res.redirect(302, originalUrl);
    } catch (error) {
        console.error("Redirect error:", error);

        return res.status(500).json({
            error: "server_error",
            message: "Failed to redirect"
        });
    }
};