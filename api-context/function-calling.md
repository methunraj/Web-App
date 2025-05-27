# Function Calling

Integrate external tools and APIs with the Gemini API using function calling capabilities.

## Overview

Function calling allows Gemini models to interact with external systems, APIs, and tools. The model can determine when to call functions, extract the necessary parameters, and use the results to provide more accurate and up-to-date responses.

## Basic Function Calling

### Define a Function
```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

// Define a function schema
const weatherFunction = {
  name: "get_weather",
  description: "Get the current weather for a location",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "The city and state, e.g. San Francisco, CA"
      },
      unit: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
        description: "The temperature unit"
      }
    },
    required: ["location"]
  }
};

// Implement the actual function
function getWeather(location, unit = "fahrenheit") {
  // This would typically call a real weather API
  return {
    location: location,
    temperature: 72,
    unit: unit,
    condition: "sunny",
    humidity: 65
  };
}
```

### Use Function Calling
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "What's the weather like in New York?",
  config: {
    tools: [
      {
        functionDeclarations: [weatherFunction]
      }
    ]
  }
});

// Check if the model wants to call a function
if (response.candidates[0].content.parts[0].functionCall) {
  const functionCall = response.candidates[0].content.parts[0].functionCall;
  
  if (functionCall.name === "get_weather") {
    const args = functionCall.args;
    const weatherData = getWeather(args.location, args.unit);
    
    // Send the function result back to the model
    const followUpResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        "What's the weather like in New York?",
        {
          role: "model",
          parts: [{ functionCall: functionCall }]
        },
        {
          role: "function",
          parts: [{
            functionResponse: {
              name: "get_weather",
              response: weatherData
            }
          }]
        }
      ],
      config: {
        tools: [
          {
            functionDeclarations: [weatherFunction]
          }
        ]
      }
    });
    
    console.log(followUpResponse.text);
  }
}
```

## Automatic Function Calling

For simpler workflows, use automatic function calling:

```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "What's the weather in Tokyo and what time is it there?",
  config: {
    tools: [
      {
        functionDeclarations: [
          weatherFunction,
          {
            name: "get_time",
            description: "Get the current time for a location",
            parameters: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "The city and country"
                },
                timezone: {
                  type: "string",
                  description: "The timezone identifier"
                }
              },
              required: ["location"]
            }
          }
        ]
      }
    ],
    toolConfig: {
      functionCallingConfig: {
        mode: "AUTO"
      }
    }
  }
});
```

## Multiple Function Definitions

```javascript
const functions = [
  {
    name: "search_web",
    description: "Search the web for current information",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query"
        },
        num_results: {
          type: "integer",
          description: "Number of results to return",
          default: 5
        }
      },
      required: ["query"]
    }
  },
  {
    name: "calculate",
    description: "Perform mathematical calculations",
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "Mathematical expression to evaluate"
        }
      },
      required: ["expression"]
    }
  },
  {
    name: "send_email",
    description: "Send an email to a recipient",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Recipient email address"
        },
        subject: {
          type: "string",
          description: "Email subject"
        },
        body: {
          type: "string",
          description: "Email body content"
        }
      },
      required: ["to", "subject", "body"]
    }
  }
];

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Calculate 15% tip on $85.50 and send the result to john@example.com",
  config: {
    tools: [
      {
        functionDeclarations: functions
      }
    ]
  }
});
```

## Function Implementation Examples

### Database Query Function
```javascript
const databaseFunction = {
  name: "query_database",
  description: "Query a database for information",
  parameters: {
    type: "object",
    properties: {
      table: {
        type: "string",
        description: "The database table to query"
      },
      filters: {
        type: "object",
        description: "Filters to apply to the query"
      },
      limit: {
        type: "integer",
        description: "Maximum number of results",
        default: 10
      }
    },
    required: ["table"]
  }
};

function queryDatabase(table, filters = {}, limit = 10) {
  // Implement database query logic
  const mockResults = [
    { id: 1, name: "Product A", price: 29.99, category: "electronics" },
    { id: 2, name: "Product B", price: 19.99, category: "books" }
  ];
  
  return {
    results: mockResults.slice(0, limit),
    total: mockResults.length,
    table: table,
    filters: filters
  };
}
```

### API Integration Function
```javascript
const apiFunction = {
  name: "call_external_api",
  description: "Call an external REST API",
  parameters: {
    type: "object",
    properties: {
      endpoint: {
        type: "string",
        description: "The API endpoint URL"
      },
      method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "DELETE"],
        description: "HTTP method"
      },
      headers: {
        type: "object",
        description: "Request headers"
      },
      body: {
        type: "object",
        description: "Request body for POST/PUT requests"
      }
    },
    required: ["endpoint", "method"]
  }
};

