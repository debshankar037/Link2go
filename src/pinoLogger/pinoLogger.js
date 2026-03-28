import pino from "pino";

export class PinoLogger{

    constructor(options={}){
        this.name = options?.name;
        this.enableConsole = options?.console ?? true;
        this.level = options?.level ?? "info";
        this.logger = pino({
            level : this.level
        })
    }

    log(level = "info", message = "", meta = {}){
        const logObject = {
            name : this.name,
            message,
            ...meta,
            timeStamp : new Date().toISOString()
        }
        if(this.enableConsole){
            this.logger[level](logObject);
        }
    }

    info(message, meta = {}) {
        this.log("info", message, meta);
    }

    error(message, meta = {}) {
        this.log("error", message, meta);
    }

    warn(message, meta = {}) {
        this.log("warn", message, meta);
    }

    debug(message, meta = {}) {
        this.log("debug", message, meta);
    }
}