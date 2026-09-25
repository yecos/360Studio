import { readFile, writeFile, mkdir } from 'node:fs/promises';

const read = (p) => readFile(p, 'utf8');
const write = async (p, s) => {
  await mkdir(p.split('/').slice(0, -1).join('/') || '.', { recursive: true });
  await writeFile(p, s);
};

async function replace(path, from, to, required = true) {
  let source = await read(path);
  if (!source.includes(from)) {
    if (required) throw new Error('Expected marker not found in ' + path + ': ' + from.slice(0, 80));
    return false;
  }
  source = source.replace(from, to);
  await write(path, source);
  return true;
}

const pkg = JSON.parse(await read('package.json'));
pkg.name = 'nexo-space-ai';
pkg.version = '0.2.0';
pkg.description = 'NEXO SPACE AI — architecture and interior design workspace powered by an open-source 2D/3D planning core';
pkg.author = 'NEXO STUDIO';
pkg.repository = { type: 'git', url: 'https://github.com/yecos/360Studio.git' };
await write('package.json', JSON.stringify(pkg, null, 2) + '\n');

await replace(
  'src/app.html',
  '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n\t\t<title>open3dFloorplan</title>',
  '<link rel="icon" type="image/svg+xml" href="/nexo-space-ai.svg" />\n\t\t<meta name="theme-color" content="#171511" />\n\t\t<meta name="description" content="NEXO SPACE AI — diseño arquitectónico e interiorismo 2D/3D asistido por IA." />\n\t\t<title>NEXO SPACE AI</title>'
);

await replace('src/routes/+page.svelte', '<div class="min-h-screen bg-gray-50">', '<div class="min-h-screen bg-[#f3efe7] text-[#26231f]">');
await replace('src/routes/+page.svelte', '<div class="bg-gradient-to-r from-slate-800 to-slate-700 shadow-sm">', '<div class="bg-[#171511] shadow-sm border-b border-white/10">');

await replace(
  'src/routes/+page.svelte',
  [
    '      <div>',
    '        <h1 class="text-2xl font-bold text-white">{$t(\'library.title\')}</h1>',
    '        <p class="text-sm text-white/50 mt-0.5">{loading ? $t(\'library.loading\') : $t(projects.length === 1 ? \'library.countOne\' : \'library.countMany\', { count: projects.length })}</p>',
    '      </div>'
  ].join('\n'),
  [
    '      <div class="flex items-center gap-4">',
    '        <div class="w-11 h-11 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center text-[#d7bd8b] font-semibold tracking-[0.18em]">NX</div>',
    '        <div>',
    '          <p class="text-[10px] uppercase tracking-[0.34em] text-[#d7bd8b]">NEXO STUDIO · DESIGN OS</p>',
    '          <h1 class="text-2xl font-semibold tracking-tight text-white">NEXO SPACE AI</h1>',
    '          <p class="text-sm text-white/45 mt-0.5">{loading ? \'Cargando proyectos…\' : $t(projects.length === 1 ? \'library.countOne\' : \'library.countMany\', { count: projects.length })}</p>',
    '        </div>',
    '      </div>'
  ].join('\n')
);

await replace(
  'src/routes/+page.svelte',
  [
    '      <div class="flex flex-wrap items-center gap-3">',
    '        <button',
    '          onclick={() => showTemplateModal = true}'
  ].join('\n'),
  [
    '      <div class="flex flex-wrap items-center gap-3">',
    '        <a',
    '          href={`${base}/templo-library`}',
    '          class="px-4 py-2.5 bg-[#d7bd8b]/10 text-[#e5d2af] rounded-lg hover:bg-[#d7bd8b]/20 font-medium text-sm transition-all flex items-center gap-2 border border-[#d7bd8b]/25"',
    '        >',
    '          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2Z"/><path d="M8 7h6M8 11h6M8 15h4"/></svg>',
    '          Biblioteca TEMPLO',
    '        </a>',
    '        <button',
    '          onclick={() => showTemplateModal = true}'
  ].join('\n')
);

await replace('src/routes/+page.svelte', 'bg-blue-500 text-white rounded-lg hover:bg-blue-600', 'bg-[#c5a675] text-[#171511] rounded-lg hover:bg-[#d7bd8b]');
await replace('src/routes/+page.svelte', 'shadow-blue-500/25', 'shadow-black/20');
await replace('src/routes/+page.svelte', 'hover:shadow-blue-500/40', 'hover:shadow-black/30');
await replace('src/routes/+page.svelte', 'text-blue-600 underline', 'text-[#7b6240] underline', false);
await replace('src/routes/+page.svelte', 'bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold', 'bg-[#c5a675] text-[#171511] rounded-lg hover:bg-[#d7bd8b] font-semibold', false);