async function callExternalAPI(endpoint, method, headers = {}, body = null) {
  try {
    const response = await fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : null
    });
    
    const data = await response.json();
    return {
      status: response.status,
      data: data,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 500,
      error: error.message,
      success: false
    };
  }
}
```

### File System Function
```javascript
const fileSystemFunction = {
  name: "file_operations",
  description: "Perform file system operations",
  parameters: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["read", "write", "list", "delete"],
        description: "The file operation to perform"
      },
      path: {
        type: "string",
        description: "File or directory path"
      },
      content: {
        type: "string",
        description: "Content to write (for write operations)"
      }
    },
    required: ["operation", "path"]
  }
};

function fileOperations(operation, path, content = null) {
  const fs = require('fs');
  
  try {
    switch (operation) {
      case 'read':
        return {
          success: true,
          content: fs.readFileSync(path, 'utf8'),
          path: path
        };
      
      case 'write':
        fs.writeFileSync(path, content);
        return {
          success: true,
          message: `File written to ${path}`,
          path: path
        };
      
      case 'list':
        return {
          success: true,
          files: fs.readdirSync(path),
          path: path
        };
      
      case 'delete':
        fs.unlinkSync(path);
        return {
          success: true,
          message: `File deleted: ${path}`,
          path: path
        };
      
      default:
        return {
          success: false,
          error: `Unknown operation: ${operation}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      path: path
    };
  }
}
```

## Advanced Function Calling Patterns

### Chained Function Calls
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Get the weather in Paris, then find flights from New York to Paris for next week",
  config: {
    tools: [
      {
        functionDeclarations: [
          weatherFunction,
          {
            name: "search_flights",
            description: "Search for flights between cities",
            parameters: {
              type: "object",
              properties: {
                origin: { type: "string" },
                destination: { type: "string" },
                departure_date: { type: "string" },
                return_date: { type: "string" }
              },
              required: ["origin", "destination", "departure_date"]
            }
          }
        ]
      }
    ]
  }
});
```

### Conditional Function Calling
```javascript
const conditionalFunction = {
  name: "process_data",
  description: "Process data based on conditions",
  parameters: {
    type: "object",
    properties: {
      data_type: {
        type: "string",
        enum: ["text", "image", "audio", "video"]
      },
      processing_options: {
        type: "object",
        properties: {
          analyze: { type: "boolean" },
          transform: { type: "boolean" },
          validate: { type: "boolean" }
        }
      }
    },
    required: ["data_type"]
  }
};

function processData(dataType, processingOptions = {}) {
  const results = {
    dataType: dataType,
    timestamp: new Date().toISOString(),
    results: []
  };
  
  if (processingOptions.analyze) {
    results.results.push(`Analyzed ${dataType} data`);
  }
  
  if (processingOptions.transform) {
    results.results.push(`Transformed ${dataType} data`);
  }
  
  if (processingOptions.validate) {
    results.results.push(`Validated ${dataType} data`);
  }
  
  return results;
}
```

## Python Examples

### Basic Function Calling
```python
from google import genai
from google.genai.types import FunctionDeclaration, Tool

client = genai.Client(api_key="YOUR_API_KEY")

# Define function
get_weather_func = FunctionDeclaration(
    name="get_weather",
    description="Get current weather for a location",
    parameters={
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "City and state"
            }
        },
        "required": ["location"]
    }
)

# Create tool
weather_tool = Tool(function_declarations=[get_weather_func])

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="What's the weather in Boston?",
    config={"tools": [weather_tool]}
)

# Handle function call
if response.candidates[0].content.parts[0].function_call:
    function_call = response.candidates[0].content.parts[0].function_call
    
    # Implement your function logic here
    weather_data = get_weather(function_call.args["location"])
    
    # Continue conversation with function result
    follow_up = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[
            "What's the weather in Boston?",
            {"role": "model", "parts": [{"function_call": function_call}]},
            {
                "role": "function",
                "parts": [{
                    "function_response": {
                        "name": "get_weather",
                        "response": weather_data
                    }
                }]
            }
        ],
        config={"tools": [weather_tool]}
    )
