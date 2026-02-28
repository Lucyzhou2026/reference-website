import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CitationStyle, AppSettings } from '../../types';
import { Button } from '../ui/Button';
import { LocalStorageService } from '../../services/storage';
import { Download, Upload, Trash2, Save } from 'lucide-react';

export const SettingsForm: React.FC = () => {
  const { state, dispatch } = useApp();
  const { settings } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    const newSettings: AppSettings = {
      ...settings,
      [name]: name === 'itemsPerPage' ? parseInt(value) || 10 : newValue
    };

    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
  };

  const handleExport = () => {
    const dataStr = LocalStorageService.exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `literature_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.literatures && Array.isArray(json.literatures)) {
          dispatch({ type: 'IMPORT_DATA', payload: json.literatures });
          alert('Data imported successfully!');
        } else {
          alert('Invalid data format');
        }
      } catch (error) {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to delete ALL data? This action cannot be undone.')) {
      dispatch({ type: 'CLEAR_DATA' });
      alert('All data has been cleared.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
        <h2 className="text-lg font-medium text-gray-900 border-b pb-2">General Settings</h2>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Citation Style</label>
            <select
              name="defaultCitationStyle"
              value={settings.defaultCitationStyle}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {Object.values(CitationStyle).map(style => (
                <option key={style} value={style}>{style.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Items Per Page</label>
             <input
               type="number"
               name="itemsPerPage"
               value={settings.itemsPerPage}
               onChange={handleChange}
               className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
               min={1}
               max={100}
             />
          </div>

          <div className="flex items-center">
             <input
               type="checkbox"
               id="enableAutoSave"
               name="enableAutoSave"
               checked={settings.enableAutoSave}
               onChange={handleChange}
               className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
             />
             <label htmlFor="enableAutoSave" className="ml-2 block text-sm text-gray-900">
               Enable Auto Save (Changes are saved automatically)
             </label>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
        <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Data Management</h2>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleExport} variant="outline" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Export Data (JSON)
            </Button>
            <Button onClick={handleImportClick} variant="outline" className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              Import Data (JSON)
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
          
          <div className="pt-4 border-t border-gray-100">
             <Button onClick={handleClearData} variant="danger" className="w-full sm:w-auto">
               <Trash2 className="mr-2 h-4 w-4" />
               Clear All Data
             </Button>
             <p className="mt-2 text-xs text-gray-500">
               Warning: This will permanently delete all your literature data and settings.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
