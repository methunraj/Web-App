import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LLMConfigForm } from "@/components/llm/LLMConfigForm";

export default function LLMConfigurationPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">LLM Configuration</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Configure LLM Provider</CardTitle>
          <CardDescription>
            Select your preferred Large Language Model provider and enter the necessary credentials and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LLMConfigForm />
        </CardContent>
      </Card>
    </div>
  );
}
