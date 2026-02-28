import React, { useState } from 'react';
import SplitLayout from './components/layout/SplitLayout';
import Editor, { Tab } from './components/editor/Editor';
import AnalysisPanel from './components/analysis/AnalysisPanel';
import { parseCitations } from './utils/citationParser';
import { literatureService } from './services/literatureService';
import { Citation, ParseResult } from './types';
import { supabase } from './lib/supabase';

// Sample text from user input
const SAMPLE_TEXT = `Now that institutions take citation counts as a measure of research impact and justify promotion and funding decisions on these counts, citations can contribute decisively to the professional careers of those cited (Slyder et al., 2011). Citations are therefore now the currency of the scholarly economy and having one’s work recognized and referenced by others is an increasingly valued commodity in today’s fiercely competitive academic world (Siler, 2012; Hyland, 2015).

References
Siler, K. (2012). Citation choice and innovation in science studies. Scientometrics, 95(1), 385–415. 10.1007/s11192-012-0881-8
Slyder, J. B., Stein, B. R., Sams, B. S., Walker, D. M., Jacob Beale, B., Feldhaus, J. J., & Copenheaver, C. A. (2011). Citation pattern and lifespan: A comparison of discipline, institution, and individual. Scientometrics, 89(3), 955–966.10.1007/s11192-011-0467-x`;

function App() {
  const [content, setContent] = useState(SAMPLE_TEXT);
  const [activeTab, setActiveTab] = useState<Tab>('check');
  const [parseResult, setParseResult] = useState<ParseResult>({
    citations: [],
    missingCitations: [],
    unusedReferences: [],
    totalInText: 0,
    totalReferences: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCitationId, setSelectedCitationId] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // 1. Local parsing logic
      const result = parseCitations(content);
      setParseResult(result);
      
      // 2. Enrich missing citations with OpenAlex data
      // REMOVED: User requested no external paper lookup for missing citations. 
      // Only citations strictly found in the text/references should be shown.
      
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCitationClick = (citation: Citation) => {
    setSelectedCitationId(citation.id);
    console.log("Clicked citation:", citation);
  };

  return (
    <SplitLayout
      left={
        <Editor
          content={content}
          onChange={setContent}
          onAnalyze={handleAnalyze}
          citations={parseResult.citations}
          highlightedId={selectedCitationId}
          onCitationClick={handleCitationClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      }
      right={
        activeTab === 'check' ? (
          <AnalysisPanel
            citations={parseResult.citations}
            missingCitations={parseResult.missingCitations}
            unusedReferences={parseResult.unusedReferences}
            onCitationClick={handleCitationClick}
          />
        ) : undefined
      }
    />
  );
}

export default App;
