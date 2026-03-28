import mongoose from "mongoose";
import { getBaseConnection } from "./connection.js";

/**
 * Strict:false model on a specific DB. Register models on the `useDb` connection so each
 * database has its own model namespace.
 *
 * @param {string | import("mongoose").Connection} dbNameOrConnection - Database name, or a connection from {@link useDatabase}
 * @param {string} collectionName - MongoDB collection name
 * @returns {import("mongoose").Model}
 */
export function createDynamicModel(dbNameOrConnection, collectionName) {
    if (!collectionName || typeof collectionName !== "string") {
        throw new Error("createDynamicModel requires a non-empty collection name string");
    }

    const conn =
        typeof dbNameOrConnection === "string"
            ? getBaseConnection().useDb(dbNameOrConnection, { useCache: true })
            : dbNameOrConnection;

    if (!conn || typeof conn.model !== "function") {
        throw new Error("createDynamicModel: invalid connection");
    }

    const modelName = collectionName.replace(/[^a-zA-Z0-9_]/g, "_");
    if (conn.models[modelName]) {
        return conn.models[modelName];
    }

    const schema = new mongoose.Schema(
        {},
        {
            strict: false,
            collection: collectionName,
            timestamps: true
        }
    );

    return conn.model(modelName, schema);
}
