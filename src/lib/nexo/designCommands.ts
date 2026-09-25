import { TEMPLO_MATERIALS } from '$lib/nexo/materials';

export type NexoDesignAction =
  | { type: 'apply-material'; materialId: string }
  | { type: 'clear-material' }
  | { type: 'set-dimension'; axis: 'width' | 'depth' | 'height'; valueCm: number }
  | { type: 'rotate-by'; degrees: number };

export interface ParsedDesignCommand {
  actions: NexoDesignAction[];
  understood: boolean;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function cmValue(raw: string, unit?: string): number | null {
  const value = Number(raw.replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) return null;
  return unit?.toLowerCase() === 'm' ? value * 100 : value;
}

function dimensionAction(
  input: string,
  terms: string[],
  axis: 'width' | 'depth' | 'height'
): NexoDesignAction | null {
  const group = terms.join('|');
  const match = input.match(new RegExp('(?:' + group + ')\\s*(?:a|=|de)?\\s*(\\d+(?:[.,]\\d+)?)\\s*(cm|m)?\\b'));
  if (!match) return null;
  const valueCm = cmValue(match[1], match[2]);
  return valueCm ? { type: 'set-dimension', axis, valueCm } : null;
}

export function parseDesignCommand(raw: string): ParsedDesignCommand {
  const input = normalize(raw);
  const actions: NexoDesignAction[] = [];
  if (!input) return { actions, understood: false };

  if (/\b(original|restaurar|restaura|quitar material|sin material)\b/.test(input)) {
    actions.push({ type: 'clear-material' });
  } else {
    const material = TEMPLO_MATERIALS.find((item) => {
      const candidates = [item.name, item.reference, item.brand + ' ' + item.reference];
      return candidates.some((candidate) => input.includes(normalize(candidate)));
    });
    if (material) actions.push({ type: 'apply-material', materialId: material.id });
  }

  const width = dimensionAction(input, ['ancho', 'anchura', 'width'], 'width');
  const depth = dimensionAction(input, ['fondo', 'profundidad', 'depth'], 'depth');
  const height = dimensionAction(input, ['alto', 'altura', 'height'], 'height');
  if (width) actions.push(width);
  if (depth) actions.push(depth);
  if (height) actions.push(height);

  const rotation = input.match(/(?:gira|girar|rota|rotar)\s*(?:el mueble\s*)?(?:a\s*)?(-?\d+(?:[.,]\d+)?)\s*(?:°|grados?)?/);
  if (rotation) {
    const degrees = Number(rotation[1].replace(',', '.'));
    if (Number.isFinite(degrees) && degrees !== 0) actions.push({ type: 'rotate-by', degrees });
  }

  return { actions, understood: actions.length > 0 };
}
