import chalk from "chalk";
import { Logger } from "trm-commons";
import { Readme as ReadmeResult } from "trm-registry-types";
import { AbstractCommand } from "../AbstractCommand";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument, option } from "../metadata/helpers";
import { importEsm, parsePackageSpec, toNavigationError } from "../../utils";

/** Markdown with light terminal styling: headings, emphasis, inline code and links. */
export function renderMarkdownBasic(markdown: string): string {
    var fence = false;
    return markdown.split(/\r?\n/).map(line => {
        if (/^\s*(```|~~~)/.test(line)) {
            fence = !fence;
            return chalk.gray(line);
        }
        if (fence) {
            return chalk.yellow(line);
        }
        const heading = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
        if (heading) {
            return heading[1].length <= 2 ? chalk.bold.underline(heading[2]) : chalk.bold(heading[2]);
        }
        return line
            .replace(/`([^`]+)`/g, (_, code) => chalk.yellow(code))
            .replace(/\*\*([^*]+)\*\*/g, (_, text) => chalk.bold(text))
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => `${text} ${chalk.cyan(`(${url})`)}`);
    }).join('\n');
}

/** Markdown rendered for the terminal with marked + marked-terminal (ESM only), or basic styling if they can't be loaded. */
export async function renderMarkdown(markdown: string): Promise<string> {
    try {
        const [{ Marked }, { markedTerminal }] = await Promise.all([importEsm('marked'), importEsm('marked-terminal')]);
        const marked = new Marked();
        marked.use(markedTerminal({
            width: Math.min(process.stdout.columns || 80, 120),
            reflowText: true,
            showSectionPrefix: false
        }));
        return String(await marked.parse(markdown)).replace(/\s+$/, '');
    } catch (e) {
        Logger.log(`Markdown renderer not available, using basic styling: ${e?.message || e}`, true);
        return renderMarkdownBasic(markdown);
    }
}

export class Readme extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "readme",
        command: "readme",
        title: "Package README",
        group: "package",
        guiRelevant: false,
        description: "Show the README of a package release.",
        longDescription: `Shows the README of a package release published on the registry, rendered for the terminal.
READMEs are optional: some registries don't support them.`,
        icon: "BookOpen",
        arguments: [
            argument(0, { name: "package", label: "Package", description: "Package name, optionally with version or distribution tag (name@version)." })
        ],
        options: [
            option("--raw", { name: "raw", label: "Raw", description: "Print the markdown source.", control: "checkbox", defaultValue: false })
        ],
        requirements: {
            requiresRegistry: true
        }
    };

    protected async handler(): Promise<void> {
        const spec = parsePackageSpec(this.args.package);
        Logger.loading(`Reading ${spec.name} README...`);
        var result: ReadmeResult;
        try {
            result = await this.getRegistry().getReadme(spec.name, spec.version);
        } catch (e) {
            throw toNavigationError(e, spec);
        }
        if (this.setJsonOutput(result)) {
            return;
        }
        if (result.readme === null || result.readme === undefined || !result.readme.trim()) {
            Logger.info(`No README available for ${result.name || spec.name}@${result.version || spec.version}`);
            return;
        }
        Logger.log(this.args.raw ? result.readme : await renderMarkdown(result.readme));
    }

}
