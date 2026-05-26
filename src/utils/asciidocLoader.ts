/**
 * AsciiDoc loader + converter for the CV project.
 *
 * Works like markdownLoader.ts but for .adoc files.
 *
 * Usage:
 *   const html = await loadAndConvertAdoc('data/projects/MyProject/README.adoc');
 *
 * Features supported natively in AsciiDoc .adoc files:
 *   - All standard AsciiDoc formatting (headings, lists, tables, code, etc.)
 *   - Passthrough blocks  (++++  ...  ++++ ) for raw HTML with custom tags
 *   - Native AsciiDoc macros for all custom components:
 *
 *   INLINE MACROS (inside paragraph text):
 *     skill:React[]                    → <skill> badge
 *     email:[href="x@y.com"]           → email button (leave empty for resume default)
 *
 *   BLOCK MACROS (standalone line):
 *     youtube::VIDEO_ID[title="...",width=800]
 *     webm::./clip.mp4[max-width=600,start=2,autoplay,auto-loop]
 *     github::[href="https://...",text="View on GitHub"]
 *     download::[href="https://...",text="Download"]
 *     linux::[href="https://...",text="Download for Linux"]
 *     windows::[href="https://...",text="Download for Windows"]
 *     macos::[href="https://...",text="Download for macOS"]
 *     firefox::[href="https://...",text="Get for Firefox"]
 *     chrome::[href="https://...",text="Get for Chrome"]
 *     website::[href="https://...",text="Visit Website"]
 *     linkedin::[href="https://...",text="View on LinkedIn"]
 *     btn::[icon="FaDownload",href="https://...",text="Label"]
 *     highlight::[title="Note",shadow=true]
 *       Content goes here...
 *     ====
 *
 *   DOT / GRAPHVIZ INLINE BLOCK (delimited block with [graphviz] style):
 *     [graphviz,caption="My Diagram",max-width=700,engine=dot]
 *     ....
 *     digraph G {
 *       rankdir=LR;
 *       A -> B -> C;
 *     }
 *     ....
 *
 *   DOT / GRAPHVIZ EXTERNAL FILE (block macro — .dot file bundled alongside the .adoc):
 *     dotgraph::./diagrams/system-architecture.dot[caption="System Architecture",max-width=700]
 *     dotgraph::./diagrams/order-flow.dot[engine=neato]
 *
 *     Supported attributes for both: caption, max-width, align (left|center|right), engine (dot|neato|fdp|sfdp|circo|twopi)
 *
 *   PASSTHROUGH BLOCK (raw HTML, same tags as used in Markdown):
 *     ++++
 *     <github href="https://...">View on GitHub</github>
 *     <skill>React</skill>
 *     ++++
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const isExternal = (url: string) => /^https?:\/\//i.test(url);

// Eager-load all .adoc files under src/data via Vite glob
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let viteAdocModules: Record<string, any> | null = null;
try {
  // @ts-ignore - import.meta.glob is a Vite-specific API
  const raw = import.meta.glob('../data/**/*.adoc', { query: '?raw', import: 'default', eager: true });
  viteAdocModules = raw as Record<string, string>;
} catch {
  viteAdocModules = null;
}

