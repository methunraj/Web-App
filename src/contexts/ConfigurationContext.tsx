'use client';
import type { Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Example } from '@/types';

// Types for the unified configuration
export interface SavedSchema {
  id: string;
  name: string;
  schemaJson: string;
  createdAt: number;
}

export interface SavedPromptSet {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  examples: Example[];
  createdAt: number;
}

export interface LLMConfiguration {
  provider: string;
  model: string;
  apiKey: string;
  temperature: number;
  thinkingBudget?: number;
  pricePerMillionInputTokens?: number;
  pricePerMillionOutputTokens?: number;
  isConfigured: boolean;
  isValid: boolean | null;
}

export interface GenerationInput {
  userIntent: string;
  exampleCount: number;
  includeValidation: boolean;
}

export interface GenerationResult {
  id: string;
  input: GenerationInput;
  schema: string;
  systemPrompt: string;
  userPromptTemplate: string;
  examples: Example[];
  reasoning?: string;
  confidence?: number;
  timestamp: number;
}

export interface CompleteConfiguration {
  id: string;
  name: string;
  llmConfig: LLMConfiguration;
  schema: string;
  systemPrompt: string;
  userPromptTemplate: string;
  examples: Example[];
  isGenerated: boolean;
  createdAt: number;
}

interface ConfigurationContextType {
  // LLM Configuration
  llmConfig: LLMConfiguration;
  updateLLMConfig: (updates: Partial<LLMConfiguration>) => void;
  validateLLMConnection: () => Promise<boolean>;
  
  // AI Generation
  isGenerating: boolean;
  generationHistory: GenerationResult[];
  generateFromPrompt: (input: GenerationInput) => Promise<void>;
  clearGenerationHistory: () => void;
  
  // Schema Management
  schemaJson: string;
  setSchemaJson: Dispatch<SetStateAction<string>>;
  savedSchemas: SavedSchema[];
  saveSchema: (name: string) => void;
  loadSchema: (id: string) => void;
  deleteSchema: (id: string) => void;
  isSchemaGenerated: boolean;
  
  // Prompt Management
  systemPrompt: string;
  setSystemPrompt: Dispatch<SetStateAction<string>>;
  userPromptTemplate: string;
  setUserPromptTemplate: Dispatch<SetStateAction<string>>;
  examples: Example[];
  setExamples: Dispatch<SetStateAction<Example[]>>;
  savedPromptSets: SavedPromptSet[];
  savePromptSet: (name: string) => void;
  loadPromptSet: (id: string) => void;
  deletePromptSet: (id: string) => void;
  arePromptsGenerated: boolean;
  
  // Unified Configuration Management
  completeConfigurations: CompleteConfiguration[];
  saveCompleteConfiguration: (name: string) => void;
  loadCompleteConfiguration: (id: string) => void;
  deleteCompleteConfiguration: (id: string) => void;
  resetConfiguration: () => void;
  isConfigurationComplete: boolean;
}

// Default values
const defaultLLMConfig: LLMConfiguration = {
  provider: 'googleAI',
  model: 'gemini-2.5-flash-preview-05-20',
  apiKey: '',
  temperature: 0.3,
  thinkingBudget: undefined,
  pricePerMillionInputTokens: undefined,
  pricePerMillionOutputTokens: undefined,
  isConfigured: false,
  isValid: null,
};

const defaultSchema = JSON.stringify(
  {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'ExtractedData',
    description: 'Schema for data to be extracted from a document.',
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title or heading of the document',
      },
      date: {
        type: ['string', 'null'],
        format: 'date',
        description: 'The main date mentioned in the document (YYYY-MM-DD format if possible)',
      },
      summary: {
        type: 'string',
        description: 'A brief summary of the document content',
      },
      keywords: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'A list of keywords from the document'
      }
    },
    required: ['title', 'summary'],
  },
  null,
  2
);

const defaultSystemPrompt = `You are a precise data extraction assistant. Your task is to extract structured information from documents according to the provided JSON schema. 
Always return valid JSON that matches the schema exactly. 
If information for a field is not available in the document, use null for that field, unless the schema specifies otherwise (e.g., a default value or if the field is not nullable).
Focus solely on extracting data as per the schema. Do not add any conversational fluff or explanations outside of the JSON output.`;

