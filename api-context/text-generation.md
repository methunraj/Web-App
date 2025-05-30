# Text Generation

Generate high-quality text content using the Gemini API's powerful language models.

## Overview

The Gemini API provides state-of-the-art text generation capabilities through models like Gemini 2.0 Flash. You can generate creative content, answer questions, summarize text, and much more.

## Basic Text Generation

### JavaScript/TypeScript
```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "GOOGLE_API_KEY" });

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Tell me a story in 300 words.",
});
console.log(response.text);
```

### Python
```python
from google import genai

client = genai.Client(api_key="YOUR_API_KEY")

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Tell me a story in 300 words.",
)

print(response.text)
```

### Go
```go
ctx := context.Background()
client, err := genai.NewClient(ctx, &genai.ClientConfig{
    APIKey:  apiKey,
    Backend: genai.BackendGeminiAPI,
})
if err != nil {
    log.Fatal(err)
}

result, err := client.Models.GenerateContent(
    ctx, 
    "gemini-2.0-flash", 
    genai.Text("Tell me a story in 300 words."), 
    nil
)
if err != nil {
    log.Fatal(err)
}
fmt.Println(result.Text())
```

## Configuration Options

### Generation Configuration
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Write a technical blog post about AI",
  config: {
    maxOutputTokens: 1000,
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    stopSequences: ["\n\n---\n\n"],
  },
});
```

### System Instructions
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Explain quantum computing",
  config: {
    systemInstruction: "You are a technical writer who explains complex topics in simple terms for beginners.",
    maxOutputTokens: 500,
    temperature: 0.3,
  },
});
```

## Streaming Responses

For long-form content, use streaming to get responses as they're generated:

```javascript
const stream = ai.models.generateContentStream({
  model: "gemini-2.0-flash",
  contents: "Write a detailed analysis of renewable energy trends",
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

## Multi-turn Conversations (Chat)

```javascript
const chat = ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      role: "user",
      parts: [{ text: "What are the benefits of renewable energy?" }]
    },
    {
      role: "model",
      parts: [{ text: "Renewable energy offers several key benefits: environmental sustainability, reduced carbon emissions, energy independence, and long-term cost savings..." }]
    },
    {
      role: "user",
      parts: [{ text: "Can you elaborate on the cost savings aspect?" }]
    }
  ],
});
```

## Advanced Features

### JSON Response Format
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Analyze this product review and extract sentiment, key points, and rating",
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
        keyPoints: { type: "array", items: { type: "string" } },
        rating: { type: "number", minimum: 1, maximum: 5 }
      }
    }
  },
});
```

### Safety Settings
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Write a story about adventure",
  config: {
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  },
});
```

## Best Practices

### Prompting Tips

1. **Be Specific**: Provide clear, detailed instructions
   ```javascript
   // Good
   "Write a 500-word technical blog post about machine learning for beginners, including practical examples"
   
   // Less effective
   "Write about AI"
   ```

2. **Use Examples**: Show the model what you want
   ```javascript
   "Format the response as a FAQ. Example:\nQ: What is AI?\nA: Artificial Intelligence is...\n\nNow create a FAQ about renewable energy:"
   ```

3. **Set Context**: Provide relevant background information
   ```javascript
   "You are a financial advisor. A client asks about investment strategies for retirement planning. Provide advice considering current market conditions."
   ```

### Temperature Guidelines

- **0.0-0.3**: Factual, consistent responses (documentation, analysis)
- **0.4-0.7**: Balanced creativity and consistency (general writing)
- **0.8-1.0**: High creativity (creative writing, brainstorming)

### Token Management

```javascript
// Count tokens before generation
const tokenCount = await ai.models.countTokens({
  model: "gemini-2.0-flash",
  contents: "Your prompt here",
});

console.log(`Input tokens: ${tokenCount.totalTokens}`);
```

## Common Use Cases

### Content Creation
```javascript
const blogPost = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Write a blog post about sustainable living tips",
  config: {
    systemInstruction: "Write in a friendly, informative tone with actionable advice",
    maxOutputTokens: 800,
    temperature: 0.6,
  },
});
```

### Code Documentation
```javascript
const documentation = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Document this function: function calculateTax(income, rate) { return income * rate; }",
  config: {
    systemInstruction: "Generate clear, comprehensive JSDoc comments",
    temperature: 0.2,
  },
});
```

### Summarization
```javascript
const summary = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `Summarize this article in 3 bullet points: ${longArticleText}`,
  config: {
    maxOutputTokens: 200,
    temperature: 0.3,
  },
});
```

### Translation
```javascript
const translation = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Translate this to Spanish: 'Hello, how are you today?'",
  config: {
    temperature: 0.1,
  },
});
```

## Error Handling

```javascript
try {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Generate content",
  });
  
  if (response.candidates[0].finishReason === "SAFETY") {
    console.log("Content was blocked due to safety filters");
  } else {
    console.log(response.text);
  }
} catch (error) {
  if (error.status === 429) {
    console.log("Rate limit exceeded. Please try again later.");
  } else if (error.status === 400) {
    console.log("Invalid request. Check your parameters.");
  } else {
    console.log("An error occurred:", error.message);
  }
}
```

## Supported Models

- **gemini-2.0-flash**: Latest and most capable model
- **gemini-1.5-flash**: Fast and efficient for most tasks
- **gemini-1.5-pro**: High-quality responses for complex tasks

## Rate Limits and Quotas

- Free tier: 15 requests per minute
- Paid tier: Higher limits based on your plan
- Monitor usage through the Google AI Studio dashboard

## What's Next

- Explore [Multimodal inputs](./image-understanding.md) for text + image generation
- Learn about [Function calling](./function-calling.md) for tool integration
- Check out [Structured output](./structured-output.md) for JSON responses
- Review [System instructions](./system-instructions.md) for behavior customization