// Eager-load all .dot files under src/data via Vite glob
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let viteDotModules: Record<string, any> | null = null;
try {
  // @ts-ignore - import.meta.glob is a Vite-specific API
  const rawDot = import.meta.glob('../data/**/*.dot', { query: '?raw', import: 'default', eager: true });
  viteDotModules = rawDot as Record<string, string>;
} catch {
  viteDotModules = null;
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

function resolveLocalKey(adocUrl: string): string | null {
  if (!viteAdocModules) return null;

  let key = adocUrl.replace(/^\.\//, '').replace(/^\//, '');
  key = key.replace(/^src\//i, '').replace(/^\.\/src\//i, '');
  if (!/^(data)\//i.test(key)) {
    key = `data/${key}`;
  }
  if (!key.toLowerCase().endsWith('.adoc')) return null;

  const keys = Object.keys(viteAdocModules);
  const candidates = [key, `./${key}`, `/src/${key}`].map(normalizePath);
  for (const cand of candidates) {
    const exact = keys.find((x) => x.toLowerCase() === cand.toLowerCase());
    if (exact) return exact;
  }
  const found = keys.find((k) => k.toLowerCase().endsWith(normalizePath(key).toLowerCase()));
  return found ?? null;
}

/** Load the raw AsciiDoc source text from a local bundled path or external URL. */
export async function loadAdoc(adocUrl?: string): Promise<string> {
  if (!adocUrl) return '';
  try {
    if (isExternal(adocUrl)) {
      const res = await fetch(adocUrl);
      if (!res.ok) return '';
      return await res.text();
    }
    const key = resolveLocalKey(adocUrl);
    if (viteAdocModules && key && viteAdocModules[key]) {
      return String(viteAdocModules[key]);
    }
    // Fallback: public folder path
    if (adocUrl.startsWith('/')) {
      const res = await fetch(adocUrl);
      if (!res.ok) return '';
      return await res.text();
    }
    return '';
  } catch (e) {
    console.warn('Failed to load adoc:', e);
    return '';
  }
}

// ---------------------------------------------------------------------------
// Macro attribute helpers
// ---------------------------------------------------------------------------

function escAttr(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Convert attrs object to HTML attribute string, skipping numeric positional keys. */
function attrsToHtml(attrs: Record<string, any>, skip: string[] = []): string {
  return Object.entries(attrs)
    .filter(([k]) => !(/^\d+$/.test(k)) && !skip.includes(k))
    .map(([k, v]) => `${k}="${escAttr(String(v))}"`)
    .join(' ');
}

// ---------------------------------------------------------------------------
// Asciidoctor extension registry factory
// ---------------------------------------------------------------------------

/** Resolve a .dot path (relative to an origin .adoc) to a Vite glob key. */
function resolveDotKey(target: string, originPath: string): string | null {
  if (!viteDotModules) return null;
  const dir = normalizePath(originPath).replace(/[^/]+$/, '');
  const combined = normalizePath(dir + target.replace(/^\.?\//, ''));
  let key = combined.replace(/^\.\//,'').replace(/^\//,'');
  key = key.replace(/^src\//i, '');
  if (!/^data\//i.test(key)) key = `data/${key}`;
  const keys = Object.keys(viteDotModules);
  const norm = normalizePath(key);
  for (const cand of [norm, `./${norm}`]) {
    const exact = keys.find((x) => x.toLowerCase() === cand.toLowerCase());
    if (exact) return exact;
  }
  return keys.find((k) => k.toLowerCase().endsWith(`/${norm.toLowerCase()}`)) ?? null;
}

function buildDotGraphHtml(self: any, parent: any, dotSource: string, attrs: Record<string, any>): any {
  const encoded = btoa(unescape(encodeURIComponent(dotSource)));
  const caption = attrs['caption'] || attrs['title'] || '';
  const maxWidth = attrs['max-width'] || attrs['width'] || '';
  const align = attrs['align'] || '';
  const engine = attrs['engine'] || '';
  const captionAttr = caption ? ` caption="${escAttr(caption)}"` : '';
  const maxWidthAttr = maxWidth ? ` max-width="${escAttr(String(maxWidth))}"` : '';
  const alignAttr = align ? ` align="${escAttr(align)}"` : '';
  const engineAttr = engine ? ` engine="${escAttr(engine)}"` : '';
  return self.createBlock(parent, 'pass',
    `<dot-graph src="${encoded}"${captionAttr}${maxWidthAttr}${alignAttr}${engineAttr}></dot-graph>`,
  );
}

function buildRegistry(asciidoctor: any, originPath = ''): any {
  const reg = asciidoctor.Extensions.create();

  // -- INLINE MACROS --

  // skill:React[]
  reg.inlineMacro('skill', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string) {
      return self.createInline(parent, 'quoted', `<skill>${escAttr(target)}</skill>`, { type: 'unquoted' });
    });
  });

  // email:[href="x@y.com"]  or  email:[]  (uses resume default)
  reg.inlineMacro('email', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string, attrs: any) {
      const href = attrs['href'] || target || '';
      const text = attrs['text'] || attrs[1] || 'Email Me';
      const hrefAttr = href ? ` href="${escAttr(href)}"` : '';
      return self.createInline(parent, 'quoted', `<email${hrefAttr}>${escAttr(text)}</email>`, { type: 'unquoted' });
    });
  });

  // -- BLOCK MACROS --

  function blockMacroHtml(self: any, parent: any, html: string) {
    return self.createBlock(parent, 'pass', html);
  }

  // youtube::VIDEO_ID[title="...",width=800]
  reg.blockMacro('youtube', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string, attrs: any) {
      const rest = attrsToHtml(attrs);
      return blockMacroHtml(self, parent, `<youtube id="${escAttr(target)}" ${rest}></youtube>`);
    });
  });

  // webm::./clip.mp4[max-width=600,start=2,autoplay,auto-loop,controls=false]
  reg.blockMacro('webm', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string, attrs: any) {
      const rest = attrsToHtml(attrs, ['src']);
      return blockMacroHtml(self, parent, `<webm src="${escAttr(target)}" ${rest}></webm>`);
    });
  });

  // github::[href="https://...",text="View on GitHub"]
  reg.blockMacro('github', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string, attrs: any) {
      const href = attrs['href'] || target || '';
      const text = attrs['text'] || attrs[1] || 'View on GitHub';
      return blockMacroHtml(self, parent, `<github href="${escAttr(href)}">${escAttr(text)}</github>`);
    });
  });

  // download::[href="...",text="Download"]
  reg.blockMacro('download', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string, attrs: any) {
      const href = attrs['href'] || target || '';
      const text = attrs['text'] || attrs[1] || 'Download';
      return blockMacroHtml(self, parent, `<download href="${escAttr(href)}">${escAttr(text)}</download>`);
    });
  });

  // linux::[href="...",text="Download for Linux"]
  reg.blockMacro('linux', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string, attrs: any) {
      const href = attrs['href'] || target || '';
      const text = attrs['text'] || attrs[1] || 'Download for Linux';
      return blockMacroHtml(self, parent, `<linux href="${escAttr(href)}">${escAttr(text)}</linux>`);
    });
  });

  // windows::[href="...",text="Download for Windows"]
  reg.blockMacro('windows', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string, attrs: any) {
      const href = attrs['href'] || target || '';
      const text = attrs['text'] || attrs[1] || 'Download for Windows';
      return blockMacroHtml(self, parent, `<windows href="${escAttr(href)}">${escAttr(text)}</windows>`);
    });
  });

  // macos::[href="...",text="Download for macOS"]
  reg.blockMacro('macos', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string, attrs: any) {
      const href = attrs['href'] || target || '';
      const text = attrs['text'] || attrs[1] || 'Download for macOS';
      return blockMacroHtml(self, parent, `<macos href="${escAttr(href)}">${escAttr(text)}</macos>`);
    });
  });

  // firefox::[href="...",text="Get for Firefox"]
  reg.blockMacro('firefox', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string, attrs: any) {
      const href = attrs['href'] || target || '';
      const text = attrs['text'] || attrs[1] || 'Get for Firefox';
      return blockMacroHtml(self, parent, `<firefox href="${escAttr(href)}">${escAttr(text)}</firefox>`);
    });
  });

  // chrome::[href="...",text="Get for Chrome"]
  reg.blockMacro('chrome', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string, attrs: any) {
      const href = attrs['href'] || target || '';
      const text = attrs['text'] || attrs[1] || 'Get for Chrome';
      return blockMacroHtml(self, parent, `<chrome href="${escAttr(href)}">${escAttr(text)}</chrome>`);
    });
  });

  // website::[href="...",text="Visit Website"]
  reg.blockMacro('website', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string, attrs: any) {
      const href = attrs['href'] || target || '';
      const text = attrs['text'] || attrs[1] || 'Visit Website';
      return blockMacroHtml(self, parent, `<website href="${escAttr(href)}">${escAttr(text)}</website>`);
    });
  });

  // linkedin::[href="...",text="View on LinkedIn"]
  reg.blockMacro('linkedin', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string, attrs: any) {
      const href = attrs['href'] || target || '';
      const text = attrs['text'] || attrs[1] || 'View on LinkedIn';
      return blockMacroHtml(self, parent, `<linkedin href="${escAttr(href)}">${escAttr(text)}</linkedin>`);
    });
  });

  // btn::[icon="FaDownload",href="https://...",text="Label"]
  reg.blockMacro('btn', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string, attrs: any) {
      const href = attrs['href'] || target || '';
      const text = attrs['text'] || attrs[1] || 'Button';
      const icon = attrs['icon'] || '';
      return blockMacroHtml(self, parent, `<btn href="${escAttr(href)}" icon="${escAttr(icon)}">${escAttr(text)}</btn>`);
    });
  });

  // highlight::[title="Note",shadow]  (single block macro, no content)
  // For a highlight WITH content, use a passthrough block instead:
  //   ++++
  //   <highlight title="Note" shadow>content here</highlight>
  //   ++++
  reg.blockMacro('highlight', function (this: any) {
    const self = this;
    this.process(function (parent: any, _target: string, attrs: any) {
      const title = attrs['title'] || '';
      const shadow = (attrs['shadow'] != null && attrs['shadow'] !== 'false') ? ' shadow' : '';
      const content = attrs['text'] || attrs[1] || '';
      return blockMacroHtml(self, parent, `<highlight title="${escAttr(title)}"${shadow}>${escAttr(content)}</highlight>`);
    });
  });

  // [graphviz,caption="...",max-width=700,engine=dot]
  // ....
  // digraph G { ... }
  // ....
  reg.block('graphviz', function (this: any) {
    const self = this;
    this.onContext(['listing', 'literal']);
    this.process(function (parent: any, reader: any, attrs: any) {
      const lines: string[] = Array.isArray(reader.lines)
        ? reader.lines
        : typeof reader.getLines === 'function'
          ? reader.getLines()
          : [];
      return buildDotGraphHtml(self, parent, lines.join('\n'), attrs);
    });
  });

  // dotgraph::./path/to/diagram.dot[caption="...",max-width=700,engine=dot]
  reg.blockMacro('dotgraph', function (this: any) {
    const self = this;
    this.process(function (parent: any, target: string, attrs: any) {
      const key = resolveDotKey(target, originPath);
      if (!key || !viteDotModules?.[key]) {
        return self.createBlock(parent, 'pass',
          `<div class="text-sm p-2 rounded border border-red-400 text-red-600">DOT file not found: ${escAttr(target)}</div>`,
        );
      }
      return buildDotGraphHtml(self, parent, String(viteDotModules[key]), attrs);
    });
  });

  return reg;
}

