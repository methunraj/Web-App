'use client';
import type { Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import type { Example } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface SavedPromptSet {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  examples: Example[];
  createdAt: number;
}

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


interface PromptContextType {
  systemPrompt: string;
  setSystemPrompt: Dispatch<SetStateAction<string>>;
  userPromptTemplate: string;
  setUserPromptTemplate: Dispatch<SetStateAction<string>>;
  examples: Example[];
  setExamples: Dispatch<SetStateAction<Example[]>>;
  
  savedPromptSets: SavedPromptSet[];
  savePromptSetToList: (name: string, systemPrompt: string, userPromptTemplate: string, examples: Example[]) => void;
  loadPromptSetFromList: (promptSetId: string) => SavedPromptSet | null;
  deletePromptSetFromList: (promptSetId: string) => void;
  updatePromptSetInList: (promptSetId: string, name: string, systemPrompt: string, userPromptTemplate: string, examples: Example[]) => void;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export function PromptProvider({ children }: { children: React.ReactNode }) {
  const [systemPrompt, setSystemPrompt] = useState<string>(defaultSystemPrompt);
  const [userPromptTemplate, setUserPromptTemplate] = useState<string>(defaultUserPromptTemplate);
  const [examples, setExamples] = useState<Example[]>([]);
  const [savedPromptSets, setSavedPromptSets] = useState<SavedPromptSet[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSets = localStorage.getItem('intelliextract_savedPromptSets');
      if (storedSets) {
        setSavedPromptSets(JSON.parse(storedSets));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('intelliextract_savedPromptSets', JSON.stringify(savedPromptSets));
    }
  }, [savedPromptSets]);

  const savePromptSetToList = useCallback((name: string, newSystemPrompt: string, newUserPromptTemplate: string, newExamples: Example[]) => {
    if (!name.trim()) throw new Error("Prompt set name cannot be empty.");
    if (savedPromptSets.some(ps => ps.name === name.trim())) {
        throw new Error(`Prompt set with name "${name.trim()}" already exists. Use a different name or update the existing one.`);
    }
    const newSet: SavedPromptSet = {
      id: uuidv4(),
      name: name.trim(),
      systemPrompt: newSystemPrompt,
      userPromptTemplate: newUserPromptTemplate,
      examples: newExamples,
      createdAt: Date.now(),
    };
    setSavedPromptSets(prev => [...prev, newSet].sort((a,b) => a.name.localeCompare(b.name)));
  }, [savedPromptSets]);
  
  const updatePromptSetInList = useCallback((promptSetId: string, name: string, newSystemPrompt: string, newUserPromptTemplate: string, newExamples: Example[]) => {
    if (!name.trim()) throw new Error("Prompt set name cannot be empty.");
    setSavedPromptSets(prev => 
      prev.map(ps => 
        ps.id === promptSetId ? { ...ps, name: name.trim(), systemPrompt: newSystemPrompt, userPromptTemplate: newUserPromptTemplate, examples: newExamples, createdAt: Date.now() } : ps
      ).sort((a,b) => a.name.localeCompare(b.name))
    );
  }, []);

  const loadPromptSetFromList = useCallback((promptSetId: string): SavedPromptSet | null => {
    const setToLoad = savedPromptSets.find(ps => ps.id === promptSetId);
    if (setToLoad) {
      setSystemPrompt(setToLoad.systemPrompt);
      setUserPromptTemplate(setToLoad.userPromptTemplate);
      setExamples(setToLoad.examples);
      return setToLoad;
    }
    return null;
  }, [savedPromptSets, setSystemPrompt, setUserPromptTemplate, setExamples]);

  const deletePromptSetFromList = useCallback((promptSetId: string) => {
    setSavedPromptSets(prev => prev.filter(ps => ps.id !== promptSetId));
  }, []);

  const value = useMemo(() => ({
    systemPrompt, setSystemPrompt,
    userPromptTemplate, setUserPromptTemplate,
    examples, setExamples,
    savedPromptSets, savePromptSetToList, loadPromptSetFromList, deletePromptSetFromList, updatePromptSetInList
  }), [
    systemPrompt, userPromptTemplate, examples, 
    savedPromptSets, savePromptSetToList, loadPromptSetFromList, deletePromptSetFromList, updatePromptSetInList
  ]);

  return <PromptContext.Provider value={value}>{children}</PromptContext.Provider>;
}

export function usePrompts() {
  const context = useContext(PromptContext);
  if (context === undefined) {
    throw new Error('usePrompts must be used within a PromptProvider');
  }
  return context;
}
