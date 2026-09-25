import { describe, expect, it, vi } from 'vitest';
import { generateNexoCopilotPlan, validateCopilotPlan } from '../src/lib/nexo/copilotProvider';

function context(locked = false) {
  const floor = {
    id: 'floor-1',
    name: 'Sala',
    level: 0,
    rooms: [],
    walls: [],
    doors: [],
    windows: [],
    stairs: [],
    columns: [],
    guides: [],
    measurements: [],
    annotations: [],
    textAnnotations: [],
    groups: [],
    furniture: [{
      id: 'f-1',
      catalogId: 'sofa',
      position: { x: 10, y: 20 },
      rotation: 0,
      scale: { x: 1, y: 1, z: 1 },
      locked,
    }],
  };
  const project = {
    id: 'p-1',
    name: 'Proyecto',
    floors: [floor],
    activeFloorId: floor.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return { project, floor, selectedId: 'f-1' } as any;
}

describe('NEXO Copilot provider validation', () => {
  it('accepts a valid TEMPLO material action', () => {
    const result = validateCopilotPlan({
      summary: 'Aplicar acabado cálido.',
      warnings: [],
      actions: [{
        targetId: 'f-1',
        type: 'apply-material',
        materialId: 'pelikano-fresno-europeo',
        axis: null,
        valueCm: null,
        degrees: null,
        color: null,
      }],
    }, context());

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].materialId).toBe('pelikano-fresno-europeo');
  });

  it('rejects invented targets and materials', () => {
    expect(() => validateCopilotPlan({
      summary: 'Bad target',
      warnings: [],
      actions: [{
        targetId: 'invented',
        type: 'apply-material',
        materialId: 'invented-material',
        axis: null,
        valueCm: null,
        degrees: null,
        color: null,
      }],
    }, context())).toThrow(/no existe/);

    expect(() => validateCopilotPlan({
      summary: 'Bad material',
      warnings: [],
      actions: [{
        targetId: 'f-1',
        type: 'apply-material',
        materialId: 'invented-material',
        axis: null,
        valueCm: null,
        degrees: null,
        color: null,
      }],
    }, context())).toThrow(/fuera de la Biblioteca TEMPLO/);
  });

  it('rejects modifications to locked furniture', () => {
    expect(() => validateCopilotPlan({
      summary: 'Locked',
      warnings: [],
      actions: [{
        targetId: 'f-1',
        type: 'rotate-by',
        materialId: null,
        axis: null,
        valueCm: null,
        degrees: 90,
        color: null,
      }],
    }, context(true))).toThrow(/bloqueado/);
  });

  it('uses Responses structured output and validates the provider result', async () => {
    const responsePlan = {
      summary: 'Cambio seguro.',
      warnings: [],
      actions: [{
        targetId: 'f-1',
        type: 'set-dimension',
        materialId: null,
        axis: 'width',
        valueCm: 180,
        degrees: null,
        color: null,
      }],
    };
    const customFetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.text.format.type).toBe('json_schema');
      expect(body.text.format.strict).toBe(true);
      expect(body.store).toBe(false);
      return new Response(JSON.stringify({
        output: [{
          type: 'message',
          content: [{ type: 'output_text', text: JSON.stringify(responsePlan) }],
        }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    });

    const result = await generateNexoCopilotPlan(
      { baseUrl: 'https://provider.example/v1', model: 'test-model' },
      'hazlo de 180 cm',
      context(),
      customFetch as typeof fetch,
    );

    expect(result.actions[0]).toMatchObject({ type: 'set-dimension', axis: 'width', valueCm: 180 });
    expect(customFetch).toHaveBeenCalledOnce();
  });
});
