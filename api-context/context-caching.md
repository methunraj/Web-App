# Context Caching

Optimize performance and reduce costs by caching frequently used content with the Gemini API's context caching feature.

## Overview

Context caching allows you to cache large amounts of input content (like documents, transcripts, or code repositories) and reuse them across multiple API calls. This significantly reduces latency and costs for repeated operations on the same content.

## Key Benefits

- **Cost Reduction**: Cached tokens are significantly cheaper than regular input tokens
- **Performance**: Faster response times for subsequent requests
- **Efficiency**: Ideal for processing large documents multiple times
- **Scalability**: Better resource utilization for batch operations

## Basic Context Caching

### JavaScript/TypeScript
```javascript
import { GoogleGenAI } from "@google/genai";
import { createUserContent, createPartFromUri } from "@google/genai";
import path from "path";

const ai = new GoogleGenAI({ apiKey: "GOOGLE_API_KEY" });

// Upload a large document
const filePath = path.join("media", "large-document.txt");
const document = await ai.files.upload({
  file: filePath,
  config: { mimeType: "text/plain" },
});
console.log("Uploaded file:", document.name);

// Create a cache with the document
const cache = await ai.caches.create({
  model: "gemini-1.5-flash",
  config: {
    contents: [
      createUserContent(createPartFromUri(document.uri, document.mimeType))
    ],
    systemInstruction: "You are an expert document analyzer.",
  },
});
console.log("Cache created:", cache.name);

// Use the cached content
const response = await ai.models.generateContent({
  model: "gemini-1.5-flash",
  contents: "Summarize the key points from this document",
  config: { cachedContent: cache.name },
});
console.log("Response:", response.text);
```

### Python
```python
from google import genai
import pathlib

client = genai.Client(api_key="YOUR_API_KEY")

# Upload a large document
document_path = "path/to/large-document.txt"
document = client.files.upload(
    path=document_path,
    config={"mime_type": "text/plain"}
)
print(f"Uploaded file: {document.name}")

# Create a cache
cache = client.caches.create(
    model="gemini-1.5-flash",
    config={
        "contents": [document],
        "system_instruction": "You are an expert document analyzer.",
    },
)
print(f"Cache created: {cache.name}")

# Use the cached content
response = client.models.generate_content(
    model="gemini-1.5-flash",
    contents="Summarize the key points from this document",
    config={"cached_content": cache.name},
)
print(f"Response: {response.text}")
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

    // Upload document
    file, err := client.Files.Upload(ctx, "path/to/document.txt", &genai.UploadFileConfig{
        MIMEType: "text/plain",
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Uploaded file: %s\n", file.Name)

    // Create cache
    cache, err := client.Caches.Create(ctx, &genai.CreateCacheConfig{
        Model: "gemini-1.5-flash",
        Contents: []*genai.Content{
            {
                Role: "user",
                Parts: []genai.Part{
                    genai.FileData{
                        FileURI:  file.URI,
                        MIMEType: file.MIMEType,
                    },
                },
            },
        },
        SystemInstruction: "You are an expert document analyzer.",
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Cache created: %s\n", cache.Name)

    // Use cached content
    result, err := client.Models.GenerateContent(
        ctx,
        "gemini-1.5-flash",
        genai.Text("Summarize the key points from this document"),
        &genai.GenerateContentConfig{
            CachedContent: cache.Name,
        },
    )
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(result.Text())
}
```

## Advanced Caching Patterns

### Multi-Document Caching
```javascript
// Cache multiple related documents
const documents = await Promise.all([
  ai.files.upload({ file: "doc1.txt", config: { mimeType: "text/plain" } }),
  ai.files.upload({ file: "doc2.txt", config: { mimeType: "text/plain" } }),
  ai.files.upload({ file: "doc3.txt", config: { mimeType: "text/plain" } }),
]);

const cache = await ai.caches.create({
  model: "gemini-1.5-flash",
  config: {
    contents: documents.map(doc => 
      createUserContent(createPartFromUri(doc.uri, doc.mimeType))
    ),
    systemInstruction: "You are analyzing a collection of related documents.",
  },
});

// Query across all cached documents
const response = await ai.models.generateContent({
  model: "gemini-1.5-flash",
  contents: "Compare the main themes across these documents",
  config: { cachedContent: cache.name },
});
```

