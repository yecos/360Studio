<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { Floor, FurnitureItem, Project } from '$lib/models/types';
  import { activeFloor, currentProject, selectedElementId, updateFurniture } from '$lib/stores/project';
  import { openAISettings, type OpenAISettings } from '$lib/stores/aiKeys';
  import { TEMPLO_MATERIALS } from '$lib/nexo/materials';
  import { parseDesignCommand, type NexoDesignAction } from '$lib/nexo/designCommands';
  import { generateNexoCopilotPlan, type NexoCopilotPlan } from '$lib/nexo/copilotProvider';

  let floor = $state<Floor | null>(null);
  let project = $state<Project | null>(null);
  let selectedId = $state<string | null>(null);
  let aiSettings = $state<OpenAISettings>({ apiKey: '', baseUrl: '', model: '' });
  let open = $state(false);
  let prompt = $state('');
  let feedback = $state('');
  let warnings = $state<string[]>([]);
  let feedbackKind = $state<'idle' | 'ok' | 'error'>('idle');
  let busy = $state(false);
  let requestController: AbortController | null = null;

  onDestroy(activeFloor.subscribe((value) => { floor = value; }));
  onDestroy(currentProject.subscribe((value) => { project = value; }));
  onDestroy(selectedElementId.subscribe((value) => { selectedId = value; }));
  onDestroy(openAISettings.subscribe((value) => { aiSettings = value; }));
  onDestroy(() => requestController?.abort());

  const furniture = $derived(floor?.furniture?.find((item) => item.id === selectedId) ?? null);
  const canRun = $derived((floor?.furniture?.length ?? 0) > 0);
  const aiConfigured = $derived(!!(aiSettings.apiKey.trim() || aiSettings.baseUrl.trim()));

  function isComplexRequest(value: string): boolean {
    const text = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return text.length > 90 || /\b(disena|diseñar|estilo|optimiza|recomienda|propone|propuesta|ambiente|sala|habitacion|espacio|circulacion|conserva|todos|varios|combina|paleta|lujo|contemporaneo|minimalista|industrial|moderno|clasico|coherente|calido|calida)\b/.test(text);
  }

  function applyLocalActions(actions: NexoDesignAction[]): string[] {
    if (!furniture) return [];
    if (furniture.locked) throw new Error('El mueble seleccionado está bloqueado.');

    const updates: Partial<FurnitureItem> = {};
    let details = { ...furniture.details };
    const messages: string[] = [];

    for (const action of actions) {
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
        updates.rotation = (updates.rotation ?? furniture.rotation) + action.degrees;
        messages.push(`rotación ${action.degrees > 0 ? '+' : ''}${action.degrees}°`);
      }
    }

    updates.details = details;
    updateFurniture(furniture.id, updates);
    return messages;
  }

  function applyAIPlan(plan: NexoCopilotPlan): number {
    if (!floor) return 0;
    const grouped = new Map<string, Partial<FurnitureItem>>();

    for (const action of plan.actions) {
      const item = floor.furniture.find((entry) => entry.id === action.targetId);
      if (!item || item.locked) continue;
      const updates = grouped.get(item.id) ?? {};
      const currentDetails = (updates.details as FurnitureItem['details']) ?? item.details ?? {};

      if (action.type === 'apply-material' && action.materialId) {
        const material = TEMPLO_MATERIALS.find((entry) => entry.id === action.materialId);
        if (!material) continue;
        updates.color = material.color;
        updates.material = material.rendererFinish;
        updates.details = { ...currentDetails, material: `${material.brand} · ${material.reference}` };
      } else if (action.type === 'clear-material') {
        updates.color = undefined;
        updates.material = undefined;
        updates.details = { ...currentDetails, material: null };
      } else if (action.type === 'set-dimension' && action.axis && action.valueCm !== null) {
        updates[action.axis] = action.valueCm;
      } else if (action.type === 'rotate-by' && action.degrees !== null) {
        updates.rotation = (updates.rotation ?? item.rotation) + action.degrees;
      } else if (action.type === 'set-color' && action.color) {
        updates.color = action.color;
      }
      grouped.set(item.id, updates);
    }

    for (const [id, updates] of grouped) updateFurniture(id, updates);
    return grouped.size;
  }

  async function applyCommand() {
    const text = prompt.trim();
    if (!text || busy) return;
    warnings = [];

    if (!floor || !project || !canRun) {
      feedback = 'Agrega al menos un mueble al piso antes de usar el Copilot.';
      feedbackKind = 'error';
      return;
    }

    const local = parseDesignCommand(text);
    const complex = isComplexRequest(text);

    if (local.understood && !complex && furniture) {
      try {
        const messages = applyLocalActions(local.actions);
        feedback = `Aplicado localmente: ${messages.join(' · ')}`;
        feedbackKind = 'ok';
        prompt = '';
      } catch (error) {
        feedback = error instanceof Error ? error.message : 'No se pudo aplicar la acción.';
        feedbackKind = 'error';
      }
      return;
    }

    if (!aiConfigured) {
      if (local.understood && furniture) {
        try {
          const messages = applyLocalActions(local.actions);
          feedback = `Apliqué la parte local: ${messages.join(' · ')}. Configura Settings → AI para interpretar el resto de la instrucción.`;
          feedbackKind = 'ok';
          prompt = '';
        } catch (error) {
          feedback = error instanceof Error ? error.message : 'No se pudo aplicar la acción.';
          feedbackKind = 'error';
        }
      } else {
        feedback = 'Este comando necesita IA. Configura un proveedor en Settings → AI y vuelve a intentarlo.';
        feedbackKind = 'error';
      }
      return;
    }

    busy = true;
    feedback = 'Analizando el proyecto y preparando acciones…';
    feedbackKind = 'idle';
    requestController = new AbortController();

    try {
      const plan = await generateNexoCopilotPlan(
        aiSettings,
        text,
        { project, floor, selectedId },
        fetch,
        requestController.signal
      );
      const changed = applyAIPlan(plan);
      warnings = plan.warnings;
      feedback = changed
        ? `${plan.summary} · Aplicado a ${changed} ${changed === 1 ? 'mueble' : 'muebles'}.`
        : plan.summary || 'La IA no encontró cambios seguros que aplicar.';
      feedbackKind = 'ok';
      prompt = '';
    } catch (error) {
      feedback = error instanceof Error ? error.message : 'No se pudo procesar la instrucción con IA.';
      feedbackKind = 'error';
    } finally {
      busy = false;
      requestController = null;
    }
  }

  function cancelRequest() {
    requestController?.abort();
  }

  function useExample(value: string) {
    prompt = value;
    open = true;
    feedback = '';
    warnings = [];
    feedbackKind = 'idle';
  }
