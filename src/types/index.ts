export interface Example {
  input: string;
  output: string;
}

export interface AppFile {
  id: string;
  name: string;
  type: string; // Mime type
  size: number;
  dataUri: string;
  textContent?: string; // Extracted text content if applicable
}

export interface AppFileWithRetry extends AppFile {
  retryCount: number;
  jobId: string; // Unique ID for this specific job attempt (file + retry cycle)
}

export interface TokenBreakdown {
  documentTokens?: number;
  schemaTokens?: number;
  systemPromptTokens?: number;
  examplesTokens?: number;
  mediaTokens?: number;
}

export interface JobResult {
  jobId: string; // Corresponds to AppFileWithRetry.jobId
  fileName: string;
  extractedData: string | null;
  thinkingProcess?: string | null;
  error?: string;
  timestamp: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedTokens?: number;
  tokenBreakdown?: TokenBreakdown;
  status: 'success' | 'failed' | 'retrying';
}

