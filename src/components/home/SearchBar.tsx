import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { useApp } from '../../context/AppContext';

export const SearchBar: React.FC = () => {
  const { state, dispatch } = useApp();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value });
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder="Search by title, author, or tags..."
        className="pl-10 h-12 text-lg shadow-sm"
        value={state.searchQuery}
        onChange={handleSearch}
      />
    </div>
  );
};
