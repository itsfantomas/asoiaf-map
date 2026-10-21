import React, { useMemo, useState } from 'react';
import {
  Castle,
  Compass,
  Layers,
  Map as MapIcon,
  Maximize2,
  Minus,
  Mountain,
  Plus,
  Route,
  Search,
  Shield,
  X,
} from 'lucide-react';
import { LANDMARKS, MIGRATION_ROUTES, REGIONS } from '../data/worldAtlasData';
import { LayerFilterId, SelectedEntity } from '../types/atlas';

interface AtlasControlsProps {
  activeLayers: Record<LayerFilterId, boolean>;
  onToggleLayer: (layer: LayerFilterId) => void;
  activeMigrationId: string | 'all';
  onSelectMigrationFilter: (id: string | 'all') => void;
  onSelectEntity: (entity: SelectedEntity) => void;
  onFocusRegionPreset: (preset: 'world' | 'westeros' | 'essos' | 'south') => void;
  onZoomStep: (delta: number) => void;
  currentScale: number;
  hasOpenDrawer: boolean;
}

interface SearchEntry {
  key: string;
  title: string;
  subtitle: string;
  badge: string;
  entity: SelectedEntity;
}

export const AtlasControls: React.FC<AtlasControlsProps> = ({
  activeLayers,
  onToggleLayer,
  activeMigrationId,
  onSelectMigrationFilter,
  onSelectEntity,
  onFocusRegionPreset,
  onZoomStep,
  currentScale,
  hasOpenDrawer,
}) => {
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const searchIndex = useMemo<SearchEntry[]>(() => {
    const regionItems: SearchEntry[] = REGIONS.map((r) => ({
      key: `reg-${r.id}`,
      title: r.name,
      subtitle: r.house ? `${r.house.name} · ${r.capital}` : r.capital,
      badge: 'Земля',
      entity: { type: 'region', id: r.id },
    }));

    const landmarkItems: SearchEntry[] = LANDMARKS.map((l) => ({
      key: `lm-${l.id}`,
      title: l.name,
      subtitle: l.subtitle,
      badge: l.categoryLabel,
      entity: { type: 'landmark', id: l.id },
    }));

    const migrationItems: SearchEntry[] = MIGRATION_ROUTES.map((m) => ({
      key: `mig-${m.id}`,
      title: m.name,
      subtitle: m.era,
      badge: 'Миграция',
      entity: { type: 'migration', id: m.id },
    }));

    return [...regionItems, ...landmarkItems, ...migrationItems];
  }, []);

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchIndex
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, searchIndex]);

  const filterButtons: Array<{
    id: LayerFilterId;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'regions',
      label: 'Земли',
      shortLabel: 'Земли',
      icon: <MapIcon className="h-3.5 w-3.5" />,
    },
    {
      id: 'landmarks',
      label: 'Крепости и города',
      shortLabel: 'Города',
      icon: <Castle className="h-3.5 w-3.5" />,
    },
    {
      id: 'houses',
      label: 'Великие дома',
      shortLabel: 'Дома',
      icon: <Shield className="h-3.5 w-3.5" />,
    },
    {
      id: 'migrations',
      label: 'Пути миграции',
      shortLabel: 'Миграции',
      icon: <Route className="h-3.5 w-3.5" />,
    },
    {
      id: 'geography',
      label: 'География',
      shortLabel: 'Рельеф',
      icon: <Mountain className="h-3.5 w-3.5" />,
    },
  ];

  // Dynamic scale calculation: roughly 1px at 1.0 world units ~ 2.4 leagues
  const scaleBarLeagues = Math.max(
    50,
    Math.round((240 / Math.max(0.35, currentScale)) / 50) * 50
  );

  return (
    <>
      {/* TOP-LEFT COMPACT HEADER + SEARCH + CONTINENT PRESETS */}
      <div className="fixed top-3 left-3 right-3 sm:right-auto sm:w-[372px] z-30 flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto rounded-2xl border border-[#D6C6B0] bg-[#F4ECE1]/92 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#8C2318] text-[#FAF5EC] shadow-sm">
                <Compass className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h1 className="font-chronicle text-lg sm:text-[20px] font-bold leading-none text-[#2A211B] truncate">
                  Известный Мир ПЛИО
                </h1>
                <p className="text-[11px] text-[#68584B] truncate mt-0.5">
                  Атлас земель, твердынь и миграций Дж. Мартина
                </p>
              </div>
            </div>

            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((v) => !v)}
              className="sm:hidden inline-flex items-center gap-1 rounded-xl border border-[#D6C6B0] bg-[#EFE4D4] px-2.5 py-1.5 text-xs font-medium text-[#2A211B]"
            >
              <Layers className="h-3.5 w-3.5 text-[#8C2318]" />
              <span>Слои</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mt-2.5">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#68584B]" />
            <input
              type="text"
              value={query}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 180)}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Найти землю, замок, дом или маршрут…"
              className="w-full rounded-xl border border-[#D6C6B0] bg-[#FAF6EE] pl-8 pr-7 py-1.5 text-xs text-[#2A211B] placeholder:text-[#8A7A6B] focus:border-[#8C2318] focus:outline-none transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Очистить поиск"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#68584B] hover:text-[#2A211B]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Dropdown Search Results */}
            {searchFocused && filteredResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-[#D6C6B0] bg-[#FAF6EE] py-1 shadow-xl z-50 max-h-64 overflow-y-auto">
                {filteredResults.map((res) => (
                  <button
                    key={res.key}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelectEntity(res.entity);
                      setQuery('');
                      setSearchFocused(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#EFE4D4] transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#2A211B] truncate">
                        {res.title}
                      </div>
                      <div className="text-[11px] text-[#68584B] truncate">
                        {res.subtitle}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#EFE4D4] border border-[#D6C6B0] px-2 py-0.5 text-[10px] font-medium text-[#8C2318]">
                      {res.badge}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Continent Jump Strip */}
          <div className="mt-2 flex items-center gap-1 overflow-x-auto">
            {(
              [
                { id: 'world', label: 'Весь мир' },
                { id: 'westeros', label: 'Вестерос' },
                { id: 'essos', label: 'Эссос' },
                { id: 'south', label: 'Южные моря' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onFocusRegionPreset(preset.id)}
                className="rounded-lg border border-[#DFD2BE] bg-[#EFE4D4]/75 px-2.5 py-1 text-[11px] font-medium text-[#3D3129] hover:border-[#8C2318] hover:text-[#8C2318] transition-colors whitespace-nowrap cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FLOATING FILTER DOCK (Desktop bottom-left / Mobile collapsible sheet) */}
      <div
        className={`fixed left-3 right-3 sm:right-auto bottom-3 z-30 flex flex-col gap-2 transition-all duration-200 ${
          hasOpenDrawer ? 'hidden lg:flex' : 'flex'
        } ${mobileFiltersOpen ? 'flex' : 'hidden sm:flex'}`}
      >
        {/* Historical Migration Sub-Selector when Migrations Layer is Active */}
        {activeLayers.migrations && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#D6C6B0] bg-[#F4ECE1]/95 px-3 py-2 shadow-lg backdrop-blur-md max-w-[680px]">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#68584B] mr-1">
              Хроника пути:
            </span>
            <button
              type="button"
              onClick={() => onSelectMigrationFilter('all')}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                activeMigrationId === 'all'
                  ? 'bg-[#2A211B] text-[#FAF5EC]'
                  : 'bg-[#EFE4D4] text-[#2A211B] hover:bg-[#E5D6C0]'
              }`}
            >
              Все 5 волн
            </button>
            {MIGRATION_ROUTES.map((route) => {
              const isSelected = activeMigrationId === route.id;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => {
                    onSelectMigrationFilter(route.id);
                    onSelectEntity({ type: 'migration', id: route.id });
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? 'text-[#FAF5EC] border-transparent shadow-sm'
                      : 'bg-[#FAF6EE] text-[#2A211B] border-[#D6C6B0] hover:border-[#8C2318]'
                  }`}
                  style={isSelected ? { backgroundColor: route.color } : undefined}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: isSelected ? '#FAF5EC' : route.color,
                    }}
                  />
                  <span>{route.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Primary 5 Layer Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#D6C6B0] bg-[#F4ECE1]/94 p-1.5 shadow-lg backdrop-blur-md">
          {filterButtons.map((btn) => {
            const active = activeLayers[btn.id];
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => onToggleLayer(btn.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-[#8C2318] text-[#FAF5EC] shadow-xs'
                    : 'bg-transparent text-[#5A4B3E] hover:bg-[#EFE4D4]'
                }`}
              >
                {btn.icon}
                <span className="hidden md:inline">{btn.label}</span>
                <span className="md:hidden">{btn.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM-RIGHT ZOOM CONTROLS & DYNAMIC LEAGUE SCALE */}
      <div
        className={`fixed bottom-3 z-30 flex items-end gap-2.5 transition-all duration-300 ${
          hasOpenDrawer
            ? 'hidden lg:flex lg:right-[424px]'
            : 'right-3 flex'
        }`}
      >
        {/* League Scale Indicator */}
        <div className="hidden sm:flex flex-col items-end rounded-xl border border-[#D6C6B0] bg-[#F4ECE1]/90 px-3 py-1.5 backdrop-blur-sm shadow">
          <span className="text-[10px] font-medium text-[#68584B]">
            ~ {scaleBarLeagues} лиг
          </span>
          <div className="mt-1 h-1.5 w-20 border-x-2 border-b-2 border-[#2A211B]" />
        </div>

        {/* + / - / Reset Stack */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#D6C6B0] bg-[#F4ECE1]/95 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => onZoomStep(1)}
            title="Приблизить карту"
            aria-label="Приблизить карту"
            className="flex h-9 w-9 items-center justify-center text-[#2A211B] hover:bg-[#EFE4D4] hover:text-[#8C2318] transition-colors border-b border-[#DFD2BE] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onZoomStep(-1)}
            title="Отдалить карту"
            aria-label="Отдалить карту"
            className="flex h-9 w-9 items-center justify-center text-[#2A211B] hover:bg-[#EFE4D4] hover:text-[#8C2318] transition-colors border-b border-[#DFD2BE] cursor-pointer"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onFocusRegionPreset('world')}
            title="Показать весь Известный Мир"
            aria-label="Показать весь Известный Мир"
            className="flex h-9 w-9 items-center justify-center text-[#2A211B] hover:bg-[#EFE4D4] hover:text-[#8C2318] transition-colors cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
};
