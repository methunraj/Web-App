import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PromptEditorForm } from "@/components/prompts/PromptEditorForm";

export default function PromptConfigurationPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2"> 
        <h1 className="text-3xl font-bold tracking-tight">Prompt Configuration</h1>
      </div> 
      <Card>
        <CardHeader> 
          <CardTitle>Configure LLM Prompts</CardTitle> 
          <CardDescription> 
            Define the system and user prompts that will be used for data extraction. The user prompt template can use Handlebars placeholders like `{'{{document_content_text}}'}` (for text from the document) or `{'{{media url=document_media_url}}'}` (for direct media processing like images/PDFs), `{'{{json_schema_text}}'}` (for the JSON schema definition), and `{'{{examples_list}}'}` (for few-shot examples). These will be resolved by the system during extraction.
          </CardDescription> 
        </CardHeader> 
        <CardContent>
          <PromptEditorForm />
        </CardContent>
      </Card>
    </div>
  );
}
