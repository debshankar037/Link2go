import { ValidResponse } from "../response/validResponse/response";
import { ErrorResponse } from "../response/error/error";
import { URLEncoderDecoder } from "../core/encoder/URLEncoderDecoder";
import { findURLInDB } from "../db/mongoQueryOperations";

export class LinkProcessor {
    static LinkShortner = async (link, logger) => {
        try {
            // Convert link to string if URL object
            const href = link instanceof URL ? link.href : String(link);

            // Use base URL from env, default localhost for local dev
            const base =
                process.env.SHORTENER_BASE_URL || "http://localhost:5000";

            // Check if URL is already shortened
            const doc = await findURLInDB(href);

            if (doc?.shortURL) {
                logger?.info?.("Link already shortened", { href });
                return doc.shortURL;
            }

            // Generate code from document _id
            const code = URLEncoderDecoder.encode(doc._id);
            logger?.info?.('Generated code:', code, 'for _id:', doc._id.toString());
            if (!code) {
                logger?.error?.("Failed to generate short code", { href });
                throw new ErrorResponse(
                    "processing",
                    `Failed to generate short code for the link ${href}`
                );
            }

            // Construct short URL with fake domain in path: /link2go.io/<code>
            const shortURL = `${stripTrailingSlash(base)}/link2go.io/${code}`;
            logger?.info?.('Constructed shortURL:', shortURL);
            
            // Save short URL in DB
            doc.shortURL = shortURL;
            logger?.info?.(`Saving doc ${doc} with shortURL: ${shortURL}`);
            await doc.save();
            logger?.info?.('Saved successfully');

            return shortURL;
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
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