# Structured Output

Generate structured data in JSON format with schema validation using the Gemini API.

## Overview

Structured output allows you to constrain the model's responses to follow specific JSON schemas, ensuring consistent and parseable data formats. This is particularly useful for applications that need to process model outputs programmatically.

## Basic JSON Mode

### Simple JSON Response
```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Extract the name, age, and occupation from: 'John Smith is a 30-year-old software engineer.'",
  config: {
    responseMimeType: "application/json",
  },
});

console.log(JSON.parse(response.text));
```

## Schema-Based Structured Output

### Defining a Schema
```javascript
const schema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" },
    occupation: { type: "string" },
    skills: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["name", "age", "occupation"]
};

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Create a profile for a software engineer",
  config: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});
```

### Complex Schema Example
```javascript
const productAnalysisSchema = {
  type: "object",
  properties: {
    product: {
      type: "object",
      properties: {
        name: { type: "string" },
        category: { type: "string" },
        price: { type: "number" }
      }
    },
    sentiment: {
      type: "string",
      enum: ["positive", "negative", "neutral"]
    },
    rating: {
      type: "number",
      minimum: 1,
      maximum: 5
    },
    pros: {
      type: "array",
      items: { type: "string" }
    },
    cons: {
      type: "array",
      items: { type: "string" }
    },
    recommendation: {
      type: "boolean"
    }
  },
  required: ["product", "sentiment", "rating"]
};

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Analyze this product review: 'The iPhone 15 Pro is amazing! Great camera, fast performance, but battery life could be better. Worth the $999 price tag.'",
  config: {
    responseMimeType: "application/json",
    responseSchema: productAnalysisSchema,
  },
});
```

## Common Use Cases

### Data Extraction
```javascript
const extractionSchema = {
  type: "object",
  properties: {
    entities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          type: { 
            type: "string",
            enum: ["PERSON", "ORGANIZATION", "LOCATION", "DATE"]
          },
          confidence: { type: "number", minimum: 0, maximum: 1 }
        }
      }
    }
  }
};

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Extract entities from: 'Apple Inc. was founded by Steve Jobs in Cupertino on April 1, 1976.'",
  config: {
    responseMimeType: "application/json",
    responseSchema: extractionSchema,
  },
});
```

### Content Classification
```javascript
const classificationSchema = {
  type: "object",
  properties: {
    categories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 }
        }
      }
    },
    primaryCategory: { type: "string" },
    tags: {
      type: "array",
      items: { type: "string" }
    }
  }
};

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Classify this article: 'Scientists discover new method for renewable energy storage using advanced battery technology.'",
  config: {
    responseMimeType: "application/json",
    responseSchema: classificationSchema,
  },
});
```

### Survey Analysis
```javascript
const surveySchema = {
  type: "object",
  properties: {
    overallSentiment: {
      type: "string",
      enum: ["very_positive", "positive", "neutral", "negative", "very_negative"]
    },
    themes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          theme: { type: "string" },
          frequency: { type: "number" },
          sentiment: { type: "string" }
        }
      }
    },
    actionItems: {
      type: "array",
      items: { type: "string" }
    },
    summary: { type: "string" }
  }
};
```

## Enum Values

Use enums to constrain responses to specific values:

```javascript
const prioritySchema = {
  type: "object",
  properties: {
    task: { type: "string" },
    priority: {
      type: "string",
      enum: ["low", "medium", "high", "urgent"]
    },
    category: {
      type: "string",
      enum: ["bug", "feature", "improvement", "documentation"]
    },
    estimatedHours: { type: "number", minimum: 0.5, maximum: 40 }
  }
};

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Analyze this task: 'Fix the login button that's not working on mobile devices'",
  config: {
    responseMimeType: "application/json",
    responseSchema: prioritySchema,
  },
});
```

## Schema in Text Prompts

You can also provide schema information directly in your prompt:

```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `
    Analyze the following customer feedback and return a JSON object with this structure:
    {
      "sentiment": "positive" | "negative" | "neutral",
      "score": number between 1-10,
      "issues": string[],
      "suggestions": string[]
    }
    
    Customer feedback: "The product is great but delivery was slow and packaging was damaged."
  `,
  config: {
    responseMimeType: "application/json",
  },
});
```

## Python Examples

### Basic Schema Usage
```python
from google import genai
from google.genai.types import GenerateContentConfig

client = genai.Client(api_key="YOUR_API_KEY")

schema = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "number"},
        "skills": {
            "type": "array",
            "items": {"type": "string"}
        }
    }
}

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Create a developer profile",
    config=GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=schema
    )
)

print(response.text)
```

## Best Practices

### Schema Design

1. **Keep schemas simple**: Start with basic structures and add complexity as needed
2. **Use descriptive property names**: Make the schema self-documenting
3. **Include required fields**: Specify which fields are mandatory
4. **Set appropriate constraints**: Use min/max values, enums, and patterns

### Property Ordering

The model will generally follow the order of properties as defined in your schema:

```javascript
const orderedSchema = {
  type: "object",
  properties: {
    title: { type: "string" },        // Will appear first
    summary: { type: "string" },      // Will appear second
    details: { type: "string" },      // Will appear third
    metadata: {                       // Will appear last
      type: "object",
      properties: {
        author: { type: "string" },
        date: { type: "string" }
      }
    }
  }
};
```

### Error Handling

```javascript
try {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Generate structured data",
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  
  const data = JSON.parse(response.text);
  console.log(data);
} catch (error) {
  if (error.message.includes('JSON')) {
    console.log("Invalid JSON response");
  } else {
    console.log("Generation error:", error.message);
  }
}
```

### Validation

```javascript
function validateResponse(data, schema) {
  // Use a JSON schema validator library like ajv
  const Ajv = require('ajv');
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  
  if (validate(data)) {
    return { valid: true, data };
  } else {
    return { valid: false, errors: validate.errors };
  }
}

const result = validateResponse(JSON.parse(response.text), schema);
if (result.valid) {
  console.log("Valid response:", result.data);
} else {
  console.log("Validation errors:", result.errors);
}
```

## JSON Schema Support

The Gemini API supports a subset of JSON Schema Draft 7:

### Supported Types
- `string`
- `number`
- `integer`
- `boolean`
- `array`
- `object`

### Supported Keywords
- `type`
- `properties`
- `required`
- `items`
- `enum`
- `minimum`
- `maximum`
- `minItems`
- `maxItems`
- `description`

### Limitations
- No support for `$ref` or schema composition
- Limited pattern matching
- No conditional schemas (`if`/`then`/`else`)

## Advanced Examples

### Multi-level Nested Objects
```javascript
const complexSchema = {
  type: "object",
  properties: {
    company: {
      type: "object",
      properties: {
        name: { type: "string" },
        industry: { type: "string" },
        employees: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              role: { type: "string" },
              department: { type: "string" },
              salary: { type: "number" }
            }
          }
        }
      }
    },
    analysis: {
      type: "object",
      properties: {
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        opportunities: { type: "array", items: { type: "string" } },
        threats: { type: "array", items: { type: "string" } }
      }
    }
  }
};
```

## What's Next

- Learn about [Function Calling](./function-calling.md) for tool integration
- Explore [Text Generation](./text-generation.md) for general content creation
- Check out [System Instructions](./system-instructions.md) for behavior customization
- Review [API Troubleshooting](./api-troubleshooting.md) for common issues