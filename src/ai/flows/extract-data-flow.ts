'use server';
/**
 * @fileOverview A Genkit flow for extracting structured data from documents.
 *
 * - extractData - A function that handles the data extraction process.
 * - ExtractDataInput - The input type for the extractData function.
 * - ExtractDataOutput - The return type for the extractData function.
 */

import { ai, countTokens } from '@/ai/genkit';
import { z } from 'genkit';
import type { Example } from '@/types'; 
import * as CachingService from '@/ai/caching-service';

// Input schema for the flow itself (wrapper function)
const ExtractDataInputSchema = z.object({
  documentFile: z.object({
    name: z.string(),
    type: z.string(), // Mime type
    dataUri: z.string().describe("Document as data URI. Must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
    textContent: z.string().optional().describe("Extracted text content if applicable, otherwise the LLM will process the dataUri directly (e.g., for images/PDFs)."),
  }),
  schemaDefinition: z.string().describe("The JSON schema for extraction (as a string)."),
  systemPrompt: z.string().describe("The system prompt for the LLM."),
  userTaskDescription: z.string().describe("User's specific instruction/task for this extraction (this is typically the user prompt template from the UI)."),
  examples: z.array(z.object({ input: z.string().describe("Example input context or document snippet."), output: z.string().describe("Example JSON output.") })).optional().describe("Few-shot examples."),
  llmProvider: z.string().optional().describe("The LLM provider (e.g., 'googleAI')."),
  modelName: z.string().optional().describe("The specific model name to use."),
  numericThinkingBudget: z.number().int().min(0).max(24576).optional().describe("Optional thinking budget for compatible models (0-24576). 0 disables thinking."),
  temperature: z.number().min(0.0).max(2.0).optional().describe("Controls randomness. Lower values (e.g., 0.2) for more deterministic output, higher (e.g., 0.8) for more creative. Range: 0.0 - 2.0."),
  
  // Add cache-related parameters
  useCache: z.boolean().optional().describe("Whether to use context caching to reduce token costs."),
  cacheId: z.string().optional().describe("Optional ID of an existing cache to use. If not provided, a new cache will be created if useCache is true."),
  cachePricePerMillionTokens: z.number().optional().describe("Price per million tokens for calculating cache savings."),
});
export type ExtractDataInput = z.infer<typeof ExtractDataInputSchema>;

// Output schema for the flow
const ExtractDataOutputSchema = z.object({
  extractedJson: z.string().describe("The extracted data as a JSON string, conforming to the provided schema."),
  promptTokens: z.number().optional().describe("Number of tokens in the prompt."),
  completionTokens: z.number().optional().describe("Number of tokens in the generated completion."),
  totalTokens: z.number().optional().describe("Total number of tokens used."),
  estimatedTokens: z.number().optional().describe("Estimated number of tokens before the request."),
  breakdownByType: z.object({
    documentTokens: z.number().optional(),
    schemaTokens: z.number().optional(),
    systemPromptTokens: z.number().optional(),
    examplesTokens: z.number().optional(),
    mediaTokens: z.number().optional(),
  }).optional().describe("Token breakdown by content type"),
  cacheSavingsInfo: z.object({
    cacheHit: z.boolean().optional(),
    cacheId: z.string().optional(),
    tokensSaved: z.number().optional(),
    cachedTokens: z.number().optional(),
    expireTime: z.string().optional(),
  }).optional().describe("Cache savings information"),
});
export type ExtractDataOutput = z.infer<typeof ExtractDataOutputSchema>;

export async function extractData(input: ExtractDataInput): Promise<ExtractDataOutput> {
  return extractDataFlow(input);
}

// Schema for the data that will be directly available to the Handlebars prompt template
const GenkitPromptContextSchema = z.object({
  system_prompt_text: z.string(),
  user_task_text: z.string(),
  document_content_text: z.string().optional(), 
  document_media_url: z.string(),             
  json_schema_text: z.string(),
  examples_list: z.array(z.object({ input: z.string(), output: z.string() })),
});

// Helper function to estimate media tokens based on file type
const estimateMediaTokens = (fileType: string, fileSize: number): number => {
  // Based on Gemini documentation
  if (fileType.startsWith('image/')) {
    // Images <= 384px in both dimensions: 258 tokens
    // Larger images are tiled at 768x768px, 258 tokens per tile
    // This is an approximation - we don't have actual image dimensions
    const estimatedPixels = Math.sqrt(fileSize); // Very rough estimate
    if (estimatedPixels <= 384) {
      return 258;
    } else {
      const tiles = Math.ceil(estimatedPixels / 768) ** 2;
      return tiles * 258;
    }
  } else if (fileType.startsWith('video/')) {
    // Video: 263 tokens per second
    // Estimate 1MB ≈ 10 seconds of video (rough approximation)
    const estimatedSeconds = (fileSize / (1024 * 1024)) * 10;
    return Math.ceil(estimatedSeconds * 263);
  } else if (fileType.startsWith('audio/')) {
    // Audio: 32 tokens per second
    // Estimate 1MB ≈ 60 seconds of audio (rough approximation)
    const estimatedSeconds = (fileSize / (1024 * 1024)) * 60;
    return Math.ceil(estimatedSeconds * 32);
  }
  return 0;
};

const extractionPrompt = ai.definePrompt({
  name: 'extractDataPrompt',
  input: { schema: GenkitPromptContextSchema },
  output: { schema: z.object({ extractedJson: z.string() }) }, 
  prompt: `{{{system_prompt_text}}}

User Task: {{{user_task_text}}}

Document to process:
{{#if document_content_text}}
{{{document_content_text}}}
{{else}}
{{media url=document_media_url}}
{{/if}}

JSON Schema for extraction:
\`\`\`json
{{{json_schema_text}}}
\`\`\`

{{#if examples_list}}
Here are some examples to guide you:
{{#each examples_list}}
---
Example Input Context:
{{{this.input}}}
Expected JSON Output:
{{{this.output}}}
---
{{/each}}
{{/if}}

Based on the user task, document, and JSON schema, extract the relevant information.
Return ONLY the valid JSON output that conforms to the schema. Do not include any other text, explanations, or markdown code fences around the JSON.`,
  config: { 
    temperature: 0.2, 
    safetySettings: [ 
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE'},
    ]
  },
});

const extractDataFlow = ai.defineFlow(
  {
    name: 'extractDataFlow',
    inputSchema: ExtractDataInputSchema,
    outputSchema: ExtractDataOutputSchema,
  },
  async (input) => {
    const promptData: z.infer<typeof GenkitPromptContextSchema> = {
      system_prompt_text: input.systemPrompt,
      user_task_text: input.userTaskDescription,
      document_content_text: input.documentFile.textContent,
      document_media_url: input.documentFile.dataUri,
      json_schema_text: input.schemaDefinition,
      examples_list: input.examples || [], 
    };

    const callConfig: Record<string, any> = {}; 
    if (input.temperature !== undefined) {
      callConfig.temperature = input.temperature;
    }
    
    if (input.llmProvider === 'googleAI' && input.numericThinkingBudget !== undefined) {
        callConfig.thinkingConfig = { 
            thinkingBudget: input.numericThinkingBudget 
        };
    }
    
    let modelToUse: string | undefined = undefined;
    if (input.modelName) {
      // Ensure model name is prefixed for googleAI provider if not already
      if (input.llmProvider === 'googleAI' && !input.modelName.startsWith('googleai/')) {
        modelToUse = `googleai/${input.modelName}`;
      } else {
        modelToUse = input.modelName;
      }
    }

    // Handle caching if enabled
    let cacheInfo = null;
    let cacheSavingsInfo = null;
    
    if (input.useCache) {
      console.log('\n=== CACHE METADATA ===');
      console.log(`File: ${input.documentFile.name}`);
      console.log(`Model: ${modelToUse || 'default'}`);
      console.log(`Cache Enabled: ${input.useCache}`);
      console.log(`Cache ID Provided: ${input.cacheId ? 'Yes' : 'No'}`);
      if (input.cacheId) {
        console.log(`Using Cached ID: ${input.cacheId}`);
      }
      console.log(`Price per million tokens: $${input.cachePricePerMillionTokens || 0.15}`);
      
      // Dump cache contents for debugging
      try {
        const allCaches = await CachingService.listCaches();
        console.log(`Available caches: ${allCaches.length}`);
        allCaches.forEach((cache, idx) => {
          console.log(`Cache #${idx+1}: ID=${cache.name}, Tokens=${cache.inputTokens}, Expires=${cache.expireTime}`);
        });
      } catch (err) {
        console.error("Error listing caches:", err);
      }
      
      // Try to use existing cache if ID provided
      if (input.cacheId) {
        cacheInfo = await CachingService.getCache(input.cacheId);
        
        if (cacheInfo) {
          console.log(`[Cache] Using existing cache ${input.cacheId}`);
          console.log(`[Cache] Saved approximately ${cacheInfo.inputTokens} input tokens`);
          console.log(`[Cache] Expire time: ${cacheInfo.expireTime}`);
          console.log(`[Cache] Price per million tokens: $${input.cachePricePerMillionTokens || 0.15}`);
          console.log(`[Cache] Estimated savings: $${((cacheInfo.inputTokens / 1000000) * (input.cachePricePerMillionTokens || 0.15)).toFixed(6)}`);
          
          // Record cache hit for statistics
          await CachingService.recordCacheHit(
            cacheInfo.inputTokens, 
            input.cachePricePerMillionTokens,
            modelToUse || 'gemini-1.5-flash-latest'
          );
          
          cacheSavingsInfo = {
            cacheHit: true,
            cacheId: cacheInfo.name,
            tokensSaved: cacheInfo.inputTokens,
            cachedTokens: cacheInfo.inputTokens,
            expireTime: cacheInfo.expireTime
          };
        } else {
          console.log(`[Cache] Cache ID ${input.cacheId} not found or expired, creating new cache`);
        }
      }
      
      // Create new cache if no existing cache was found/specified
      if (!cacheInfo) {
        // For schema+system prompt caching, combine them to create the cacheable content
        // Note: We DON'T include the document content in the cache key, only the schema and system prompt
        // This allows reusing the same cache across different documents
        const cacheContent = `${input.schemaDefinition}`;
        const systemPromptToCache = input.systemPrompt;
        
        if (input.examples && input.examples.length > 0) {
          // If we have examples, include them in the cache
          const examplesText = input.examples.map(ex => 
            `Example Input: ${ex.input}\nExample Output: ${ex.output}`
          ).join('\n\n');
          
          console.log(`[Cache] Creating new cache with system prompt, schema, and ${input.examples.length} examples`);
          console.log(`[Cache] HINT: This cache will be reusable for any document using the same schema`);
          
          cacheInfo = await CachingService.createCache(
            modelToUse || 'gemini-1.5-flash-latest',
            `${cacheContent}\n\nExamples:\n${examplesText}`,
            systemPromptToCache
          );
        } else {
          console.log(`[Cache] Creating new cache with system prompt and schema only`);
          console.log(`[Cache] HINT: This cache will be reusable for any document using the same schema`);
          
          cacheInfo = await CachingService.createCache(
            modelToUse || 'gemini-1.5-flash-latest',
            cacheContent,
            systemPromptToCache
          );
        }
        
        console.log(`[Cache] Created new cache with ID: ${cacheInfo.name}`);
        console.log(`[Cache] Cached ${cacheInfo.inputTokens} tokens that will be reused in future requests`);
        console.log(`[Cache] Expire time: ${cacheInfo.expireTime}`);
        
        cacheSavingsInfo = {
          cacheHit: false,
          cacheId: cacheInfo.name,
          tokensSaved: undefined,
          cachedTokens: cacheInfo.inputTokens,
          expireTime: cacheInfo.expireTime
        };
      }
      
      console.log('=====================\n');
    }

    // Configure the call options with appropriate caching parameters for Google's Gemini API
    if (input.useCache && cacheInfo) {
      console.log(`[Cache] Cache ID ${cacheInfo.name} is available, but direct cachedContent parameter is not supported in this API version`);
      console.log(`[Cache] Will rely on implicit caching instead`);
      
      // Note: The API is currently returning an error for the cachedContent parameter
      // We're keeping the cache tracking for statistics, but not passing it directly to the API
      // Implicit caching may still work if Google's backend recognizes similar content
      
      // DO NOT add this parameter as it causes a Bad Request error
      // if (input.llmProvider === 'googleAI') {
      //   callConfig.cachedContent = cacheInfo.name;
      // }
    }

    // Calculate token estimates BEFORE making the API call
    let estimatedTokens = 0;
    const breakdownByType: {
      documentTokens?: number;
      schemaTokens?: number;
      systemPromptTokens?: number;
      examplesTokens?: number;
      mediaTokens?: number;
    } = {};

    try {
      // Count tokens for document text if available
      if (input.documentFile.textContent) {
        const docTokens = await countTokens(modelToUse || 'gemini-1.5-flash-latest', input.documentFile.textContent);
        breakdownByType.documentTokens = docTokens.totalTokens;
        estimatedTokens += docTokens.totalTokens;
      } else {
        // For non-text files, estimate based on file type and size
        const base64Data = input.documentFile.dataUri.split(',')[1];
        const fileSize = Math.ceil((base64Data.length * 3) / 4);
        const mediaTokens = estimateMediaTokens(input.documentFile.type, fileSize);
        breakdownByType.mediaTokens = mediaTokens;
        estimatedTokens += mediaTokens;
      }

      // Count tokens for schema
      const schemaTokens = await countTokens(modelToUse || 'gemini-1.5-flash-latest', input.schemaDefinition);
      breakdownByType.schemaTokens = schemaTokens.totalTokens;
      estimatedTokens += schemaTokens.totalTokens;

      // Count tokens for system prompt
      const systemPromptTokens = await countTokens(modelToUse || 'gemini-1.5-flash-latest', input.systemPrompt);
      breakdownByType.systemPromptTokens = systemPromptTokens.totalTokens;
      estimatedTokens += systemPromptTokens.totalTokens;

      // Count tokens for examples if provided
      if (input.examples && input.examples.length > 0) {
        const examplesText = input.examples.map(ex => `Input: ${ex.input}\nOutput: ${ex.output}`).join('\n\n');
        const examplesTokens = await countTokens(modelToUse || 'gemini-1.5-flash-latest', examplesText);
        breakdownByType.examplesTokens = examplesTokens.totalTokens;
        estimatedTokens += examplesTokens.totalTokens;
      }
    } catch (err) {
      console.error("Error estimating tokens:", err);
      // Continue with the extraction even if token estimation fails
    }

    const { output, usage } = await extractionPrompt(promptData, {
      model: modelToUse, // Use specified model (which is already prefixed) or prompt's default (from ai.ts)
      config: Object.keys(callConfig).length > 0 ? callConfig : undefined,
    });
    
    // Log detailed token usage information
    console.log('\n=== TOKEN USAGE METADATA ===');
    console.log(`File: ${input.documentFile.name}`);
    console.log(`Type: ${input.documentFile.type}`);
    console.log(`Model: ${modelToUse || 'default'}`);
    console.log('Actual usage from API:');
    console.log(JSON.stringify(usage, null, 2));
    
    // Calculate and log thinking tokens
    const inputTokens = usage?.inputTokens || 0;
    const outputTokens = usage?.outputTokens || 0;
    const totalTokens = usage?.totalTokens || 0;
    const thinkingTokens = totalTokens - (inputTokens + outputTokens);
    
    console.log('Token breakdown:');
    console.log(`- Input tokens: ${inputTokens}`);
    console.log(`- Output tokens: ${outputTokens}`);
    console.log(`- Thinking tokens: ${thinkingTokens > 0 ? thinkingTokens : 0} (billed as output tokens)`);
    console.log(`- Total tokens: ${totalTokens}`);
    
    console.log('Estimated usage before API call:');
    console.log(JSON.stringify({
      estimatedTokens,
      breakdownByType
    }, null, 2));
    console.log('===========================\n');
    
    if (!output || !output.extractedJson) {
      throw new Error("Extraction failed: No JSON output from LLM.");
    }
    
    let finalJson = output.extractedJson;
    finalJson = finalJson.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    try {
      JSON.parse(finalJson);
    } catch (e) {
       console.error("LLM output is not valid JSON after attempting cleanup:", output.extractedJson);
       throw new Error(`Extraction failed: LLM output is not valid JSON. Error: ${(e as Error).message}. Cleaned Output: ${finalJson}`);
    }
    
    return { 
      extractedJson: finalJson,
      promptTokens: usage?.inputTokens,
      completionTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
      estimatedTokens: estimatedTokens,
      breakdownByType,
      cacheSavingsInfo: cacheSavingsInfo ? {
        cacheHit: cacheSavingsInfo.cacheHit,
        cacheId: cacheSavingsInfo.cacheId,
        tokensSaved: cacheSavingsInfo.tokensSaved,
        cachedTokens: cacheSavingsInfo.cachedTokens,
        expireTime: cacheSavingsInfo.expireTime
      } : undefined
    };
  }
);
