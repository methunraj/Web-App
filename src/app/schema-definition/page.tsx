import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SchemaEditorForm } from "@/components/schema/SchemaEditorForm";

export default function SchemaDefinitionPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Schema Definition</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Define Extraction Schema</CardTitle>
          <CardDescription>
            Create or import a JSON schema to define the structure of the data you want to extract.
            You can also use AI to generate a schema based on your intent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SchemaEditorForm />
        </CardContent>
      </Card>
    </div>
  );
}
