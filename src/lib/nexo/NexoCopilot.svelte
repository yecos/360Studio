<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { Floor, FurnitureItem } from '$lib/models/types';
  import { activeFloor, selectedElementId, updateFurniture } from '$lib/stores/project';
  import { TEMPLO_MATERIALS } from '$lib/nexo/materials';
  import { parseDesignCommand } from '$lib/nexo/designCommands';

  let floor = $state<Floor | null>(null);
  let selectedId = $state<string | null>(null);
  let open = $state(false);
  let prompt = $state('');
  let feedback = $state('');
  let feedbackKind = $state<'idle' | 'ok' | 'error'>('idle');

  onDestroy(activeFloor.subscribe((value) => { floor = value; }));
  onDestroy(selectedElementId.subscribe((value) => { selectedId = value; }));

  const furniture = $derived(floor?.furniture?.find((item) => item.id === selectedId) ?? null);

  function applyCommand() {
    const text = prompt.trim();
    if (!text) return;
    if (!furniture) {
      feedback = 'Selecciona primero un mueble en la planta.';
      feedbackKind = 'error';
      return;
    }

    const parsed = parseDesignCommand(text);
    if (!parsed.understood) {
      feedback = 'No entendí esa acción todavía. Prueba con material, ancho, fondo, altura o rotación.';
      feedbackKind = 'error';
      return;
    }

    const updates: Partial<FurnitureItem> = {};
    let details = { ...furniture.details };
    const messages: string[] = [];

    for (const action of parsed.actions) {
      if (action.type === 'apply-material') {
        const material = TEMPLO_MATERIALS.find((item) => item.id === action.materialId);
        if (!material) continue;
        updates.color = material.color;
        updates.material = material.rendererFinish;
        details = { ...details, material: `${material.brand} · ${material.reference}` };
        messages.push(material.name);
      } else if (action.type === 'clear-material') {
        updates.color = undefined;
        updates.material = undefined;
        details = { ...details, material: null };
        messages.push('material original');
      } else if (action.type === 'set-dimension') {
        updates[action.axis] = action.valueCm;
        const label = action.axis === 'width' ? 'ancho' : action.axis === 'depth' ? 'fondo' : 'altura';
        messages.push(`${label} ${Math.round(action.valueCm * 10) / 10} cm`);
      } else if (action.type === 'rotate-by') {
        updates.rotation = furniture.rotation + action.degrees;
        messages.push(`rotación ${action.degrees > 0 ? '+' : ''}${action.degrees}°`);
      }
    }

    updates.details = details;
    updateFurniture(furniture.id, updates);
    feedback = `Aplicado: ${messages.join(' · ')}`;
    feedbackKind = 'ok';
    prompt = '';
  }

  function useExample(value: string) {
    prompt = value;
    open = true;
    feedback = '';
    feedbackKind = 'idle';
  }
</script>

<div class="pointer-events-none absolute left-1/2 top-4 z-30 w-[min(40rem,calc(100%-2rem))] -translate-x-1/2">
  <div class="pointer-events-auto overflow-hidden rounded-2xl border border-black/10 bg-white/92 shadow-[0_18px_50px_rgba(24,20,15,0.18)] backdrop-blur-xl">
    <button
      class="flex w-full items-center gap-3 px-4 py-3 text-left"
      onclick={() => open = !open}
      aria-expanded={open}
    >
      <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#171511] text-[#d7bd8b]">✦</span>
      <span class="min-w-0 flex-1">
        <span class="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8b6e48]">NEXO Copilot · Beta</span>
        <span class="block truncate text-sm font-medium text-[#2b2823]">{furniture ? 'Edita el mueble seleccionado con lenguaje natural' : 'Selecciona un mueble para comenzar'}</span>
      </span>
      <span class="rounded-full bg-[#eee8dd] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#7d6b52]">Local actions</span>
    </button>

    {#if open}
      <div class="border-t border-black/8 p-3">
        <div class="flex gap-2">
          <input
            bind:value={prompt}
            disabled={!furniture}
            onkeydown={(event) => { if (event.key === 'Enter') { event.preventDefault(); applyCommand(); } }}
            placeholder={furniture ? 'Ej: Fresno Europeo, ancho 180 cm y gira 90°' : 'Selecciona un mueble en planta'}
            class="min-w-0 flex-1 rounded-xl border border-black/10 bg-[#faf8f3] px-4 py-3 text-sm outline-none transition focus:border-[#b39365] focus:ring-4 focus:ring-[#c5a675]/10 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            onclick={applyCommand}
            disabled={!furniture || !prompt.trim()}
            class="rounded-xl bg-[#171511] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2b2823] disabled:cursor-not-allowed disabled:opacity-35"
          >Aplicar</button>
        </div>

        <div class="mt-2 flex flex-wrap gap-1.5">
          {#each ['Fresno Europeo', 'Capri ancho 180 cm', 'fondo 40 cm', 'gira 90°'] as example}
            <button onclick={() => useExample(example)} class="rounded-full border border-black/8 bg-[#f4efe6] px-2.5 py-1 text-[10px] text-[#746a5d] hover:bg-[#ece3d4]">{example}</button>
          {/each}
        </div>

        {#if feedback}
          <p class="mt-2 rounded-lg px-3 py-2 text-xs {feedbackKind === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}">{feedback}</p>
        {/if}

        <p class="mt-2 text-[10px] leading-4 text-[#9a9185]">Esta beta interpreta acciones localmente. La siguiente capa usará el proveedor IA configurado en Settings → AI para comandos complejos y propuestas completas.</p>
      </div>
    {/if}
  </div>
</div>
