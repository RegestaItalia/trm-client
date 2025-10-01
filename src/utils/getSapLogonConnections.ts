import * as fs from "fs";
import { xml2js } from "./xml2js";
import { Context } from "./Context";

export async function getSapLogonConnections() {
    var systems = [];
    const sapLandscape = Context.getInstance().getSettings().sapLandscape;
    if (sapLandscape) {
        const sXml = fs.readFileSync(Context.getInstance().getSettings().sapLandscape, { encoding: 'utf8', flag: 'r' });
        const result = await xml2js(sXml);
        try {
            result.Landscape.Services[0].Service.forEach((xmlObj) => {
                var obj = xmlObj['$'];
                var addrMatches = obj.server.match(/(.*)\:(\d*)$/);
                var ashost = addrMatches[1];
                var port = addrMatches[2];
                var sysnr = port.slice(-2);
                var saprouter;
                if (obj.routerid) {
                    const router = result.Landscape.Routers[0].Router.find((o) => o['$'].uuid === obj.routerid);
                    if (router) {
                        saprouter = router['$'].router;
                    }
                }
                systems.push({
                    id: obj.uuid,
                    name: obj.name,
                    dest: obj.systemid,
                    sysnr,
                    ashost,
                    saprouter
                });
            });
        } catch { }
    }
    return systems;
}