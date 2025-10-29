# Personal CV Web Page

This project is a personal CV web page built with React and TypeScript. It showcases various projects, provides detailed project pages, and includes a responsive design for mobile compatibility.
See [here](http://daniel.mailbase.info) for an example where this template is used.

## Features
- modern design
- mobile compatible
- easily customizable, you don't even need to know React
- light / dark mode
- count lines of codes (see multi-loc-config.json and cloc-mapping.json)

## How to use
Fork (if you want) or clone the repository directly:
```
git clone git@github.com:danielroth1/CVWebpageTemplate.git
```

You only have add the content via files in the /src/data folder. 
After you have done the following customizations:
- add your "about me" section (ABOUT_ME.md)
- add your "contact" page (CONTACT.md)
- add a personal picture or use a placeholder if you are not comfortable with it (peronal_photo.jpg)
- add your own projects as a display of your achievements (projects.json + projects/)
- add your resume as pdf for download (resume.pdf)

set it up
```
npm run install
```

try it out
```
npm run dev
```

create distributable
```
npm run build
```

and deploy it. I have provided a script for deployment on a ftp file server, see scripts/deploy.sh
```
./scripts/deploy.sh
```

## Project Structure

The project is organized as follows:

```
personal-cv
├── public
│   └── index.html          # Main HTML file
├── src
│   ├── index.tsx          # Entry point of the React application
│   ├── App.tsx            # Main App component with routing
│   ├── routes.tsx         # Defines application routes
│   ├── pages               # Contains page components
│   │   ├── Home.tsx       # Home page component
│   │   ├── Projects.tsx    # Projects overview page
│   │   └── ProjectDetail.tsx # Detailed project page
│   ├── components          # Reusable components
│   │   ├── Header.tsx      # Header component
│   │   ├── Sidebar.tsx     # Sidebar navigation component
│   │   ├── Footer.tsx      # Footer component
│   │   ├── ProjectList.tsx  # List of projects
│   │   ├── ProjectCard.tsx  # Individual project card
│   │   └── MobileNav.tsx    # Mobile navigation menu
│   ├── hooks               # Custom hooks
│   │   └── useWindowSize.ts # Hook for window size
│   ├── data                # Data files
│   │   └── projects.ts      # Project data
│   ├── styles              # CSS styles
│   │   ├── globals.css      # Global styles
│   │   └── components.css    # Component-specific styles
│   ├── utils               # Utility functions
│   │   └── helpers.ts       # Helper functions
│   └── types               # TypeScript types
│       └── index.ts         # Type definitions
├── package.json            # NPM configuration
├── tsconfig.json           # TypeScript configuration
├── .gitignore              # Git ignore file
└── README.md               # Project documentation
```

## Getting Started

To get started with this project, follow these steps:

1. **Clone the repository:**
   ```
   git clone <repository-url>
   ```

2. **Navigate to the project directory:**
   ```
   cd personal-cv
   ```

3. **Install dependencies:**
   ```
   npm install
   ```

4. **Run the application:**
   ```
   npm start
   ```

The application will be available at `http://localhost:3000`.

## Features

- Overview of various projects with clickable links leading to detailed pages.
- Responsive design for mobile compatibility.
- Sidebar navigation for easy access to different sections of the CV.

## ToDo

- add project component
   - pictures
   - used programming languages
   - duration, when was it worked on?
   - status (under development / completed)
- allow to add more details to each job / education
  - maybe a good idea to make this expandable
  - add a separate component for this
- download CV button
- add "About me" section
- color code programming languages (reference skill <-> project, work experience)

- allow to add any kind of description / page with markdown
  -> very efficient and powerful way of adding custom content
  -> can just add the markdown from github?

- simplify README.md for emplyers (not developer)
  - if possible add download buttons for release version
  - if possible add link to web page
  - every project should have a very short description
  - missing projects:
    - 

## License

This project is licensed under the MIT License.

## Additional Pages

### About page

- Create or edit `src/data/ABOUT_ME.md` to populate the About page at `/about`.

### Resume page

- The Resume page at `/resume` will prefer `src/data/RESUME.md` if present.
- If `RESUME.md` is not present, it will look for `src/data/resume.json` with the shape:

```
{
   "profile": {
      "name": "Jane Doe",
      "title": "Software Developer",
      "email": "jane.doe@example.com",
      "skills": {
         "Front-End": ["React", "TypeScript"],
         "Backend": ["C#", "ASP.NET Core"],
         "Databases": ["MySQL"],
         "DevOps": ["Git"]
      }
   },
   "work": [ { "startYear": "2022", "endYear": "Today", "position": "Senior Dev", "company": "Acme", "bullets": ["..."] } ],
   "education": [ { "startYear": "2016", "endYear": "2020", "position": "B.Sc.", "company": "State University", "bullets": ["..."] } ]
}
```

- If `profile.skills` is an object, categories will be rendered with headings on the Resume page. If it's a flat array, badges are rendered in a single group.
- Add `resume.pdf` under `src/data/` to enable download & preview.

### Contact page

- The Contact page at `/contact` loads markdown from `src/data/CONTACT.md`.
- Create or edit `src/data/CONTACT.md` to customize the introductory text (supports GitHub-flavored markdown).
- The page still uses `profile.email` from `resume.json` for the mailto button; keep that field updated.

- Place a `resume.pdf` in the `public/` folder to enable the Download Resume button and inline PDF preview.

### Icons

- The navigation includes icons via `react-icons` (Home, Projects, About, Resume).

## Video embeds and Safari stability

Project pages can embed short demo videos in markdown using a custom tag, for example:

```
<webm src="./preview.webm" max-width="600" />
```

Under the hood the app will prefer an H.264 MP4 fallback on Safari and load videos lazily with `preload="none"` to improve stability on mobile browsers. For best results, generate compressed variants next to your original files:

```
npm run compress-videos
```

This creates `[name].min.webm` (VP9) and `[name].min.mp4` (H.264) beside each `*.webm` under `src/data/**`. The renderer will automatically use these smaller variants when available. Requires `ffmpeg` (macOS: `brew install ffmpeg`).