### Code Repository Caching
```python
# Cache an entire codebase for analysis
import os

def upload_codebase(client, directory_path):
    files = []
    for root, dirs, filenames in os.walk(directory_path):
        for filename in filenames:
            if filename.endswith(('.py', '.js', '.ts', '.java', '.cpp')):
                file_path = os.path.join(root, filename)
                uploaded_file = client.files.upload(
                    path=file_path,
                    config={"mime_type": "text/plain"}
                )
                files.append(uploaded_file)
    return files

# Upload and cache codebase
codebase_files = upload_codebase(client, "./my-project")

cache = client.caches.create(
    model="gemini-1.5-flash",
    config={
        "contents": codebase_files,
        "system_instruction": "You are a senior software engineer reviewing code.",
    },
)

# Analyze the cached codebase
response = client.models.generate_content(
    model="gemini-1.5-flash",
    contents="Identify potential security vulnerabilities in this codebase",
    config={"cached_content": cache.name},
)
```

## Cache Management

### List Existing Caches
```javascript
const caches = await ai.caches.list();
console.log("Available caches:", caches.map(c => c.name));
```

### Get Cache Information
```javascript
const cacheInfo = await ai.caches.get(cache.name);
console.log("Cache details:", {
  name: cacheInfo.name,
  model: cacheInfo.model,
  tokenCount: cacheInfo.usageMetadata.totalTokenCount,
  createTime: cacheInfo.createTime,
  expireTime: cacheInfo.expireTime,
});
```

### Update Cache TTL
```python
# Extend cache lifetime
updated_cache = client.caches.update(
    name=cache.name,
    config={"ttl": "3600s"}  # 1 hour
)
```

### Delete Cache
```javascript
await ai.caches.delete(cache.name);
console.log("Cache deleted");
```

## Performance Optimization

### Optimal Cache Size
```javascript
// Check token count before caching
const tokenCount = await ai.models.countTokens({
  model: "gemini-1.5-flash",
  contents: largeDocument,
});

if (tokenCount.totalTokens > 32000) {
  console.log("Document is large enough to benefit from caching");
  // Proceed with caching
} else {
  console.log("Document may be too small for caching benefits");
}
```

### Batch Operations with Caching
```python
# Process multiple queries efficiently
queries = [
    "Summarize the main points",
    "Extract key statistics",
    "Identify action items",
    "List all mentioned companies",
]

results = []
for query in queries:
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=query,
        config={"cached_content": cache.name},
    )
    results.append(response.text)

print("All queries completed using cached content")
```

## Cost Analysis

### Token Usage Tracking
```javascript
const response = await ai.models.generateContent({
  model: "gemini-1.5-flash",
  contents: "Analyze this document",
  config: { cachedContent: cache.name },
});

console.log("Token usage:", {
  cachedTokens: response.usageMetadata.cachedContentTokenCount,
  inputTokens: response.usageMetadata.promptTokenCount,
  outputTokens: response.usageMetadata.candidatesTokenCount,
  totalTokens: response.usageMetadata.totalTokenCount,
});
```

## Best Practices

### When to Use Context Caching
- **Large Documents**: Files over 32K tokens benefit most from caching
- **Repeated Analysis**: Multiple queries on the same content
- **Batch Processing**: Processing many similar requests
- **Interactive Applications**: Chat interfaces with persistent context

### Cache Lifecycle Management
```javascript
class CacheManager {
  constructor(ai) {
    this.ai = ai;
    this.caches = new Map();
  }

  async createCache(key, content, config = {}) {
    const cache = await this.ai.caches.create({
      model: "gemini-1.5-flash",
      config: {
        contents: content,
        ttl: config.ttl || "3600s",
        ...config,
      },
    });
    
    this.caches.set(key, cache);
    return cache;
  }

  async getOrCreateCache(key, contentFactory, config = {}) {
    if (this.caches.has(key)) {
      return this.caches.get(key);
    }
    
    const content = await contentFactory();
    return this.createCache(key, content, config);
  }

  async cleanup() {
    for (const [key, cache] of this.caches) {
      try {
        await this.ai.caches.delete(cache.name);
        this.caches.delete(key);
      } catch (error) {
        console.warn(`Failed to delete cache ${key}:`, error);
      }
    }
  }
}
```

