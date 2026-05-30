// eslint-disable-next-line @typescript-eslint/no-explicit-any
let allDocsJson: Record<string, any> = {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let allDocFiles: Record<string, any> = {};

try {
    // @ts-ignore - import.meta.glob is a Vite-specific API
    allDocsJson = import.meta.glob('../data/projects/*/docs.json', { eager: true });
} catch {
    allDocsJson = {};
}

try {
    // @ts-ignore - import.meta.glob is a Vite-specific API
    allDocFiles = import.meta.glob('../data/projects/*/docs/*.{md,adoc}', { query: '?raw', import: 'default', eager: true });
} catch {
    allDocFiles = {};
}

export interface DocEntry {
    slug: string;
    title: string;
    level: number;
}

export interface DocEntryWithNumber extends DocEntry {
    /** Human-readable section number like "1", "2.1", "2.1.3" */
    number: string;
    markdownUrl: string;
}

export interface DocsConfig {
    title: string;
    route: string;
    landing_page: string;
    toc: DocEntry[];
    projectFolder: string;
    entries: DocEntryWithNumber[];
}

function resolveDocExt(projectFolder: string, slug: string): 'adoc' | 'md' {
    const adocKey = Object.keys(allDocFiles).find(
        (k) =>
            k.toLowerCase().includes(`/${projectFolder.toLowerCase()}/docs/`) &&
            k.toLowerCase().endsWith(`/${slug}.adoc`),
    );
    return adocKey ? 'adoc' : 'md';
}

function buildToc(entries: DocEntry[], projectFolder: string): DocEntryWithNumber[] {
    const counters: number[] = [];
    return entries.map((entry) => {
        const depth = entry.level - 1;
        while (counters.length <= depth) counters.push(0);
        counters.splice(depth + 1);
        counters[depth] = (counters[depth] ?? 0) + 1;
        const number = counters.join('.');
        const ext = resolveDocExt(projectFolder, entry.slug);
        return {
            ...entry,
            number,
            markdownUrl: `src/data/projects/${projectFolder}/docs/${entry.slug}.${ext}`,
        };
    });
}

function isValidConfig(raw: unknown): raw is { title: string; route: string; landing_page: string; toc: DocEntry[] } {
    if (!raw || typeof raw !== 'object') return false;
    const r = raw as Record<string, unknown>;
    return (
        typeof r.title === 'string' && r.title.length > 0 &&
        typeof r.route === 'string' && r.route.length > 0 &&
        typeof r.landing_page === 'string' && r.landing_page.length > 0 &&
        Array.isArray(r.toc) && r.toc.length > 0
    );
}

function extractProjectFolder(globKey: string): string {
    // Key looks like: ../data/projects/ERPDemo/docs.json
    const match = globKey.match(/projects\/([^/]+)\/docs\.json$/);
    return match ? match[1] : '';
}

export const projectDocsList: DocsConfig[] = Object.entries(allDocsJson)
    .map(([key, mod]) => {
        const raw = mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod;
        if (!isValidConfig(raw)) return null;
        const projectFolder = extractProjectFolder(key);
        if (!projectFolder) return null;
        return {
            title: raw.title,
            route: raw.route,
            landing_page: raw.landing_page,
            toc: raw.toc,
            projectFolder,
            entries: buildToc(raw.toc, projectFolder),
        } satisfies DocsConfig;
    })
    .filter((c): c is DocsConfig => c !== null);

export function getDocsByRoute(route: string): DocsConfig | undefined {
    return projectDocsList.find((c) => c.route === route);
}

export function findDocBySlug(route: string, slug: string): DocEntryWithNumber | undefined {
    return getDocsByRoute(route)?.entries.find((e) => e.slug === slug);
}

export function getAdjacentDocs(
    route: string,
    slug: string,
): { prev: DocEntryWithNumber | null; next: DocEntryWithNumber | null } {
    const entries = getDocsByRoute(route)?.entries ?? [];
    const idx = entries.findIndex((e) => e.slug === slug);
    return {
        prev: idx > 0 ? entries[idx - 1] : null,
        next: idx >= 0 && idx < entries.length - 1 ? entries[idx + 1] : null,
    };
}
