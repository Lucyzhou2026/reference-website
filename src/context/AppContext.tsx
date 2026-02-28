import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { LiteratureItem, AppSettings, FilterOptions, LiteratureType, CitationStyle } from '../types';
import { LocalStorageService } from '../services/storage';

interface AppState {
  literatures: LiteratureItem[];
  filteredItems: LiteratureItem[];
  searchQuery: string;
  activeFilters: FilterOptions;
  settings: AppSettings;
  loading: boolean;
  error: string | null;
}

const initialState: AppState = {
  literatures: [],
  filteredItems: [],
  searchQuery: '',
  activeFilters: {
    search: '',
    types: [],
    yearRange: [1900, new Date().getFullYear()],
    tags: []
  },
  settings: {
    defaultCitationStyle: CitationStyle.APA,
    itemsPerPage: 10,
    enableAutoSave: true,
    theme: 'light'
  },
  loading: true,
  error: null
};

type Action =
  | { type: 'LOAD_DATA'; payload: { literatures: LiteratureItem[]; settings: AppSettings } }
  | { type: 'ADD_LITERATURE'; payload: LiteratureItem }
  | { type: 'UPDATE_LITERATURE'; payload: LiteratureItem }
  | { type: 'DELETE_LITERATURE'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTERS'; payload: FilterOptions }
  | { type: 'UPDATE_SETTINGS'; payload: AppSettings }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'IMPORT_DATA'; payload: LiteratureItem[] }
  | { type: 'CLEAR_DATA' };

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...state,
        literatures: action.payload.literatures,
        settings: action.payload.settings,
        filteredItems: action.payload.literatures, // Initial filter is all
        loading: false
      };
    case 'ADD_LITERATURE': {
      const newLiteratures = [...state.literatures, action.payload];
      LocalStorageService.saveLiterature(action.payload);
      return {
        ...state,
        literatures: newLiteratures,
        filteredItems: applySearchAndFilter(newLiteratures, state.searchQuery, state.activeFilters)
      };
    }
    case 'UPDATE_LITERATURE': {
      const updatedLiteratures = state.literatures.map(item =>
        item.id === action.payload.id ? action.payload : item
      );
      LocalStorageService.saveLiterature(action.payload);
      return {
        ...state,
        literatures: updatedLiteratures,
        filteredItems: applySearchAndFilter(updatedLiteratures, state.searchQuery, state.activeFilters)
      };
    }
    case 'DELETE_LITERATURE': {
      const remainingLiteratures = state.literatures.filter(item => item.id !== action.payload);
      LocalStorageService.deleteLiterature(action.payload);
      return {
        ...state,
        literatures: remainingLiteratures,
        filteredItems: applySearchAndFilter(remainingLiteratures, state.searchQuery, state.activeFilters)
      };
    }
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
        filteredItems: applySearchAndFilter(state.literatures, action.payload, state.activeFilters)
      };
    case 'SET_FILTERS':
      return {
        ...state,
        activeFilters: action.payload,
        filteredItems: applySearchAndFilter(state.literatures, state.searchQuery, action.payload)
      };
    case 'UPDATE_SETTINGS':
      LocalStorageService.saveSettings(action.payload);
      return {
        ...state,
        settings: action.payload
      };
    case 'IMPORT_DATA':
      LocalStorageService.importLiteratures(action.payload);
      // Reload to get merged state properly or just append
      // For simplicity, we assume importLiteratures handles storage merge, we just reload from storage or merge in state
      // Let's reload from storage to be safe or just merge in state.
      // Since LocalStorageService.importLiteratures merges, let's re-read or manually merge.
      // Re-reading is safer but synchronous here.
      const allLiteratures = LocalStorageService.getLiteratures();
      return {
        ...state,
        literatures: allLiteratures,
        filteredItems: applySearchAndFilter(allLiteratures, state.searchQuery, state.activeFilters)
      };
    case 'CLEAR_DATA':
      LocalStorageService.clearAll();
      return {
        ...state,
        literatures: [],
        filteredItems: []
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// Helper function for search and filter
const applySearchAndFilter = (
  items: LiteratureItem[],
  query: string,
  filters: FilterOptions
): LiteratureItem[] => {
  let result = items;

  // Search
  if (query) {
    const lowerQuery = query.toLowerCase();
    result = result.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.authors.some(a => a.toLowerCase().includes(lowerQuery)) ||
      item.abstract?.toLowerCase().includes(lowerQuery) ||
      item.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  // Filter
  if (filters.types.length > 0) {
    result = result.filter(item => filters.types.includes(item.type as LiteratureType));
  }

  if (filters.yearRange) {
    result = result.filter(item => item.year >= filters.yearRange[0] && item.year <= filters.yearRange[1]);
  }
  
  if (filters.tags.length > 0) {
    result = result.filter(item => filters.tags.some(tag => item.tags.includes(tag)));
  }

  return result;
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const loadData = () => {
      try {
        const literatures = LocalStorageService.getLiteratures();
        const settings = LocalStorageService.getSettings();
        dispatch({ type: 'LOAD_DATA', payload: { literatures, settings } });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load data from storage' });
      }
    };
    loadData();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
