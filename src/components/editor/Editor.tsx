import React, { useState } from 'react';
import { Upload, Play, Search, PenTool, CheckCircle, ArrowLeft } from 'lucide-react';
import { Citation } from '../../types';
import mammoth from 'mammoth';
import SearchPanel from './SearchPanel';
import WritePanel from './WritePanel';

export type Tab = 'search' | 'write' | 'check';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  citations: Citation[];
  highlightedId: string | null;
  onCitationClick: (citation: Citation) => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const Editor: React.FC<EditorProps> = ({ 
  content, 
  onChange, 
  onAnalyze, 
  citations,
  highlightedId,
  onCitationClick,
  activeTab,
  onTabChange
}) => {
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.txt')) {
      const text = await file.text();
      onChange(text);
    } else if (file.name.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        onChange(result.value);
        if (result.messages.length > 0) {
          console.warn("Mammoth messages:", result.messages);
        }
      } catch (error) {
        console.error("Failed to parse docx:", error);
        alert("Failed to parse DOCX file. Please make sure it's a valid Word document.");
      }
    } else if (file.name.endsWith('.pdf')) {
        alert("PDF support is currently experimental. Please copy-paste text or use DOCX/TXT.");
    }
  };

  // Generate highlighted content for check mode
  const renderHighlightedContent = () => {
    if (citations.length === 0) return <div className="whitespace-pre-wrap font-serif text-gray-800">{content}</div>;

    const sortedCitations = [...citations].sort((a, b) => a.index - b.index);
    const elements = [];
    let lastIndex = 0;

    sortedCitations.forEach((cit) => {
      // Add text before citation
      if (cit.index > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, cit.index)}
          </span>
        );
      }

      // Add highlighted citation
      const isSelected = cit.id === highlightedId;
      const colorClass = 
        cit.matchStatus === 'missing' ? 'bg-orange-200 text-orange-800 border-b-2 border-orange-400' :
        cit.matchStatus === 'unused' ? 'bg-yellow-100 text-yellow-800' :
        'bg-green-100 text-green-800 border-b-2 border-green-400';

      const handleCitationClick = (e: React.MouseEvent) => {
         e.stopPropagation();
         if (cit.type === 'in-text') {
           onCitationClick(cit);
         }
      };

      const isReference = cit.type === 'reference';
      
      elements.push(
        <span
          key={cit.id}
          className={`${!isReference ? 'cursor-pointer' : ''} px-1 rounded ${colorClass} ${isSelected && !isReference ? 'ring-2 ring-offset-1 ring-green-500' : ''}`}
          onClick={handleCitationClick}
          title={isReference ? 'Reference Entry' : 'In-Text Citation'}
        >
          {content.substring(cit.index, cit.index + cit.length)}
        </span>
      );

      lastIndex = cit.index + cit.length;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      );
    }

    return <div className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed">{elements}</div>;
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onTabChange('search')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center ${activeTab === 'search' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Search className="w-4 h-4 mr-2" /> Search
          </button>
          <button
            onClick={() => onTabChange('write')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center ${activeTab === 'write' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <PenTool className="w-4 h-4 mr-2" /> Write
          </button>
          <button
            onClick={() => onTabChange('check')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center ${activeTab === 'check' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Check
          </button>
        </div>
        
        {activeTab === 'check' && (
          <div className="flex space-x-2">
            <label className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
              <Upload className="w-4 h-4 mr-2" />
              Import
              <input type="file" className="hidden" accept=".txt,.docx,.pdf" onChange={handleFileUpload} />
            </label>
            
            {isAnalyzed ? (
               <button 
                onClick={() => setIsAnalyzed(false)}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Edit Text
              </button>
            ) : (
              <button 
                onClick={() => {
                  onAnalyze();
                  setIsAnalyzed(true);
                }}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Analyze
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 relative overflow-auto bg-white">
        {activeTab === 'search' && <SearchPanel />}
        {activeTab === 'write' && <WritePanel />}
        {activeTab === 'check' && (
          <div className="h-full w-full p-8">
            {!isAnalyzed ? (
              <textarea
                className="w-full h-full p-4 text-base leading-relaxed resize-none focus:outline-none font-serif text-gray-800"
                placeholder="Paste your academic paper here (including References)..."
                value={content}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
              />
            ) : (
              <div className="h-full w-full">
                {renderHighlightedContent()}
              </div>
            )}
          </div>
        )}
      </div>
      
    </div>
  );
};

export default Editor;
