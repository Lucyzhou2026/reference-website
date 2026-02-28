import { LiteratureItem, LiteratureType, CitationStyle } from '../types';

interface CitationFormatter {
  format(item: LiteratureItem): string;
}

class APAFormatter implements CitationFormatter {
  format(item: LiteratureItem): string {
    const authors = this.formatAuthors(item.authors);
    const year = `(${item.year})`;
    const title = item.title; // In APA, article title is not italicized
    
    let source = '';
    
    switch (item.type) {
      case LiteratureType.JOURNAL:
        source = `${item.journal || 'Unknown Journal'}`;
        if (item.volume) source += `, ${item.volume}`;
        if (item.issue) source += `(${item.issue})`;
        if (item.pages) source += `, ${item.pages}`;
        if (item.doi) source += `. https://doi.org/${item.doi}`;
        break;
      case LiteratureType.BOOK:
        source = `${item.publisher || 'Unknown Publisher'}`;
        break;
      case LiteratureType.WEB:
        source = `${item.url || ''}`;
        break;
      default:
        source = `${item.publisher || item.journal || ''}`;
    }

    // Note: In a real app, we'd need to handle italics (e.g., Journal Title, Book Title).
    // Since we are returning a plain string here, we can't easily do rich text.
    // However, for the purpose of "copy to clipboard", plain text is often preferred or we use markdown.
    // Let's return a string, but maybe we can use simple markdown for italics if the UI supports it.
    // For now, I'll stick to plain text structure but keep in mind italics are missing.
    // Actually, for a "preview", returning HTML or a React node would be better, but the interface says string.
    
    // Correction: Let's assume the consumer handles basic formatting or we ignore italics for plain text copy.
    
    if (item.type === LiteratureType.BOOK) {
      return `${authors} ${year}. ${title}. ${source}.`;
    }
    
    return `${authors} ${year}. ${title}. ${source}.`;
  }

  private formatAuthors(authors: string[]): string {
    if (!authors || authors.length === 0) return 'Unknown Author';
    if (authors.length === 1) return authors[0];
    if (authors.length <= 20) {
      const lastAuthor = authors[authors.length - 1];
      const otherAuthors = authors.slice(0, -1).join(', ');
      return `${otherAuthors}, & ${lastAuthor}`;
    }
    return `${authors.slice(0, 19).join(', ')}, ... ${authors[authors.length - 1]}`;
  }
}

class MLAFormatter implements CitationFormatter {
  format(item: LiteratureItem): string {
    const authors = this.formatAuthors(item.authors);
    const title = `"${item.title}."`;
    
    let container = '';
    
    switch (item.type) {
      case LiteratureType.JOURNAL:
        container = `${item.journal || ''}`;
        if (item.volume) container += `, vol. ${item.volume}`;
        if (item.issue) container += `, no. ${item.issue}`;
        container += `, ${item.year}`;
        if (item.pages) container += `, pp. ${item.pages}`;
        break;
      case LiteratureType.BOOK:
        container = `${item.publisher}, ${item.year}`;
        break;
      default:
         container = `${item.publisher || item.journal || ''}, ${item.year}`;
    }

    return `${authors} ${title} ${container}.`;
  }

  private formatAuthors(authors: string[]): string {
    if (!authors || authors.length === 0) return 'Unknown Author';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]}, and ${authors[1]}`;
    return `${authors[0]}, et al`;
  }
}

class BibTeXFormatter implements CitationFormatter {
  format(item: LiteratureItem): string {
    const type = this.getBibTeXType(item.type);
    const key = this.generateKey(item);
    
    let fields = [
      `  title = {${item.title}}`,
      `  author = {${item.authors.join(' and ')}}`,
      `  year = {${item.year}}`
    ];

    if (item.journal) fields.push(`  journal = {${item.journal}}`);
    if (item.volume) fields.push(`  volume = {${item.volume}}`);
    if (item.issue) fields.push(`  number = {${item.issue}}`);
    if (item.pages) fields.push(`  pages = {${item.pages}}`);
    if (item.publisher) fields.push(`  publisher = {${item.publisher}}`);
    if (item.doi) fields.push(`  doi = {${item.doi}}`);
    if (item.url) fields.push(`  url = {${item.url}}`);

    return `@${type}{${key},\n${fields.join(',\n')}\n}`;
  }

  private getBibTeXType(type: LiteratureType | string): string {
    switch (type) {
      case LiteratureType.JOURNAL: return 'article';
      case LiteratureType.BOOK: return 'book';
      case LiteratureType.CONFERENCE: return 'inproceedings';
      case LiteratureType.THESIS: return 'phdthesis';
      case LiteratureType.REPORT: return 'techreport';
      case LiteratureType.WEB: return 'misc';
      default: return 'misc';
    }
  }

  private generateKey(item: LiteratureItem): string {
    const firstAuthor = item.authors[0]?.split(' ').pop()?.toLowerCase() || 'unknown';
    const firstWordTitle = item.title.split(' ')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'untitled';
    return `${firstAuthor}${item.year}${firstWordTitle}`;
  }
}

export class CitationFormatterFactory {
  static create(style: CitationStyle): CitationFormatter {
    switch (style) {
      case CitationStyle.APA:
        return new APAFormatter();
      case CitationStyle.MLA:
        return new MLAFormatter();
      case CitationStyle.BIBTEX:
        return new BibTeXFormatter();
      default:
        throw new Error(`Unsupported citation style: ${style}`);
    }
  }
}
