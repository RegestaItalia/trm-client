import chalk from "chalk";
import { Logger } from "trm-commons";
import { Search as SearchResult, SearchRequest, SearchSort } from "trm-registry-types";
import { AbstractCommand } from "../AbstractCommand";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument, option } from "../metadata/helpers";
import { formatDate, toNavigationError, truncate } from "../../utils";

export const SEARCH_SORTS: SearchSort[] = ['relevance', 'downloads', 'name', 'updated'];
export const SEARCH_MAX_LIMIT = 25;

const listArg = (value: unknown): string[] | undefined => {
    const values = (Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [])
        .map(v => String(v).trim()).filter(v => v.length > 0);
    return values.length > 0 ? values : undefined;
};

const integerArg = (value: unknown, name: string, defaultValue: number): number => {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1) {
        throw new Error(`Option --${name} must be a positive integer.`);
    }
    return n;
};

/** The registry search request of the command arguments (query words, comma-separated filters, sort and paging). */
export function buildSearchRequest(args: any): SearchRequest {
    const words: string[] = Array.isArray(args.query) ? args.query : typeof args.query === 'string' ? [args.query] : [];
    const q = words.join(' ').trim() || undefined;
    const keywords = listArg(args.keywords);
    const maintainers = listArg(args.maintainers);
    const organizations = listArg(args.org)?.map(o => o.replace(/^@/, '').replace(/\/$/, ''));
    if (!q && !keywords && !maintainers && !organizations) {
        throw new Error(`Provide a search query or at least one filter (--keywords, --maintainers, --org).`);
    }
    var sort: SearchSort;
    if (args.sort !== undefined && args.sort !== null && args.sort !== '') {
        sort = String(args.sort).trim().toLowerCase() as SearchSort;
        if (!SEARCH_SORTS.includes(sort)) {
            throw new Error(`Invalid sort "${args.sort}". Possible values are ${SEARCH_SORTS.join(', ')}.`);
        }
    }
    const page = integerArg(args.page, 'page', 1);
    const limit = integerArg(args.limit, 'limit', SEARCH_MAX_LIMIT);
    if (limit > SEARCH_MAX_LIMIT) {
        throw new Error(`Option --limit can't be greater than ${SEARCH_MAX_LIMIT}.`);
    }
    const request: SearchRequest = { page, limit };
    if (q) request.q = q;
    if (keywords) request.keywords = keywords;
    if (maintainers) request.maintainers = maintainers;
    if (organizations) request.organizations = organizations;
    if (sort) request.sort = sort;
    return request;
}

/** "Showing 26-50 of 120 packages (page 2/5)" */
export function formatSearchFooter(result: SearchResult): string {
    const page = result.page || 1;
    const limit = result.limit || SEARCH_MAX_LIMIT;
    const pages = Math.max(1, Math.ceil(result.total / limit));
    const start = (page - 1) * limit + 1;
    const end = start + result.results.length - 1;
    return `Showing ${start}-${end} of ${result.total} package${result.total === 1 ? '' : 's'} (page ${page}/${pages})`;
}

export class Search extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "search",
        command: "search",
        aliases: ["s", "se"],
        title: "Search packages",
        group: "registry",
        guiRelevant: false,
        description: "Search packages on the registry.",
        longDescription: `Searches packages by name, description and keywords, optionally filtered by keywords, maintainers or organizations.
Package search is optional: some registries don't support it.`,
        icon: "Search",
        arguments: [
            argument(0, { name: "query", label: "Query", description: "Search terms.", required: false, multiple: true })
        ],
        options: [
            option("--keywords <list>", { name: "keywords", label: "Keywords", description: "Only packages with all of these keywords (comma-separated)." }),
            option("--maintainers <list>", { name: "maintainers", label: "Maintainers", description: "Only packages maintained by these users or organizations (comma-separated)." }),
            option("--org <list>", { name: "org", label: "Organizations", description: "Only packages published under these organizations (comma-separated)." }),
            option("--sort <sort>", { name: "sort", label: "Sort", description: `Sort order: ${SEARCH_SORTS.join(', ')}.`, control: "select", choices: SEARCH_SORTS.map(s => ({ label: s, value: s })) }),
            option("--page <n>", { name: "page", label: "Page", description: "Page number.", control: "number-input", defaultValue: 1 }),
            option("--limit <n>", { name: "limit", label: "Limit", description: `Results per page (max ${SEARCH_MAX_LIMIT}).`, control: "number-input", defaultValue: SEARCH_MAX_LIMIT })
        ],
        requirements: {
            requiresRegistry: true
        }
    };

    protected async handler(): Promise<void> {
        const request = buildSearchRequest(this.args);
        Logger.loading(`Searching packages...`);
        var result: SearchResult;
        try {
            result = await this.getRegistry().search(request);
        } catch (e) {
            throw toNavigationError(e);
        }
        if (this.setJsonOutput(result)) {
            return;
        }
        const results = result.results || [];
        if (results.length === 0) {
            if (result.total > 0) {
                Logger.info(`No packages found on page ${result.page} (${result.total} packages in total).`);
            } else {
                Logger.info(`No packages found`);
            }
            return;
        }
        Logger.table(['Name', 'Version', 'Description', 'Maintainers', 'Date'], results.map(o => [
            `${o.name}${o.private ? chalk.yellow(' (private)') : ''}`,
            o.version,
            truncate(o.description, 60),
            (o.maintainers || []).map(m => m.name).join(', '),
            formatDate(o.release_date)
        ]));
        Logger.log(formatSearchFooter(result));
        const limit = result.limit || request.limit;
        if (result.page * limit < result.total) {
            Logger.log(chalk.gray(`Use --page ${result.page + 1} to see the next page.`));
        }
    }

}
