import type { Floor, Project } from '$lib/models/types';
import { TEMPLO_MATERIALS } from '$lib/nexo/materials';
import { getCatalogItem } from '$lib/utils/furnitureCatalog';
import { getEffectiveModel, validateOpenAIConfig, type OpenAIConfig } from '$lib/utils/openaiClient';

export type NexoCopilotAIAction = {
  targetId: string;
  type: 'apply-material' | 'clear-material' | 'set-dimension' | 'rotate-by' | 'set-color';
  materialId: string | null;
  axis: 'width' | 'depth' | 'height' | null;
  valueCm: number | null;
  degrees: number | null;
  color: string | null;
};

export type NexoCopilotPlan = {
  summary: string;
  actions: NexoCopilotAIAction[];
  warnings: string[];
};

export type NexoCopilotContext = {
  project: Project;
  floor: Floor;
  selectedId: string | null;
};

const MAX_RESPONSE_BYTES = 1024 * 1024;
const MAX_ACTIONS = 24;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

async function readJSON(response: Response): Promise<unknown> {
  if (Number(response.headers.get('content-length')) > MAX_RESPONSE_BYTES) {
    await response.body?.cancel();
    throw new Error('La respuesta del proveedor es demasiado grande.');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('El proveedor devolvió una respuesta vacía.');
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error('La respuesta del proveedor es demasiado grande.');
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  try { return JSON.parse(text); }
  catch { throw new Error('El proveedor devolvió JSON inválido.'); }
}

function extractOutputText(data: unknown): string {
  if (!isRecord(data) || !Array.isArray(data.output)) {
    throw new Error('El proveedor no devolvió una respuesta compatible con Responses API.');
  }
  for (const item of data.output) {
    if (!isRecord(item) || item.type !== 'message' || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (isRecord(part) && part.type === 'output_text' && typeof part.text === 'string' && part.text.trim()) {
        return part.text;
      }
      if (isRecord(part) && part.type === 'refusal' && typeof part.refusal === 'string') {
        throw new Error('El proveedor rechazó la solicitud: ' + part.refusal.slice(0, 240));
      }
    }
  }
  throw new Error('El proveedor no devolvió texto estructurado.');
}

function contextPayload(context: NexoCopilotContext) {
  return {
    project: {
      name: context.project.name,
      description: context.project.description ?? '',
    },
    floor: {
      id: context.floor.id,
      name: context.floor.name,
      level: context.floor.level,
      roomCount: context.floor.rooms.length,
      rooms: context.floor.rooms.map(room => ({
        id: room.id,
        name: room.name,
        area: room.area,
        material: room.details?.material ?? null,
      })),
    },
    selectedFurnitureId: context.selectedId,
    furniture: context.floor.furniture.map(item => {
      const catalog = getCatalogItem(item.catalogId);
      return {
        id: item.id,
        name: catalog?.name ?? item.catalogId,
        category: catalog?.category ?? 'Unknown',
        selected: item.id === context.selectedId,
        widthCm: item.width ?? catalog?.width ?? null,
        depthCm: item.depth ?? catalog?.depth ?? null,
        heightCm: item.height ?? catalog?.height ?? null,
        rotationDeg: item.rotation,
        currentMaterial: item.details?.material ?? item.material ?? null,
        locked: !!item.locked,
      };
    }),
    availableMaterials: TEMPLO_MATERIALS.map(material => ({
      id: material.id,
      name: material.name,
      brand: material.brand,
      reference: material.reference,
      category: material.category,
      tone: material.tone,
      finish: material.finish,
      tags: material.tags,
    })),
  };
}

export function validateCopilotPlan(plan: unknown, context: NexoCopilotContext): NexoCopilotPlan {
  if (!isRecord(plan) || typeof plan.summary !== 'string' || !Array.isArray(plan.actions) || !Array.isArray(plan.warnings)) {
    throw new Error('El plan de IA no tiene el formato esperado.');
  }
  if (plan.actions.length > MAX_ACTIONS) throw new Error('El plan de IA contiene demasiadas acciones.');

  const furnitureIds = new Set(context.floor.furniture.map(item => item.id));
  const lockedIds = new Set(context.floor.furniture.filter(item => item.locked).map(item => item.id));
  const materialIds = new Set(TEMPLO_MATERIALS.map(material => material.id));
  const validTypes = new Set(['apply-material', 'clear-material', 'set-dimension', 'rotate-by', 'set-color']);
  const validAxes = new Set(['width', 'depth', 'height']);

  const actions: NexoCopilotAIAction[] = plan.actions.map((raw, index) => {
    if (!isRecord(raw) || typeof raw.targetId !== 'string' || !furnitureIds.has(raw.targetId)) {
      throw new Error(`La acción ${index + 1} apunta a un mueble que no existe en el piso actual.`);
    }
    if (lockedIds.has(raw.targetId)) {
      throw new Error(`La acción ${index + 1} intenta modificar un mueble bloqueado.`);
    }
    if (typeof raw.type !== 'string' || !validTypes.has(raw.type)) {
      throw new Error(`La acción ${index + 1} usa un tipo no permitido.`);
    }
    const action: NexoCopilotAIAction = {
      targetId: raw.targetId,
      type: raw.type as NexoCopilotAIAction['type'],
      materialId: typeof raw.materialId === 'string' ? raw.materialId : null,
      axis: typeof raw.axis === 'string' && validAxes.has(raw.axis) ? raw.axis as NexoCopilotAIAction['axis'] : null,
      valueCm: typeof raw.valueCm === 'number' && Number.isFinite(raw.valueCm) ? raw.valueCm : null,
      degrees: typeof raw.degrees === 'number' && Number.isFinite(raw.degrees) ? raw.degrees : null,
      color: typeof raw.color === 'string' ? raw.color : null,
    };

    if (action.type === 'apply-material' && (!action.materialId || !materialIds.has(action.materialId))) {
      throw new Error(`La acción ${index + 1} usa un material fuera de la Biblioteca TEMPLO.`);
    }
    if (action.type === 'set-dimension') {
      if (!action.axis || action.valueCm === null || action.valueCm < 1 || action.valueCm > 2000) {
        throw new Error(`La acción ${index + 1} contiene una dimensión inválida.`);
      }
    }
    if (action.type === 'rotate-by' && (action.degrees === null || Math.abs(action.degrees) > 360)) {
      throw new Error(`La acción ${index + 1} contiene una rotación inválida.`);
    }
    if (action.type === 'set-color' && (!action.color || !/^#[0-9a-f]{6}$/i.test(action.color))) {
      throw new Error(`La acción ${index + 1} contiene un color inválido.`);
    }
    return action;
  });

  return {
    summary: plan.summary.slice(0, 600),
    actions,
    warnings: plan.warnings.filter((item): item is string => typeof item === 'string').slice(0, 8).map(item => item.slice(0, 300)),
  };
}

export async function generateNexoCopilotPlan(
  config: OpenAIConfig,
  userPrompt: string,
  context: NexoCopilotContext,
  customFetch: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<NexoCopilotPlan> {
  const baseUrl = validateOpenAIConfig(config);
  const targetIds = context.floor.furniture.map(item => item.id);
  if (!targetIds.length) throw new Error('Este piso todavía no tiene muebles que el Copilot pueda modificar.');

  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['summary', 'actions', 'warnings'],
    properties: {
      summary: { type: 'string', maxLength: 600 },
      warnings: {
        type: 'array',
        maxItems: 8,
        items: { type: 'string', maxLength: 300 }
      },
      actions: {
        type: 'array',
        maxItems: MAX_ACTIONS,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['targetId', 'type', 'materialId', 'axis', 'valueCm', 'degrees', 'color'],
          properties: {
            targetId: { type: 'string', enum: targetIds },
            type: { type: 'string', enum: ['apply-material', 'clear-material', 'set-dimension', 'rotate-by', 'set-color'] },
            materialId: { type: ['string', 'null'], enum: [...TEMPLO_MATERIALS.map(material => material.id), null] },
            axis: { type: ['string', 'null'], enum: ['width', 'depth', 'height', null] },
            valueCm: { type: ['number', 'null'] },
            degrees: { type: ['number', 'null'] },
            color: { type: ['string', 'null'], pattern: '^#[0-9A-Fa-f]{6}$' },
          }
        }
      }
    }
  };

  const instructions = [
    'You are NEXO Copilot, an architecture and interior-design editing planner.',
    'Return only actions supported by the provided JSON schema.',
    'Never invent furniture IDs or material IDs.',
    'Never add, delete, move, unlock, or replace geometry.',
    'Locked furniture must not be modified; mention it in warnings instead.',
    'Preserve circulation and existing furniture positions.',
    'Use TEMPLO materials only when assigning a named material.',
    'Do not change dimensions unless the user explicitly asks for dimensions or the requested action is impossible without a dimension change.',
    'For style requests, prefer material/color changes and keep geometry untouched.',
    'If a request needs unsupported operations, put them in warnings and return only the safe supported subset.',
    'Respond in Spanish in summary and warnings.',
  ].join(' ');

  const payload = {
    request: userPrompt,
    context: contextPayload(context),
  };

  const controller = new AbortController();
  const abort = () => controller.abort();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 120_000);
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();

  try {
    const response = await customFetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(config.apiKey?.trim() ? { Authorization: `Bearer ${config.apiKey.trim()}` } : {}),
      },
      body: JSON.stringify({
        model: getEffectiveModel(config),
        store: false,
        instructions,
        input: [{ role: 'user', content: [{ type: 'input_text', text: JSON.stringify(payload) }] }],
        text: {
          format: {
            type: 'json_schema',
            name: 'nexo_copilot_plan',
            strict: true,
            schema,
          }
        },
        max_output_tokens: 3000,
      }),
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      await response.body?.cancel();
      const hint = response.status === 401 || response.status === 403
        ? 'Revisa la API key y el acceso de la cuenta.'
        : response.status === 429
          ? 'El proveedor alcanzó su límite de uso o gasto.'
          : response.status === 400 || response.status === 404 || response.status === 422
            ? 'Revisa el modelo, la URL base y que el proveedor soporte Responses API con Structured Outputs.'
            : 'Revisa el estado del proveedor.';
      throw new Error(`El proveedor respondió HTTP ${response.status}. ${hint}`);
    }

    const data = await readJSON(response);
    const rawText = extractOutputText(data);
    let parsed: unknown;
    try { parsed = JSON.parse(rawText); }
    catch { throw new Error('La IA devolvió un plan que no es JSON válido.'); }
    return validateCopilotPlan(parsed, context);
  } catch (error) {
    if (timedOut) throw new Error('El Copilot agotó el tiempo de espera. La solicitud no se reintentó automáticamente.');
    if (signal?.aborted) throw new Error('Solicitud cancelada.');
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar directamente al proveedor. Revisa URL, HTTPS, CORS y permisos de red local.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
