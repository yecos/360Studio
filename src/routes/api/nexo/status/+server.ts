import { json } from '@sveltejs/kit';
import { NEXO_BRAND } from '$lib/nexo/brand';
import { NEXO_FEATURES } from '$lib/nexo/features';

export const prerender = false;

export function GET() {
  return json({
    status: 'ok',
    product: NEXO_BRAND.product,
    studio: NEXO_BRAND.studio,
    version: '0.2.0',
    core: 'OpenPlan3D',
    copilot: { mode: 'hybrid', structuredActions: true, provider: 'openai-compatible' },
    features: NEXO_FEATURES
  });
}