</script>

<div class="pointer-events-none absolute left-1/2 top-4 z-30 w-[min(44rem,calc(100%-2rem))] -translate-x-1/2">
  <div class="pointer-events-auto overflow-hidden rounded-2xl border border-black/10 bg-white/94 shadow-[0_18px_50px_rgba(24,20,15,0.18)] backdrop-blur-xl">
    <button
      class="flex w-full items-center gap-3 px-4 py-3 text-left"
      onclick={() => open = !open}
      aria-expanded={open}
    >
      <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#171511] text-[#d7bd8b]">✦</span>
      <span class="min-w-0 flex-1">
        <span class="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8b6e48]">NEXO Copilot · Beta</span>
        <span class="block truncate text-sm font-medium text-[#2b2823]">
          {furniture ? 'Edita el mueble seleccionado o el piso actual' : canRun ? 'Edita los muebles del piso actual' : 'Agrega un mueble para comenzar'}
        </span>
      </span>
      <span class="rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] {aiConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-[#eee8dd] text-[#7d6b52]'}">
        {aiConfigured ? (aiSettings.model || 'AI provider') : 'Local'}
      </span>
    </button>

    {#if open}
      <div class="border-t border-black/8 p-3">
        <div class="flex gap-2">
          <input
            bind:value={prompt}
            disabled={!canRun || busy}
            onkeydown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void applyCommand(); } }}
            placeholder={canRun ? 'Ej: Haz la sala más cálida usando Fresno Europeo y Capri, conserva la circulación' : 'Agrega un mueble al piso'}
            class="min-w-0 flex-1 rounded-xl border border-black/10 bg-[#faf8f3] px-4 py-3 text-sm outline-none transition focus:border-[#b39365] focus:ring-4 focus:ring-[#c5a675]/10 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {#if busy}
            <button
              onclick={cancelRequest}
              class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >Cancelar</button>
          {:else}
            <button
              onclick={() => void applyCommand()}
              disabled={!canRun || !prompt.trim()}
              class="rounded-xl bg-[#171511] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2b2823] disabled:cursor-not-allowed disabled:opacity-35"
            >Aplicar</button>
          {/if}
        </div>

        <div class="mt-2 flex flex-wrap gap-1.5">
          {#each ['Fresno Europeo', 'Capri ancho 180 cm', 'gira 90°', 'Haz la sala más cálida usando Fresno Europeo y Capri, conserva la circulación'] as example}
            <button onclick={() => useExample(example)} disabled={busy} class="rounded-full border border-black/8 bg-[#f4efe6] px-2.5 py-1 text-[10px] text-[#746a5d] hover:bg-[#ece3d4] disabled:opacity-40">{example}</button>
          {/each}
        </div>

        {#if feedback}
          <p class="mt-2 rounded-lg px-3 py-2 text-xs {feedbackKind === 'ok' ? 'bg-emerald-50 text-emerald-700' : feedbackKind === 'error' ? 'bg-amber-50 text-amber-800' : 'bg-[#f4efe6] text-[#746a5d]'}">{feedback}</p>
        {/if}

        {#if warnings.length}
          <div class="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800">Límites detectados</p>
            {#each warnings as warning}
              <p class="mt-1 text-xs leading-5 text-amber-800">• {warning}</p>
            {/each}
          </div>
        {/if}

        <div class="mt-2 flex items-center justify-between gap-3 text-[10px] leading-4 text-[#9a9185]">
          <span>Comandos simples se resuelven localmente. Las solicitudes de diseño usan tu proveedor de Settings → AI.</span>
          <span class="shrink-0">{floor?.furniture?.length ?? 0} muebles</span>
        </div>
      </div>
    {/if}
  </div>
</div>