### Error Handling
```python
try:
    cache = client.caches.create(
        model="gemini-1.5-flash",
        config={
            "contents": large_document,
            "system_instruction": "You are a document analyzer.",
        },
    )
except Exception as e:
    if "INVALID_ARGUMENT" in str(e):
        print("Document may be too large or invalid format")
    elif "QUOTA_EXCEEDED" in str(e):
        print("Cache quota exceeded, clean up old caches")
    else:
        print(f"Unexpected error: {e}")
    raise
```

## Common Use Cases

### Document Analysis Service
```javascript
class DocumentAnalyzer {
  constructor(ai) {
    this.ai = ai;
    this.documentCaches = new Map();
  }

  async analyzeDocument(documentPath, queries) {
    // Create or get existing cache
    let cache = this.documentCaches.get(documentPath);
    if (!cache) {
      const document = await this.ai.files.upload({
        file: documentPath,
        config: { mimeType: "text/plain" },
      });
      
      cache = await this.ai.caches.create({
        model: "gemini-1.5-flash",
        config: {
          contents: [createUserContent(createPartFromUri(document.uri, document.mimeType))],
          systemInstruction: "You are an expert document analyzer.",
        },
      });
      
      this.documentCaches.set(documentPath, cache);
    }

    // Process all queries using cached content
    const results = [];
    for (const query of queries) {
      const response = await this.ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: query,
        config: { cachedContent: cache.name },
      });
      results.push({ query, response: response.text });
    }

    return results;
  }
}
```

### Meeting Transcript Analysis
```python
class MeetingAnalyzer:
    def __init__(self, client):
        self.client = client
        self.meeting_caches = {}
    
    def analyze_meeting(self, transcript_path, meeting_id):
        # Cache the transcript
        if meeting_id not in self.meeting_caches:
            transcript = self.client.files.upload(
                path=transcript_path,
                config={"mime_type": "text/plain"}
            )
            
            cache = self.client.caches.create(
                model="gemini-1.5-flash",
                config={
                    "contents": [transcript],
                    "system_instruction": "You are analyzing a meeting transcript.",
                },
            )
            
            self.meeting_caches[meeting_id] = cache
        
        cache = self.meeting_caches[meeting_id]
        
        # Generate multiple analyses
        analyses = {}
        
        # Summary
        summary = self.client.models.generate_content(
            model="gemini-1.5-flash",
            contents="Provide a concise summary of this meeting",
            config={"cached_content": cache.name},
        )
        analyses["summary"] = summary.text
        
        # Action items
        actions = self.client.models.generate_content(
            model="gemini-1.5-flash",
            contents="Extract all action items and assign responsibilities",
            config={"cached_content": cache.name},
        )
        analyses["action_items"] = actions.text
        
        # Key decisions
        decisions = self.client.models.generate_content(
            model="gemini-1.5-flash",
            contents="List all key decisions made in this meeting",
            config={"cached_content": cache.name},
        )
        analyses["decisions"] = decisions.text
        
        return analyses
```

## Technical Specifications

### Cache Limits
- **Minimum Content Size**: 32,768 tokens (2.5 Flash), 2,048 tokens (other models)
- **Maximum Content Size**: Same as model's context window
- **Cache TTL**: Default 1 hour, maximum 24 hours
- **Maximum Caches**: 100 per project

### Supported Content Types
- Text documents
- Code files
- Structured data (JSON, CSV)
- Images (when using multimodal models)
- Audio files (when using audio-capable models)

### Pricing
- Cached tokens: ~50% cost reduction compared to regular input tokens
- Cache storage: Minimal additional cost
- Cache operations: Standard API call pricing

## Troubleshooting

### Common Issues

**Cache Creation Fails**
```javascript
try {
  const cache = await ai.caches.create(config);
} catch (error) {
  if (error.message.includes('INVALID_ARGUMENT')) {
    console.log('Check content size and format');
  } else if (error.message.includes('QUOTA_EXCEEDED')) {
    console.log('Clean up existing caches');
  }
}
```

**Cache Not Found**
```python
try:
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents="Query",
        config={"cached_content": cache_name},
    )
except Exception as e:
    if "NOT_FOUND" in str(e):
        print("Cache expired or deleted, recreate cache")
        # Recreate cache logic here
```

## Related Documentation

- [Files API](./files-api.md) - Upload and manage files for caching
- [Token Counting](./token-counting.md) - Understand token usage and costs
- [Text Generation](./text-generation.md) - Basic text generation capabilities
- [Performance Optimization](./performance-optimization.md) - General optimization strategies