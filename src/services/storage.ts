/**
 * IndexedDB Storage Service
 *
 * Uses Dexie.js to manage recordings in IndexedDB.
 * Provides CRUD operations for Recording objects.
 */

import Dexie, { Table } from 'dexie';
import { Recording, FilterOptions } from '../types';

/**
 * Generate searchable text from recording data
 * Normalizes and combines all searchable fields
 */
const generateSearchText = (recording: Partial<Recording>): string => {
  const parts = [
    recording.filename || '',
    recording.customName || '',
    recording.transcript || '',
    recording.notes || '',
    recording.subject || '',
    recording.category || '',
    ...(recording.tags || []),
  ];

  return parts
    .join(' ')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
};

/**
 * Database class extending Dexie
 * Defines the schema for the recordings table
 */
class RecordingsDatabase extends Dexie {
  // TypeScript table definition
  recordings!: Table<Recording, number>;

  constructor() {
    super('LectureRecordingsDB');

    // Define schema version 1
    // Index on id (auto-increment), date, and status for efficient queries
    this.version(1).stores({
      recordings: '++id, date, status',
    });

    // Define schema version 2 - Enhanced organization features
    // Added indexes: category, *tags (multi-entry), isStudied, priority
    this.version(2).stores({
      recordings: '++id, date, status, category, *tags, isStudied, priority',
    }).upgrade(async (trans) => {
      // Migration function: populate new fields with defaults for existing recordings
      const recordings = await trans.table('recordings').toArray();

      for (const recording of recordings) {
        const updates: Partial<Recording> = {
          tags: [],
          isStudied: false,
          lastModified: recording.date,
          // Generate searchText from existing data
          searchText: generateSearchText(recording),
        };

        await trans.table('recordings').update(recording.id!, updates);
      }
    });
  }
}

// Create single database instance to be used throughout the app
export const db = new RecordingsDatabase();

/**
 * Save a new recording to the database
 * @param recording - Recording object without id (will be auto-generated)
 * @returns Promise resolving to the new recording's id
 */
export const saveRecording = async (recording: Omit<Recording, 'id'>): Promise<number> => {
  try {
    const id = await db.recordings.add(recording as Recording);
    return id;
  } catch (error) {
    console.error('Error saving recording:', error);
    throw new Error('Failed to save recording to database');
  }
};

/**
 * Get all recordings from the database
 * Sorted by date in descending order (newest first)
 * @returns Promise resolving to array of recordings
 */
export const getAllRecordings = async (): Promise<Recording[]> => {
  try {
    // orderBy('date').reverse() sorts newest first
    const recordings = await db.recordings.orderBy('date').reverse().toArray();
    return recordings;
  } catch (error) {
    console.error('Error fetching recordings:', error);
    throw new Error('Failed to fetch recordings from database');
  }
};

/**
 * Get a single recording by id
 * @param id - Recording id
 * @returns Promise resolving to the recording or undefined if not found
 */
export const getRecording = async (id: number): Promise<Recording | undefined> => {
  try {
    const recording = await db.recordings.get(id);
    return recording;
  } catch (error) {
    console.error('Error fetching recording:', error);
    throw new Error('Failed to fetch recording from database');
  }
};

/**
 * Update an existing recording
 * @param id - Recording id
 * @param updates - Partial recording object with fields to update
 * @returns Promise resolving to the number of updated records (1 or 0)
 */
export const updateRecording = async (
  id: number,
  updates: Partial<Omit<Recording, 'id'>>
): Promise<number> => {
  try {
    const updated = await db.recordings.update(id, updates);
    return updated;
  } catch (error) {
    console.error('Error updating recording:', error);
    throw new Error('Failed to update recording in database');
  }
};

/**
 * Delete a recording from the database
 * @param id - Recording id
 * @returns Promise resolving when deletion is complete
 */
export const deleteRecording = async (id: number): Promise<void> => {
  try {
    await db.recordings.delete(id);
  } catch (error) {
    console.error('Error deleting recording:', error);
    throw new Error('Failed to delete recording from database');
  }
};

/**
 * Check database storage quota usage
 * Useful for warning users when approaching storage limits
 * @returns Promise resolving to storage estimate or null if not supported
 */
export const checkStorageQuota = async (): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
} | null> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

      return { usage, quota, percentUsed };
    } catch (error) {
      console.error('Error checking storage quota:', error);
      return null;
    }
  }
  return null;
};

// ============================================================================
// Phase 1A: Enhanced Query Functions
// ============================================================================

/**
 * Search recordings by text query
 * Searches across filename, customName, transcript, notes, subject, category, tags
 * @param query - Search query string
 * @returns Promise resolving to array of matching recordings
 */
export const searchRecordings = async (query: string): Promise<Recording[]> => {
  try {
    if (!query.trim()) {
      return getAllRecordings();
    }

    const normalizedQuery = query.toLowerCase().trim();
    const allRecordings = await db.recordings.toArray();

    return allRecordings.filter((recording) => {
      // Ensure searchText is up to date
      const searchText = recording.searchText || generateSearchText(recording);
      return searchText.includes(normalizedQuery);
    });
  } catch (error) {
    console.error('Error searching recordings:', error);
    throw new Error('Failed to search recordings');
  }
};

