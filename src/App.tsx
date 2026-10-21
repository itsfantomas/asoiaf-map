import { useCallback, useState } from 'react';
import { LANDMARKS, MIGRATION_ROUTES, REGIONS } from './data/worldAtlasData';
import { LayerFilterId, SelectedEntity } from './types/atlas';
import { WorldMapCanvas } from './components/WorldMapCanvas';
import { AtlasControls } from './components/AtlasControls';
import { LoreDrawer } from './components/LoreDrawer';

export function App() {
  const [activeLayers, setActiveLayers] = useState<
    Record<LayerFilterId, boolean>
  >({
    regions: true,
    landmarks: true,
    houses: false,
    migrations: true,
    geography: true,
  });

  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);
  const [activeMigrationId, setActiveMigrationId] = useState<string | 'all'>(
    'all'
  );

  const [focusTarget, setFocusTarget] = useState<{
    x: number;
    y: number;
    scale: number;
    nonce: number;
  } | null>(null);

  const [zoomStepSignal, setZoomStepSignal] = useState<{
    delta: number;
    nonce: number;
  } | null>(null);

  const [currentScale, setCurrentScale] = useState<number>(0.7);

  const triggerFocus = useCallback((x: number, y: number, scale: number) => {
    setFocusTarget({ x, y, scale, nonce: Date.now() + Math.random() });
  }, []);

  const handleToggleLayer = useCallback((layer: LayerFilterId) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  }, []);

  const handleSelectEntity = useCallback(
    (entity: SelectedEntity) => {
      setSelectedEntity(entity);
      if (!entity) return;

      if (entity.type === 'region') {
        const reg = REGIONS.find((r) => r.id === entity.id);
        if (reg) {
          setActiveLayers((prev) => ({ ...prev, regions: true }));
          triggerFocus(
            reg.focusView.x,
            reg.focusView.y,
            reg.focusView.scale
          );
        }
      } else if (entity.type === 'landmark') {
        const lm = LANDMARKS.find((l) => l.id === entity.id);
        if (lm) {
          setActiveLayers((prev) => ({ ...prev, landmarks: true }));
          triggerFocus(lm.x, lm.y, 2.75);
        }
      } else if (entity.type === 'migration') {
        const route = MIGRATION_ROUTES.find((m) => m.id === entity.id);
        if (route) {
          setActiveLayers((prev) => ({ ...prev, migrations: true }));
          setActiveMigrationId(route.id);
          triggerFocus(
            route.focusView.x,
            route.focusView.y,
            route.focusView.scale
          );
        }
      }
    },
    [triggerFocus]
  );

  const handleFocusRegionPreset = useCallback(
    (preset: 'world' | 'westeros' | 'essos' | 'south') => {
      if (preset === 'world') {
        triggerFocus(0, 0, -1);
      } else if (preset === 'westeros') {
        triggerFocus(420, 610, 1.55);
      } else if (preset === 'essos') {
        triggerFocus(1385, 735, 1.45);
      } else if (preset === 'south') {
        triggerFocus(1145, 1135, 1.75);
      }
    },
    [triggerFocus]
  );

  const handleZoomStep = useCallback((delta: number) => {
    setZoomStepSignal({ delta, nonce: Date.now() + Math.random() });
  }, []);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#F4ECE1]">
      {/* Interactive Full-Bleed Cartographic World Canvas */}
      <WorldMapCanvas
        activeLayers={activeLayers}
        selectedEntity={selectedEntity}
        activeMigrationId={activeMigrationId}
        onSelectEntity={handleSelectEntity}
        focusTarget={focusTarget}
        zoomStepSignal={zoomStepSignal}
        onScaleChange={setCurrentScale}
      />

      {/* Subtle Top-Right Cartographer Hint when Drawer is Closed */}
      {!selectedEntity && (
        <div className="pointer-events-none hidden xl:flex items-center gap-2 fixed top-4 right-4 z-20 rounded-full border border-[#D6C6B0] bg-[#F4ECE1]/88 px-3.5 py-1.5 text-xs text-[#68584B] shadow-sm backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-[#8C2318]" />
          <span>
            Нажмите на землю, крепость или путь миграции для открытия летописи
          </span>
        </div>
      )}

      {/* Floating Search, Continent Presets, Layer Filters & Zoom Controls */}
      <AtlasControls
        activeLayers={activeLayers}
        onToggleLayer={handleToggleLayer}
        activeMigrationId={activeMigrationId}
        onSelectMigrationFilter={setActiveMigrationId}
        onSelectEntity={handleSelectEntity}
        onFocusRegionPreset={handleFocusRegionPreset}
        onZoomStep={handleZoomStep}
        currentScale={currentScale}
        hasOpenDrawer={Boolean(selectedEntity)}
      />

      {/* Slide-Over Lore & Chronicle Drawer */}
      <LoreDrawer
        selectedEntity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
        onSelectEntity={handleSelectEntity}
        onFocusCoordinates={triggerFocus}
      />
    </main>
  );
}

export default App;