const defaultUserPromptTemplate = `Based on the provided document content and the JSON schema, please extract the relevant information.

Document Content will be provided by the system (using {{document_content_text}} or {{media url=document_media_url}}).
JSON Schema will be provided by the system (using {{json_schema_text}}).
{{#if examples_list.length}}
Here are some examples:
{{#each examples_list}}
---
Input: {{{this.input}}}
Output: {{{this.output}}}
---
{{/each}}
{{/if}}

Your task is to meticulously analyze the document and populate the fields defined in the JSON schema.
Return ONLY the valid JSON output that conforms to the schema.`;

const ConfigurationContext = createContext<ConfigurationContextType | undefined>(undefined);

export function ConfigurationProvider({ children }: { children: React.ReactNode }) {
  // LLM Configuration State
  const [llmConfig, setLLMConfig] = useState<LLMConfiguration>(defaultLLMConfig);
  
  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<GenerationResult[]>([]);
  
  // Schema State
  const [schemaJson, setSchemaJson] = useState<string>(defaultSchema);
  const [savedSchemas, setSavedSchemas] = useState<SavedSchema[]>([]);
  const [isSchemaGenerated, setIsSchemaGenerated] = useState(false);
  
  // Prompt State
  const [systemPrompt, setSystemPrompt] = useState<string>(defaultSystemPrompt);
  const [userPromptTemplate, setUserPromptTemplate] = useState<string>(defaultUserPromptTemplate);
  const [examples, setExamples] = useState<Example[]>([]);
  const [savedPromptSets, setSavedPromptSets] = useState<SavedPromptSet[]>([]);
  const [arePromptsGenerated, setArePromptsGenerated] = useState(false);
  
  // Complete Configurations State
  const [completeConfigurations, setCompleteConfigurations] = useState<CompleteConfiguration[]>([]);

  // Load saved data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load LLM config
      const savedLLMConfig = localStorage.getItem('intelliextract_llm_config');
      if (savedLLMConfig) {
        try {
          const parsed = JSON.parse(savedLLMConfig);
          setLLMConfig(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Error loading LLM config:', e);
        }
      }
      
      // Load schemas
      const savedSchemasData = localStorage.getItem('intelliextract_savedSchemas');
      if (savedSchemasData) {
        try {
          setSavedSchemas(JSON.parse(savedSchemasData));
        } catch (e) {
          console.error('Error loading schemas:', e);
        }
      }
      
      // Load prompt sets
      const savedPromptSetsData = localStorage.getItem('intelliextract_savedPromptSets');
      if (savedPromptSetsData) {
        try {
          setSavedPromptSets(JSON.parse(savedPromptSetsData));
        } catch (e) {
          console.error('Error loading prompt sets:', e);
        }
      }
      
      // Load complete configurations
      const savedCompleteConfigs = localStorage.getItem('intelliextract_completeConfigurations');
      if (savedCompleteConfigs) {
        try {
          setCompleteConfigurations(JSON.parse(savedCompleteConfigs));
        } catch (e) {
          console.error('Error loading complete configurations:', e);
        }
      }
      
      // Load generation history
      const savedGenerationHistory = localStorage.getItem('intelliextract_generationHistory');
      if (savedGenerationHistory) {
        try {
          setGenerationHistory(JSON.parse(savedGenerationHistory));
        } catch (e) {
          console.error('Error loading generation history:', e);
        }
      }
    }
  }, []);

  // Save data to localStorage when state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('intelliextract_llm_config', JSON.stringify(llmConfig));
    }
  }, [llmConfig]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('intelliextract_savedSchemas', JSON.stringify(savedSchemas));
    }
  }, [savedSchemas]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('intelliextract_savedPromptSets', JSON.stringify(savedPromptSets));
    }
  }, [savedPromptSets]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('intelliextract_completeConfigurations', JSON.stringify(completeConfigurations));
    }
  }, [completeConfigurations]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('intelliextract_generationHistory', JSON.stringify(generationHistory));
    }
  }, [generationHistory]);

  // LLM Configuration Methods
  const updateLLMConfig = useCallback((updates: Partial<LLMConfiguration>) => {
    setLLMConfig(prev => {
      const updated = { ...prev, ...updates };
      // Auto-determine if configured
      updated.isConfigured = !!(updated.model && (updated.apiKey || updated.provider === 'googleAI'));
      return updated;
    });
  }, []);

  const validateLLMConnection = useCallback(async (): Promise<boolean> => {
    // Simple validation - in a real app you'd test the actual connection
    const isValid = llmConfig.model && (llmConfig.apiKey.length > 15 || llmConfig.provider === 'googleAI');
    setLLMConfig(prev => ({ ...prev, isValid }));
    return isValid;
  }, [llmConfig.model, llmConfig.apiKey, llmConfig.provider]);

  // AI Generation Methods
  const generateFromPrompt = useCallback(async (input: GenerationInput) => {
    if (!llmConfig.isConfigured) {
      throw new Error('LLM must be configured before generating content');
    }

    setIsGenerating(true);
    try {
      // Use the actual AI generation flow
      const { generateUnifiedConfiguration } = await import('@/ai/flows/unified-generation-flow');
      
      const generationInput = {
        userIntent: input.userIntent,
        exampleCount: input.exampleCount,
        llmProvider: llmConfig.provider,
        modelName: llmConfig.model,
        temperature: llmConfig.temperature,
      };
      
      const result = await generateUnifiedConfiguration(generationInput);

      const generatedResult: GenerationResult = {
        id: uuidv4(),
        input,
        schema: result.schema,
        systemPrompt: result.systemPrompt,
        userPromptTemplate: result.userPromptTemplate,
        examples: result.examples,
        reasoning: result.reasoning,
        confidence: result.confidence,
        timestamp: Date.now(),
      };

      // Update state with generated content
      setSchemaJson(generatedResult.schema);
      setSystemPrompt(generatedResult.systemPrompt);
      setUserPromptTemplate(generatedResult.userPromptTemplate);
      setExamples(generatedResult.examples);
      
      // Mark as generated
      setIsSchemaGenerated(true);
      setArePromptsGenerated(true);
      
      // Add to history
      setGenerationHistory(prev => [generatedResult, ...prev]);
      
    } catch (error) {
      console.error('Generation failed:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [llmConfig.isConfigured, llmConfig.provider, llmConfig.model, llmConfig.temperature]);

  const clearGenerationHistory = useCallback(() => {
    setGenerationHistory([]);
  }, []);

  // Schema Management Methods
  const saveSchema = useCallback((name: string) => {
    if (!name.trim()) {
      throw new Error("Schema name cannot be empty.");
    }
    if (savedSchemas.some(s => s.name === name.trim())) {
      throw new Error(`Schema with name "${name.trim()}" already exists.`);
    }
    const newSchema: SavedSchema = { 
      id: uuidv4(), 
      name: name.trim(), 
      schemaJson, 
      createdAt: Date.now() 
    };
    setSavedSchemas(prev => [...prev, newSchema].sort((a,b) => a.name.localeCompare(b.name)));
  }, [schemaJson, savedSchemas]);

  const loadSchema = useCallback((id: string) => {
    const schema = savedSchemas.find(s => s.id === id);
    if (schema) {
      setSchemaJson(schema.schemaJson);
      setIsSchemaGenerated(false);
    }
  }, [savedSchemas]);

  const deleteSchema = useCallback((id: string) => {
    setSavedSchemas(prev => prev.filter(s => s.id !== id));
  }, []);

  // Prompt Management Methods
  const savePromptSet = useCallback((name: string) => {
    if (!name.trim()) {
      throw new Error("Prompt set name cannot be empty.");
    }
    if (savedPromptSets.some(ps => ps.name === name.trim())) {
      throw new Error(`Prompt set with name "${name.trim()}" already exists.`);
    }
    const newSet: SavedPromptSet = {
      id: uuidv4(),
      name: name.trim(),
      systemPrompt,
      userPromptTemplate,
      examples,
      createdAt: Date.now(),
    };
    setSavedPromptSets(prev => [...prev, newSet].sort((a,b) => a.name.localeCompare(b.name)));
  }, [systemPrompt, userPromptTemplate, examples, savedPromptSets]);

  const loadPromptSet = useCallback((id: string) => {
    const promptSet = savedPromptSets.find(ps => ps.id === id);
    if (promptSet) {
      setSystemPrompt(promptSet.systemPrompt);
      setUserPromptTemplate(promptSet.userPromptTemplate);
      setExamples(promptSet.examples);
      setArePromptsGenerated(false);
    }
  }, [savedPromptSets]);

  const deletePromptSet = useCallback((id: string) => {
    setSavedPromptSets(prev => prev.filter(ps => ps.id !== id));
  }, []);

  // Complete Configuration Management
  const saveCompleteConfiguration = useCallback((name: string) => {
    if (!name.trim()) {
      throw new Error("Configuration name cannot be empty.");
    }
    if (completeConfigurations.some(c => c.name === name.trim())) {
      throw new Error(`Configuration with name "${name.trim()}" already exists.`);
    }
    const newConfig: CompleteConfiguration = {
      id: uuidv4(),
      name: name.trim(),
      llmConfig,
      schema: schemaJson,
      systemPrompt,
      userPromptTemplate,
      examples,
      isGenerated: isSchemaGenerated && arePromptsGenerated,
      createdAt: Date.now(),
    };
    setCompleteConfigurations(prev => [...prev, newConfig].sort((a,b) => a.name.localeCompare(b.name)));
  }, [llmConfig, schemaJson, systemPrompt, userPromptTemplate, examples, isSchemaGenerated, arePromptsGenerated, completeConfigurations]);

  const loadCompleteConfiguration = useCallback((id: string) => {
    const config = completeConfigurations.find(c => c.id === id);
    if (config) {
      setLLMConfig(config.llmConfig);
      setSchemaJson(config.schema);
      setSystemPrompt(config.systemPrompt);
      setUserPromptTemplate(config.userPromptTemplate);
      setExamples(config.examples);
      setIsSchemaGenerated(config.isGenerated);
      setArePromptsGenerated(config.isGenerated);
    }
  }, [completeConfigurations]);

  const deleteCompleteConfiguration = useCallback((id: string) => {
    setCompleteConfigurations(prev => prev.filter(c => c.id !== id));
  }, []);

  const resetConfiguration = useCallback(() => {
    setSchemaJson(defaultSchema);
    setSystemPrompt(defaultSystemPrompt);
    setUserPromptTemplate(defaultUserPromptTemplate);
    setExamples([]);
    setIsSchemaGenerated(false);
    setArePromptsGenerated(false);
  }, []);

  // Computed properties
  const isConfigurationComplete = useMemo(() => {
    return !!(
      llmConfig.isConfigured &&
      schemaJson &&
      systemPrompt &&
      userPromptTemplate
    );
  }, [llmConfig.isConfigured, schemaJson, systemPrompt, userPromptTemplate]);

  const value = useMemo(() => ({
    // LLM Configuration
    llmConfig,
    updateLLMConfig,
    validateLLMConnection,
    
    // AI Generation
    isGenerating,
    generationHistory,
    generateFromPrompt,
    clearGenerationHistory,
    
    // Schema Management
    schemaJson,
    setSchemaJson,
    savedSchemas,
    saveSchema,
    loadSchema,
    deleteSchema,
    isSchemaGenerated,
    
    // Prompt Management
    systemPrompt,
    setSystemPrompt,
    userPromptTemplate,
    setUserPromptTemplate,
    examples,
    setExamples,
    savedPromptSets,
    savePromptSet,
    loadPromptSet,
    deletePromptSet,
    arePromptsGenerated,
    
    // Unified Configuration Management
    completeConfigurations,
    saveCompleteConfiguration,
    loadCompleteConfiguration,
    deleteCompleteConfiguration,
    resetConfiguration,
    isConfigurationComplete,
  }), [
    llmConfig, updateLLMConfig, validateLLMConnection,
    isGenerating, generationHistory, generateFromPrompt, clearGenerationHistory,
    schemaJson, savedSchemas, saveSchema, loadSchema, deleteSchema, isSchemaGenerated,
    systemPrompt, userPromptTemplate, examples, savedPromptSets, savePromptSet, loadPromptSet, deletePromptSet, arePromptsGenerated,
    completeConfigurations, saveCompleteConfiguration, loadCompleteConfiguration, deleteCompleteConfiguration, resetConfiguration, isConfigurationComplete
  ]);

  return <ConfigurationContext.Provider value={value}>{children}</ConfigurationContext.Provider>;
}

export function useConfiguration() {
  const context = useContext(ConfigurationContext);
  if (context === undefined) {
    throw new Error('useConfiguration must be used within a ConfigurationProvider');
  }
  return context;
}

// Mock generation functions (to be replaced with actual AI generation)
function generateMockSchema(input: GenerationInput): string {
  const baseSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: `${input.domain.charAt(0).toUpperCase() + input.domain.slice(1)}Data`,
    description: `Schema for extracting ${input.domain} data`,
    type: 'object',
    properties: {},
    required: [] as string[]
  };

  // Add domain-specific properties
  switch (input.domain) {
    case 'invoice':
      baseSchema.properties = {
        invoiceNumber: { type: 'string', description: 'Invoice number' },
        date: { type: 'string', format: 'date', description: 'Invoice date' },
        customerName: { type: 'string', description: 'Customer name' },
        totalAmount: { type: 'number', description: 'Total amount' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              quantity: { type: 'number' },
              price: { type: 'number' }
            }
          }
        }
      };
      baseSchema.required = ['invoiceNumber', 'totalAmount'];
      break;
    case 'resume':
      baseSchema.properties = {
        name: { type: 'string', description: 'Full name' },
        email: { type: 'string', format: 'email', description: 'Email address' },
        phone: { type: 'string', description: 'Phone number' },
        experience: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              company: { type: 'string' },
              position: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        skills: { type: 'array', items: { type: 'string' } }
      };
      baseSchema.required = ['name', 'email'];
      break;
    default:
      baseSchema.properties = {
        title: { type: 'string', description: 'Document title' },
        content: { type: 'string', description: 'Main content' },
        metadata: { type: 'object', description: 'Additional metadata' }
      };
      baseSchema.required = ['title'];
  }

  return JSON.stringify(baseSchema, null, 2);
}

