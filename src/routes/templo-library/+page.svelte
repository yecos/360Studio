<script lang="ts">
  import { base } from '$app/paths';
  import { MATERIAL_CATEGORIES, TEMPLO_MATERIALS } from '$lib/nexo/materials';

  let query = $state('');
  let category = $state<(typeof MATERIAL_CATEGORIES)[number]>('Todos');
  let favorites = $state<string[]>([]);

  const filtered = $derived(
    TEMPLO_MATERIALS.filter((material) => {
      const matchesCategory = category === 'Todos' || material.category === category;
      const needle = query.trim().toLowerCase();
      const matchesQuery = !needle || [material.name, material.brand, material.reference, material.category, material.finish, material.tone, ...material.tags]
        .some((value) => value.toLowerCase().includes(needle));
      return matchesCategory && matchesQuery;
    })
  );

  function toggleFavorite(id: string) {
    favorites = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
  }
</script>

<svelte:head>
  <title>Biblioteca TEMPLO · NEXO SPACE AI</title>
  <meta name="description" content="Biblioteca de materiales de TEMPLO integrada a NEXO SPACE AI." />
</svelte:head>

<div class="min-h-screen bg-[#f3efe7] text-[#211f1b]">
  <header class="sticky top-0 z-20 border-b border-white/10 bg-[#171511]/95 backdrop-blur-xl">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
      <div class="flex items-center gap-4">
        <a href={base || '/'} class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#d7bd8b] font-semibold">NX</a>
        <div>
          <p class="text-[10px] uppercase tracking-[0.32em] text-[#d7bd8b]">NEXO SPACE AI</p>
          <h1 class="text-lg font-semibold text-white">Biblioteca TEMPLO</h1>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="hidden rounded-full border border-[#d7bd8b]/30 bg-[#d7bd8b]/10 px-3 py-1 text-xs text-[#e3cfaa] sm:inline-flex">v0.2 · catálogo base</span>
        <a href={base || '/'} class="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white">Volver al workspace</a>
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-7xl px-6 py-10">
    <section class="grid gap-8 lg:grid-cols-[1.4fr_.6fr]">
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b6e48]">Material intelligence</p>
        <h2 class="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.035em] text-[#1d1b18] sm:text-5xl">
          Materiales reales listos para entrar al flujo de diseño.
        </h2>
        <p class="mt-5 max-w-2xl text-base leading-7 text-[#6e685f]">
          Esta es la primera capa de TEMPLO dentro de NEXO SPACE AI. El siguiente paso será asignar estas referencias directamente a objetos del editor 3D, guardar paletas por proyecto y alimentar fichas técnicas y presupuestos.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3 self-end">
        <div class="rounded-2xl border border-black/8 bg-white/55 p-5 shadow-sm">
          <p class="text-3xl font-semibold">{TEMPLO_MATERIALS.length}</p>
          <p class="mt-1 text-xs uppercase tracking-[0.18em] text-[#817a70]">Materiales base</p>
        </div>
        <div class="rounded-2xl border border-black/8 bg-[#171511] p-5 text-white shadow-sm">
          <p class="text-3xl font-semibold">{favorites.length}</p>
          <p class="mt-1 text-xs uppercase tracking-[0.18em] text-white/50">Favoritos</p>
        </div>
      </div>
    </section>

    <section class="mt-10 rounded-3xl border border-black/8 bg-white/65 p-4 shadow-[0_20px_60px_rgba(54,45,32,0.06)] backdrop-blur">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label class="relative block flex-1">
          <span class="sr-only">Buscar material</span>
          <svg class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b9388]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input bind:value={query} placeholder="Buscar material, marca, acabado o uso…" class="w-full rounded-2xl border border-black/10 bg-[#faf8f3] py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#b39365] focus:ring-4 focus:ring-[#c5a675]/10" />
        </label>
        <div class="flex flex-wrap gap-2">
          {#each MATERIAL_CATEGORIES as item}
            <button
              onclick={() => category = item}
              class="rounded-xl px-3.5 py-2.5 text-xs font-semibold transition {category === item ? 'bg-[#171511] text-white' : 'bg-[#eee8dd] text-[#625c53] hover:bg-[#e4dbc9]'}"
            >{item}</button>
          {/each}
        </div>
      </div>
    </section>

    <section class="mt-7">
      <div class="mb-4 flex items-center justify-between">
        <p class="text-sm text-[#777066]">{filtered.length} referencias visibles</p>
        <p class="text-xs uppercase tracking-[0.18em] text-[#9a9185]">TEMPLO · Curated Library</p>
      </div>

      {#if filtered.length}
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {#each filtered as material}
            <article class="group overflow-hidden rounded-3xl border border-black/8 bg-[#fbfaf7] shadow-[0_18px_45px_rgba(48,39,26,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(48,39,26,0.10)]">
              <div class="relative h-44 overflow-hidden">
                <div class="absolute inset-0 scale-105 transition duration-500 group-hover:scale-100" style:background={material.swatch}></div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5"></div>
                <button
                  aria-label={favorites.includes(material.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  onclick={() => toggleFavorite(material.id)}
                  class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur-md transition hover:bg-black/35"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={favorites.includes(material.id) ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2"><path d="M12 21s-7-4.35-9.5-8.5C.5 9 2.3 5 6.2 5c2 0 3.2 1.1 3.8 2 .6-.9 1.8-2 3.8-2 3.9 0 5.7 4 3.7 7.5C19 16.65 12 21 12 21Z"/></svg>
                </button>
                <span class="absolute bottom-4 left-4 rounded-full border border-white/30 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">{material.category}</span>
              </div>

              <div class="p-5">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9b7a4c]">{material.brand}</p>
                    <h3 class="mt-1 text-xl font-semibold tracking-tight">{material.name}</h3>
                  </div>
                  <span class="rounded-lg bg-[#ede6da] px-2.5 py-1 text-[10px] font-semibold text-[#6c6255]">{material.finish}</span>
                </div>

                <dl class="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div class="rounded-xl bg-[#f3efe7] p-3">
                    <dt class="text-[10px] uppercase tracking-[0.16em] text-[#938a7d]">Referencia</dt>
                    <dd class="mt-1 font-medium text-[#39352f]">{material.reference}</dd>
                  </div>
                  <div class="rounded-xl bg-[#f3efe7] p-3">
                    <dt class="text-[10px] uppercase tracking-[0.16em] text-[#938a7d]">Tono</dt>
                    <dd class="mt-1 font-medium text-[#39352f]">{material.tone}</dd>
                  </div>
                </dl>

                <div class="mt-4 flex flex-wrap gap-1.5">
                  {#each material.tags as tag}
                    <span class="rounded-full border border-black/8 px-2.5 py-1 text-[10px] text-[#756e64]">{tag}</span>
                  {/each}
                </div>
              </div>
            </article>
          {/each}
        </div>
      {:else}
        <div class="rounded-3xl border border-dashed border-black/15 bg-white/45 py-20 text-center">
          <p class="text-lg font-medium">No encontramos materiales con ese filtro.</p>
          <button onclick={() => { query = ''; category = 'Todos'; }} class="mt-3 text-sm font-semibold text-[#8b6e48] underline">Limpiar búsqueda</button>
        </div>
      {/if}
    </section>

    <section class="mt-10 rounded-3xl bg-[#171511] p-7 text-white sm:p-9">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.26em] text-[#d7bd8b]">Siguiente integración</p>
          <h3 class="mt-2 text-2xl font-semibold">Material → objeto 3D → ficha técnica → presupuesto</h3>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-white/55">El catálogo ya tiene la estructura necesaria. La próxima iteración conectará una referencia seleccionada con el objeto activo del editor.</p>
        </div>
        <button disabled class="cursor-not-allowed rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/45">Conectar al editor · Próximamente</button>
      </div>
    </section>
  </main>
</div>
