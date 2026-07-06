import { CommandClass } from "../metadata/CommandMetadata";
import { Ping } from "./Ping";
import { Info } from "./Info";
import { Registry } from "./Registry";
import { Login } from "./Login";
import { WhoAmI } from "./WhoAmI";
import { Logout } from "./Logout";
import { Alias } from "./Alias";
import { Publish } from "./Publish";
import { DistTag } from "./DistTag";
import { Lock } from "./Lock";
import { Unpublish } from "./Unpublish";
import { Deprecate } from "./Deprecate";
import { Install } from "./Install";
import { List } from "./List";
import { Content } from "./Content";
import { View } from "./View";
import { Compare } from "./Compare";
import { Dirty } from "./Dirty";
import { FindDependencies } from "./FindDependencies";
import { Cg3y } from "./Cg3y";
import { Cg3z } from "./Cg3z";
import { Settings } from "./Settings";
import { ClearCache } from "./ClearCache";

export * from "./Ping";
export * from "./Info";

export * from "./Registry";
export * from "./Login";
export * from "./WhoAmI";
export * from "./Logout";

export * from "./Alias";

export * from "./Publish";
export * from "./DistTag";
export * from "./Lock";
export * from "./Unpublish";
export * from "./Deprecate";

export * from "./Install";

export * from "./List";
export * from "./Content";
export * from "./View";
export * from "./Compare";
export * from "./Dirty";

export * from "./FindDependencies";

export * from "./Cg3y";
export * from "./Cg3z";

export * from "./Settings";
export * from "./ClearCache";

export const commands = [
    Ping,
    Info,
    Registry,
    Login,
    WhoAmI,
    Logout,
    Alias,
    Publish,
    DistTag,
    Lock,
    Unpublish,
    Deprecate,
    Install,
    List,
    Content,
    View,
    Compare,
    Dirty,
    FindDependencies,
    Cg3y,
    Cg3z,
    Settings,
    ClearCache
] satisfies CommandClass[];

export function getCommand(id: string): CommandClass | undefined {
    return commands.find(commandClass => {
        const metadata = Array.isArray(commandClass.metadata) ? commandClass.metadata : [commandClass.metadata];
        return metadata.some(command => command.id === id);
    });
}
