import { DummyLogger, ILogger, JSONLog } from "trm-commons";
import { format } from "util";
import { writeSync } from "fs";

const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

export type JsonOutput = {
    success: boolean,
    data?: any,
    logs: JSONLog[]
}

/**
 * Logger for `--logger JSON`: collects messages instead of printing them and, at the end of the command,
 * writes a single JSON document ({@link JsonOutput}) to stdout, so the output can be parsed by scripts.
 */
export class JsonLogger extends DummyLogger {

    private logs: JSONLog[] = [];
    private data: any;
    private originalConsoleLog: typeof console.log;

    constructor(debug: boolean) {
        super();
        this.debug = debug;
    }

    private push(type: string, text: string, debug?: boolean): void {
        if (debug && !this.debug) {
            return;
        }
        this.logs.push({
            type,
            text: `${text}`.replace(ANSI_REGEX, '')
        });
    }

    public success(text: string, debug?: boolean): void {
        this.push('success', text, debug);
    }

    public error(text: string, debug?: boolean): void {
        this.push('error', text, debug);
    }

    public warning(text: string, debug?: boolean): void {
        this.push('warning', text, debug);
    }

    public info(text: string, debug?: boolean): void {
        this.push('info', text, debug);
    }

    public log(text: string, debug?: boolean): void {
        this.push('log', text, debug);
    }

    public registryResponse(response: Parameters<ILogger['registryResponse']>[0], debug?: boolean): void {
        this.push(`${response.type}`.toLowerCase(), response.text, debug);
    }

    public msgty(msgty: string, text: string, debug?: boolean): void {
        switch (msgty) {
            case 'A':
            case 'E': this.error(text, debug); break;
            case 'W': this.warning(text, debug); break;
            case 'I': this.info(text, debug); break;
            case 'S': this.success(text, debug); break;
        }
    }

    public setData(data: any): void {
        this.data = data;
    }

    /**
     * Redirects console.log (used by some commands to print plain text) to the collected logs, keeping stdout clean.
     */
    public captureConsole(): void {
        if (!this.originalConsoleLog) {
            this.originalConsoleLog = console.log;
            console.log = (...args: any[]) => this.log(format(...args));
        }
    }

    /**
     * Writes the JSON document to stdout. Synchronous write: the CLI exits right after.
     */
    public flush(success: boolean): void {
        if (this.originalConsoleLog) {
            console.log = this.originalConsoleLog;
            this.originalConsoleLog = undefined;
        }
        const output: JsonOutput = {
            success,
            data: this.data,
            logs: this.logs
        };
        writeSync(1, JSON.stringify(output) + '\n');
    }

}
