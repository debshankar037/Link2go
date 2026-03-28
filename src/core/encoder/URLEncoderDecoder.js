import baseX from "base-x";
import bn from "bn.js";
import mongoose from "mongoose";

export class URLEncoderDecoder {

    static EncoderMaps = {
        "base62": "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    }

    static encode(objectId, base = "base62") {
        const encoder = baseX(URLEncoderDecoder.EncoderMaps[base]);
        const hex = objectId.toString();
        const num = new bn(hex, 16);
        const buffer = num.toArrayLike(Buffer);
        return encoder.encode(buffer);
    }

    static decode(code = "", base = "base62") {
        const encoder = baseX(URLEncoderDecoder.EncoderMaps[base]);
        const bytes = encoder.decode(code);
        const hex = new bn(bytes).toString("hex").padStart(24, "0");
        return new mongoose.Types.ObjectId(hex);
    }

}