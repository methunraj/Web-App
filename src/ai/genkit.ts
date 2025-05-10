import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Create googleAI instance that we can use directly
const googleAIPlugin = googleAI();

export const ai = genkit({
  plugins: [googleAIPlugin],
  model: 'googleai/gemini-1.5-flash-latest', // Updated default model
});

// Simplified token counting function that doesn't actually count tokens 
// but provides a structure to log token metadata later
export async function countTokens(model: string, contents: any) {
  // Log content details
  console.log(`[TOKEN METADATA] Model: ${model}`);
  console.log(`[TOKEN METADATA] Content type: ${typeof contents}`);
  
  if (typeof contents === 'string') {
    console.log(`[TOKEN METADATA] Content length: ${contents.length} chars`);
    // Log a snippet of the content for debugging
    console.log(`[TOKEN METADATA] Content sample: ${contents.substring(0, 100)}${contents.length > 100 ? '...' : ''}`);
  } else {
    console.log(`[TOKEN METADATA] Content: ${JSON.stringify(contents).substring(0, 200)}...`);
  }
  
  // Since we can't reliably count tokens beforehand with the current setup,
  // we return a placeholder object with 0 tokens
  return { totalTokens: 0 };
}
