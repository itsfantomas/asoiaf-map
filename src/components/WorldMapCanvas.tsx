import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  LANDMARKS,
  MIGRATION_ROUTES,
  MOUNTAIN_CLUSTERS,
  REGIONS,
  RIVERS,
  SEA_LABELS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../data/worldAtlasData';
import {
  LandmarkData,
  LayerFilterId,
  MigrationRoute,
  RegionData,
  SelectedEntity,
} from '../types/atlas';
import { HouseShieldGlyph } from './HouseShieldBadge';

export interface CameraTransform {
  tx: number;
  ty: number;
  scale: number;
}

interface WorldMapCanvasProps {
  activeLayers: Record<LayerFilterId, boolean>;
  selectedEntity: SelectedEntity;
  activeMigrationId: string | 'all';
  onSelectEntity: (entity: SelectedEntity) => void;
  focusTarget: { x: number; y: number; scale: number; nonce: number } | null;
  zoomStepSignal: { delta: number; nonce: number } | null;
  onScaleChange?: (scale: number) => void;
}

interface TooltipInfo {
  x: number;
  y: number;
  title: string;
  subtitle: string;
  tag: string;
}

const MIN_SCALE_FACTOR = 0.85;
const MAX_SCALE = 4.6;

export const WorldMapCanvas: React.FC<WorldMapCanvasProps> = ({
  activeLayers,
  selectedEntity,
  activeMigrationId,
  onSelectEntity,
  focusTarget,
  zoomStepSignal,
  onScaleChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [camera, setCamera] = useState<CameraTransform>({ tx: 0, ty: 0, scale: 0.7 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [hoveredLandmarkId, setHoveredLandmarkId] = useState<string | null>(null);
  const [hoveredMigrationId, setHoveredMigrationId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const dragStateRef = useRef<{
    isDown: boolean;
    hasMoved: boolean;
    startX: number;
    startY: number;
    originTx: number;
    originTy: number;
  }>({
    isDown: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    originTx: 0,
    originTy: 0,
  });

  const pinchRef = useRef<{
    active: boolean;
    initialDist: number;
    initialScale: number;
    midX: number;
    midY: number;
    originTx: number;
    originTy: number;
  }>({
    active: false,
    initialDist: 0,
    initialScale: 1,
    midX: 0,
    midY: 0,
    originTx: 0,
    originTy: 0,
  });

  const clampCamera = useCallback(
    (tx: number, ty: number, scale: number): CameraTransform => {
      const el = containerRef.current;
      if (!el) return { tx, ty, scale };
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const fitScale = Math.min(cw / WORLD_WIDTH, ch / WORLD_HEIGHT);
      const minScale = Math.max(0.28, fitScale * MIN_SCALE_FACTOR);
      const clampedScale = Math.min(MAX_SCALE, Math.max(minScale, scale));

      const mapW = WORLD_WIDTH * clampedScale;
      const mapH = WORLD_HEIGHT * clampedScale;

      const marginX = cw * 0.35;
      const marginY = ch * 0.35;

      const minTx = Math.min(cw - mapW - marginX, (cw - mapW) / 2);
      const maxTx = Math.max(marginX, (cw - mapW) / 2);
      const minTy = Math.min(ch - mapH - marginY, (ch - mapH) / 2);
      const maxTy = Math.max(marginY, (ch - mapH) / 2);

      return {
        tx: Math.min(maxTx, Math.max(minTx, tx)),
        ty: Math.min(maxTy, Math.max(minTy, ty)),
        scale: clampedScale,
      };
    },
    []
  );

  const fitWorldToScreen = useCallback((animate = false) => {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    // Slight padding so floating chrome sits comfortably at edges
    const fitScale = Math.min((cw * 0.96) / WORLD_WIDTH, (ch * 0.94) / WORLD_HEIGHT);
    const tx = (cw - WORLD_WIDTH * fitScale) / 2;
    const ty = (ch - WORLD_HEIGHT * fitScale) / 2;
    if (animate) {
      setIsAnimating(true);
      window.setTimeout(() => setIsAnimating(false), 450);
    }
    setCamera({ tx, ty, scale: fitScale });
  }, []);

  useEffect(() => {
    fitWorldToScreen(false);
    const handleResize = () => {
      setCamera((prev) => clampCamera(prev.tx, prev.ty, prev.scale));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitWorldToScreen, clampCamera]);

  useEffect(() => {
    onScaleChange?.(camera.scale);
  }, [camera.scale, onScaleChange]);

  // Smooth camera glide when external focusTarget triggers
  useEffect(() => {
    if (!focusTarget || !containerRef.current) return;
    const el = containerRef.current;
    const cw = el.clientWidth;
    const ch = el.clientHeight;

    if (focusTarget.scale <= 0) {
      fitWorldToScreen(true);
      return;
    }

    const fitScale = Math.min((cw * 0.96) / WORLD_WIDTH, (ch * 0.94) / WORLD_HEIGHT);
    const targetScale = Math.min(MAX_SCALE, Math.max(fitScale, fitScale * focusTarget.scale));

    // Offset center slightly left on desktop when drawer is open
    const isDesktop = cw >= 1024;
    const viewCenterX = isDesktop && selectedEntity ? (cw - 390) * 0.52 : cw * 0.5;
    const viewCenterY = isDesktop ? ch * 0.5 : ch * 0.42;

    const rawTx = viewCenterX - focusTarget.x * targetScale;
    const rawTy = viewCenterY - focusTarget.y * targetScale;

    setIsAnimating(true);
    setCamera(clampCamera(rawTx, rawTy, targetScale));
    const timer = window.setTimeout(() => setIsAnimating(false), 480);
    return () => window.clearTimeout(timer);
  }, [focusTarget, clampCamera, fitWorldToScreen, selectedEntity]);

  // External +/- zoom button support
  useEffect(() => {
    if (!zoomStepSignal || !containerRef.current) return;
    const el = containerRef.current;
    const cx = el.clientWidth / 2;
    const cy = el.clientHeight / 2;

    setIsAnimating(true);
    setCamera((prev) => {
      const nextScale = prev.scale * (zoomStepSignal.delta > 0 ? 1.32 : 1 / 1.32);
      const worldX = (cx - prev.tx) / prev.scale;
      const worldY = (cy - prev.ty) / prev.scale;
      const nextTx = cx - worldX * nextScale;
      const nextTy = cy - worldY * nextScale;
      return clampCamera(nextTx, nextTy, nextScale);
    });
    const timer = window.setTimeout(() => setIsAnimating(false), 300);
    return () => window.clearTimeout(timer);
  }, [zoomStepSignal, clampCamera]);

  // Wheel zoom centered at pointer
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const el = containerRef.current;
      if (!el) return;
      setIsAnimating(false);
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.13 : 1 / 1.13;

      setCamera((prev) => {
        const nextScale = prev.scale * factor;
        const worldX = (mouseX - prev.tx) / prev.scale;
        const worldY = (mouseY - prev.ty) / prev.scale;
        const nextTx = mouseX - worldX * nextScale;
        const nextTy = mouseY - worldY * nextScale;
        return clampCamera(nextTx, nextTy, nextScale);
      });
    },
    [clampCamera]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Pointer drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsAnimating(false);
    dragStateRef.current = {
      isDown: true,
      hasMoved: false,
      startX: e.clientX,
      startY: e.clientY,
      originTx: camera.tx,
      originTy: camera.ty,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const drag = dragStateRef.current;
    if (drag.isDown) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.hypot(dx, dy) > 4) {
        drag.hasMoved = true;
        setTooltip(null);
      }
      if (drag.hasMoved) {
        setCamera((prev) =>
          clampCamera(drag.originTx + dx, drag.originTy + dy, prev.scale)
        );
      }
    }
  };

  const handleMouseUp = () => {
    dragStateRef.current.isDown = false;
  };

  // Touch handlers (1-finger pan + 2-finger pinch zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsAnimating(false);
    setTooltip(null);
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragStateRef.current = {
        isDown: true,
        hasMoved: false,
        startX: t.clientX,
        startY: t.clientY,
        originTx: camera.tx,
        originTy: camera.ty,
      };
      pinchRef.current.active = false;
    } else if (e.touches.length === 2) {
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const rect = containerRef.current?.getBoundingClientRect();
      pinchRef.current = {
        active: true,
        initialDist: dist,
        initialScale: camera.scale,
        midX: (t1.clientX + t2.clientX) / 2 - (rect?.left ?? 0),
        midY: (t1.clientY + t2.clientY) / 2 - (rect?.top ?? 0),
        originTx: camera.tx,
        originTy: camera.ty,
      };
      dragStateRef.current.isDown = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragStateRef.current.isDown && !pinchRef.current.active) {
      const t = e.touches[0];
      const dx = t.clientX - dragStateRef.current.startX;
      const dy = t.clientY - dragStateRef.current.startY;
      if (Math.hypot(dx, dy) > 5) {
        dragStateRef.current.hasMoved = true;
      }
      setCamera((prev) =>
        clampCamera(
          dragStateRef.current.originTx + dx,
          dragStateRef.current.originTy + dy,
          prev.scale
        )
      );
    } else if (e.touches.length === 2 && pinchRef.current.active) {
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / Math.max(1, pinchRef.current.initialDist);
      const nextScale = pinchRef.current.initialScale * ratio;
      const worldX =
        (pinchRef.current.midX - pinchRef.current.originTx) / pinchRef.current.initialScale;
      const worldY =
        (pinchRef.current.midY - pinchRef.current.originTy) / pinchRef.current.initialScale;
      const nextTx = pinchRef.current.midX - worldX * nextScale;
      const nextTy = pinchRef.current.midY - worldY * nextScale;
      setCamera(clampCamera(nextTx, nextTy, nextScale));
    }
  };

  const handleTouchEnd = () => {
    dragStateRef.current.isDown = false;
    pinchRef.current.active = false;
  };

  const updatePointerTooltip = (
    e: React.MouseEvent,
    info: Omit<TooltipInfo, 'x' | 'y'>
  ) => {
    if (dragStateRef.current.hasMoved) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      ...info,
    });
  };

  const handleRegionClick = (e: React.MouseEvent, region: RegionData) => {
    e.stopPropagation();
    if (dragStateRef.current.hasMoved) return;
    onSelectEntity({ type: 'region', id: region.id });
  };

  const handleLandmarkClick = (e: React.MouseEvent, lm: LandmarkData) => {
    e.stopPropagation();
    if (dragStateRef.current.hasMoved) return;
    onSelectEntity({ type: 'landmark', id: lm.id });
  };

  const handleMigrationClick = (e: React.MouseEvent, route: MigrationRoute) => {
    e.stopPropagation();
    if (dragStateRef.current.hasMoved) return;
    onSelectEntity({ type: 'migration', id: route.id });
  };

  // Counter-scale factor so pins stay legible without ballooning at high zoom
  const inversePinScale = Math.min(1.35, Math.max(0.55, 0.86 / Math.sqrt(camera.scale)));
  const showMinorLabels = camera.scale >= 0.85;

  const visibleMigrations = activeLayers.migrations
    ? MIGRATION_ROUTES.filter(
        (m) => activeMigrationId === 'all' || m.id === activeMigrationId
      )
    : [];

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        handleMouseUp();
        setHoveredRegionId(null);
        setHoveredLandmarkId(null);
        setHoveredMigrationId(null);
        setTooltip(null);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => {
        if (!dragStateRef.current.hasMoved) {
          onSelectEntity(null);
        }
      }}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
      style={{
        background:
          'radial-gradient(circle at 50% 48%, #E6DEC8 0%, #D9D0BC 58%, #CFC4AE 100%)',
      }}
    >
      {/* Subtle parchment vignette overlay (pointer-events-none) */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          boxShadow: 'inset 0 0 120px rgba(42, 33, 27, 0.19)',
        }}
      />

      {/* Transformed World Map Layer */}
      <div
        style={{
          transformOrigin: '0 0',
          transform: `translate3d(${camera.tx}px, ${camera.ty}px, 0) scale(${camera.scale})`,
          transition: isAnimating
            ? 'transform 460ms cubic-bezier(0.22, 1, 0.36, 1)'
            : 'none',
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
          willChange: 'transform',
        }}
      >
        <svg
          width={WORLD_WIDTH}
          height={WORLD_HEIGHT}
          viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
          className="block overflow-visible"
        >
          <defs>
            {/* Subtle parchment filter texture */}
            <pattern
              id="vellum-grid"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 120 0 L 0 0 0 120"
                fill="none"
                stroke="#8A7965"
                strokeWidth="0.35"
                strokeOpacity="0.16"
              />
            </pattern>

            {/* Valyrian Smoking Sea Ember Glow */}
            <radialGradient id="valyria-ember" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#9E2A1C" stopOpacity="0.32" />
              <stop offset="55%" stopColor="#5C4742" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#5C4742" stopOpacity="0" />
            </radialGradient>

            {/* Arrowheads for each migration route */}
            {MIGRATION_ROUTES.map((route) => (
              <marker
                key={`arrow-${route.id}`}
                id={`arrow-${route.id}`}
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5.5"
                markerHeight="5.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={route.color} />
              </marker>
            ))}
          </defs>

          {/* 1. Cartographic Sea Grid & Portolan Wind Rose Lines */}
          <rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="url(#vellum-grid)" />

          {/* Portolan Rhumb Lines radiating from Narrow Sea & Summer Sea */}
          {[
            { cx: 678, cy: 790 },
            { cx: 1475, cy: 1095 },
          ].map((hub, idx) => (
            <g key={idx} opacity="0.13" pointerEvents="none">
              {Array.from({ length: 16 }).map((_, rayIdx) => {
                const angle = (rayIdx * Math.PI) / 8;
                const x2 = hub.cx + Math.cos(angle) * 1800;
                const y2 = hub.cy + Math.sin(angle) * 1800;
                return (
                  <line
                    key={rayIdx}
                    x1={hub.cx}
                    y1={hub.cy}
                    x2={x2}
                    y2={y2}
                    stroke="#68584B"
                    strokeWidth={rayIdx % 2 === 0 ? '0.8' : '0.45'}
                  />
                );
              })}
              <circle
                cx={hub.cx}
                cy={hub.cy}
                r="26"
                fill="#E8DFCE"
                stroke="#8A765E"
                strokeWidth="1"
              />
              <path
                d={`M ${hub.cx} ${hub.cy - 24} L ${hub.cx + 5} ${hub.cy - 5} L ${
                  hub.cx + 24
                } ${hub.cy} L ${hub.cx + 5} ${hub.cy + 5} L ${hub.cx} ${
                  hub.cy + 24
                } L ${hub.cx - 5} ${hub.cy + 5} L ${hub.cx - 24} ${hub.cy} L ${
                  hub.cx - 5
                } ${hub.cy - 5} Z`}
                fill="#8C2318"
                opacity="0.65"
              />
            </g>
          ))}

          {/* Decorative Cartographic Outer Frame */}
          <rect
            x="18"
            y="18"
            width={WORLD_WIDTH - 36}
            height={WORLD_HEIGHT - 36}
            fill="none"
            stroke="#8B775F"
            strokeWidth="2.2"
            opacity="0.45"
            pointerEvents="none"
          />
          <rect
            x="25"
            y="25"
            width={WORLD_WIDTH - 50}
            height={WORLD_HEIGHT - 50}
            fill="none"
            stroke="#8B775F"
            strokeWidth="0.9"
            strokeDasharray="12 6"
            opacity="0.38"
            pointerEvents="none"
          />

          {/* 2. Shallow Coastal Halo under all Landmasses */}
          <g pointerEvents="none">
            {REGIONS.map((region) =>
              region.paths.map((d, idx) => (
                <path
                  key={`halo-${region.id}-${idx}`}
                  d={d}
                  fill="none"
                  stroke="#EFE9DA"
                  strokeWidth="15"
                  strokeLinejoin="round"
                  opacity="0.72"
                />
              ))
            )}
            {REGIONS.map((region) =>
              region.paths.map((d, idx) => (
                <path
                  key={`ripple-${region.id}-${idx}`}
                  d={d}
                  fill="none"
                  stroke="#B5A892"
                  strokeWidth="4.5"
                  strokeLinejoin="round"
                  opacity="0.45"
                />
              ))
            )}
          </g>

          {/* Smoking Sea volcanic haze around Valyria */}
          <circle
            cx="1148"
            cy="1032"
            r="118"
            fill="url(#valyria-ember)"
            pointerEvents="none"
          />

          {/* 3. Interactive Regions Polygons */}
          <g>
            {REGIONS.map((region) => {
              const isSelected =
                (selectedEntity?.type === 'region' &&
                  selectedEntity.id === region.id) ||
                (selectedEntity?.type === 'landmark' &&
                  LANDMARKS.find((l) => l.id === selectedEntity.id)?.regionId ===
                    region.id);
              const isHovered = hoveredRegionId === region.id;

              const baseFill = activeLayers.regions
                ? isSelected
                  ? region.hoverColor
                  : isHovered
                  ? region.hoverColor
                  : region.fillColor
                : '#EDE4D5';

              return (
                <g
                  key={region.id}
                  onClick={(e) => handleRegionClick(e, region)}
                  onMouseEnter={(e) => {
                    setHoveredRegionId(region.id);
                    updatePointerTooltip(e, {
                      title: region.name,
                      subtitle: region.house
                        ? `${region.house.name} · ${region.house.words}`
                        : region.ruler,
                      tag: region.continentLabel,
                    });
                  }}
                  onMouseMove={(e) =>
                    updatePointerTooltip(e, {
                      title: region.name,
                      subtitle: region.house
                        ? `${region.house.name} · ${region.house.words}`
                        : region.ruler,
                      tag: region.continentLabel,
                    })
                  }
                  onMouseLeave={() => {
                    setHoveredRegionId((prev) => (prev === region.id ? null : prev));
                    setTooltip(null);
                  }}
                  className="cursor-pointer"
                >
                  {region.paths.map((d, idx) => (
                    <path
                      key={`${region.id}-${idx}`}
                      d={d}
                      fill={baseFill}
                      stroke={
                        isSelected
                          ? '#8C2318'
                          : isHovered
                          ? '#5E493A'
                          : activeLayers.regions
                          ? '#7A6855'
                          : '#9B8B78'
                      }
                      strokeWidth={
                        isSelected ? 2.6 : isHovered ? 2.0 : activeLayers.regions ? 1.25 : 0.9
                      }
                      strokeLinejoin="round"
                      style={{
                        transition: 'fill 200ms ease, stroke 200ms ease',
                      }}
                    />
                  ))}
                </g>
              );
            })}
          </g>

          {/* 4. Geography Layer: Rivers, Lake Gods Eye, Mountains, The Wall & Sea Labels */}
          {activeLayers.geography && (
            <g pointerEvents="none">
              {/* Rivers */}
              {RIVERS.map((river) => (
                <g key={river.id}>
                  <path
                    d={river.path}
                    fill="none"
                    stroke="#7D98A1"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.88"
                  />
                  {river.labelPos && showMinorLabels && (
                    <text
                      x={river.labelPos.x}
                      y={river.labelPos.y}
                      transform={`rotate(${river.labelPos.rotate ?? 0}, ${
                        river.labelPos.x
                      }, ${river.labelPos.y})`}
                      fill="#4B6873"
                      fontSize="9.5"
                      fontStyle="italic"
                      fontFamily="'Cormorant Garamond', Georgia, serif"
                      textAnchor="middle"
                    >
                      р. {river.name}
                    </text>
                  )}
                </g>
              ))}

              {/* Gods Eye Sacred Lake south of Harrenhal */}
              <ellipse
                cx="426"
                cy="704"
                rx="11"
                ry="8"
                fill="#A7B9BC"
                stroke="#6C858D"
                strokeWidth="0.9"
              />
              {/* Womb of the World Lake by Vaes Dothrak */}
              <ellipse
                cx="1456"
                cy="536"
                rx="14"
                ry="7"
                fill="#A7B9BC"
                stroke="#6C858D"
                strokeWidth="0.9"
              />

              {/* Forest of Qohor & Haunted Forest subtle tree clusters */}
              {[
                { x: 985, y: 522 },
                { x: 1005, y: 515 },
                { x: 1022, y: 528 },
                { x: 978, y: 538 },
                { x: 1014, y: 544 },
                { x: 382, y: 215 },
                { x: 404, y: 205 },
                { x: 425, y: 218 },
                { x: 362, y: 224 },
              ].map((pt, idx) => (
                <path
                  key={`tree-${idx}`}
                  d={`M ${pt.x} ${pt.y - 6} L ${pt.x + 4.5} ${pt.y + 3} L ${
                    pt.x - 4.5
                  } ${pt.y + 3} Z`}
                  fill="#6B7B5C"
                  opacity="0.45"
                />
              ))}

              {/* Hand-drawn Cartographic Mountain Ranges */}
              {MOUNTAIN_CLUSTERS.map((cluster) => (
                <g key={cluster.id}>
                  {cluster.peaks.map((pk, idx) => {
                    const s = pk.scale ?? 1;
                    return (
                      <g
                        key={idx}
                        transform={`translate(${pk.x}, ${pk.y}) scale(${s})`}
                      >
                        <path
                          d="M -11 7 L 0 -9 L 11 7 Z"
                          fill="#EDE6D8"
                          stroke="#68584B"
                          strokeWidth="1.25"
                          strokeLinejoin="round"
                        />
                        {/* Shaded eastern slope */}
                        <path
                          d="M 0 -9 L 11 7 L 2 7 Z"
                          fill="#9C8B78"
                          opacity="0.55"
                        />
                      </g>
                    );
                  })}
                  {showMinorLabels && (
                    <text
                      x={cluster.labelPos.x}
                      y={cluster.labelPos.y}
                      transform={`rotate(${cluster.labelPos.rotate ?? 0}, ${
                        cluster.labelPos.x
                      }, ${cluster.labelPos.y})`}
                      fill="#5A4B3E"
                      fontSize="10.5"
                      fontStyle="italic"
                      fontWeight="600"
                      fontFamily="'Cormorant Garamond', Georgia, serif"
                      textAnchor="middle"
                      letterSpacing="0.06em"
                    >
                      {cluster.name}
                    </text>
                  )}
                </g>
              ))}

              {/* THE WALL (Стена) — glacial fortification */}
              <g>
                <path
                  d="M 345 252 Q 410 247 475 252"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 345 252 Q 410 247 475 252"
                  fill="none"
                  stroke="#5A8396"
                  strokeWidth="2.6"
                  strokeDasharray="6 3"
                  strokeLinecap="round"
                />
                <text
                  x="390"
                  y="242"
                  fill="#335363"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="'Cormorant Garamond', Georgia, serif"
                  letterSpacing="0.18em"
                  textAnchor="middle"
                >
                  СТЕНА
                </text>
              </g>
            </g>
          )}

          {/* Sea & Ocean Calligraphy Labels */}
          <g pointerEvents="none">
            {SEA_LABELS.map((sea) => {
              if (sea.size === 'sm' && !showMinorLabels) return null;
              const fontSize =
                sea.size === 'lg' ? 18 : sea.size === 'md' ? 14.5 : 10.5;
              return (
                <text
                  key={sea.id}
                  x={sea.x}
                  y={sea.y}
                  transform={`rotate(${sea.rotate ?? 0}, ${sea.x}, ${sea.y})`}
                  fill="#6E6355"
                  opacity={sea.size === 'lg' ? 0.55 : 0.68}
                  fontSize={fontSize}
                  fontStyle="italic"
                  fontWeight={sea.size === 'lg' ? 600 : 500}
                  fontFamily="'Cormorant Garamond', Georgia, serif"
                  letterSpacing={sea.size === 'lg' ? '0.32em' : '0.14em'}
                  textAnchor="middle"
                >
                  {sea.name}
                </text>
              );
            })}
          </g>

          {/* 5. Region Calligraphy Titles */}
          {activeLayers.regions && (
            <g pointerEvents="none">
              {REGIONS.map((region) => {
                const isSelected =
                  selectedEntity?.type === 'region' &&
                  selectedEntity.id === region.id;
                const fontSize =
                  region.labelPos.size === 'lg'
                    ? 19
                    : region.labelPos.size === 'md'
                    ? 14
                    : 11.5;

                return (
                  <g key={`lbl-${region.id}`}>
                    <text
                      x={region.labelPos.x}
                      y={region.labelPos.y}
                      fill={isSelected ? '#8C2318' : '#2A211B'}
                      stroke="#F4ECE1"
                      strokeWidth="3.2"
                      paintOrder="stroke"
                      fontSize={fontSize}
                      fontWeight="700"
                      fontFamily="'Cormorant Garamond', Georgia, serif"
                      letterSpacing="0.09em"
                      textAnchor="middle"
                      opacity={0.92}
                    >
                      {region.name.toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* 6. Historical Migration & Conquest Routes Layer */}
          {visibleMigrations.length > 0 && (
            <g>
              {visibleMigrations.map((route) => {
                const isFocused =
                  (selectedEntity?.type === 'migration' &&
                    selectedEntity.id === route.id) ||
                  activeMigrationId === route.id ||
                  hoveredMigrationId === route.id;

                return (
                  <g
                    key={route.id}
                    className="cursor-pointer"
                    onClick={(e) => handleMigrationClick(e, route)}
                    onMouseEnter={(e) => {
                      setHoveredMigrationId(route.id);
                      updatePointerTooltip(e, {
                        title: route.name,
                        subtitle: route.people,
                        tag: route.era,
                      });
                    }}
                    onMouseMove={(e) =>
                      updatePointerTooltip(e, {
                        title: route.name,
                        subtitle: route.people,
                        tag: route.era,
                      })
                    }
                    onMouseLeave={() => {
                      setHoveredMigrationId(null);
                      setTooltip(null);
                    }}
                  >
                    {/* Invisible wide stroke for effortless clicking */}
                    <path
                      d={route.mainPath}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="18"
                    />
                    {/* Soft vellum halo behind route */}
                    <path
                      d={route.mainPath}
                      fill="none"
                      stroke="#F4ECE1"
                      strokeWidth={isFocused ? 6.5 : 4.6}
                      strokeLinecap="round"
                      opacity="0.78"
                    />
                    {/* Main animated historical path */}
                    <path
                      d={route.mainPath}
                      fill="none"
                      stroke={route.color}
                      strokeWidth={isFocused ? 3.5 : 2.5}
                      strokeDasharray="10 6"
                      strokeLinecap="round"
                      markerEnd={`url(#arrow-${route.id})`}
                      className={
                        isFocused ? 'migration-route-active' : 'migration-route-subtle'
                      }
                    />
                    {/* Secondary branching campaigns / migrations */}
                    {route.secondaryPath?.map((secPath, idx) => (
                      <path
                        key={idx}
                        d={secPath}
                        fill="none"
                        stroke={route.color}
                        strokeWidth={isFocused ? 2.1 : 1.5}
                        strokeDasharray="5 5"
                        strokeLinecap="round"
                        markerEnd={`url(#arrow-${route.id})`}
                        opacity={isFocused ? 0.92 : 0.68}
                        className="migration-route-subtle"
                      />
                    ))}

                    {/* Historical Waypoint medallions */}
                    {(isFocused || activeMigrationId !== 'all') &&
                      route.waypoints.map((wp, idx) => (
                        <g
                          key={idx}
                          transform={`translate(${wp.x}, ${wp.y}) scale(${inversePinScale})`}
                        >
                          <circle
                            r="6.2"
                            fill="#F4ECE1"
                            stroke={route.color}
                            strokeWidth="2.2"
                          />
                          <circle r="2.4" fill={route.color} />
                          <text
                            y="-10"
                            fill={route.color}
                            stroke="#F4ECE1"
                            strokeWidth="3"
                            paintOrder="stroke"
                            fontSize="10.5"
                            fontWeight="600"
                            fontFamily="'Inter', sans-serif"
                            textAnchor="middle"
                          >
                            {wp.label}
                          </text>
                        </g>
                      ))}
                  </g>
                );
              })}
            </g>
          )}

          {/* 7. Great Houses Heraldic Shields on Map */}
          {activeLayers.houses && (
            <g>
              {REGIONS.filter((r) => Boolean(r.house)).map((region) => {
                if (!region.house) return null;
                const hx = region.labelPos.x;
                const hy = region.labelPos.y + 18;

                return (
                  <g
                    key={`house-map-${region.id}`}
                    transform={`translate(${hx}, ${hy}) scale(${
                      inversePinScale * 0.92
                    })`}
                    onClick={(e) => handleRegionClick(e, region)}
                    onMouseEnter={(e) =>
                      updatePointerTooltip(e, {
                        title: region.house!.name,
                        subtitle: `${region.house!.words} · ${region.capital}`,
                        tag: 'Великий Дом Вестероса',
                      })
                    }
                    onMouseLeave={() => setTooltip(null)}
                    className="cursor-pointer"
                  >
                    <path
                      d="M-11,-12 L11,-12 L11,-1 C11,6.5 5.5,11 0,14 C-5.5,11 -11,6.5 -11,-1 Z"
                      fill={region.house.bannerColor}
                      stroke="#E6C78B"
                      strokeWidth="1.8"
                    />
                    <HouseShieldGlyph
                      regionId={region.id}
                      accent={region.house.accentColor}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* 8. Strongholds, Capitals, Free Cities & Ruins Pins */}
          {activeLayers.landmarks && (
            <g>
              {LANDMARKS.map((lm) => {
                const isSelected =
                  selectedEntity?.type === 'landmark' &&
                  selectedEntity.id === lm.id;
                const isHovered = hoveredLandmarkId === lm.id;
                const showName =
                  lm.major || showMinorLabels || isSelected || isHovered;

                const pinColor =
                  lm.category === 'capital'
                    ? '#8C2318'
                    : lm.category === 'free-city'
                    ? '#2B4C7E'
                    : lm.category === 'ruin'
                    ? '#5A4842'
                    : lm.category === 'sacred'
                    ? '#7B4B94'
                    : '#68584B';

                const labelOffset =
                  lm.labelAlign === 'left'
                    ? { dx: -9, dy: 3.5, anchor: 'end' as const }
                    : lm.labelAlign === 'top'
                    ? { dx: 0, dy: -10, anchor: 'middle' as const }
                    : lm.labelAlign === 'bottom'
                    ? { dx: 0, dy: 16, anchor: 'middle' as const }
                    : { dx: 9, dy: 3.5, anchor: 'start' as const };

                return (
                  <g
                    key={lm.id}
                    transform={`translate(${lm.x}, ${lm.y}) scale(${inversePinScale})`}
                    onClick={(e) => handleLandmarkClick(e, lm)}
                    onMouseEnter={(e) => {
                      setHoveredLandmarkId(lm.id);
                      updatePointerTooltip(e, {
                        title: lm.name,
                        subtitle: lm.subtitle,
                        tag: lm.categoryLabel,
                      });
                    }}
                    onMouseMove={(e) =>
                      updatePointerTooltip(e, {
                        title: lm.name,
                        subtitle: lm.subtitle,
                        tag: lm.categoryLabel,
                      })
                    }
                    onMouseLeave={() => {
                      setHoveredLandmarkId(null);
                      setTooltip(null);
                    }}
                    className="cursor-pointer"
                  >
                    {/* Invisible hit circle for easy tap on mobile & desktop */}
                    <circle r="13" fill="transparent" />

                    {isSelected && (
                      <circle
                        r="11"
                        fill="none"
                        stroke="#8C2318"
                        strokeWidth="2"
                        className="marker-pulse"
                      />
                    )}

                    {/* Outer brass/vellum ring */}
                    <circle
                      r={lm.major ? 6.2 : 4.7}
                      fill="#F7F1E6"
                      stroke={isSelected ? '#8C2318' : '#2A211B'}
                      strokeWidth={isSelected || isHovered ? 2.1 : 1.4}
                    />

                    {/* Inner category glyph */}
                    {lm.category === 'ruin' ? (
                      <polygon
                        points="0,-3.4 3.4,0 0,3.4 -3.4,0"
                        fill={pinColor}
                      />
                    ) : (
                      <circle r={lm.major ? 3.5 : 2.5} fill={pinColor} />
                    )}

                    {showName && (
                      <text
                        x={labelOffset.dx}
                        y={labelOffset.dy}
                        textAnchor={labelOffset.anchor}
                        fill={isSelected ? '#8C2318' : '#2A211B'}
                        stroke="#F4ECE1"
                        strokeWidth="3.1"
                        paintOrder="stroke"
                        fontSize={lm.major ? '11.5' : '10.2'}
                        fontWeight={lm.major || isSelected ? '600' : '500'}
                        fontFamily="'Inter', sans-serif"
                      >
                        {lm.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* Floating Cartographic Tooltip near Cursor */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-30 hidden sm:block max-w-[260px] rounded-lg border border-[#D6C6B0] bg-[#F7F0E4]/95 px-3 py-2 shadow-lg backdrop-blur-sm transition-opacity duration-150"
          style={{
            left: Math.min(
              (containerRef.current?.clientWidth ?? 1200) - 275,
              tooltip.x + 16
            ),
            top: Math.max(16, tooltip.y - 58),
          }}
        >
          <div className="text-[10px] font-medium uppercase tracking-wider text-[#8C2318]">
            {tooltip.tag}
          </div>
          <div className="font-chronicle text-[17px] font-bold leading-tight text-[#2A211B]">
            {tooltip.title}
          </div>
          <div className="mt-0.5 text-[11.5px] leading-snug text-[#68584B]">
            {tooltip.subtitle}
          </div>
        </div>
      )}
    </div>
  );
};
