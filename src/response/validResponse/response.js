import { ResponseCode } from "../ResponseCodes.js";

export class ValidResponse {

    constructor(code = ResponseCode.SUCCESS, data = null){
        this.code = code;
        this.data = data;
        this.statusCode = ResponseCode[code] || ResponseCode.SUCCESS; 
    }

    get statusCode(){
        return ResponseCode[this.code] || ResponseCode.SUCCESS;
    }
    get code(){
        return this.code;
    }
    get data(){
        return this.data;
    }
    set code(code){
        this.code = code;
    }
    set statusCode(status){
        this.statusCode = Number(status);
    }
    set data(data = {}){
        this.data = data;
    }

    toJSON(){
        return {
            data: this.data
        }
    }
    
}