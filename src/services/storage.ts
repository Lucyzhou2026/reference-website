import { LiteratureItem, AppSettings, CitationStyle } from '../types';

const STORAGE_KEY = 'literature_manager_data';

interface StorageData {
  literatures: LiteratureItem[];
  settings: AppSettings;
  lastSync: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultCitationStyle: CitationStyle.APA,
  itemsPerPage: 10,
  enableAutoSave: true,
  theme: 'light'
};

const DEFAULT_DATA: StorageData = {
  literatures: [],
  settings: DEFAULT_SETTINGS,
  lastSync: Date.now()
};

export class LocalStorageService {
  private static getData(): StorageData {
    const dataStr = localStorage.getItem(STORAGE_KEY);
    if (!dataStr) {
      return DEFAULT_DATA;
    }
    try {
      return JSON.parse(dataStr);
    } catch (error) {
      console.error('Failed to parse storage data:', error);
      return DEFAULT_DATA;
    }
  }

  private static saveData(data: StorageData): void {
    data.lastSync = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  static getLiteratures(): LiteratureItem[] {
    return this.getData().literatures;
  }

  static saveLiterature(item: LiteratureItem): void {
    const data = this.getData();
    const index = data.literatures.findIndex(l => l.id === item.id);
    
    if (index >= 0) {
      data.literatures[index] = item;
    } else {
      data.literatures.push(item);
    }
    
    this.saveData(data);
  }

  static deleteLiterature(id: string): void {
    const data = this.getData();
    data.literatures = data.literatures.filter(l => l.id !== id);
    this.saveData(data);
  }

  static importLiteratures(items: LiteratureItem[]): void {
    const data = this.getData();
    // Merge logic: overwrite existing by ID, add new
    items.forEach(newItem => {
      const index = data.literatures.findIndex(l => l.id === newItem.id);
      if (index >= 0) {
        data.literatures[index] = newItem;
      } else {
        data.literatures.push(newItem);
      }
    });
    this.saveData(data);
  }
  
  static getSettings(): AppSettings {
    return this.getData().settings;
  }

  static saveSettings(settings: AppSettings): void {
    const data = this.getData();
    data.settings = settings;
    this.saveData(data);
  }

  static clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  static exportData(): string {
    return JSON.stringify(this.getData(), null, 2);
  }
}
