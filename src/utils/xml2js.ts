import * as oXml2Js from "xml2js";

export function xml2js(sXml: string): Promise<any> {
    return new Promise((res, rej) => {
        oXml2Js.parseString(sXml, (err, result) => {
            if (err) {
                rej(err);
            } else {
                res(result);
            }
        });
    });
}