export interface Project {
    id: string;
    title: string;
    description: string;
    link: string;
    /**
     * Optional URL to markdown content for detailed project description.
     * Can be:
     * - A relative path to a local markdown file within src (e.g., 
     *   "/src/data/projects/<project-id>/README.md" or "./data/projects/<project-id>/README.md")
     * - A public URL (e.g., a GitHub README URL)
     */
    markdownUrl?: string;
}

export interface CVData {
    name: string;
    title: string;
    email: string;
    phone: string;
    education: Array<{ school: string; degree: string; period: string; details?: string[] }>;
    workHistory: Array<{ company: string; role: string; period: string; details?: string[] }>;
    skills: string[];
}