'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  BrainCircuit, 
  Loader2, 
  Sparkles, 
  FileJson2, 
  MessageSquareText, 
  Lightbulb,
  History,
  Settings2,
  Save,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react';
import { useConfiguration, type GenerationInput } from '@/contexts/ConfigurationContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AIGenerationTab() {
  const {
    isGenerating,
    generationHistory,
    generateFromPrompt,
    schemaJson,
    setSchemaJson,
    systemPrompt,
    setSystemPrompt,
    userPromptTemplate,
    setUserPromptTemplate,
    examples,
    setExamples,
    isSchemaGenerated,
    arePromptsGenerated,
    savedSchemas,
    savedPromptSets,
    saveCompleteConfiguration,
    resetConfiguration,
  } = useConfiguration();

  const { toast } = useToast();

  // Generation form state
  const [userIntent, setUserIntent] = useState('');
  const [exampleCount, setExampleCount] = useState(2);
  const [includeValidation, setIncludeValidation] = useState(true);
  const [includeComprehensiveExamples, setIncludeComprehensiveExamples] = useState(true);

  // UI state
  const [activeSection, setActiveSection] = useState<'generation' | 'schema' | 'prompts' | 'test'>('generation');
  const [saveConfigName, setSaveConfigName] = useState('');

  const handleGenerate = async () => {
    if (!userIntent.trim()) {
      toast({ title: "Missing Input", description: "Please describe what you want to extract.", variant: "destructive" });
      return;
    }

    try {
      const generationInput: GenerationInput = {
        userIntent: userIntent.trim(),
        exampleCount,
        includeValidation,
        includeComprehensiveExamples,
      };

      await generateFromPrompt(generationInput);
      
      toast({ 
        title: "Generation Complete", 
        description: "AI configuration has been generated successfully!" 
      });

      // Switch to schema section to show results
      setActiveSection('schema');
    } catch (error) {
      console.error('Generation failed:', error);
      toast({ 
        title: "Generation Failed", 
        description: error instanceof Error ? error.message : "An error occurred during generation.",
        variant: "destructive" 
      });
    }
  };

  const handleSaveCompleteConfig = () => {
    if (!saveConfigName.trim()) {
      toast({ title: "Missing Name", description: "Please enter a name for the configuration.", variant: "destructive" });
      return;
    }

    try {
      saveCompleteConfiguration(saveConfigName.trim());
      toast({ title: "Configuration Saved", description: `Configuration "${saveConfigName}" saved successfully.` });
      setSaveConfigName('');
    } catch (error) {
      toast({ 
        title: "Save Failed", 
        description: error instanceof Error ? error.message : "Failed to save configuration.",
        variant: "destructive" 
      });
    }
  };

  const handleReset = () => {
    resetConfiguration();
    setUserIntent('');
    toast({ title: "Configuration Reset", description: "All configuration has been reset to defaults." });
  };

  return (
    <div className="space-y-6">
      {/* AI Generation Hub */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Configuration Generator
          </CardTitle>
          <CardDescription>
            Describe what you want to extract and let AI generate the complete configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-intent">What do you want to extract? *</Label>
              <Textarea
                id="user-intent"
                placeholder="Describe your extraction goal in detail. For example: 'Extract customer information from invoices including company name, invoice number, date, total amount, and line items with descriptions, quantities and prices.'"
                value={userIntent}
                onChange={(e) => setUserIntent(e.target.value)}
                className="min-h-[100px]"
                disabled={isGenerating}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="example-count">Examples to Generate</Label>
                <Input
                  id="example-count"
                  type="number"
                  min={1}
                  max={5}
                  value={exampleCount}
                  onChange={(e) => setExampleCount(parseInt(e.target.value) || 2)}
                  disabled={isGenerating}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="include-comprehensive-examples"
                  checked={includeComprehensiveExamples}
                  onChange={(e) => setIncludeComprehensiveExamples(e.target.checked)}
                  disabled={isGenerating}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="include-comprehensive-examples" className="text-sm font-medium">
                  Include comprehensive examples for various document types
                </Label>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !userIntent.trim()}
              size="lg"
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Configuration...
                </>
              ) : (
                <>
                  <BrainCircuit className="mr-2 h-5 w-5" />
                  Generate Complete Configuration
                </>
              )}
            </Button>
          </div>

          {generationHistory.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Generations
              </Label>
              <ScrollArea className="h-32 w-full rounded-md border p-2">
                {generationHistory.slice(0, 5).map((result) => (
                  <div key={result.id} className="text-xs p-2 border-b last:border-b-0">
                    <div className="font-medium">{result.input.userIntent.substring(0, 60)}...</div>
                    <div className="text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Sections */}
      <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as typeof activeSection)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generation" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generation
          </TabsTrigger>
          <TabsTrigger value="schema" className="flex items-center gap-2">
            <FileJson2 className="h-4 w-4" />
            Schema
            {isSchemaGenerated && <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">AI</Badge>}
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4" />
            Prompts
            {arePromptsGenerated && <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">AI</Badge>}
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Test & Save
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generation" className="mt-6">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Tips for Better Generation</AlertTitle>
            <AlertDescription>
              • Be specific about the data you want to extract<br/>
              • Mention the document format (PDF, image, text)<br/>
              • Include examples of the information you're looking for<br/>
              • Specify any validation rules or constraints
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="schema" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileJson2 className="h-5 w-5" />
                  JSON Schema
                </span>
                {isSchemaGenerated && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <BrainCircuit className="h-3 w-3" />
                    AI Generated
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Define the structure of data to extract from documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schema-editor">Schema Definition</Label>
                <Textarea
                  id="schema-editor"
                  value={schemaJson}
                  onChange={(e) => setSchemaJson(e.target.value)}
                  className="font-mono text-sm min-h-[300px]"
                  placeholder="JSON schema will appear here after generation..."
                />
              </div>

              <div className="flex items-center gap-2">
                <Select>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Load saved schema" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedSchemas.map((schema) => (
                      <SelectItem key={schema.id} value={schema.id}>
                        {schema.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Load
                </Button>
                <Button variant="outline" size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Save Schema
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>System Prompt</span>
                  {arePromptsGenerated && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <BrainCircuit className="h-3 w-3" />
                      AI Generated
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Instructions for the AI extraction model</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="min-h-[120px]"
                  placeholder="System prompt will be generated here..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Prompt Template</CardTitle>
                <CardDescription>Template for processing individual documents</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={userPromptTemplate}
                  onChange={(e) => setUserPromptTemplate(e.target.value)}
                  className="min-h-[150px]"
                  placeholder="User prompt template will be generated here..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Examples</CardTitle>
                <CardDescription>Few-shot examples to guide the AI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {examples.length > 0 ? (
                    examples.map((example, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Input</Label>
                          <div className="text-sm bg-muted p-2 rounded">{example.input}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Output</Label>
                          <div className="text-sm bg-muted p-2 rounded font-mono">{example.output}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Examples will appear here after AI generation
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="test" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Management</CardTitle>
                <CardDescription>Save, load, and manage your complete configurations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Configuration name"
                    value={saveConfigName}
                    onChange={(e) => setSaveConfigName(e.target.value)}
                    className="flex-grow"
                  />
                  <Button onClick={handleSaveCompleteConfig} disabled={!saveConfigName.trim()}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Complete Config
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset All
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Config
                  </Button>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Config
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration Preview</CardTitle>
                <CardDescription>Review your complete configuration before proceeding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Schema Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={schemaJson ? "default" : "secondary"}>
                        {schemaJson ? "Defined" : "Not Set"}
                      </Badge>
                      {isSchemaGenerated && (
                        <Badge variant="outline" className="text-xs">AI Generated</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="font-medium">Prompts Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={systemPrompt && userPromptTemplate ? "default" : "secondary"}>
                        {systemPrompt && userPromptTemplate ? "Configured" : "Not Set"}
                      </Badge>
                      {arePromptsGenerated && (
                        <Badge variant="outline" className="text-xs">AI Generated</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="font-medium">Examples</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={examples.length > 0 ? "default" : "secondary"}>
                        {examples.length} examples
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="font-medium">Ready for Extraction</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={schemaJson && systemPrompt && userPromptTemplate ? "default" : "destructive"}>
                        {schemaJson && systemPrompt && userPromptTemplate ? "Ready" : "Incomplete"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {schemaJson && systemPrompt && userPromptTemplate && (
                  <Alert>
                    <Settings2 className="h-4 w-4" />
                    <AlertTitle>Configuration Complete</AlertTitle>
                    <AlertDescription>
                      Your extraction configuration is ready! You can now proceed to upload files and run extractions.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}