---
applyTo: "**"
---

# GitHub Copilot instructions

These instructions are the authoritative guide for AI-assisted development in this repository.
They extend and supersede `copilot-instructions.md` at the repo root.

---

## Project overview

Personal CV / portfolio website built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**.
Content is authored in **Markdown** (`.md`) or **AsciiDoc** (`.adoc`).

---

## Commits

- Short descriptive title, blank line, bullet-point body:
  ```
  Add AsciiDoc support for project pages

  - add asciidocLoader.ts with Vite glob and lazy asciidoctor import
  - add asciidocRenderer.tsx mapping custom HTML tags to React components
  - update ProjectDetail, AboutSection, Contact to auto-detect .adoc
  ```

---

## Architecture

### Key directories

| Path | Purpose |
|---|---|
| `src/components/` | Presentational React components |
| `src/pages/` | Route-level page components |
| `src/utils/` | Pure utilities, loaders, renderers |
| `src/hooks/` | Custom React hooks |
| `src/layouts/` | Shared page layout wrappers |
| `src/data/` | Static JSON + Markdown/AsciiDoc content |
| `src/styles/` | Global CSS, theme, AsciiDoc styles |
| `src/types/` | Shared TypeScript interfaces |
| `docs/` | Human-readable authoring guides |

### Content data files

| File | Purpose |
|---|---|
| `src/data/projects.json` | Project list; each entry has `id`, `title`, `skills`, `markdownUrl`, etc. |
| `src/data/resume.json` | Profile, experience, education, skills used on the Resume page |
| `src/data/skills.json` | Skill metadata (categories, colours) |
| `src/data/projects/ERPDemo/erp-docs.json` | Ordered TOC for the ERP Demo multi-page docs (slug + title + level) |
| `src/data/ABOUT_ME.md` | About page body (can be `.adoc`) |
| `src/data/CONTACT.md` | Contact page body (can be `.adoc`) |
| `src/data/projects/<Name>/README.md` | Project detail page body (can be `.adoc`) |
| `src/data/projects/ERPDemo/docs/*.md` | Individual ERP Demo documentation pages |

### `Project` type (`src/types/index.ts`)

```ts
interface Project {
  id: string;
  title: string;
  description: string;
  link: string;
  skills?: string[];
  markdownUrl?: string;   // path to .md or .adoc file
  date?: string;
  date_from?: string;
  date_to?: string;       // accepts "today"
  preview_start?: number; // card video start offset in seconds
  'cloc-mapping-overwrite'?: Record<string, string>;
}
```

---

## React patterns

- Functional components and hooks only — no class components.
- `React.FC` only when the component accepts `children`; otherwise use typed function declarations.
- Rules of Hooks are strict: no conditional hooks, no hooks inside loops.
- Keep `useEffect` dependency arrays complete and correct.
- Local state first → Context for cross-cutting concerns → no prop drilling.
- Extract reusable logic into custom hooks under `src/hooks/`.

---

## Styling

- Tailwind utility classes for layout and spacing.
- CSS Modules (`*.module.css`) for component-specific styles.
- Global CSS lives in `src/styles/globals.css`; it imports `theme.css` and `asciidoc.css`.
- Theme tokens are CSS custom properties defined in `src/styles/theme.css`. Always use them (`var(--color-bg)`, `var(--color-primary)`, etc.) instead of hard-coded colours.
- The `.prose` Tailwind typography class is applied to all rendered content areas.
- The `.adoc-content` class is applied to AsciiDoc renders; its styles live in `src/styles/asciidoc.css`.

---

## TypeScript

- Prefer `unknown` over `any`. Use `any` only at proven parser/library boundaries.
- Shared types go in `src/types/index.ts`.
- Export narrow interfaces; keep implementation types local.

---

## Content pipeline — Markdown

| File | Role |
|---|---|
| `src/utils/markdownLoader.ts` | Loads `.md` via Vite glob (`import.meta.glob`) or fetch |
| `src/utils/markdownComponents.ts` | Maps custom HTML tags to React components for `react-markdown` |
| `src/utils/markdownImageResolver.ts` | Resolves relative image paths to Vite asset URLs |
| `src/utils/markdownVideoResolver.ts` | Resolves relative video paths; exposes `resolveVideoVariants` |

