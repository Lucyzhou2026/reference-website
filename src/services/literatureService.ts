import axios from 'axios';
import { LiteratureMetadata } from '../types';

const OPENALEX_API = 'https://api.openalex.org/works';
const CROSSREF_API = 'https://api.crossref.org/works';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = '/api/deepseek/chat/completions';

export const literatureService = {
  async searchOpenAlex(query: string, page: number = 1): Promise<{ results: LiteratureMetadata[], total: number }> {
    try {
      // Check if query is a DOI
      const isDoi = query.match(/^10.\d{4,9}\/[-._;()/:A-Z0-9]+$/i) || query.includes('doi.org');
      
      let params: any = {
        per_page: 8,
        page: page,
        sort: 'relevance_score:desc'
      };

      if (isDoi) {
        // If it looks like a DOI, clean it and search by DOI directly
        const cleanDoi = query.replace('https://doi.org/', '').trim();
        params = {
          filter: `doi:https://doi.org/${cleanDoi}`
        };
      } else {
        params.search = query;
      }

      const response = await axios.get(OPENALEX_API, { params });

      const results = response.data.results.map((result: any) => ({
        id: result.id,
        title: result.title,
        authors: result.authorships.map((a: any) => a.author.display_name),
        year: result.publication_year,
        journal: result.primary_location?.source?.display_name || 'Unknown Source',
        doi: result.doi ? result.doi.replace('https://doi.org/', '') : undefined,
        url: result.doi || result.primary_location?.landing_page_url,
        abstract: result.abstract_inverted_index ? createAbstractFromInvertedIndex(result.abstract_inverted_index) : undefined,
        citationCount: result.cited_by_count,
        type: mapOpenAlexType(result.type),
        isOpenAccess: result.open_access?.is_oa || false,
        analysisStatus: 'pending' // Initial status
      }));

      return {
        results,
        total: response.data.meta.count
      };
    } catch (error) {
      console.error('OpenAlex search failed:', error);
      return { results: [], total: 0 };
    }
  },

  async analyzePaper(paper: LiteratureMetadata, query: string): Promise<LiteratureMetadata> {
    if (!paper.abstract && !paper.title) {
      return {
        ...paper,
        analysisStatus: 'failed',
        summary: 'No abstract available to analyze.'
      };
    }

    try {
      const prompt = `
        You are an advanced academic research assistant designed to act like the Elicit AI engine.
        
        User's Research Claim/Query: "${query}"
        
        Paper Title: "${paper.title}"
        Paper Abstract: "${paper.abstract || 'No abstract provided. Infer relevance from title.'}"

        Your Task:
        1. **Summary**: Write a 1-sentence summary (max 30 words) explaining EXACTLY how this paper supports, refutes, or relates to the User's Claim. Be direct.
        2. **Supporting Quote**: Extract the single most relevant sentence from the abstract that serves as evidence. If no abstract, write "No abstract available for direct quote."
        3. **Explanation**: Write a short paragraph (2-3 sentences) explaining the significance of this paper in the context of the user's query. Why does it matter?

        Output strictly in valid JSON format:
        {
          "summary": "...",
          "supportingQuote": "...",
          "explanation": "..."
        }
      `;

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a helpful research assistant. Return valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          stream: false,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Clean JSON string (remove markdown code blocks if present)
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      let analysis;
      try {
        analysis = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Raw content:', content);
        throw new Error('Failed to parse analysis response');
      }

      return {
        ...paper,
        summary: analysis.summary || 'Summary unavailable.',
        supportingQuote: analysis.supportingQuote || 'No supporting quote found.',
        explanation: analysis.explanation || 'Explanation unavailable.',
        analysisStatus: 'completed'
      };

    } catch (error) {
      console.error('Analysis failed:', error);
      return {
        ...paper,
        analysisStatus: 'failed',
        summary: 'Analysis failed. Please try again.'
      };
    }
  }
};

// Helper to reconstruct abstract from OpenAlex inverted index
function createAbstractFromInvertedIndex(invertedIndex: any): string {
  if (!invertedIndex) return '';
  const words: string[] = [];
  Object.keys(invertedIndex).forEach(word => {
    invertedIndex[word].forEach((position: number) => {
      words[position] = word;
    });
  });
  return words.join(' ');
}

// Helper to map OpenAlex types to user-friendly types
function mapOpenAlexType(type: string): string {
  const map: Record<string, string> = {
    'article': 'Journal Article',
    'book-chapter': 'Book Chapter',
    'dissertation': 'Thesis',
    'review': 'Review',
    'book': 'Book',
    'dataset': 'Dataset',
    'preprint': 'Preprint',
    'report': 'Report'
  };
  return map[type] || 'Article';
}
