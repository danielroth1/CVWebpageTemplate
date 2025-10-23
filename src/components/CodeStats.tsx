import React from 'react';
import SkillBadge from './SkillBadge';
import Tooltip from './Tooltip';

interface ClocLanguageEntry {
    language: string;
    code: number;
}

interface ClocSummary {
    total?: {
        nFiles?: number;
        code?: number;
    };
    languages?: ClocLanguageEntry[];
}

interface ClocData {
    summary?: ClocSummary;
    raw?: {
        SUM?: {
            nFiles?: number;
            code?: number;
        };
    };
}

interface CodeStatsProps {
    clocData: ClocData | null;
    languageMapping: Record<string, string>;
    overrides?: Record<string, string>;
    /** Whether the stats panel should start collapsed */
    defaultCollapsed?: boolean;
    /** Optional callback when user toggles collapsed state */
    onToggleCollapsed?: (collapsed: boolean) => void;
}

type LabelPart = { type: 'text'; value: string } | { type: 'skill'; value: string };

function resolveLabelParts(label: string): LabelPart[] {
    const parts: LabelPart[] = [];
    const regex = /<skill>(.*?)<\/skill>/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(label)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', value: label.slice(lastIndex, match.index) });
        }
        parts.push({ type: 'skill', value: match[1].trim() });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < label.length) {
        parts.push({ type: 'text', value: label.slice(lastIndex) });
    }

    return parts;
}

function renderLabel(label: string): React.ReactNode {
    if (!label) return null;
    const parts = resolveLabelParts(label);

    if (!parts.length) {
        return label;
    }

    return parts.map((part, idx) => {
        if (part.type === 'skill') {
            return <SkillBadge key={`skill-${part.value}-${idx}`}>{part.value}</SkillBadge>;
        }
        if (!part.value) {
            return <React.Fragment key={`empty-${idx}`} />;
        }
        return (
            <span key={`text-${idx}`}>{part.value}</span>
        );
    });
}

