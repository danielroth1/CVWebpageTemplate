import erpDocsRaw from '../data/projects/ERPDemo/erp-docs.json';

// Eagerly load all .md and .adoc files in the ERP docs folder so we can
// detect which extension is present for each slug at build time.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let viteErpDocFiles: Record<string, any> = {};
try {
    // @ts-ignore - import.meta.glob is a Vite-specific API
    viteErpDocFiles = import.meta.glob('../data/projects/ERPDemo/docs/*.{md,adoc}', { query: '?raw', import: 'default', eager: true });
} catch {
    viteErpDocFiles = {};
}

function resolveDocExt(slug: string): 'adoc' | 'md' {
    const adocKey = Object.keys(viteErpDocFiles).find((k) =>
        k.toLowerCase().endsWith(`/${slug}.adoc`),
    );
    return adocKey ? 'adoc' : 'md';
}

export interface ErpDocEntry {
    slug: string;
    title: string;
    level: number;
}

export interface ErpDocEntryWithNumber extends ErpDocEntry {
    /** Human-readable number like "1", "2.1", "2.1.3" */
    number: string;
    markdownUrl: string;
}

const entries: ErpDocEntry[] = erpDocsRaw as ErpDocEntry[];

/**
 * Compute numbered TOC entries from the flat ordered list.
 * Level 1 → "1", "2", ...
 * Level 2 → "1.1", "1.2", ...
 * Level 3 → "1.1.1", ...
 */
export function buildErpDocsToc(): ErpDocEntryWithNumber[] {
    const counters: number[] = [];
    return entries.map((entry) => {
        const depth = entry.level - 1; // 0-indexed
        // Grow counter array if needed
        while (counters.length <= depth) counters.push(0);
        // Truncate deeper counters when going up a level
        counters.splice(depth + 1);
        counters[depth] = (counters[depth] ?? 0) + 1;
        const number = counters.join('.');
        return {
            ...entry,
            number,
            markdownUrl: `src/data/projects/ERPDemo/docs/${entry.slug}.${resolveDocExt(entry.slug)}`,
        };
    });
}

export const erpDocsToc: ErpDocEntryWithNumber[] = buildErpDocsToc();

export function findErpDocBySlug(slug: string): ErpDocEntryWithNumber | undefined {
    return erpDocsToc.find((e) => e.slug === slug);
}

export function getAdjacentErpDocs(slug: string): {
    prev: ErpDocEntryWithNumber | null;
    next: ErpDocEntryWithNumber | null;
} {
    const idx = erpDocsToc.findIndex((e) => e.slug === slug);
    return {
        prev: idx > 0 ? erpDocsToc[idx - 1] : null,
        next: idx >= 0 && idx < erpDocsToc.length - 1 ? erpDocsToc[idx + 1] : null,
    };
}
