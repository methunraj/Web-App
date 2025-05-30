# Gemini API Quickstart

Get a Gemini API key and make your first API request in minutes.

## Overview

The Gemini API provides access to Google's most capable AI models, including Gemini 2.0 Flash, for text generation, multimodal understanding, and more. This quickstart guide will help you get up and running quickly.

## Prerequisites

- A Google account
- An API key (see [API Keys guide](./api-keys.md))
- Node.js, Python, or Go development environment

## Installation

### JavaScript/TypeScript
```bash
npm install @google/genai
```

### Python
```bash
pip install -U -q "google-genai"
```

### Go
```bash
go get google.golang.org/genai
```

## Basic Usage

### JavaScript/TypeScript
```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

await main();
```

### Python
```python
from google import genai

client = genai.Client(api_key="YOUR_API_KEY")

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Explain how AI works in a few words",
)

print(response.text)
```

### Go
```go
package main

import (
    "context"
    "fmt"
    "log"

    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, &genai.ClientConfig{
        APIKey:  "YOUR_API_KEY",
        Backend: genai.BackendGeminiAPI,
    })
    if err != nil {
        log.Fatal(err)
    }

    result, err := client.Models.GenerateContent(
        ctx,
        "gemini-2.0-flash",
        genai.Text("Explain how AI works in a few words"),
        nil,
    )
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(result.Text())
}
```

## Configuration Options

### Generation Configuration
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Tell me a story about a magic backpack.",
  config: {
    candidateCount: 1,
    stopSequences: ["x"],
    maxOutputTokens: 20,
    temperature: 1.0,
  },
});
```

### System Instructions
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Tell me a story",
  config: {
    systemInstruction: "You are a story teller for kids under 5 years old",
    maxOutputTokens: 400,
    temperature: 0.5,
  },
});
```

## API Versions

The SDK defaults to `v1beta`, but you can specify other versions:

```javascript
const ai = new GoogleGenAI({
  apiKey: "YOUR_API_KEY",
  httpOptions: { apiVersion: "v1alpha" },
});
```

## Error Handling

```javascript
try {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Hello, world!",
  });
  console.log(response.text);
} catch (error) {
  console.error("Error generating content:", error);
}
```

## Next Steps

- Explore [Text Generation](./text-generation.md) for more advanced text capabilities
- Learn about [Multimodal inputs](./image-understanding.md) for image and video processing
- Check out [Function Calling](./function-calling.md) for tool integration
- Review [System Instructions](./system-instructions.md) for behavior customization
- See [Structured Output](./structured-output.md) for JSON responses

## Common Use Cases

### Chat Conversation
```javascript
const chat = ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    { role: "user", parts: [{ text: "Hello!" }] },
    { role: "model", parts: [{ text: "Hi there! How can I help you today?" }] },
    { role: "user", parts: [{ text: "What's the weather like?" }] },
  ],
});
```

### Streaming Responses
```javascript
const stream = ai.models.generateContentStream({
  model: "gemini-2.0-flash",
  contents: "Write a long story",
});

for await (const chunk of stream) {
  console.log(chunk.text);
}
```

## Resources

- [API Reference](https://ai.google.dev/api)
- [Cookbook Examples](https://ai.google.dev/gemini-api/cookbook)
- [Community Forum](https://ai.google.dev/gemini-api/community)
- [Troubleshooting Guide](./api-troubleshooting.md)