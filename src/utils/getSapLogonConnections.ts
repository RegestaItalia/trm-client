import path from "path";
import * as fs from "fs";
import { xml2js } from "./xml2js";
import { getRoamingPath } from "./getRoamingPath";

export async function getSapLogonConnections() {
    const landscapePath = path.join(getRoamingPath(), `SAP\\Common\\SAPUILandscape.xml`);
    const sXml = fs.readFileSync(landscapePath, { encoding: 'utf8', flag: 'r' });
    const result = await xml2js(sXml);
    var systems = [];
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
    } catch (e) { }
    return systems;
}