/**
 * Get recordings by tags (OR logic - matches any of the provided tags)
 * @param tags - Array of tag strings
 * @returns Promise resolving to array of recordings with any of the tags
 */
export const getRecordingsByTags = async (tags: string[]): Promise<Recording[]> => {
  try {
    if (tags.length === 0) {
      return [];
    }

    const recordings = await db.recordings
      .where('tags')
      .anyOf(tags)
      .toArray();

    return recordings;
  } catch (error) {
    console.error('Error fetching recordings by tags:', error);
    throw new Error('Failed to fetch recordings by tags');
  }
};

/**
 * Get recordings by category
 * @param category - Category string
 * @returns Promise resolving to array of recordings in that category
 */
export const getRecordingsByCategory = async (category: string): Promise<Recording[]> => {
  try {
    const recordings = await db.recordings
      .where('category')
      .equals(category)
      .toArray();

    return recordings;
  } catch (error) {
    console.error('Error fetching recordings by category:', error);
    throw new Error('Failed to fetch recordings by category');
  }
};

/**
 * Get recordings within a date range
 * @param start - Start date
 * @param end - End date
 * @returns Promise resolving to array of recordings within the date range
 */
export const getRecordingsByDateRange = async (
  start: Date,
  end: Date
): Promise<Recording[]> => {
  try {
    const recordings = await db.recordings
      .where('date')
      .between(start, end, true, true)
      .toArray();

    return recordings;
  } catch (error) {
    console.error('Error fetching recordings by date range:', error);
    throw new Error('Failed to fetch recordings by date range');
  }
};

/**
 * Filter recordings by multiple criteria
 * All filters are combined with AND logic
 * @param filters - FilterOptions object
 * @returns Promise resolving to array of filtered recordings
 */
export const filterRecordings = async (filters: FilterOptions): Promise<Recording[]> => {
  try {
    let recordings = await db.recordings.toArray();

    // Apply search query filter
    if (filters.searchQuery?.trim()) {
      const normalizedQuery = filters.searchQuery.toLowerCase().trim();
      recordings = recordings.filter((rec) => {
        const searchText = rec.searchText || generateSearchText(rec);
        return searchText.includes(normalizedQuery);
      });
    }

    // Apply tags filter (OR logic - matches any tag)
    if (filters.tags && filters.tags.length > 0) {
      recordings = recordings.filter((rec) => {
        return rec.tags?.some((tag) => filters.tags!.includes(tag));
      });
    }

    // Apply category filter
    if (filters.category) {
      recordings = recordings.filter((rec) => rec.category === filters.category);
    }

    // Apply status filter
    if (filters.status) {
      recordings = recordings.filter((rec) => rec.status === filters.status);
    }

    // Apply isStudied filter
    if (filters.isStudied !== undefined) {
      recordings = recordings.filter((rec) => rec.isStudied === filters.isStudied);
    }

    // Apply priority filter
    if (filters.priority) {
      recordings = recordings.filter((rec) => rec.priority === filters.priority);
    }

    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      recordings = recordings.filter((rec) => {
        const recDate = new Date(rec.date);
        const afterStart = !filters.dateFrom || recDate >= filters.dateFrom;
        const beforeEnd = !filters.dateTo || recDate <= filters.dateTo;
        return afterStart && beforeEnd;
      });
    }

    // Sort by date descending (newest first)
    recordings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return recordings;
  } catch (error) {
    console.error('Error filtering recordings:', error);
    throw new Error('Failed to filter recordings');
  }
};

/**
 * Get all unique tags from all recordings
 * @returns Promise resolving to sorted array of unique tag strings
 */
export const getAllTags = async (): Promise<string[]> => {
  try {
    const recordings = await db.recordings.toArray();
    const tagsSet = new Set<string>();

    recordings.forEach((rec) => {
      rec.tags?.forEach((tag) => tagsSet.add(tag));
    });

    return Array.from(tagsSet).sort();
  } catch (error) {
    console.error('Error fetching all tags:', error);
    throw new Error('Failed to fetch all tags');
  }
};

/**
 * Get all unique categories from all recordings
 * @returns Promise resolving to sorted array of unique category strings
 */
export const getAllCategories = async (): Promise<string[]> => {
  try {
    const recordings = await db.recordings.toArray();
    const categoriesSet = new Set<string>();

    recordings.forEach((rec) => {
      if (rec.category) {
        categoriesSet.add(rec.category);
      }
    });

    return Array.from(categoriesSet).sort();
  } catch (error) {
    console.error('Error fetching all categories:', error);
    throw new Error('Failed to fetch all categories');
  }
};

/**
 * Update searchText for a recording
 * Should be called after updating transcript, notes, or other searchable fields
 * @param id - Recording id
 */
export const updateSearchText = async (id: number): Promise<void> => {
  try {
    const recording = await db.recordings.get(id);
    if (recording) {
      const searchText = generateSearchText(recording);
      await db.recordings.update(id, { searchText });
    }
  } catch (error) {
    console.error('Error updating search text:', error);
    throw new Error('Failed to update search text');
  }
};