```

## Error Handling

```javascript
try {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Call a function to get data",
    config: {
      tools: [{ functionDeclarations: [myFunction] }]
    }
  });
  
  if (response.candidates[0].content.parts[0].functionCall) {
    const functionCall = response.candidates[0].content.parts[0].functionCall;
    
    try {
      const result = await executeFunction(functionCall.name, functionCall.args);
      
      // Continue with function result
      const followUp = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          // ... conversation history
          {
            role: "function",
            parts: [{
              functionResponse: {
                name: functionCall.name,
                response: result
              }
            }]
          }
        ],
        config: {
          tools: [{ functionDeclarations: [myFunction] }]
        }
      });
      
    } catch (functionError) {
      // Handle function execution error
      const errorResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          // ... conversation history
          {
            role: "function",
            parts: [{
              functionResponse: {
                name: functionCall.name,
                response: {
                  error: functionError.message,
                  success: false
                }
              }
            }]
          }
        ],
        config: {
          tools: [{ functionDeclarations: [myFunction] }]
        }
      });
    }
  }
} catch (error) {
  console.error('Error in function calling:', error);
}
```

## Best Practices

### Function Design

1. **Clear Descriptions**: Provide detailed function descriptions
2. **Specific Parameters**: Use specific parameter types and constraints
3. **Error Handling**: Always handle function execution errors
4. **Validation**: Validate function parameters before execution

### Security Considerations

```javascript
function secureFunction(params) {
  // Validate inputs
  if (!params || typeof params !== 'object') {
    throw new Error('Invalid parameters');
  }
  
  // Sanitize inputs
  const sanitizedParams = sanitizeInputs(params);
  
  // Check permissions
  if (!hasPermission(sanitizedParams.operation)) {
    throw new Error('Permission denied');
  }
  
  // Execute with rate limiting
  return rateLimitedExecution(sanitizedParams);
}
```

### Performance Optimization

```javascript
// Cache function results when appropriate
const functionCache = new Map();

function cachedFunction(params) {
  const cacheKey = JSON.stringify(params);
  
  if (functionCache.has(cacheKey)) {
    return functionCache.get(cacheKey);
  }
  
  const result = expensiveOperation(params);
  functionCache.set(cacheKey, result);
  
  return result;
}
```

## Real-world Applications

### E-commerce Assistant
```javascript
const ecommerceTools = [
  {
    name: "search_products",
    description: "Search for products in the catalog",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        category: { type: "string" },
        price_range: {
          type: "object",
          properties: {
            min: { type: "number" },
            max: { type: "number" }
          }
        }
      },
      required: ["query"]
    }
  },
  {
    name: "add_to_cart",
    description: "Add a product to the shopping cart",
    parameters: {
      type: "object",
      properties: {
        product_id: { type: "string" },
        quantity: { type: "integer", minimum: 1 }
      },
      required: ["product_id"]
    }
  },
  {
    name: "check_inventory",
    description: "Check product availability",
    parameters: {
      type: "object",
      properties: {
        product_id: { type: "string" }
      },
      required: ["product_id"]
    }
  }
];
```

### Data Analysis Assistant
```javascript
const dataAnalysisTools = [
  {
    name: "load_dataset",
    description: "Load a dataset for analysis",
    parameters: {
      type: "object",
      properties: {
        source: { type: "string" },
        format: { type: "string", enum: ["csv", "json", "excel"] }
      },
      required: ["source"]
    }
  },
  {
    name: "analyze_data",
    description: "Perform statistical analysis on data",
    parameters: {
      type: "object",
      properties: {
        dataset_id: { type: "string" },
        analysis_type: {
          type: "string",
          enum: ["descriptive", "correlation", "regression", "clustering"]
        },
        columns: { type: "array", items: { type: "string" } }
      },
      required: ["dataset_id", "analysis_type"]
    }
  },
  {
    name: "create_visualization",
    description: "Create charts and graphs",
    parameters: {
      type: "object",
      properties: {
        dataset_id: { type: "string" },
        chart_type: {
          type: "string",
          enum: ["bar", "line", "scatter", "histogram", "pie"]
        },
        x_axis: { type: "string" },
        y_axis: { type: "string" }
      },
      required: ["dataset_id", "chart_type"]
    }
  }
];
```

## What's Next

- Explore [Code Execution](./code-execution.md) for running code within the model
- Learn about [Structured Output](./structured-output.md) for consistent responses
- Check out [System Instructions](./system-instructions.md) for behavior customization
- Review [API Troubleshooting](./api-troubleshooting.md) for common issues