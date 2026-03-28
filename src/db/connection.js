import mongoose from "mongoose";
import { ErrorResponse } from "../response/error/error.js";

/** @type {import("mongoose").Connection | null} */
let baseConnection = null;

const getMongoDBATLASConnectionURI = () =>{
    
    const userName = process.env.MONGODB_ATLAS_USERNAME;
    const passWord = process.env.MONGODB_ATLAS_PASSWORD;
    const appName = process.env.MONGODB_ATLAS_APPNAME;
    const hostName = process.env.MONGODB_ATLAS_HOST;

    const queryArray = [];

    if(appName){
        queryArray.push(`appName=${appName}`);
    }

    const queryString = queryArray.join(",");

    return `mongodb+srv://${encodeURIComponent(userName)}:${encodeURIComponent(passWord)}@${hostName}/?${queryString}`
}

/**
 * Opens one MongoDB client (from URLDB). Use {@link useDatabase} / {@link createDynamicModel}
 * to work in specific databases without extra connections.
 *
 * @param {object} [options]
 * @param {string} [options.uri] - Defaults to process.env.URLDB (e.g. mongodb://localhost:27017 or Atlas URI)
 * @param {{ info?: Function; error?: Function; warn?: Function } | undefined} [options.logger]
 * @returns {Promise<import("mongoose").Connection>}
 */
export async function connectDatabase(options = {}) {
    
    const connectionURI = getMongoDBATLASConnectionURI();
    if (!connectionURI?.trim()) {
        throw new ErrorResponse("db_error","Missing MongoDB connection string");
    }

    mongoose.set("strictQuery", false);

    if (baseConnection) {
        options.logger?.warn?.("MongoDB base connection already exists; reusing");
        return baseConnection;
    }

    try {
        baseConnection = mongoose.createConnection(uri, {
            serverSelectionTimeoutMS: 10_000
        });
        await baseConnection.asPromise();

        options.logger?.info?.("MongoDB connected", {
            host: baseConnection.host,
            defaultDb: baseConnection.name
        });
    } catch (err) {
        baseConnection = null;
        options.logger?.error?.("MongoDB connection failed", {
            message: err.message
        });
        throw err;
    }

    baseConnection.on("disconnected", () => {
        options.logger?.warn?.("MongoDB disconnected");
    });

    return baseConnection;
}

/**
 * Root connection used with {@link connectDatabase}. Prefer {@link useDatabase} for app code.
 */
export function getBaseConnection() {
    if (!baseConnection) {
        throw new Error("Database not connected: call connectDatabase() first");
    }
    return baseConnection;
}

/**
 * Switch to a logical database (same pool / cluster as URLDB).
 * @param {string} dbName
 * @returns {import("mongoose").Connection}
 */
export function useDatabase(dbName) {
    if (!dbName || typeof dbName !== "string") {
        throw new Error("useDatabase requires a non-empty database name string");
    }
    return getBaseConnection().useDb(dbName, { useCache: true });
}

/** @deprecated Use getBaseConnection(); name kept for compatibility */
export function getMongooseConnection() {
    return getBaseConnection();
}
