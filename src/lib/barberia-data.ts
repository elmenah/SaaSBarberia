/**
 * Fuente única de verdad para los servicios de la barbería.
 * El dueño los gestiona en /dashboard/servicios
 * y tanto los barberos como el booking público los consumen desde acá.
 */
export const SERVICIOS = [
  { id: "corte",       name: "Corte clásico",           category: "Cortes",   price: 8000,  durationMins: 30, icon: "✂️" },
  { id: "degradado",   name: "Corte degradé",            category: "Cortes",   price: 10000, durationMins: 45, icon: "✨" },
  { id: "corte_barba", name: "Corte + Barba",            category: "Combos",   price: 14000, durationMins: 60, icon: "💈" },
  { id: "barba",       name: "Barba perfilada",          category: "Barba",    price: 6000,  durationMins: 30, icon: "🪒" },
  { id: "barba_comp",  name: "Barba completa",           category: "Barba",    price: 8000,  durationMins: 40, icon: "🪒" },
  { id: "combo_full",  name: "Corte + Barba + Cejas",    category: "Combos",   price: 18000, durationMins: 75, icon: "💈" },
  { id: "keratina",    name: "Tratamiento de keratina",  category: "Cuidado",  price: 22000, durationMins: 60, icon: "💆" },
  { id: "cejas",       name: "Diseño de cejas",          category: "Cuidado",  price: 4000,  durationMins: 15, icon: "🎨" },
];

export type Servicio = (typeof SERVICIOS)[0];
