import React, { useState } from 'react';
import { LiteratureItem, CitationStyle } from '../../types';
import { CitationFormatterFactory } from '../../utils/citation';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CitationPreviewProps {
  item: LiteratureItem;
}

export const CitationPreview: React.FC<CitationPreviewProps> = ({ item }) => {
  const [activeTab, setActiveTab] = useState<CitationStyle>(CitationStyle.APA);
  const [copied, setCopied] = useState(false);

  const getCitation = (style: CitationStyle) => {
    try {
      const formatter = CitationFormatterFactory.create(style);
      return formatter.format(item);
    } catch (e) {
      return 'Error generating citation';
    }
  };

  const handleCopy = () => {
    const text = getCitation(activeTab);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="sticky top-24">
      <div className="border-b border-gray-200 px-6 pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Citation Preview</h3>
        <div className="flex space-x-4 -mb-px">
          {Object.values(CitationStyle).map(style => (
            <button
              key={style}
              onClick={() => setActiveTab(style)}
              className={cn(
                "pb-2 text-sm font-medium transition-colors border-b-2",
                activeTab === style
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {style.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <CardContent className="pt-6">
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4 font-mono text-sm whitespace-pre-wrap">
          {getCitation(activeTab)}
        </div>
        <Button onClick={handleCopy} variant="outline" size="sm" className="w-full">
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
