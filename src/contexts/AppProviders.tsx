'use client';

import { SchemaProvider } from './SchemaContext';
import { PromptProvider } from './PromptContext';
import { LLMProvider } from './LLMContext';
import { FileProvider } from './FileContext';
import { JobProvider } from './JobContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SchemaProvider>
      <PromptProvider>
        <LLMProvider>
          <FileProvider>
            <JobProvider>
              {children}
            </JobProvider>
          </FileProvider>
        </LLMProvider>
      </PromptProvider>
    </SchemaProvider>
  );
}
