import React from 'react';
import { Link } from 'react-router-dom';
import { erpDocsToc } from '../utils/erpDocs';
import type { ErpDocEntryWithNumber } from '../utils/erpDocs';

const ErpDocsLanding: React.FC = () => {
    return (
        <div className="px-4 lg:px-8 pb-8 mt-2 lg:mt-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-[var(--color-text)]">ERP Demo Documentation</h1>
            <p className="text-[var(--color-text)] opacity-80 mb-8 text-lg">
                In-depth documentation for the ERP Demo project — covering architecture, API design,
                database schema, frontend structure, and Kubernetes deployment.
            </p>

            <h2 className="text-xl font-semibold mb-4 text-[var(--color-text)]">Table of Contents</h2>
            <nav aria-label="Table of contents">
                <ol className="space-y-1">
                    {erpDocsToc.map((entry: ErpDocEntryWithNumber) => (
                        <li
                            key={entry.slug}
                            style={{ paddingLeft: `${(entry.level - 1) * 1.5}rem` }}
                        >
                            <Link
                                to={`/erp-docs/${entry.slug}`}
                                className="inline-flex items-baseline gap-2 py-1 text-[var(--color-primary)] hover:text-[var(--color-primary-accent)] hover:underline transition-colors"
                            >
                                <span className="font-mono text-sm opacity-70 min-w-[2.5rem]">{entry.number}</span>
                                <span className={entry.level === 1 ? 'font-semibold' : ''}>{entry.title}</span>
                            </Link>
                        </li>
                    ))}
                </ol>
            </nav>
        </div>
    );
};

export default ErpDocsLanding;