Custom HTML tags supported inside Markdown (via `rehype-raw`):
`<skill>`, `<youtube>`, `<webm>`, `<github>`, `<download>`, `<linux>`, `<windows>`, `<macos>`,
`<firefox>`, `<chrome>`, `<website>`, `<linkedin>`, `<btn>`, `<email>`, `<highlight>`, `<img>`

---

## Content pipeline — AsciiDoc

| File | Role |
|---|---|
| `src/utils/asciidocLoader.ts` | Loads `.adoc` via Vite glob, lazily imports `@asciidoctor/core`, registers all macros, converts to HTML |
| `src/utils/asciidocRenderer.tsx` | Parses the HTML with `html-react-parser`, maps custom tags to the same React components as Markdown |
| `src/styles/asciidoc.css` | Styles for asciidoctor-generated HTML classes |

### Extension auto-detection

Pages that render content check the file extension and branch automatically:

```ts
const isAdoc = (url?: string) => /\.adoc$/i.test(url ?? '');
```

- `src/pages/ProjectDetail.tsx` — uses `markdownUrl` from `projects.json`
- `src/components/AboutSection.tsx` — uses the `ABOUT_PATH` constant
- `src/pages/Contact.tsx` — uses the `CONTACT_MD_PATH` constant

To switch a page to AsciiDoc, change the constant or the `markdownUrl` value; no other code change is needed.

### Registered AsciiDoc macros

**Inline macros** (inside paragraph text):

```asciidoc
skill:React[]
email:[]
email:[href="x@y.com",text="Label"]
```

**Block macros** (standalone line):

```asciidoc
youtube::VIDEO_ID[title="…",width=800]
webm::./clip.mp4[max-width=600,start=2,autoplay,auto-loop]
github::[href="…",text="View on GitHub"]
download::[href="…",text="Download"]
linux::, windows::, macos::, firefox::, chrome::, website::, linkedin::
btn::[href="…",icon="FaDownload",text="Label"]
highlight::[title="…",text="…",shadow]
```

**Highlight block** — wraps `skill:Name[]` badges (or arbitrary content) in a highlight box:

```asciidoc
[highlight,title="Tech Stack",shadow]
====
skill::React[]
skill::TypeScript[]
====
```

**Passthrough blocks** — raw HTML, identical to Markdown usage:

```asciidoc
++++
<highlight title="Note" shadow><skill>React</skill> content</highlight>
++++
```

**DOT / Graphviz diagram block:**

Inline (DOT source inside the `.adoc` file):

```asciidoc
[graphviz,caption="System Architecture",max-width=700]
....
digraph G {
  rankdir=LR;
  A -> B -> C;
}
....
```

External file (separate `.dot` file bundled under `src/data/`):

```asciidoc
dotgraph::./diagrams/system-architecture.dot[caption="System Architecture",max-width=700]
```

Attributes (both forms): `caption`, `max-width`, `align` (left|center|right), `engine` (dot|neato|fdp|sfdp|circo|twopi, default `dot`).
Rendered client-side via `@viz-js/viz` (Graphviz WASM). The block processor in `asciidocLoader.ts` base64-encodes the DOT source and emits `<dot-graph src="…">`. `asciidocRenderer.tsx` maps it to `DotGraphMarkdown` in `src/components/DotGraph.tsx`.

Full documentation: `docs/authoring-guide.adoc`
Quick reference: `docs/adoc-macros.adoc`

---

## Do not

- Do not place business logic inside components; put it in `src/utils/` or `src/services/`.
- Do not violate the Rules of Hooks.
- Do not create class components.
- Do not use hard-coded colour values; use CSS custom properties from `theme.css`.
- Do not use global styles for component-specific concerns; use CSS Modules or Tailwind.
- Do not add docstrings, comments, or type annotations to code you didn't change.
- Do not add error handling for scenarios that cannot happen at a given call site.
- Do not over-engineer: only make changes that are directly requested or clearly necessary.
