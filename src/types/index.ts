export interface Project {
    id: string;
    title: string;
    description: string;
    link: string;
    skills?: string[];
    'cloc-mapping-overwrite'?: Record<string, string>;
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