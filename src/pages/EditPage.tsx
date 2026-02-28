import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LiteratureForm } from '../components/edit/LiteratureForm';

export const EditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state } = useApp();
  
  const isNew = !id || id === 'new';
  
  const item = useMemo(() => {
    if (isNew) return undefined;
    return state.literatures.find(l => l.id === id);
  }, [id, state.literatures, isNew]);

  if (!isNew && !item && !state.loading) {
    return <div className="text-center py-10">Literature item not found.</div>;
  }

  return (
    <div>
      <LiteratureForm initialData={item} isNew={isNew} />
    </div>
  );
};
