export type NexoMaterial = {
  id: string;
  name: string;
  brand: string;
  reference: string;
  category: 'Madera' | 'Tablero' | 'Piedra' | 'Metal' | 'Textil';
  finish: string;
  tone: string;
  swatch: string;
  tags: string[];
};

export const TEMPLO_MATERIALS: NexoMaterial[] = [
  {
    id: 'pelikano-fresno-europeo',
    name: 'Fresno Europeo',
    brand: 'Pelikano',
    reference: 'Fresno Europeo',
    category: 'Madera',
    finish: 'Veta natural',
    tone: 'Cálido claro',
    swatch: 'linear-gradient(135deg,#d9c3a1 0%,#c8aa7e 28%,#ead8bd 52%,#b89568 72%,#dbc7a6 100%)',
    tags: ['mobiliario', 'panelados', 'centros de TV']
  },
  {
    id: 'duratex-perla',
    name: 'Perla',
    brand: 'Duratex',
    reference: 'Perla',
    category: 'Tablero',
    finish: 'Mate',
    tone: 'Gris perla',
    swatch: 'linear-gradient(135deg,#deddd8,#c9c8c2 55%,#e9e8e3)',
    tags: ['mobiliario', 'neutro', 'interiores']
  },
  {
    id: 'madecor-capri',
    name: 'Capri',
    brand: 'Madecor',
    reference: 'Capri',
    category: 'Tablero',
    finish: 'Mate',
    tone: 'Beige claro',
    swatch: 'linear-gradient(135deg,#d8cbb8,#cbbca6 48%,#e6ddcf)',
    tags: ['cabeceros', 'mobiliario', 'beige']
  },
  {
    id: 'madecor-sagano',
    name: 'Ságano',
    brand: 'Madecor',
    reference: 'Ságano',
    category: 'Madera',
    finish: 'Texturizado',
    tone: 'Madera media',
    swatch: 'linear-gradient(135deg,#8b6748,#b28b64 32%,#765237 58%,#a67d58 82%,#7f5a3d)',
    tags: ['mobiliario', 'acentos', 'madera']
  },
  {
    id: 'calacatta-grey',
    name: 'Calacatta Grey',
    brand: 'TEMPLO',
    reference: 'Calacatta Grey',
    category: 'Piedra',
    finish: 'Pulido',
    tone: 'Blanco / gris',
    swatch: 'linear-gradient(135deg,#f2f0ec 0%,#d5d3d0 22%,#faf9f6 48%,#bdbdbb 50%,#ece9e4 72%,#d1cfcc 100%)',
    tags: ['cubiertas', 'piedra', 'superficies']
  },
  {
    id: 'bronce-espejo',
    name: 'Bronce Espejo',
    brand: 'TEMPLO',
    reference: 'Bronce',
    category: 'Metal',
    finish: 'Reflectivo',
    tone: 'Bronce oscuro',
    swatch: 'linear-gradient(135deg,#4d392d,#a37a58 42%,#5c4333 58%,#c09a75)',
    tags: ['bar', 'detalles', 'reflectivo']
  }
];

export const MATERIAL_CATEGORIES = ['Todos', 'Madera', 'Tablero', 'Piedra', 'Metal', 'Textil'] as const;
