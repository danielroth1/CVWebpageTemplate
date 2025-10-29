import React from 'react';
import SkillBadge from './SkillBadge';
import Tooltip from './Tooltip';
import useWindowSize from '../hooks/useWindowSize';
import { ClocLanguageEntry, animateNumbers } from '../utils/animate';

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

// Extract <skill>Skill</skill> from a mapping label. If present, we return that pure skill name.
// Otherwise, we return null to indicate non-skill label (or free text only).
function extractSkill(label: string): string | null {
    if (!label) return null;
    const m = label.match(/<skill>(.*?)<\/skill>/i);
    if (!m) return null;
    return m[1].trim();
}

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

    // Consolidate entries that map to the same <skill> into a single row with summed LOC.
    // For entries without a <skill> tag, we keep their resolved label as-is (no merging across different labels).
    const aggregated = React.useMemo(() => {
        const byKey = new Map<string, { code: number; isSkill: boolean }>();
        for (const entry of filteredLanguages || []) {
            const code = typeof entry.code === 'number' ? entry.code : 0;
            if (!code) continue;
            const label = resolveLabel(entry.language);
            const skill = extractSkill(label);
            const key = skill ?? label ?? entry.language;
            const prev = byKey.get(key)?.code ?? 0;
            byKey.set(key, { code: prev + code, isSkill: !!skill });
        }
        const list = Array.from(byKey.entries()).map(([language, v]) => ({ language, code: v.code, isSkill: v.isSkill }));
        // Sort descending by code for a stable display
        list.sort((a, b) => b.code - a.code);
        return list;
    }, [filteredLanguages, resolveLabel]);

    const [animatedTotals, setAnimatedTotals] = React.useState({ files: 0, code: 0 });
    const [animatedSkills, setAnimatedSkills] = React.useState<Record<string, number>>({});
    const [collapsed, setCollapsed] = React.useState<boolean>(defaultCollapsed);

        // Run count-up when visible first time
    React.useEffect(() => {
      if (collapsed) return;
            const totalFiles = adjustedTotal?.nFiles;
            const totalCode = adjustedTotal?.code;
            const skills = (aggregated || []).map(({ language, code }) => ({ language, code }));
            animateNumbers(skills, totalFiles || 0, totalCode || 0, setAnimatedTotals, setAnimatedSkills);
        }, [adjustedTotal, aggregated, collapsed]);

    // Screen size (match Tailwind's lg)
    const { width } = useWindowSize();
    const isLg = width >= 1024;

    const toggle = () => {
        setCollapsed((c) => {
            const next = !c;
            onToggleCollapsed?.(next);
            return next;
        });
    };

    return (
    <div className={(collapsed ? "" : "app-border border rounded-xl p-4 app-surface min-w-[13rem]")}>
            {collapsed ? (
                <div className="w-full flex justify-center">
                    <button
                        type="button"
                        onClick={toggle}
                        className="btn-base btn-brand text-sm px-3 py-2 rounded-md transition shadow hover:shadow-md"
                        aria-expanded={!collapsed}
                    >
                        <span className="inline-flex items-center gap-2">
                            {/* code icon */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="w-4 h-4"
                                aria-hidden="true"
                            >
                                <path d="M8 16l-4-4 4-4" />
                                <path d="M16 8l4 4-4 4" />
                                <path d="M14 4l-4 16" />
                            </svg>
                            <span>{isLg ? 'Show' : 'Show code stats'}</span>
                        </span>
                    </button>
                </div>
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
                        className="text-xs ms-1 px-2 py-1 rounded border app-border hover:bg-[var(--color-bg-muted)] transition"
                        aria-expanded={!collapsed}
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
                            {aggregated && aggregated.length ? (
                                <>
                                    <div className="my-2 border-t app-border" />
                                    <div className="space-y-2 max-h-48 overflow-auto">
                                        {aggregated.map((item) => {
                                            const code = animatedSkills[item.language] ?? 0;
                                            return (
                                                <div key={`${item.language}`} className="flex justify-between gap-3 mr-4">
                                                    <div className="flex flex-wrap items-center gap-1 text-xs text-[var(--color-text-muted)]">
                                                        {item.isSkill ? (
                                                            <SkillBadge>{item.language}</SkillBadge>
                                                        ) : (
                                                            renderLabel(item.language)
                                                        )}
                                                    </div>
                                                    <div className="text-xs font-mono">{code}</div>
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
            . The lines of code represent the actual lines of code of this project (empty spaces and comments are not included). I have written most of that code.
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
