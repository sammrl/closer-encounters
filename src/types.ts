/**
 * Interface for the marker data structure displayed on the globe
 */
export interface GlobeMarker {
  id: string;
  lat: number;
  lng: number;
  size: number;
  color: string;
  category: 'confirmed' | 'probable' | 'possible';
  // Additional custom fields
  title: string;
  date: string;
  year?: number; // Year extracted from date for filtering by time period
  location: string;
  region?: string;
  country?: string;
  credibility?: number;
  description?: string;
}

/**
 * Interface for loading progress state
 */
export interface LoadingProgress {
  loaded: number;
  total: number;
  percent: number;
  complete: boolean;
}

/**
 * Color scheme definition
 */
export interface ColorScheme {
  confirmed: string;
  probable: string;
  possible: string;
} 