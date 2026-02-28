
import { parseCitations } from './src/utils/citationParser';

const text = `
In-text citation (Siler, 2012).

References
Siler, K. (2012). Citation choice. Scientometrics. 10.1007/s11192-012-0881-8
`;

const result = parseCitations(text);
const inText = result.citations.find(c => c.type === 'in-text');
const reference = result.citations.find(c => c.type === 'reference');

console.log('In-text metadata DOI:', inText?.metadata?.doi);
console.log('Reference DOI:', reference?.doi);

if (inText?.metadata?.doi === '10.1007/s11192-012-0881-8') {
    console.log('SUCCESS: DOI passed to in-text citation metadata');
} else {
    console.log('FAILURE: DOI not found in metadata');
}
