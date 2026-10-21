import React, { useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Castle,
  Compass,
  Crown,
  Flame,
  MapPin,
  ScrollText,
  Sparkles,
  X,
} from 'lucide-react';
import { LANDMARKS, MIGRATION_ROUTES, REGIONS } from '../data/worldAtlasData';
import { SelectedEntity } from '../types/atlas';
import { HouseShieldBadge } from './HouseShieldBadge';

interface LoreDrawerProps {
  selectedEntity: SelectedEntity;
  onClose: () => void;
  onSelectEntity: (entity: SelectedEntity) => void;
  onFocusCoordinates: (x: number, y: number, scale: number) => void;
}

export const LoreDrawer: React.FC<LoreDrawerProps> = ({
  selectedEntity,
  onClose,
  onSelectEntity,
  onFocusCoordinates,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedEntity) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntity, onClose]);

  if (!selectedEntity) return null;

  const region =
    selectedEntity.type === 'region'
      ? REGIONS.find((r) => r.id === selectedEntity.id)
      : null;

  const landmark =
    selectedEntity.type === 'landmark'
      ? LANDMARKS.find((l) => l.id === selectedEntity.id)
      : null;

  const parentRegion = landmark
    ? REGIONS.find((r) => r.id === landmark.regionId)
    : null;

  const migration =
    selectedEntity.type === 'migration'
      ? MIGRATION_ROUTES.find((m) => m.id === selectedEntity.id)
      : null;

  const headerImage =
    region?.image || landmark?.image || migration?.image || '/images/kings-landing.jpg';
  const badgeText = region
    ? region.continentLabel
    : landmark
    ? landmark.categoryLabel
    : migration
    ? migration.era
    : '';
  const titleText = region?.name || landmark?.name || migration?.name || '';
  const subtitleText =
    region?.subtitle || landmark?.subtitle || migration?.people || '';

  return (
    <aside
      aria-label="Свиток хроник Цитадели"
      className="fixed bottom-0 inset-x-0 z-40 max-h-[66dvh] lg:max-h-none lg:top-4 lg:bottom-4 lg:left-auto lg:right-4 lg:w-[404px] flex flex-col overflow-hidden rounded-t-2xl lg:rounded-2xl border border-[#D6C6B0] bg-[#F4ECE1]/97 shadow-2xl backdrop-blur-md transition-all duration-300"
    >
      {/* Mobile drag visual bar */}
      <div className="flex lg:hidden justify-center py-1.5 bg-[#EFE4D4] border-b border-[#DFD2BE]">
        <span className="h-1 w-10 rounded-full bg-[#B9A78E]" />
      </div>

      {/* Hero Artwork Banner */}
      <div className="relative h-40 sm:h-48 shrink-0 overflow-hidden bg-[#2A211B]">
        <img
          src={headerImage}
          alt={titleText}
          className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(42,33,27,0.92) 0%, rgba(42,33,27,0.35) 55%, rgba(42,33,27,0.18) 100%)',
          }}
        />

        {/* Top navigation row inside banner */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
          {landmark && parentRegion ? (
            <button
              type="button"
              onClick={() => onSelectEntity({ type: 'region', id: parentRegion.id })}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#2A211B]/75 px-3 py-1 text-xs font-medium text-[#F4ECE1] backdrop-blur-sm border border-[#F4ECE1]/20 hover:bg-[#8C2318] transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{parentRegion.name}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2A211B]/75 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[#E9D7B9] backdrop-blur-sm border border-[#F4ECE1]/15">
              <Sparkles className="h-3 w-3 text-[#E2B448]" />
              {badgeText}
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть описание"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2A211B]/75 text-[#F4ECE1] border border-[#F4ECE1]/20 hover:bg-[#8C2318] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Title overlay at bottom of image */}
        <div className="absolute bottom-3 inset-x-4">
          <h2 className="font-chronicle text-2xl sm:text-[28px] font-bold leading-none text-[#FAF5EC] drop-shadow">
            {titleText}
          </h2>
          <p className="mt-1 text-xs sm:text-[13px] text-[#E6DAC6] line-clamp-1">
            {subtitleText}
          </p>
        </div>
      </div>

      {/* Scrollable Chronicle Content */}
      <div className="vellum-scroll flex-1 overflow-y-auto px-5 py-4 space-y-5 text-[#2A211B]">
        {/* === REGION VIEW === */}
        {region && (
          <>
            {/* Great House Banner if present */}
            {region.house && (
              <div className="flex items-center gap-3.5 rounded-xl border border-[#D6C6B0] bg-[#EFE4D4] px-3.5 py-3">
                <HouseShieldBadge
                  house={region.house}
                  regionId={region.id}
                  size={40}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-chronicle text-lg font-bold text-[#2A211B]">
                      {region.house.name}
                    </span>
                    <span className="text-xs font-semibold text-[#8C2318]">
                      {region.house.words}
                    </span>
                  </div>
                  <p className="text-xs text-[#68584B] mt-0.5">
                    Герб: {region.house.sigilName}
                  </p>
                </div>
              </div>
            )}

            {/* Key Facts Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-lg border border-[#DFD2BE] bg-[#EFE4D4]/70 p-2.5">
                <div className="text-[10.5px] uppercase tracking-wider text-[#68584B] flex items-center gap-1">
                  <Crown className="h-3 w-3 text-[#8C2318]" />
                  Столица / Оплот
                </div>
                <div className="mt-1 font-medium text-[#2A211B] leading-snug">
                  {region.capital}
                </div>
              </div>
              <div className="rounded-lg border border-[#DFD2BE] bg-[#EFE4D4]/70 p-2.5">
                <div className="text-[10.5px] uppercase tracking-wider text-[#68584B] flex items-center gap-1">
                  <Compass className="h-3 w-3 text-[#B08D57]" />
                  Климат
                </div>
                <div className="mt-1 font-medium text-[#2A211B] leading-snug">
                  {region.climate}
                </div>
              </div>
            </div>

            {/* Summary & Lore */}
            <div className="space-y-3 text-[13.5px] leading-relaxed">
              <p className="font-medium text-[#2A211B]">{region.summary}</p>
              {region.lore.map((paragraph, idx) => (
                <p key={idx} className="text-[#4E4137]">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Historical Chronicle Box */}
            <div className="rounded-xl border-l-3 border-l-[#8C2318] border border-[#D6C6B0] bg-[#EFE4D4]/85 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8C2318]">
                <ScrollText className="h-3.5 w-3.5" />
                Летопись Цитадели
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#3D3129]">
                {region.historicalNote}
              </p>
            </div>

            {/* Notable Strongholds inside Region */}
            {region.notableLandmarkIds.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#68584B] mb-2 flex items-center gap-1.5">
                  <Castle className="h-3.5 w-3.5 text-[#8C2318]" />
                  Твердыни и города края
                </h3>
                <div className="grid grid-cols-1 gap-1.5">
                  {region.notableLandmarkIds.map((lmId) => {
                    const item = LANDMARKS.find((l) => l.id === lmId);
                    if (!item) return null;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          onSelectEntity({ type: 'landmark', id: item.id })
                        }
                        className="group flex items-center justify-between rounded-lg border border-[#D6C6B0] bg-[#FAF6EE] px-3 py-2 text-left hover:border-[#8C2318] hover:bg-[#EFE4D4] transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="text-[13px] font-semibold text-[#2A211B] group-hover:text-[#8C2318]">
                            {item.name}
                          </div>
                          <div className="text-[11.5px] text-[#68584B]">
                            {item.subtitle}
                          </div>
                        </div>
                        <MapPin className="h-4 w-4 text-[#8C2318] shrink-0 opacity-75 group-hover:opacity-100" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* === LANDMARK VIEW === */}
        {landmark && (
          <>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-lg border border-[#DFD2BE] bg-[#EFE4D4]/70 p-2.5">
                <div className="text-[10.5px] uppercase tracking-wider text-[#68584B]">
                  Основатель / Владыка
                </div>
                <div className="mt-1 font-medium text-[#2A211B] leading-snug">
                  {landmark.founderOrRuler}
                </div>
              </div>
              <div className="rounded-lg border border-[#DFD2BE] bg-[#EFE4D4]/70 p-2.5">
                <div className="text-[10.5px] uppercase tracking-wider text-[#68584B]">
                  Эпоха основания
                </div>
                <div className="mt-1 font-medium text-[#2A211B] leading-snug">
                  {landmark.era}
                </div>
              </div>
            </div>

            <p className="text-[14px] leading-relaxed text-[#2A211B]">
              {landmark.description}
            </p>

            <div className="rounded-xl border-l-3 border-l-[#B08D57] border border-[#D6C6B0] bg-[#EFE4D4]/85 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7A5B2B]">
                <BookOpen className="h-3.5 w-3.5" />
                Историческая пометка
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#3D3129]">
                {landmark.historicalFact}
              </p>
            </div>

            {parentRegion && (
              <button
                type="button"
                onClick={() =>
                  onSelectEntity({ type: 'region', id: parentRegion.id })
                }
                className="w-full rounded-lg border border-[#D6C6B0] bg-[#EFE4D4] px-3.5 py-2.5 text-xs font-medium text-[#2A211B] hover:border-[#8C2318] hover:text-[#8C2318] transition-colors cursor-pointer"
              >
                Перейти к полному описанию земли: {parentRegion.name} →
              </button>
            )}
          </>
        )}

        {/* === HISTORICAL MIGRATION ROUTE VIEW === */}
        {migration && (
          <>
            <div
              className="rounded-xl border border-[#D6C6B0] px-3.5 py-2.5 flex items-center justify-between"
              style={{ backgroundColor: '#EFE4D4' }}
            >
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-[#68584B]">
                  Датировка в хрониках
                </div>
                <div className="text-sm font-semibold text-[#2A211B] mt-0.5">
                  {migration.era}
                </div>
              </div>
              <span
                className="h-3.5 w-3.5 rounded-full shrink-0 ring-4 ring-white/60"
                style={{ backgroundColor: migration.color }}
              />
            </div>

            <div className="space-y-3 text-[13.5px] leading-relaxed">
              <p className="font-medium text-[#2A211B]">{migration.summary}</p>
              {migration.chronicle.map((paragraph, idx) => (
                <p key={idx} className="text-[#4E4137]">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Interactive Waypoints */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#68584B] mb-2 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-[#8C2318]" />
                Ключевые вехи маршрута (нажмите для приближения)
              </h3>
              <div className="space-y-1.5">
                {migration.waypoints.map((wp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onFocusCoordinates(wp.x, wp.y, 2.5)}
                    className="w-full group flex items-start gap-2.5 rounded-lg border border-[#D6C6B0] bg-[#FAF6EE] p-2.5 text-left hover:border-[#8C2318] hover:bg-[#EFE4D4] transition-colors cursor-pointer"
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: migration.color }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-[#2A211B] group-hover:text-[#8C2318]">
                        {wp.label}
                      </div>
                      <div className="text-[11.5px] text-[#68584B] leading-snug mt-0.5">
                        {wp.note}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border-l-3 border-l-[#8C2318] border border-[#D6C6B0] bg-[#EFE4D4]/85 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8C2318]">
                <Flame className="h-3.5 w-3.5" />
                Историческое наследие
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#3D3129]">
                {migration.consequence}
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
