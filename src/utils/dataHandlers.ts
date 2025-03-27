/// <reference path="../types.ts" />
import { GlobeMarker } from '../types';

/**
 * Loads JSON files in batches to prevent memory issues when handling thousands of files
 * @param dataUrls Array of URLs to JSON files
 * @param batchSize Number of files to load in each batch
 * @param progressCallback Callback to report loading progress
 */
export const loadJsonFilesBatched = async (
  dataUrls: string[],
  batchSize = 100,
  progressCallback?: (loaded: number, total: number) => void
): Promise<any[]> => {
  const results: any[] = [];
  const totalFiles = dataUrls.length;
  
  // Process in batches to avoid memory issues
  for (let i = 0; i < totalFiles; i += batchSize) {
    const batchUrls = dataUrls.slice(i, i + batchSize);
    const batchPromises = batchUrls.map(url => 
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.status}`);
          }
          return response.json();
        })
        .catch(error => {
          console.error(`Error loading ${url}:`, error);
          return null; // Return null for failed loads so we can filter them out
        })
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(result => result !== null));
    
    // Report progress
    if (progressCallback) {
      progressCallback(Math.min(i + batchSize, totalFiles), totalFiles);
    }
  }
  
  return results;
};

/**
 * Converts raw JSON data to GlobeMarker format
 * @param jsonData Array of raw JSON data objects
 */
export const convertToGlobeMarkers = (jsonData: any[]): GlobeMarker[] => {
  return jsonData.map((data, index) => {
    // Handle missing or incorrect coordinate data
    const lat = parseFloat(data.latitude || data.lat);
    const lng = parseFloat(data.longitude || data.lng);
    
    // Skip invalid coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn(`Skipping data point with invalid coordinates:`, data);
      return null;
    }
    
    // Map categories to predefined types
    let category: 'confirmed' | 'probable' | 'possible' = 'possible';
    if (data.category) {
      const categoryStr = String(data.category).toLowerCase();
      if (categoryStr.includes('confirm')) category = 'confirmed';
      else if (categoryStr.includes('prob')) category = 'probable';
    }
    
    // Assign colors based on category
    const colorMap = {
      confirmed: '#6ee7ff',
      probable: '#ff7b3d',
      possible: '#65fc78'
    };
    
    return {
      id: data.id || `data-point-${index}`,
      lat,
      lng,
      size: 1.0,
      color: colorMap[category],
      category,
      title: data.title || `Data Point ${index + 1}`,
      date: data.date || 'Unknown date',
      location: data.location || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      region: data.region || data.area || 'Unknown region',
      country: data.country || 'Unknown country',
      credibility: data.credibility || data.confidence || 5,
      description: data.description || data.notes || 'No details available'
    };
  }).filter(marker => marker !== null) as GlobeMarker[];
};

/**
 * Handles chunking a large dataset for better rendering performance
 * @param markers Array of markers to chunk
 * @param chunkSize Size of each chunk
 */
export const chunkDataset = <T>(markers: T[], chunkSize = 1000): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < markers.length; i += chunkSize) {
    chunks.push(markers.slice(i, i + chunkSize));
  }
  return chunks;
}; 