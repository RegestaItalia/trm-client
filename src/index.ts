#!/usr/bin/env node
import dotenv from 'dotenv';
import { Command } from "commander";
import { getClientVersion } from "./utils";
import { Alias, Compare, Content, Deprecate, DistTag, FindDependencies, Info, Install, List, Lock, Login, Logout, Ping, Publish, Registry, Settings, Unpublish, View, WhoAmI } from './command/implementations';

dotenv.config({
    quiet: true
});

const program = new Command();

program
    .name(`trm`)
    .description(`TRM - Transport Request Manager CLI
        
Full documentation available at https://docs.trmregistry.com/
Public registry at https://trmregistry.com/

© 2025 RegestaItalia https://regestaitalia.eu/`)
    .version(getClientVersion());

new Ping(program, 'ping').register();
new Info(program, 'info').register();

new Registry(program, 'registry add').register();
new Registry(program, 'registry rm').register();
new Login(program, 'login').register();
new WhoAmI(program, 'whoami').register();
new Logout(program, 'logout').register();

new Alias(program, 'alias create').register();
new Alias(program, 'alias delete').register();
new Alias(program, 'alias').register();

new Publish(program, 'publish').register();
new DistTag(program, 'dist-tag add').register();
new DistTag(program, 'dist-tag rm').register();
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

new FindDependencies(program, 'find-dependencies').register();

new Settings(program, 'settings').register();

program.parse(process.argv);