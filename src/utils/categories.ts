import type { Category } from '../types';

/**
 * Predefined categories for Santander Fiesta Awards.
 * Each category has an icon name from @expo/vector-icons (MaterialCommunityIcons)
 * and a color that complements the white & gold theme.
 */
export const CATEGORIES: Category[] = [
  { id: 'food',       name: 'Comida',        icon: 'silverware-fork-knife', color: '#C8A84E' },
  { id: 'transport',  name: 'Transporte',    icon: 'car',                   color: '#A68A3E' },
  { id: 'supermarket',name: 'Supermercado',  icon: 'cart',                  color: '#8B7355' },
  { id: 'shopping',   name: 'Shopping',      icon: 'shopping',              color: '#D4B96A' },
  { id: 'entertainment',name: 'Entretenimiento',icon: 'movie-open',         color: '#B8944A' },
  { id: 'health',     name: 'Salud',         icon: 'medical-bag',           color: '#9A7B4E' },
  { id: 'services',   name: 'Servicios',     icon: 'lightning-bolt',        color: '#C0953A' },
  { id: 'education',  name: 'Educación',     icon: 'book-open-variant',     color: '#A8843A' },
  { id: 'travel',     name: 'Viajes',        icon: 'airplane',              color: '#D4A84E' },
  { id: 'other',      name: 'Otros',         icon: 'dots-horizontal',       color: '#B8A87A' },
];

/** Get a category by its ID */
export function getCategory(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

/** Total of current month expenses helper */
export function getCurrentMonthLabel(): string {
  const now = new Date();
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}
