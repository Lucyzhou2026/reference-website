import React from 'react';
import { LiteratureItem } from '../../types';
import { LiteratureCard } from './LiteratureCard';
import { Inbox } from 'lucide-react';

interface LiteratureListProps {
  items: LiteratureItem[];
}

export const LiteratureList: React.FC<LiteratureListProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <Inbox className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No literature found</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-sm">
          Get started by adding a new literature item or try adjusting your search filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(item => (
        <LiteratureCard key={item.id} item={item} />
      ))}
    </div>
  );
};
