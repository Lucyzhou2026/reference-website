import React from 'react';
import { useApp } from '../../context/AppContext';
import { LiteratureType } from '../../types';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export const FilterPanel: React.FC = () => {
  const { state, dispatch } = useApp();
  const { activeFilters } = state;

  const handleTypeToggle = (type: LiteratureType) => {
    const currentTypes = activeFilters.types;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    dispatch({
      type: 'SET_FILTERS',
      payload: { ...activeFilters, types: newTypes }
    });
  };

  const handleYearChange = (index: 0 | 1, value: string) => {
    const numValue = parseInt(value) || 0;
    const newRange = [...activeFilters.yearRange] as [number, number];
    newRange[index] = numValue;
    
    dispatch({
      type: 'SET_FILTERS',
      payload: { ...activeFilters, yearRange: newRange }
    });
  };

  return (
    <div className="mb-8 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Filter by Type</h4>
        <div className="flex flex-wrap gap-2">
          {Object.values(LiteratureType).map(type => (
            <button
              key={type}
              onClick={() => handleTypeToggle(type)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full border transition-colors",
                activeFilters.types.includes(type)
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      
      {/* Year Range Filter - Simplified for now */}
      <div className="flex items-center space-x-4">
        <h4 className="text-sm font-medium text-gray-700">Year Range:</h4>
        <div className="flex items-center space-x-2">
            <input
              type="number"
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md"
              value={activeFilters.yearRange[0]}
              onChange={(e) => handleYearChange(0, e.target.value)}
              placeholder="Min"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md"
              value={activeFilters.yearRange[1]}
              onChange={(e) => handleYearChange(1, e.target.value)}
              placeholder="Max"
            />
        </div>
      </div>
    </div>
  );
};
