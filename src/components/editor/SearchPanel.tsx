import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader, ChevronDown, ChevronUp, AlertCircle, ExternalLink, Quote, FileText, BarChart2, BookOpen, Link as LinkIcon, Sparkles, X } from 'lucide-react';
import { literatureService } from '../../services/literatureService';
import { LiteratureMetadata } from '../../types';

const SearchPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LiteratureMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

  // Handle Search
  const handleSearch = async (newPage = 1) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setSelectedPaperId(null); // Reset selection
    if (newPage === 1) setResults([]);

    try {
      const { results: newResults, total: totalCount } = await literatureService.searchOpenAlex(query, newPage);
      
      if (newResults.length === 0) {
        setError('No matching literature found. Please refine your keywords.');
        setResults([]);
      } else {
        setResults(newResults);
        setTotal(totalCount);
        setPage(newPage);
        
        // Trigger analysis for all results in background
        newResults.forEach(paper => triggerAnalysis(paper));
      }
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger AI Analysis for a paper
  const triggerAnalysis = async (paper: LiteratureMetadata) => {
    // Update status to loading locally first
    setResults(prev => prev.map(p => 
      p.id === paper.id ? { ...p, analysisStatus: 'loading' } : p
    ));

    try {
      const analyzedPaper = await literatureService.analyzePaper(paper, query);
      setResults(prev => prev.map(p => 
        p.id === paper.id ? analyzedPaper : p
      ));
    } catch (error) {
      console.error("Analysis failed for", paper.id, error);
      setResults(prev => prev.map(p => 
        p.id === paper.id ? { ...p, analysisStatus: 'failed' } : p
      ));
    }
  };

  const selectedPaper = results.find(p => p.id === selectedPaperId);

  return (
    <div className="h-full flex flex-col bg-gray-50 font-sans">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
           <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">E</div>
           <h2 className="text-xl font-bold text-gray-900 tracking-tight">Literature Search</h2>
        </div>
        
        <div className="flex gap-2 relative">
          <div className="flex-1 relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
              placeholder="Provide your keywords, claims, research questions to search relevant academic literature..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-gray-800 placeholder-gray-400 shadow-sm group-hover:bg-white"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5 group-hover:text-teal-600 transition-colors" />
          </div>
          <button
            onClick={() => handleSearch(1)}
            disabled={loading}
            className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:bg-teal-300 flex items-center shadow-md transition-all active:scale-95"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
            Search
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex relative">
        {/* Results List */}
        <div className={`flex-1 overflow-auto p-6 transition-all duration-300 ${selectedPaperId ? 'w-2/3 pr-2' : 'w-full'}`}>
          
          {error && (
            <div className="flex items-center p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-6 animate-in fade-in slide-in-from-top-2 shadow-sm">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              {error}
            </div>
          )}

          {results.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                <div className="col-span-5 p-4 border-r border-gray-200">Paper Details</div>
                <div className="col-span-7 p-4">Summary & Relevance</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100">
                {results.map((paper, index) => (
                  <div 
                    key={paper.id || index} 
                    className={`grid grid-cols-12 transition-colors cursor-pointer group ${
                      selectedPaperId === paper.id ? 'bg-teal-50/50 ring-1 ring-inset ring-teal-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPaperId(paper.id || null)}
                  >
                    
                    {/* Left Column: Paper Metadata */}
                    <div className="col-span-5 p-4 border-r border-gray-100 flex flex-col gap-1.5">
                      <h3 className="font-semibold text-gray-900 leading-snug text-sm group-hover:text-teal-700 transition-colors">
                        {paper.title}
                      </h3>
                      
                      <div className="text-xs text-gray-500">
                        {paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 && ' et al.'}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400 mt-1">
                        <span className="font-medium text-gray-600">{paper.year}</span>
                        {paper.journal && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-[150px]">{paper.journal}</span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                          paper.type?.toLowerCase().includes('article') 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {paper.type}
                        </span>
                        
                        {paper.citationCount !== undefined && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-1">
                            <BarChart2 size={10} />
                            {paper.citationCount}
                          </span>
                        )}

                        {paper.isOpenAccess && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-50 text-orange-700 border border-orange-100">
                            Full Text
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Column: AI Analysis */}
                    <div className="col-span-7 p-4 relative flex items-start">
                      {paper.analysisStatus === 'loading' || paper.analysisStatus === 'pending' ? (
                        <div className="flex items-center gap-2 text-gray-400 animate-pulse mt-1">
                          <div className="h-2 w-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                          <div className="h-2 w-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="h-2 w-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <span className="text-xs ml-1 font-medium">Analyzing...</span>
                        </div>
                      ) : paper.analysisStatus === 'failed' ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-red-400 text-xs flex items-center gap-1">
                            <AlertCircle size={12} /> Analysis unavailable
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerAnalysis(paper);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {paper.summary}
                            <Sparkles size={12} className="inline-block ml-1 text-teal-500 fill-teal-100" />
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-xs text-gray-500 font-medium">
                  {total > 0 && (
                    <>Showing <span className="text-gray-900">{(page - 1) * 8 + 1}-{Math.min(page * 8, total)}</span> of <span className="text-gray-900">{total}</span></>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSearch(page - 1)}
                    disabled={page === 1 || loading}
                    className="px-3 py-1.5 border border-gray-200 rounded-md bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleSearch(page + 1)}
                    disabled={page * 8 >= total || loading}
                    className="px-3 py-1.5 border border-gray-200 rounded-md bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          ) : (
            !loading && !error && (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-6">
                  <Search className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Academic Discovery</h3>
                <p className="text-gray-500 max-w-sm text-sm leading-relaxed mb-8">
                  Enter your research claim or question. We'll find relevant papers and extract supporting evidence for you.
                </p>
              </div>
            )
          )}
        </div>

        {/* Right Detail Panel (Drawer) */}
        {selectedPaper && (
          <div className="w-[400px] border-l border-gray-200 bg-white flex flex-col h-full shadow-xl z-10">
             {/* Drawer Header */}
             <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
               <h3 className="font-semibold text-gray-800 text-sm">Result Details</h3>
               <button 
                 onClick={() => setSelectedPaperId(null)}
                 className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
               >
                 <X size={18} />
               </button>
             </div>

             {/* Drawer Content */}
             <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* Section 1: Supporting Quotes */}
                <div>
                   <div className="flex items-center gap-2 mb-3">
                      <Quote size={16} className="text-teal-600" />
                      <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Supporting quotes</h4>
                   </div>
                   
                   <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 relative">
                      <div className="absolute -left-1 top-6 w-1 h-8 bg-teal-400 rounded-r"></div>
                      <p className="text-gray-800 text-sm italic leading-relaxed">
                        "{selectedPaper.supportingQuote || 'No direct quote available from the abstract.'}"
                      </p>
                   </div>
                </div>

                {/* Section 2: Explanation */}
                <div>
                   <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className="text-blue-600" />
                      <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Explanation</h4>
                   </div>
                   <div className="prose prose-sm text-gray-600 leading-relaxed text-sm">
                      {selectedPaper.explanation || selectedPaper.summary}
                   </div>
                </div>

                {/* Section 3: External Links */}
                <div className="pt-4 border-t border-gray-100">
                   <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide mb-3">External Resources</h4>
                   <div className="flex flex-col gap-2">
                      {selectedPaper.doi && (
                        <a 
                          href={`https://doi.org/${selectedPaper.doi}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                        >
                          <ExternalLink size={14} />
                          View Publisher Version (DOI)
                        </a>
                      )}
                      {selectedPaper.url && (
                        <a 
                          href={selectedPaper.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                        >
                          <BookOpen size={14} />
                          View Source Record
                        </a>
                      )}
                      {/* Simulated Links for Google Scholar etc */}
                      <a 
                        href={`https://scholar.google.com/scholar?q=${encodeURIComponent(selectedPaper.title)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                      >
                        <LinkIcon size={14} />
                        Search on Google Scholar
                      </a>
                      <a 
                        href={`https://sci-hub.se/${selectedPaper.doi || selectedPaper.title}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                      >
                        <LinkIcon size={14} />
                        Search on Sci-Hub
                      </a>
                   </div>
                </div>

             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SearchPanel;