// ---------------------------------------------------------------------------
// Convert AsciiDoc text → HTML string (lazy-loads asciidoctor)
// ---------------------------------------------------------------------------

let _asciidoctor: any = null;

async function getAsciidoctor(): Promise<any> {
  if (_asciidoctor) return _asciidoctor;
  // Dynamic import keeps asciidoctor (~2.5 MB) out of the initial bundle
  const mod = await import('@asciidoctor/core');
  _asciidoctor = (mod.default as any)();
  return _asciidoctor;
}

/**
 * Convert raw AsciiDoc text to an HTML string.
 *
 * @param adocText   Raw AsciiDoc source
 * @param originPath Path used to load the file (used only by the renderer for image/video resolution)
 */
export async function adocToHtml(adocText: string, originPath?: string): Promise<string> {
  if (!adocText) return '';
  try {
    const asciidoctor = await getAsciidoctor();
    const registry = buildRegistry(asciidoctor, originPath ?? '');
    const html = asciidoctor.convert(adocText, {
      safe: 'unsafe',          // allow passthrough blocks (++++ syntax)
      extension_registry: registry,
      attributes: {
        showtitle: '',          // render the document title as <h1>
        'source-highlighter': '', // disable built-in syntax highlighter
        idprefix: '',
        idseparator: '-',
        sectids: '',
      },
    });
    return typeof html === 'string' ? html : '';
  } catch (e) {
    console.warn('Failed to convert adoc to HTML:', e);
    return '';
  }
}

/**
 * Load an AsciiDoc file and convert it to HTML in one step.
 */
export async function loadAndConvertAdoc(adocUrl?: string): Promise<string> {
  if (!adocUrl) return '';
  const text = await loadAdoc(adocUrl);
  if (!text) return '';
  return adocToHtml(text, adocUrl);
}

export default loadAndConvertAdoc;
