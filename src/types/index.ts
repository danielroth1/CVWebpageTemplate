export interface Project {
    id: string;
    title: string;
    description: string;
    link: string;
    skills?: string[];
    'cloc-mapping-overwrite'?: Record<string, string>;
    /** Optional start time in seconds for preview video shown on project cards */
    preview_start?: number;
    /**
     * Optional single date string to display as-is (e.g., "2025" or "10/2024").
     * When present, ignore date_from/date_to and do not compute a span.
     */
    date?: string;
    /** Flexible start date, formats allowed: "YYYY", "MM.YYYY", "DD.MM.YYYY" ("/" separators also allowed) */
    date_from?: string;
    /** Flexible end date, same formats as date_from; can also be the literal "today" */
    date_to?: string;
    /**
     * Optional URL to markdown content for detailed project description.
     * Can be:
     * - A relative path to a local markdown file within src (e.g., 
     *   "/src/data/projects/<project-id>/README.md" or "./data/projects/<project-id>/README.md")
     * - A public URL (e.g., a GitHub README URL)
     */
    markdownUrl?: string;
}

export interface Profile {
    name: string;
    title: string;
    email: string;
    phone: string;
    skills: string[];
}

export interface ProjectsData {
    projects: Project[];
}