function generateMockSystemPrompt(input: GenerationInput): string {
  return `You are an expert data extraction assistant specialized in processing ${input.domain} documents. 
Your task is to carefully analyze documents and extract structured information according to the provided JSON schema.

Key guidelines:
- Extract information accurately and completely
- Follow the schema structure exactly
- Use null for missing information unless schema specifies defaults
- Maintain data type consistency
- Focus on precision and attention to detail

Return only valid JSON that conforms to the provided schema.`;
}

function generateMockUserPrompt(input: GenerationInput): string {
  return `Please extract ${input.domain} information from the provided document according to the JSON schema.

Document: {{#if document_content_text}}{{document_content_text}}{{else}}{{media url=document_media_url}}{{/if}}

Schema: {{json_schema_text}}

{{#if examples_list.length}}
Examples:
{{#each examples_list}}
Input: {{{this.input}}}
Output: {{{this.output}}}
{{/each}}
{{/if}}

Extract the information and return only the JSON result that matches the schema.`;
}

function generateMockExamples(input: GenerationInput): Example[] {
  switch (input.domain) {
    case 'invoice':
      return [
        {
          input: 'Invoice #INV-001 dated 2024-01-15 for Acme Corp, Total: $1,250.00',
          output: '{"invoiceNumber": "INV-001", "date": "2024-01-15", "customerName": "Acme Corp", "totalAmount": 1250.00}'
        }
      ];
    case 'resume':
      return [
        {
          input: 'John Smith, john@email.com, Software Engineer at Tech Corp (2020-2023)',
          output: '{"name": "John Smith", "email": "john@email.com", "experience": [{"company": "Tech Corp", "position": "Software Engineer", "duration": "2020-2023"}]}'
        }
      ];
    default:
      return [
        {
          input: 'Sample document with title "Project Report" containing analysis data',
          output: '{"title": "Project Report", "content": "analysis data"}'
        }
      ];
  }
}