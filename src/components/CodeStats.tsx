import React from 'react';
import SkillBadge from './SkillBadge';

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

const CodeStats: React.FC<CodeStatsProps> = ({ clocData, languageMapping, overrides }) => {
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

    return (
        <div className="border border-gray-200 rounded p-4 bg-gray-50">
            <h3 className="text-sm font-semibold mb-2">Code stats</h3>
            {clocData ? (
                <div className="text-sm text-gray-800">
                    {adjustedTotal ? (
                        <div className="mb-3 space-y-2">
                            <div className="flex justify-between">
                                <div className="text-xs text-gray-700">Files:</div>
                                <div className="text-xs font-mono">
                                    <strong>{typeof adjustedTotal.nFiles === 'number' ? adjustedTotal.nFiles : '—'}</strong>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <div className="text-xs text-gray-700">Total lines of code:</div>
                                <div className="text-xs font-mono">
                                    <strong className="text-xs font-mono">{typeof adjustedTotal.code === 'number' ? adjustedTotal.code : '—'}</strong>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-3">No total summary available</div>
                    )}
                    {filteredLanguages && filteredLanguages.length ? (
                        <>
                            <div className="my-2 border-t border-gray-200" />
                            <div className="space-y-2 max-h-48 overflow-auto">
                                {filteredLanguages.map((entry) => {
                                    const label = resolveLabel(entry.language);
                                    return (
                                        <div
                                            key={`${entry.language}-${entry.code}`}
                                            className="flex justify-between gap-3"
                                        >
                                            <div className="flex flex-wrap items-center gap-1 text-xs text-gray-700">
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
                <div className="text-sm text-gray-600">No LOC data</div>
            )}
        </div>
    );
};

export default CodeStats;
