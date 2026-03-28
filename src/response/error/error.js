import { ResponseCode } from "../ResponseCodes.js";

export class ErrorResponse extends Error {
    static errorMap = {
        processing: ResponseCode.INTERNAL_SERVER_ERROR,
        invalid: ResponseCode.BAD_REQUEST,
        already_exists: ResponseCode.CONFLICT,
        db_error: ResponseCode.INTERNAL_SERVER_ERROR
    };

    constructor(code = "processing", message = "error occured in the server") {
        super(message);
        this.code = code;
        this.statusCode =
            ErrorResponse.errorMap[code] || ResponseCode.INTERNAL_SERVER_ERROR;
    }
}

export class InvalidLinkStructure extends ErrorResponse {
    constructor(message = "Invalid link structure") {
        super("invalid", message);
    }
}

export class LinkNotFound extends ErrorResponse {
    constructor(message = "Link not found") {
        super("invalid", message);
    }
}

export class LinkAlreadyExists extends ErrorResponse {
    constructor(message = "Link already exists") {
        super("already_exists", message);
    }
}
