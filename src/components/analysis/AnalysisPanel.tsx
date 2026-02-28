import React from 'react';
import { Citation, LiteratureMetadata } from '../../types';
import { AlertCircle, CheckCircle, HelpCircle, ExternalLink, Download, Calendar, BookOpen, Link as LinkIcon, Globe, Clipboard } from 'lucide-react';

interface AnalysisPanelProps {
  citations: Citation[];
  missingCitations: Citation[];
  unusedReferences: Citation[];
  onCitationClick: (citation: Citation) => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  citations,
  missingCitations,
  unusedReferences,
  onCitationClick
}) => {
  const inTextCitations = citations.filter(c => c.type === 'in-text');
  
  const handleExportBibTeX = () => {
    // Generate BibTeX content
    const references = citations.filter(c => c.type === 'reference' || (c.type === 'in-text' && c.metadata));
    const bibContent = references.map((ref, index) => {
      const meta = ref.metadata || {
        title: ref.title,
        authors: ref.authors,
        year: ref.year,
        journal: ref.journal,
        doi: ref.doi
      };
      
      const key = `${meta.authors?.[0]?.split(' ').pop() || 'Unknown'}${meta.year || '0000'}${index}`;
      return `@article{${key},
  title={${meta.title || 'Unknown Title'}},
  author={${meta.authors?.join(' and ') || 'Unknown Author'}},
  journal={${meta.journal || 'Unknown Journal'}},
  year={${meta.year || '0000'}},
  doi={${meta.doi || ''}}
}`;
    }).join('\n\n');
    
    const blob = new Blob([bibContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'references.bib';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const copyBibTeX = (e: React.MouseEvent, cit: Citation) => {
      e.stopPropagation();
      // Heuristic construction
      const meta = cit.metadata || {
          title: cit.title,
          authors: cit.authors,
          year: cit.year,
          journal: cit.journal,
          doi: cit.doi
      };
      const key = `${meta.authors?.[0]?.split(' ').pop() || 'Unknown'}${meta.year || '0000'}`;
      const bib = `@article{${key},
  title={${meta.title || 'Unknown Title'}},
  author={${meta.authors?.join(' and ') || 'Unknown Author'}},
  journal={${meta.journal || 'Unknown Journal'}},
  year={${meta.year || '0000'}},
  doi={${meta.doi || ''}}
}`;
      navigator.clipboard.writeText(bib);
      alert('BibTeX copied to clipboard!');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-l border-gray-200">
      <div className="px-4 py-3 border-b bg-white flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">Analysis Results</h2>
        <div className="flex space-x-2">
           <button 
             onClick={handleExportBibTeX}
             className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
             title="Export BibTeX"
           >
             <Download className="w-4 h-4" />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <div className="text-sm text-gray-500">In-Text Citations</div>
            <div className="text-2xl font-bold text-blue-600">{inTextCitations.length}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <div className="text-sm text-gray-500">References</div>
            <div className="text-2xl font-bold text-green-600">{citations.filter(c => c.type === 'reference').length}</div>
          </div>
        </div>

        {/* Missing Citations Warning */}
        {missingCitations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center text-orange-600 font-medium">
              <AlertCircle className="w-4 h-4 mr-2" />
              Missing References ({missingCitations.length})
            </div>
            {missingCitations.map(cit => (
              <div 
                key={cit.id}
                className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm cursor-pointer hover:bg-orange-100 transition-colors"
                onClick={() => onCitationClick(cit)}
              >
                <div className="font-medium text-gray-800">{cit.rawText}</div>
                <div className="text-gray-500 text-xs mt-1">Found in text but not in reference list</div>
                {cit.metadata && (
                  <div className="mt-2 pt-2 border-t border-orange-200">
                    <div className="text-xs text-blue-600 font-semibold flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Found online:
                    </div>
                    <div className="text-xs text-gray-700">{cit.metadata.title}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Unused References Warning */}
        {unusedReferences.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center text-yellow-600 font-medium">
              <HelpCircle className="w-4 h-4 mr-2" />
              Unused References ({unusedReferences.length})
            </div>
            {unusedReferences.map(ref => (
              <div 
                key={ref.id}
                className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm"
              >
                <div className="font-medium text-gray-800">{ref.title || ref.rawText.substring(0, 50) + '...'}</div>
                <div className="text-gray-500 text-xs mt-1">In reference list but never cited</div>
              </div>
            ))}
          </div>
        )}

        {/* Valid Citations List */}
        <div className="space-y-4">
           <div className="flex items-center text-green-600 font-medium mb-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              Matched Citations
            </div>
            {inTextCitations.filter(c => c.matchStatus === 'matched').map(cit => {
               // Determine metadata source
               const linkedRef = citations.find(r => 
                  r.type === 'reference' && 
                  r.year === cit.year && 
                  r.authors.some(refAuth => cit.authors.some(citAuth => refAuth.includes(citAuth) || citAuth.includes(refAuth)))
               );
               
               const meta = cit.metadata || (linkedRef ? {
                  title: linkedRef.title || 'Unknown Title',
                  authors: linkedRef.authors,
                  year: linkedRef.year,
                  journal: linkedRef.journal, // Often undefined in basic parse
                  doi: linkedRef.doi
               } : null);

               const doi = meta?.doi;
               const url = meta?.url || (doi ? `https://doi.org/${doi}` : undefined);
               
               // Fallback title if meta title is empty
               const displayTitle = meta?.title || cit.rawText;
               const displayAuthors = meta?.authors?.join('; ') || cit.authors.join('; ');
               const displayJournal = meta?.journal || 'Journal'; 

               // Card click handler: Open DOI if available, otherwise just select
               const handleCardClick = (e: React.MouseEvent) => {
                 if (url) {
                   // Open DOI/URL
                   window.open(url, '_blank');
                 } else {
                   // Just select if no link
                   onCitationClick(cit);
                 }
               };

               return (
                <div 
                  key={cit.id}
                  className="bg-white border border-[#E6E9EF] rounded-[14px] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_3px_10px_rgba(0,0,0,0.08)] transition-shadow cursor-pointer block text-left"
                  onClick={handleCardClick}
                >
                  {/* 1. Title */}
                  <div className="text-[#0A2A5E] font-bold text-[20px] leading-[1.3] mb-2">
                    {displayTitle}
                  </div>

                  {/* 2. Authors */}
                  <div className="text-[#5B6573] text-[14px] mb-2.5 leading-normal">
                    {displayAuthors}
                  </div>

                  {/* 3. Metadata Pills */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {/* Year Pill */}
                    {meta?.year && (
                      <div className="inline-flex items-center gap-1.5 bg-[#F1F3F5] text-[#5B6573] px-2.5 py-1.5 rounded-full text-[13px] leading-none whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 opacity-90 text-red-400" />
                        {meta.year}
                      </div>
                    )}
                    
                    {/* Journal Pill */}
                    {displayJournal && (
                      <div className="inline-flex items-center gap-1.5 bg-[#F1F3F5] text-[#5B6573] px-2.5 py-1.5 rounded-full text-[13px] leading-none whitespace-nowrap">
                        <BookOpen className="w-3.5 h-3.5 opacity-90 text-blue-500" />
                        {displayJournal}
                      </div>
                    )}

                    {/* DOI Pill */}
                    {doi && (
                       <div className="inline-flex items-center gap-1.5 bg-[#F1F3F5] text-[#5B6573] px-2.5 py-1.5 rounded-full text-[13px] leading-none whitespace-nowrap max-w-full truncate" title={doi}>
                        <LinkIcon className="w-3.5 h-3.5 opacity-90 text-gray-400" />
                        DOI: {doi}
                      </div>
                    )}
                  </div>

                  {/* 4. Action Buttons */}
                  <div className="flex gap-2.5 mt-3" onClick={(e) => e.stopPropagation()}>
                    <a 
                      href={url || '#'}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-3 py-2 border border-[#D8DDE6] rounded-full bg-white text-[#394150] text-[14px] no-underline hover:bg-[#fafbfc] transition-colors ${!url ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Open Paper Page
                    </a>
                    
                    <button 
                      type="button"
                      onClick={(e) => copyBibTeX(e, cit)}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-[#D8DDE6] rounded-full bg-white text-[#394150] text-[14px] hover:bg-[#fafbfc] transition-colors"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      Copy BibTeX
                    </button>
                  </div>
                </div>
               );
            })}
        </div>

      </div>
    </div>
  );
};

export default AnalysisPanel;
