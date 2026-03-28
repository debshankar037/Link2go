import { ResponseCode } from "../ResponseCodes.js";

export class ValidResponse {
    constructor(code = "SUCCESS", data = null) {
        this.code = code;
        this.data = data;
        this.statusCode =
            ResponseCode[code] ?? ResponseCode.SUCCESS;
    }

    toJSON() {
        return {
            data: this.data
        };
    }
}