const CodeStats: React.FC<CodeStatsProps> = ({ clocData, languageMapping, overrides, defaultCollapsed = false, onToggleCollapsed }) => {
    const rawTotal = clocData?.summary?.total ?? clocData?.raw?.SUM ?? null;
    const languages = Array.isArray(clocData?.summary?.languages)
        ? clocData?.summary?.languages
        : null;

    const resolveLabel = React.useCallback(
        (language: string) => overrides?.[language] ?? languageMapping[language] ?? language,
        [languageMapping, overrides],
    );

    // Filter out small languages (<20 LOC) and compute adjusted totals
    const { filteredLanguages, adjustedTotal } = React.useMemo(() => {
        if (!rawTotal) return { filteredLanguages: languages ?? [], adjustedTotal: rawTotal };

        let adjustedCode = typeof rawTotal.code === 'number' ? rawTotal.code : undefined;
        let adjustedFiles = typeof rawTotal.nFiles === 'number' ? rawTotal.nFiles : undefined;

        const filtered = (languages ?? []).filter((entry) => {
            const keep = typeof entry.code === 'number' ? entry.code >= 20 : true;
            if (!keep) {
                if (typeof adjustedCode === 'number') adjustedCode = Math.max(0, adjustedCode - (entry.code ?? 0));
                if (typeof adjustedFiles === 'number') adjustedFiles = Math.max(0, adjustedFiles - 1);
            }
            return keep;
        });

        const adjTotal = adjustedCode === undefined && adjustedFiles === undefined ? null : { code: adjustedCode, nFiles: adjustedFiles };
        return { filteredLanguages: filtered, adjustedTotal: adjTotal };
    }, [rawTotal, languages]);

    const [collapsed, setCollapsed] = React.useState<boolean>(defaultCollapsed);

    const toggle = () => {
        setCollapsed((c) => {
            const next = !c;
            onToggleCollapsed?.(next);
            return next;
        });
    };

    return (
    <div className={(collapsed ? "" : "app-border border rounded-xl p-4 app-surface min-w-[13rem]") + " lg:sticky lg:top-4"}>
            {collapsed ? (
                <button
                    type="button"
                    onClick={toggle}
                    className="text-xs px-2 py-1 rounded border app-border hover:bg-[var(--color-bg-muted)] transition"
                    aria-expanded={!collapsed}
                    aria-label="Show code statistics"
                >
                    Show Stats
                </button>
            ) : (
                <>
                <div className="flex items-start justify-between mb-2 mr-3">
                    <div className="flex items-center gap-1">
                        <h3 className="text-sm font-semibold text-[var(--color-text)]">Code stats</h3>
                        <InfoIcon />
                    </div>
                    <button
                        type="button"
                        onClick={toggle}
                        className="text-xs px-2 py-1 rounded border app-border hover:bg-[var(--color-bg-muted)] transition"
                        aria-expanded={!collapsed}
                        aria-label="Hide code statistics"
                    >
                        Hide
                    </button>
                </div>
                    {clocData ? (
                        <div className="text-sm text-[var(--color-text)]">
                            {adjustedTotal ? (
                                <div className="mb-3 space-y-2 mr-4">
                                    <div className="flex justify-between">
                                        <div className="text-xs text-[var(--color-text-muted)]">Files:</div>
                                        <div className="text-xs font-mono">
                                            <strong>{typeof adjustedTotal.nFiles === 'number' ? adjustedTotal.nFiles : '—'}</strong>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <div className="text-xs text-[var(--color-text-muted)]">Total lines of code:</div>
                                        <div className="text-xs font-mono">
                                            <strong className="text-xs font-mono">{typeof adjustedTotal.code === 'number' ? adjustedTotal.code : '—'}</strong>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-3 mr-4">No total summary available</div>
                            )}
                            {filteredLanguages && filteredLanguages.length ? (
                                <>
                                    <div className="my-2 border-t app-border" />
                                    <div className="space-y-2 max-h-48 overflow-auto">
                                        {filteredLanguages.map((entry) => {
                                            const label = resolveLabel(entry.language);
                                            return (
                                                <div key={`${entry.language}-${entry.code}`} className="flex justify-between gap-3 mr-4">
                                                    <div className="flex flex-wrap items-center gap-1 text-xs text-[var(--color-text-muted)]">
                                                        {renderLabel(label)}
                                                    </div>
                                                    <div className="text-xs font-mono">{entry.code}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    ) : (
                        <div className="text-sm text-[var(--color-text-muted)]">No LOC data</div>
                    )}
                </>
            )}
        </div>
    );
};

export default CodeStats;

// ---------------------- Info components ----------------------
// Reusing same InfoIcon tooltip pattern from AllCodeStats.
const InfoIcon: React.FC = () => {
    const [open, setOpen] = React.useState(false);
    const toggle = () => setOpen(o => !o);
    return (
        <div className="relative inline-block">
            <Tooltip
                content="See how the code statistics are generated."
                delay={600}
                placement="bottom"
                disabled={open}
                maxWidthClass="max-w-xl"
                minWidthClass="min-w-[14rem]"
            >
                <button
                    type="button"
                    aria-expanded={open}
                    aria-label="More information about code stats"
                    onClick={toggle}
                    className="w-4 h-4 flex items-center justify-center rounded-full border app-border text-[10px] font-bold cursor-pointer select-none bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
                >
                    i
                </button>
            </Tooltip>
            {open && (
                <div className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-1 w-64 text-[11px] p-3 rounded border app-border bg-[var(--color-bg)] shadow-xl space-y-2">
                    <p>
                        The code stats have been calculated with{' '}
            <a
              href="https://github.com/AlDanial/cloc"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              cloc
            </a>
            . The lines of code represent the actual lines of code of this Open Source project (empty spaces and comments are not included). I have written most of that code.
                    </p>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-[10px] px-2 py-1 rounded border app-border hover:bg-[var(--color-bg-muted)]"
                            aria-label="Close code stats info"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
