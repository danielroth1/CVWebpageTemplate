export interface Project {
    id: string;
    title: string;
    description: string;
    link: string;
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