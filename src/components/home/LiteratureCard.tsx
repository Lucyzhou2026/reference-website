import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Copy, Check, FileText } from 'lucide-react';
import { LiteratureItem, LiteratureType } from '../../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { CitationFormatterFactory } from '../../utils/citation';

interface LiteratureCardProps {
  item: LiteratureItem;
}

export const LiteratureCard: React.FC<LiteratureCardProps> = ({ item }) => {
  const { dispatch, state } = useApp();
  const [copied, setCopied] = useState(false);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this item?')) {
      dispatch({ type: 'DELETE_LITERATURE', payload: item.id });
    }
  };

  const handleCopyCitation = () => {
    const formatter = CitationFormatterFactory.create(state.settings.defaultCitationStyle);
    const citation = formatter.format(item);
    navigator.clipboard.writeText(citation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getTypeIcon = (type: LiteratureType | string) => {
    // You can add specific icons for each type if desired
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <div className="mt-1">{getTypeIcon(item.type)}</div>
            <div>
              <CardTitle className="text-lg line-clamp-2" title={item.title}>
                {item.title}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {item.authors.join(', ')} ({item.year})
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
            {item.type}
          </span>
          {item.tags.map(tag => (
            <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
              {tag}
            </span>
          ))}
        </div>
        {item.journal && (
          <p className="text-sm text-gray-600 italic mb-1">{item.journal}</p>
        )}
      </CardContent>
      <CardFooter className="justify-end space-x-2 pt-2 border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyCitation}
          title="Copy Citation"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Link to={`/edit/${item.id}`}>
          <Button variant="ghost" size="sm" title="Edit">
            <Edit2 className="h-4 w-4" />
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600" title="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
