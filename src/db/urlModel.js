import { createDynamicModel } from "./dynamicModel";

/** @type {import("mongoose").Model | null} */
let urlModel = null;

export const getURLModel = () => {
    if (!urlModel) {
        const dbName = process.env.LINK_DB_NAME || "link_shortener";
        const collection = process.env.URL_COLLECTION || "urls";
        urlModel = createDynamicModel(dbName, collection);
    }
    return urlModel;
}
