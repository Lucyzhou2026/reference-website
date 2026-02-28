import { Citation, ParseResult } from '../types';

export const parseCitations = (text: string): ParseResult => {
  const citations: Citation[] = [];
  const inTextCitations: Citation[] = [];
  const referenceListCitations: Citation[] = [];

  // 1. Identify "References" section to split text
  const refSectionMatch = text.match(/(?:References|Bibliography|Works Cited)\s*\n/i);
  let bodyText = text;
  let referenceText = '';
  
  if (refSectionMatch && refSectionMatch.index !== undefined) {
    bodyText = text.substring(0, refSectionMatch.index);
    referenceText = text.substring(refSectionMatch.index + refSectionMatch[0].length);
  }

  // 2. Parse In-text citations
  // Strategy: Find content in parentheses, then split by semicolon, then parse Author, Year
  const parensPattern = /\(([^)]+)\)/g;
  let match;
  
  while ((match = parensPattern.exec(bodyText)) !== null) {
    const content = match[1];
    const parts = content.split(';');
    
    let currentSearchIndex = 0;

    parts.forEach(part => {
      // Check for "Author, Year" pattern
      // e.g. "Slyder et al., 2011" or "Hyland, 2015"
      // Enforce that Author starts with a capital letter to avoid matching common words like "however", "therefore" etc.
      // Exception: particles like "von", "de", "van" might be lowercase, but usually capitalized at start of citation.
      // We'll stick to Capital letter requirement for now to reduce false positives.
      const citMatch = part.trim().match(/^([A-Z][A-Za-z\s.,&]+?),\s*(\d{4})/);
      
      if (citMatch) {
        const [raw, authorsStr, yearStr] = citMatch;
        // Basic author cleanup: "Smith et al." -> ["Smith"]
        const authors = authorsStr.replace(' et al.', '').split(/,|&| and /).map(a => a.trim()).filter(a => a);
        
        // Calculate correct index
        const trimmedPart = part.trim();
        // Find where this part starts within the parenthesis content
        const partStartInContent = content.indexOf(trimmedPart, currentSearchIndex);
        
        if (partStartInContent !== -1) {
            const partIndex = match.index! + 1 + partStartInContent;
            
            inTextCitations.push({
              id: `intext-${inTextCitations.length}`,
              type: 'in-text',
              rawText: trimmedPart,
              authors,
              year: parseInt(yearStr),
              matchStatus: 'pending', 
              index: partIndex,
              length: trimmedPart.length
            });
            
            currentSearchIndex = partStartInContent + trimmedPart.length;
        }
      }
    });
  }
  
  // Also handle [1] style numeric citations
  const numericPattern = /\[(\d+(?:,\s*\d+)*)\]/g;
  while ((match = numericPattern.exec(bodyText)) !== null) {
     const nums = match[1].split(',').map(n => n.trim());
     nums.forEach(num => {
       inTextCitations.push({
         id: `intext-num-${inTextCitations.length}`,
         type: 'in-text',
         rawText: `[${num}]`,
         authors: [], // Numeric citations don't have authors in-text usually
         year: 0,
         matchStatus: 'pending',
         index: match!.index, // Approximation: highlight the whole group [1, 2] for each? 
                              // For simplicity, we highlight the group. 
                              // But if we want individual, it's harder. 
                              // Let's stick to Author-Year focus as per sample text.
         length: match![0].length
       });
     });
  }

  // 3. Parse Reference List
  // Split by newline and try to match lines
  const lines = referenceText.split('\n').filter(l => l.trim().length > 0);
  let currentRefSearchIndex = 0; // To track position in referenceText to avoid finding same line earlier

  lines.forEach((line, idx) => {
    // Heuristic: Check if line starts with Author name or number
    // Simple heuristic for (Author, Year) style references
    // E.g. Slyder, J. B., ... (2011). Title...
    const yearMatch = line.match(/\((\d{4})\)/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      const authorsPart = line.substring(0, yearMatch.index).trim();
      let rest = line.substring(yearMatch.index! + yearMatch[0].length).trim();
      
      // Remove leading dot or whitespace (Fix for title starting with dot)
      if (rest.startsWith('.')) {
        rest = rest.substring(1).trim();
      }

      // Extract title (assume it ends with a dot)
      const titleMatch = rest.match(/^([^.]+)\./);
      const title = titleMatch ? titleMatch[1].trim() : rest;

      // Extract DOI if present
      // Heuristic: look for "10." followed by digits/chars, avoiding trailing punctuation
      // \S includes all non-whitespace characters.
      // We'll capture as much as possible, then trim common trailing punctuation.
      const doiMatch = line.match(/(10\.\d{4,9}\/\S+)/i);
      let doi = doiMatch ? doiMatch[1] : undefined;
      
      if (doi) {
          // Clean trailing punctuation that are not part of DOI
          // Common endings: dot, comma, semicolon.
          // Note: DOIs can end with characters like ')', but usually in a reference list, a closing parenthesis at the very end might be part of the text structure, not the DOI. 
          // However, some DOIs DO contain parentheses. 
          // Safe bet: remove trailing dot, comma, semicolon.
          doi = doi.replace(/[\.,;]+$/, '');
      }

      const authors = authorsPart.split(/,|&/).map(a => a.trim().replace(/\.$/, '')).filter(a => a);
      
      // Calculate global index in the original text correctly
      // Find the line in referenceText starting from currentRefSearchIndex
      const lineStartInRefText = referenceText.indexOf(line, currentRefSearchIndex);
      
      if (lineStartInRefText !== -1) {
          const globalStartIndex = refSectionMatch.index! + refSectionMatch[0].length + lineStartInRefText;
          currentRefSearchIndex = lineStartInRefText + line.length;

          referenceListCitations.push({
            id: `ref-${idx}`,
            type: 'reference',
            rawText: line,
            authors,
            year,
            title,
            doi,
            matchStatus: 'unused', // Default
            index: globalStartIndex, 
            length: line.length
          });
      }
    }
  });

  // 4. Cross-reference Logic
  // Check if in-text citations exist in reference list
  inTextCitations.forEach(cit => {
    if (cit.authors.length === 0) return; // Skip numeric for now
    
    // Simple matching: Author surname + Year
    const match = referenceListCitations.find(ref => {
      return ref.year === cit.year && ref.authors.some(refAuth => 
        cit.authors.some(citAuth => refAuth.includes(citAuth) || citAuth.includes(refAuth))
      );
    });

    if (match) {
      cit.matchStatus = 'matched';
      match.matchStatus = 'matched';
      cit.metadata = { // Link to reference metadata
        title: match.title || '',
        authors: match.authors,
        year: match.year,
        journal: match.journal,
        doi: match.doi
      };
    } else {
      cit.matchStatus = 'missing';
    }
  });

  const missingCitations = inTextCitations.filter(c => c.matchStatus === 'missing');
  const unusedReferences = referenceListCitations.filter(r => r.matchStatus === 'unused');
  const allCitations = [...inTextCitations, ...referenceListCitations];

  return {
    citations: allCitations,
    missingCitations,
    unusedReferences,
    totalInText: inTextCitations.length,
    totalReferences: referenceListCitations.length
  };
};