await replace(
  'src/routes/+page.svelte',
  [
    '  <div class="max-w-5xl mx-auto px-6 py-8">',
    '    {#if duplicating}'
  ].join('\n'),
  [
    '  <div class="max-w-5xl mx-auto px-6 pt-8">',
    '    <div class="grid gap-3 md:grid-cols-3">',
    '      <a href={`${base}/templo-library`} class="group rounded-2xl border border-black/8 bg-white/65 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">',
    '        <div class="flex items-center justify-between"><span class="rounded-xl bg-[#171511] px-3 py-2 text-xs font-semibold tracking-[0.15em] text-[#d7bd8b]">TEMPLO</span><span class="text-[#8a7659] transition group-hover:translate-x-1">→</span></div>',
    '        <h2 class="mt-5 text-lg font-semibold">Biblioteca de materiales</h2>',
    '        <p class="mt-1 text-sm leading-6 text-[#777066]">Referencias, acabados y paletas listas para el flujo de interiorismo.</p>',
    '      </a>',
    '      <div class="rounded-2xl border border-black/8 bg-white/40 p-5">',
    '        <div class="flex items-center justify-between"><span class="rounded-xl bg-[#ede5d8] px-3 py-2 text-xs font-semibold tracking-[0.15em] text-[#8b6e48]">AI</span><span class="text-[10px] uppercase tracking-[0.16em] text-[#a0988c]">Próximo</span></div>',
    '        <h2 class="mt-5 text-lg font-semibold">Design Copilot</h2>',
    '        <p class="mt-1 text-sm leading-6 text-[#8a8379]">Edición del proyecto y variantes de diseño mediante lenguaje natural.</p>',
    '      </div>',
    '      <div class="rounded-2xl border border-black/8 bg-white/40 p-5">',
    '        <div class="flex items-center justify-between"><span class="rounded-xl bg-[#ede5d8] px-3 py-2 text-xs font-semibold tracking-[0.15em] text-[#8b6e48]">CLIENT</span><span class="text-[10px] uppercase tracking-[0.16em] text-[#a0988c]">Próximo</span></div>',
    '        <h2 class="mt-5 text-lg font-semibold">Portal del cliente</h2>',
    '        <p class="mt-1 text-sm leading-6 text-[#8a8379]">Comparaciones, comentarios, aprobaciones y presentación interactiva.</p>',
    '      </div>',
    '    </div>',
    '  </div>',
    '',
    '  <div class="max-w-5xl mx-auto px-6 py-8">',
    '    {#if duplicating}'
  ].join('\n')
);

await replace(
  'src/routes/editor/+page.svelte',
  "  import PropertiesPanel from '$lib/components/sidebar/PropertiesPanel.svelte';",
  "  import PropertiesPanel from '$lib/components/sidebar/PropertiesPanel.svelte';\n  import TemploMaterialDock from '$lib/nexo/TemploMaterialDock.svelte';\n  import NexoCopilot from '$lib/nexo/NexoCopilot.svelte';"
);

await replace(
  'src/routes/editor/+page.svelte',
  [
    '        {/if}',
    '      </div>',
    '      {#if showLayers && mode === \'2d\'}'
  ].join('\n'),
  [
    '        {/if}',
    '        {#if mode === \'2d\'}',
    '          <NexoCopilot />',
    '          <TemploMaterialDock />',
    '        {/if}',
    '      </div>',
    '      {#if showLayers && mode === \'2d\'}'
  ].join('\n')
);

await replace('src/lib/utils/export.ts', "pdf.text('openplan3d.com', col2 + 4, tbY + 9);", "pdf.text('NEXO SPACE AI', col2 + 4, tbY + 9);");
await replace('src/lib/utils/export.ts', "pdf.text('Created with Open 3D Floor Planner', col2 + 4, tbY + 15);", "pdf.text('NEXO STUDIO · Architecture & Interior Design', col2 + 4, tbY + 15);");
await replace('src/routes/render-lab/+page.svelte', '<svelte:head><title>Render lab · OpenPlan3D</title>', '<svelte:head><title>Render Lab · NEXO SPACE AI</title>', false);
await replace('src/routes/render-lab/+page.svelte', '<span class="mark">◈</span> OpenPlan3D', '<span class="mark">◈</span> NEXO SPACE AI', false);

await write('src/lib/nexo/brand.ts', [
  'export const NEXO_BRAND = {',
  "  product: 'NEXO SPACE AI',",
  "  studio: 'NEXO STUDIO',",
  "  tagline: 'Architecture & Interior Design OS',",
  "  colors: { ink: '#171511', ivory: '#f3efe7', sand: '#c5a675', gold: '#d7bd8b' }",
  '} as const;',
  ''
].join('\n'));

await write('src/lib/nexo/features.ts', [
  'export const NEXO_FEATURES = {',
  '  corePlanner: true,',
  '  localProjects: true,',
  '  aiRender: true,',
  '  cloudProjects: false,',
  '  temploLibrary: true,',
  '  designCopilot: true,',
  '  clientPortal: false',
  '} as const;',
  ''
].join('\n'));

await write('src/routes/api/nexo/status/+server.ts', [
  "import { json } from '@sveltejs/kit';",
  "import { NEXO_BRAND } from '$lib/nexo/brand';",
  "import { NEXO_FEATURES } from '$lib/nexo/features';",
  '',
  'export const prerender = false;',
  '',
  'export function GET() {',
  '  return json({',
  "    status: 'ok',",
  '    product: NEXO_BRAND.product,',
  '    studio: NEXO_BRAND.studio,',
  "    version: '0.2.0',",
  "    core: 'OpenPlan3D',",
  "    copilot: { mode: 'hybrid', structuredActions: true, provider: 'openai-compatible' },",
  '    features: NEXO_FEATURES',
  '  });',
  '}',
  ''
].join('\n'));

await write('static/nexo-space-ai.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#171511"/><path d="M16 44V20h5l22 24h5V20" fill="none" stroke="#d7bd8b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>\n');

await write('NEXO_UPSTREAM.md', [
  '# NEXO SPACE AI upstream strategy',
  '',
  'Core upstream: https://github.com/laanlabs/openPlan3D',
  '',
  'The project intentionally preserves OpenPlan3D file/package schema identifiers so existing project data remains compatible.',
  'NEXO-specific product code should prefer the src/lib/nexo namespace and the .nexo automation layer.',
  '',
  'Do not replace upstream copyright/license notices when syncing.',
  ''
].join('\n'));

console.log('NEXO overlay applied successfully.');
