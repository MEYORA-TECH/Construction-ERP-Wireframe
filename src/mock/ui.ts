import { create } from 'zustand';

export const COMPANIES = [
  { id: 'sterling', name: 'Sterling Constructions Pvt Ltd', city: 'Chennai · Head Office' },
  { id: 'sterling-infra', name: 'Sterling Infra Projects Ltd', city: 'Bengaluru · Regional Office' },
  { id: 'sterling-realty', name: 'Sterling Realty LLP', city: 'Hyderabad · Regional Office' },
];

export const ROLES = ['Project Manager', 'Managing Director', 'Finance Controller', 'Site Engineer', 'Procurement Manager'];

interface UiState {
  company: string;
  role: string;
  sidebarCollapsed: boolean;
  recentApps: string[];
  setCompany(id: string): void;
  setRole(role: string): void;
  toggleSidebar(): void;
  touchApp(id: string): void;
}

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable — per-viewer convenience only */
  }
}

export const useUi = create<UiState>((set, get) => ({
  company: load('erp.company', 'sterling'),
  role: load('erp.role', 'Project Manager'),
  sidebarCollapsed: load('erp.sidebar', false),
  recentApps: load('erp.recent', ['project', 'procurement', 'site', 'billing', 'finance']),
  setCompany(id) {
    save('erp.company', id);
    set({ company: id });
  },
  setRole(role) {
    save('erp.role', role);
    set({ role });
  },
  toggleSidebar() {
    const v = !get().sidebarCollapsed;
    save('erp.sidebar', v);
    set({ sidebarCollapsed: v });
  },
  touchApp(id) {
    const list = [id, ...get().recentApps.filter((a) => a !== id)].slice(0, 5);
    save('erp.recent', list);
    set({ recentApps: list });
  },
}));
