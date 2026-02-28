import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiteratureItem, LiteratureType } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { CitationPreview } from './CitationPreview';
import { ArrowLeft, Save } from 'lucide-react';

interface LiteratureFormProps {
  initialData?: LiteratureItem;
  isNew?: boolean;
}

export const LiteratureForm: React.FC<LiteratureFormProps> = ({ initialData, isNew = false }) => {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  
  const defaultItem: LiteratureItem = {
    id: crypto.randomUUID(),
    title: '',
    authors: [],
    year: new Date().getFullYear(),
    type: LiteratureType.JOURNAL,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const [formData, setFormData] = useState<LiteratureItem>(initialData || defaultItem);
  const [authorsInput, setAuthorsInput] = useState(initialData?.authors.join(', ') || '');
  const [tagsInput, setTagsInput] = useState(initialData?.tags.join(', ') || '');

  // Update formData when initialData changes (for edit mode loading)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setAuthorsInput(initialData.authors.join(', '));
      setTagsInput(initialData.tags.join(', '));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) || 0 : value
    }));
  };

  const handleAuthorsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthorsInput(e.target.value);
    const authors = e.target.value.split(',').map(a => a.trim()).filter(a => a);
    setFormData(prev => ({ ...prev, authors }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
    const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      alert('Title is required');
      return;
    }

    const itemToSave = {
      ...formData,
      updatedAt: new Date().toISOString(),
      // Ensure authors and tags are synced if user didn't type anything new but state might be stale?
      // Actually they are synced on change.
    };

    if (isNew) {
      dispatch({ type: 'ADD_LITERATURE', payload: itemToSave });
    } else {
      dispatch({ type: 'UPDATE_LITERATURE', payload: itemToSave });
    }

    navigate('/');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="pl-0 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'Add New Literature' : 'Edit Literature'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Title *"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter literature title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {Object.values(LiteratureType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="Year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Authors (comma separated)"
                  value={authorsInput}
                  onChange={handleAuthorsChange}
                  placeholder="e.g. Smith, J., Doe, A."
                />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <Input
                  label={formData.type === LiteratureType.BOOK ? "Publisher" : "Journal / Conference"}
                  name={formData.type === LiteratureType.BOOK ? "publisher" : "journal"}
                  value={formData.type === LiteratureType.BOOK ? (formData.publisher || '') : (formData.journal || '')}
                  onChange={handleChange}
                />
              </div>

              {formData.type === LiteratureType.JOURNAL && (
                <>
                  <Input label="Volume" name="volume" value={formData.volume || ''} onChange={handleChange} />
                  <Input label="Issue" name="issue" value={formData.issue || ''} onChange={handleChange} />
                  <Input label="Pages" name="pages" value={formData.pages || ''} onChange={handleChange} />
                </>
              )}
              
              <div className="md:col-span-1">
                <Input label="DOI" name="doi" value={formData.doi || ''} onChange={handleChange} />
              </div>
               <div className="md:col-span-2">
                <Input label="URL" name="url" value={formData.url || ''} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
             <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Additional Information</h3>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Abstract</label>
               <textarea
                 name="abstract"
                 value={formData.abstract || ''}
                 onChange={handleChange}
                 rows={4}
                 className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
               />
             </div>

             <Input
               label="Tags (comma separated)"
               value={tagsInput}
               onChange={handleTagsChange}
               placeholder="e.g. research, important, v1"
             />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" size="lg">
              <Save className="mr-2 h-4 w-4" />
              Save Literature
            </Button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-1">
        <CitationPreview item={formData} />
      </div>
    </div>
  );
};
