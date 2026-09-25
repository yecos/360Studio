<script lang="ts">
  import { base } from '$app/paths';
  import { onDestroy } from 'svelte';
  import type { Floor } from '$lib/models/types';
  import { activeFloor, selectedElementId, updateFurniture } from '$lib/stores/project';
  import { TEMPLO_MATERIALS, type NexoMaterial } from '$lib/nexo/materials';

  let floor = $state<Floor | null>(null);
  let selectedId = $state<string | null>(null);
  let expanded = $state(false);

  onDestroy(activeFloor.subscribe((value) => { floor = value; }));
  onDestroy(selectedElementId.subscribe((value) => { selectedId = value; }));

  const furniture = $derived(floor?.furniture?.find((item) => item.id === selectedId) ?? null);
  const activeMaterial = $derived(
    furniture?.details?.material
      ? TEMPLO_MATERIALS.find((item) => `${item.brand} · ${item.reference}` === furniture?.details?.material) ?? null
      : null
  );

  function apply(material: NexoMaterial) {
    if (!furniture) return;
    updateFurniture(furniture.id, {
      color: material.color,
      material: material.rendererFinish,
      details: {
        ...furniture.details,
        material: `${material.brand} · ${material.reference}`
      }
    });
  }

  function clearMaterial() {
    if (!furniture) return;
    updateFurniture(furniture.id, {
      color: undefined,
      material: undefined,
      details: { ...furniture.details, material: null }
    });
  }
</script>

{#if furniture}
  <aside class="absolute bottom-4 right-4 z-30 w-[min(22rem,calc(100%-2rem))] overflow-hidden rounded-2xl border border-black/10 bg-[#171511]/95 text-white shadow-2xl backdrop-blur-xl">
    <button
      class="flex w-full items-center gap-3 px-4 py-3 text-left"
      onclick={() => expanded = !expanded}
      aria-expanded={expanded}
    >
      <span class="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d7bd8b]/25 bg-[#d7bd8b]/10 text-[#d7bd8b] text-xs font-bold">T</span>
      <span class="min-w-0 flex-1">
        <span class="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d7bd8b]">TEMPLO Material</span>
        <span class="block truncate text-sm font-medium text-white/90">{activeMaterial ? `${activeMaterial.brand} · ${activeMaterial.name}` : 'Asignar acabado al mueble'}</span>
      </span>
      <span class="text-white/45">{expanded ? '−' : '+'}</span>
    </button>

    {#if expanded}
      <div class="border-t border-white/10 p-3">
        <div class="grid grid-cols-3 gap-2">
          {#each TEMPLO_MATERIALS as material}
            <button
              class="overflow-hidden rounded-xl border text-left transition {activeMaterial?.id === material.id ? 'border-[#d7bd8b] ring-2 ring-[#d7bd8b]/20' : 'border-white/10 hover:border-white/25'}"
              onclick={() => apply(material)}
              title={`${material.brand} · ${material.reference}`}
            >
              <span class="block h-12" style:background={material.swatch}></span>
              <span class="block bg-white/5 px-2 py-2">
                <span class="block truncate text-[10px] font-semibold">{material.name}</span>
                <span class="mt-0.5 block truncate text-[9px] text-white/45">{material.brand}</span>
              </span>
            </button>
          {/each}
        </div>

        <div class="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
          <button onclick={clearMaterial} class="text-xs text-white/45 underline hover:text-white/75">Restaurar original</button>
          <a href={`${base}/templo-library`} class="rounded-lg bg-[#d7bd8b] px-3 py-2 text-xs font-semibold text-[#171511] hover:bg-[#e3cfaa]">Abrir biblioteca</a>
        </div>
      </div>
    {/if}
  </aside>
{/if}
