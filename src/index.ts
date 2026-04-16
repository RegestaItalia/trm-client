#!/usr/bin/env node
import dotenv from 'dotenv';
import { Command } from "commander";
import { getClientVersion } from "./utils";
import { Alias, Cg3y, Cg3z, ClearCache, Compare, Content, Deprecate, Dirty, DistTag, FindDependencies, Info, Install, List, Lock, Login, Logout, Ping, Publish, Registry, Settings, Unpublish, View, WhoAmI } from './command/implementations';
import { Transport } from 'trm-core';

dotenv.config({
    quiet: true
});

const program = new Command();

program
    .name(`trm`)
    .description(`${Transport.getTransportIcon()}  TRM - Transport Request Manager CLI
        
Full documentation available at https://docs.trmregistry.com/
Public registry at https://trmregistry.com/

© 2023 RegestaItalia https://regestaitalia.eu/`)
    .version(process.env.DEVELOPMENT && process.env.DEVELOPMENT.toLowerCase().trim() === 'true' ? 'Development' : getClientVersion());

program.configureHelp({
    sortSubcommands: true,
    visibleCommands: (cmd) => {
        var commands: Command[] = [];
        cmd.commands.forEach(c => {
            if (c.description()) {
                commands.push(c);
            }
            c.commands.forEach(s => {
                commands.push(s);
            });
        });
        return commands;
    },
    subcommandTerm: (cmd) => {
        var term = `${cmd.name()} ${cmd.usage()}`
        if (cmd.parent.name() !== program.name()) {
            term = `${cmd.parent.name()} ${cmd.name()} ${cmd.usage()}`
        }
        return term;
    }
});

new Ping(program, 'ping').register();
new Info(program, 'info').register();

new Registry(program, 'registry', null, 'add').register();
new Registry(program, 'registry', null, 'rm').register();
new Login(program, 'login').register();
new WhoAmI(program, 'whoami').register();
new Logout(program, 'logout').register();

new Alias(program, 'alias').register();
new Alias(program, 'alias', null, 'create').register();
new Alias(program, 'alias', null, 'delete').register();

new Publish(program, 'publish').register();
new DistTag(program, 'dist-tag', null, 'add').register();
new DistTag(program, 'dist-tag', null, 'rm').register();
new Publish(program, 'pack', ['export']).register();
new Lock(program, 'lock', ['lock-file']).register();
new Unpublish(program, 'unpublish').register();
new Deprecate(program, 'deprecate').register();

new Install(program, 'install', ['i']).register();
new Install(program, 'clean-install', ['ci']).register();
new Install(program, 'update').register();
new Install(program, 'import').register();

new List(program, 'list', ['ls']).register();
new Content(program, 'content', ['contents']).register();
new View(program, 'view').register();
new Compare(program, 'compare').register();
new Dirty(program, 'dirty').register();

new FindDependencies(program, 'find-dependencies').register();

new Cg3y(program, 'cg3y').register();
new Cg3z(program, 'cg3z').register();

new Settings(program, 'settings').register();
new ClearCache(program, 'clear-cache').register();

program.parse(process.argv);