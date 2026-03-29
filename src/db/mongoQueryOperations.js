import { getURLModel } from "./urlModel";
import { ErrorResponse } from "../response/error/error";
import { logger } from "../index.js";

// export const findURLInDB = async (urlInput) => {
//     const href = typeof urlInput === "string" ? urlInput : urlInput?.href;
//     if (!href?.trim()) {
//         throw new ErrorResponse("invalid", "invalid url");
//     }

//     const URLModel = getURLModel();

//     try {
//         const doc = await URLModel.findOneAndUpdate(
//             { originalUrl: href },
//             { $setOnInsert: { originalUrl: href } },
//             { upsert: true, new: true }
//         ).lean();
//         return doc;
//     } catch (error) {
//         throw new ErrorResponse("db_error", `failed to find the url in db ${error.message}`);
//     }
// };

export const createURLEntryInDB = async ( shortURLGenerated, id, originalUrl ) =>{
    try{
        
        const URLModel = getURLModel();
        const doc = await URLModel.findOneAndUpdate(
            {originalUrl},
            {
                $setOnInsert: {
                    _id: id,
                    shortUrl: shortURLGenerated,
                    clicks: 0,
                    createdAt: new Date()
                },
            },
            {
                upsert: true,
                returnDocument: "after", // same as new: true
                rawResult: true           // gives full MongoDB response
            }
        );
        return doc;
    }catch(error){
        if(error instanceof ErrorResponse){
            throw error;
        }
        logger.error(`failed to create entry for the url ${originalUrl}`);
        throw new ErrorResponse("db_error", `failed to insert url entry in db error - ${error.message}`);
    }
}

export const checkIfCodeValid = async ( id ) => {
    try{
        const URLModel = getURLModel();
        const doc = await URLModel.findById(id).lean();
        return doc;
    }catch(error){
        logger.error(`error occured while finding short code in db ${error.message}`);
        throw new ErrorResponse("db_error",`failed to validate code error ${error.message}`);
    }
}