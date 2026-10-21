export type ContinentId = 'westeros' | 'essos' | 'south';

export type LandmarkCategory =
  | 'castle'
  | 'capital'
  | 'free-city'
  | 'ruin'
  | 'sacred';

export type LayerFilterId =
  | 'regions'
  | 'landmarks'
  | 'houses'
  | 'migrations'
  | 'geography';

export interface GreatHouseInfo {
  name: string;
  words: string;
  sigilName: string;
  bannerColor: string;
  accentColor: string;
}

export interface RegionData {
  id: string;
  name: string;
  subtitle: string;
  continent: ContinentId;
  continentLabel: string;
  ruler: string;
  capital: string;
  climate: string;
  populationNote: string;
  image: string;
  fillColor: string;
  hoverColor: string;
  labelPos: { x: number; y: number; rotate?: number; size?: 'sm' | 'md' | 'lg' };
  focusView: { x: number; y: number; scale: number };
  paths: string[];
  house?: GreatHouseInfo;
  summary: string;
  lore: string[];
  historicalNote: string;
  notableLandmarkIds: string[];
}

export interface LandmarkData {
  id: string;
  name: string;
  subtitle: string;
  regionId: string;
  category: LandmarkCategory;
  categoryLabel: string;
  x: number;
  y: number;
  labelAlign?: 'top' | 'bottom' | 'left' | 'right';
  major?: boolean;
  image: string;
  founderOrRuler: string;
  era: string;
  description: string;
  historicalFact: string;
}

export interface MigrationWaypoint {
  x: number;
  y: number;
  label: string;
  note: string;
}

export interface MigrationRoute {
  id: string;
  name: string;
  era: string;
  people: string;
  color: string;
  secondaryPath?: string[];
  mainPath: string;
  image: string;
  focusView: { x: number; y: number; scale: number };
  summary: string;
  chronicle: string[];
  consequence: string;
  waypoints: MigrationWaypoint[];
}

export interface RiverFeature {
  id: string;
  name: string;
  path: string;
  labelPos?: { x: number; y: number; rotate?: number };
}

export interface MountainCluster {
  id: string;
  name: string;
  labelPos: { x: number; y: number; rotate?: number };
  peaks: Array<{ x: number; y: number; scale?: number }>;
}

export interface SeaLabel {
  id: string;
  name: string;
  x: number;
  y: number;
  rotate?: number;
  size: 'lg' | 'md' | 'sm';
}

export type SelectedEntity =
  | { type: 'region'; id: string }
  | { type: 'landmark'; id: string }
  | { type: 'migration'; id: string }
  | null;
