import { getURLModel } from "./urlModel.js";
import { ErrorResponse } from "../response/error/error.js";

export const findURLInDB = async (urlInput) => {
    const href = typeof urlInput === "string" ? urlInput : urlInput?.href;
    if (!href?.trim()) {
        throw new ErrorResponse("invalid", "invalid url");
    }

    const URLModel = getURLModel();

    try {
        const doc = await URLModel.findOneAndUpdate(
            { originalUrl: href },
            { $setOnInsert: { originalUrl: href } },
            { upsert: true, new: true }
        );
        return doc;
    } catch (error) {
        throw new ErrorResponse("db_error", `failed to find the url in db ${error.message}`);
    }
};
