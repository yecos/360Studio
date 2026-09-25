import { readFile, writeFile, mkdir } from 'node:fs/promises';

const read = (p) => readFile(p, 'utf8');
const write = async (p, s) => { await mkdir(p.split('/').slice(0,-1).join('/') || '.', { recursive: true }); await writeFile(p, s); };

async function replace(path, from, to, required = true) {
  let source = await read(path);
  if (!source.includes(from)) {
    if (required) throw new Error(`Expected marker not found in ${path}: ${from.slice(0, 80)}`);
    return false;
  }
  source = source.replace(from, to);
  await write(path, source);
  return true;
}

const pkg = JSON.parse(await read('package.json'));
pkg.name = 'nexo-space-ai';
pkg.version = '0.1.0';
pkg.description = 'NEXO SPACE AI — architecture and interior design workspace powered by an open-source 2D/3D planning core';
pkg.author = 'NEXO STUDIO';
pkg.repository = { type: 'git', url: 'https://github.com/yecos/360Studio.git' };
await write('package.json', JSON.stringify(pkg, null, 2) + '\n');

await replace('src/app.html', '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n\t\t<title>open3dFloorplan</title>', '<link rel="icon" type="image/svg+xml" href="/nexo-space-ai.svg" />\n\t\t<meta name="theme-color" content="#171511" />\n\t\t<meta name="description" content="NEXO SPACE AI — diseño arquitectónico e interiorismo 2D/3D asistido por IA." />\n\t\t<title>NEXO SPACE AI</title>');

await replace('src/routes/+page.svelte', '<div class="min-h-screen bg-gray-50">', '<div class="min-h-screen bg-[#f3efe7] text-[#26231f]">');
await replace('src/routes/+page.svelte', '<div class="bg-gradient-to-r from-slate-800 to-slate-700 shadow-sm">', '<div class="bg-[#171511] shadow-sm border-b border-white/10">');
await replace('src/routes/+page.svelte', `<div>\n        <h1 class="text-2xl font-bold text-white">{$t('library.title')}</h1>\n        <p class="text-sm text-white/50 mt-0.5">{loading ? $t('library.loading') : $t(projects.length === 1 ? 'library.countOne' : 'library.countMany', { count: projects.length })}</p>\n      </div>`, `<div class="flex items-center gap-4">\n        <div class="w-11 h-11 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center text-[#d7bd8b] font-semibold tracking-[0.18em]">NX</div>\n        <div>\n          <p class="text-[10px] uppercase tracking-[0.34em] text-[#d7bd8b]">NEXO STUDIO · DESIGN OS</p>\n          <h1 class="text-2xl font-semibold tracking-tight text-white">NEXO SPACE AI</h1>\n          <p class="text-sm text-white/45 mt-0.5">{loading ? 'Cargando proyectos…' : $t(projects.length === 1 ? 'library.countOne' : 'library.countMany', { count: projects.length })}</p>\n        </div>\n      </div>`);
await replace('src/routes/+page.svelte', 'bg-blue-500 text-white rounded-lg hover:bg-blue-600', 'bg-[#c5a675] text-[#171511] rounded-lg hover:bg-[#d7bd8b]');
await replace('src/routes/+page.svelte', 'shadow-blue-500/25', 'shadow-black/20');
await replace('src/routes/+page.svelte', 'hover:shadow-blue-500/40', 'hover:shadow-black/30');
await replace('src/routes/+page.svelte', 'text-blue-600 underline', 'text-[#7b6240] underline', false);
await replace('src/routes/+page.svelte', 'bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold', 'bg-[#c5a675] text-[#171511] rounded-lg hover:bg-[#d7bd8b] font-semibold', false);

await replace('src/lib/utils/export.ts', "pdf.text('openplan3d.com', col2 + 4, tbY + 9);", "pdf.text('NEXO SPACE AI', col2 + 4, tbY + 9);");
await replace('src/lib/utils/export.ts', "pdf.text('Created with Open 3D Floor Planner', col2 + 4, tbY + 15);", "pdf.text('NEXO STUDIO · Architecture & Interior Design', col2 + 4, tbY + 15);");
await replace('src/routes/render-lab/+page.svelte', '<svelte:head><title>Render lab · OpenPlan3D</title>', '<svelte:head><title>Render Lab · NEXO SPACE AI</title>', false);
await replace('src/routes/render-lab/+page.svelte', '<span class="mark">◈</span> OpenPlan3D', '<span class="mark">◈</span> NEXO SPACE AI', false);

await write('src/lib/nexo/brand.ts', `export const NEXO_BRAND = {\n  product: 'NEXO SPACE AI',\n  studio: 'NEXO STUDIO',\n  tagline: 'Architecture & Interior Design OS',\n  colors: { ink: '#171511', ivory: '#f3efe7', sand: '#c5a675', gold: '#d7bd8b' }\n} as const;\n`);
await write('static/nexo-space-ai.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#171511"/><path d="M16 44V20h5l22 24h5V20" fill="none" stroke="#d7bd8b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>\n`);
await write('src/lib/nexo/features.ts', `export const NEXO_FEATURES = {\n  corePlanner: true,\n  localProjects: true,\n  aiRender: true,\n  cloudProjects: false,\n  temploLibrary: false,\n  designCopilot: false,\n  clientPortal: false\n} as const;\n`);\n\nawait write('src/routes/api/nexo/status/+server.ts', `import { json } from '@sveltejs/kit';\nimport { NEXO_BRAND } from '$lib/nexo/brand';\nimport { NEXO_FEATURES } from '$lib/nexo/features';\n\nexport const prerender = false;\n\nexport function GET() {\n  return json({\n    status: 'ok',\n    product: NEXO_BRAND.product,\n    studio: NEXO_BRAND.studio,\n    version: '0.1.0',\n    core: 'OpenPlan3D',\n    features: NEXO_FEATURES\n  });\n}\n`);\n\nawait write('NEXO_UPSTREAM.md', `# NEXO SPACE AI upstream strategy\n\nCore upstream: https://github.com/laanlabs/openPlan3D\n\nThe project intentionally preserves OpenPlan3D file/package schema identifiers so existing project data remains compatible. NEXO-specific product code should prefer the \`src/lib/nexo\` namespace and the \`.nexo\` automation layer.\n\nDo not replace upstream copyright/license notices when syncing.\n`);

console.log('NEXO overlay applied successfully.');
