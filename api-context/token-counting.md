# Token Counting

Understand and optimize token usage with the Gemini API's token counting capabilities.

## Overview

Tokens are the basic units of text processing in language models. Understanding token usage is crucial for:
- **Cost Management**: API pricing is based on token consumption
- **Performance Optimization**: Managing context window limits
- **Request Planning**: Estimating costs before making API calls
- **Content Optimization**: Optimizing prompts and responses

## Basic Token Counting

### JavaScript/TypeScript
```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "GOOGLE_API_KEY" });

// Count tokens in a prompt
const prompt = "The quick brown fox jumps over the lazy dog.";
const countResult = await ai.models.countTokens({
  model: "gemini-2.0-flash",
  contents: prompt,
});

console.log("Token count:", countResult.totalTokens);

// Count tokens with generation config
const countWithConfig = await ai.models.countTokens({
  model: "gemini-2.0-flash",
  contents: prompt,
  config: {
    systemInstruction: "You are a helpful assistant.",
    maxOutputTokens: 100,
  },
});

console.log("Total tokens with config:", countWithConfig.totalTokens);
```

### Python
```python
from google import genai

client = genai.Client(api_key="YOUR_API_KEY")

# Count tokens in a prompt
prompt = "The quick brown fox jumps over the lazy dog."
response = client.models.count_tokens(
    model="gemini-2.0-flash",
    contents=prompt,
)

print(f"Token count: {response.total_tokens}")

# Count tokens with system instruction
response_with_system = client.models.count_tokens(
    model="gemini-2.0-flash",
    contents=prompt,
    config={
        "system_instruction": "You are a helpful assistant.",
    },
)

print(f"Total tokens with system instruction: {response_with_system.total_tokens}")
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

    // Count tokens
    prompt := "The quick brown fox jumps over the lazy dog."
    result, err := client.Models.CountTokens(
        ctx,
        "gemini-2.0-flash",
        genai.Text(prompt),
        nil,
    )
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Token count: %d\n", result.TotalTokens)
}
```

## Token Usage in Generation

### Tracking Usage Metadata
```javascript
// Generate content and track token usage
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Write a short story about a robot learning to paint.",
  config: {
    maxOutputTokens: 500,
    temperature: 0.7,
  },
});

console.log("Generated text:", response.text);
console.log("Usage metadata:", {
  promptTokens: response.usageMetadata.promptTokenCount,
  candidateTokens: response.usageMetadata.candidatesTokenCount,
  totalTokens: response.usageMetadata.totalTokenCount,
  cachedTokens: response.usageMetadata.cachedContentTokenCount || 0,
});
```

### Streaming with Token Tracking
```python
# Track tokens in streaming responses
stream = client.models.generate_content_stream(
    model="gemini-2.0-flash",
    contents="Explain the theory of relativity in detail.",
    config={"max_output_tokens": 1000},
)

total_output_tokens = 0
for chunk in stream:
    if chunk.text:
        print(chunk.text, end="")
    if hasattr(chunk, 'usage_metadata'):
        total_output_tokens = chunk.usage_metadata.candidates_token_count

print(f"\n\nTotal output tokens: {total_output_tokens}")
```

## Multi-Modal Token Counting

### Images and Text
```javascript
// Count tokens for image + text input
const imageFile = await ai.files.upload({
  file: "path/to/image.jpg",
  config: { mimeType: "image/jpeg" },
});

const countResult = await ai.models.countTokens({
  model: "gemini-2.0-flash",
  contents: [
    {
      role: "user",
      parts: [
        { text: "Describe this image in detail" },
        { fileData: { fileUri: imageFile.uri, mimeType: imageFile.mimeType } },
      ],
    },
  ],
});

console.log("Multimodal token count:", countResult.totalTokens);
```

### Audio Content
```python
# Count tokens for audio input
audio_file = client.files.upload(
    path="path/to/audio.mp3",
    config={"mime_type": "audio/mp3"}
)

count_response = client.models.count_tokens(
    model="gemini-2.0-flash",
    contents=[
        {
            "role": "user",
            "parts": [
                {"text": "Transcribe and summarize this audio"},
                {"file_data": {"file_uri": audio_file.uri, "mime_type": audio_file.mime_type}},
            ],
        }
    ],
)

print(f"Audio + text token count: {count_response.total_tokens}")
```

## Advanced Token Management

### Batch Token Counting
```javascript
class TokenCounter {
  constructor(ai) {
    this.ai = ai;
  }

  async countMultiplePrompts(prompts, model = "gemini-2.0-flash") {
    const results = await Promise.all(
      prompts.map(async (prompt, index) => {
        const count = await this.ai.models.countTokens({
          model,
          contents: prompt,
        });
        return {
          index,
          prompt: prompt.substring(0, 50) + "...",
          tokens: count.totalTokens,
        };
      })
    );

    const totalTokens = results.reduce((sum, result) => sum + result.tokens, 0);
    
    return {
      individual: results,
      total: totalTokens,
      average: totalTokens / results.length,
    };
  }

  async estimateCost(prompts, model = "gemini-2.0-flash") {
    const tokenData = await this.countMultiplePrompts(prompts, model);
    
    // Example pricing (check current rates)
    const inputCostPer1K = 0.00015; // $0.00015 per 1K input tokens
    const outputCostPer1K = 0.0006;  // $0.0006 per 1K output tokens
    
    const estimatedInputCost = (tokenData.total / 1000) * inputCostPer1K;
    
    return {
      inputTokens: tokenData.total,
      estimatedInputCost,
      breakdown: tokenData.individual,
    };
  }
}

// Usage
const counter = new TokenCounter(ai);
const prompts = [
  "Explain quantum computing",
  "Write a poem about nature",
  "Summarize the latest AI research",
];

const costEstimate = await counter.estimateCost(prompts);
console.log("Cost estimate:", costEstimate);
```

### Context Window Management
```python
class ContextManager:
    def __init__(self, client, model="gemini-2.0-flash"):
        self.client = client
        self.model = model
        self.max_context = self.get_model_context_limit(model)
    
    def get_model_context_limit(self, model):
        # Model context limits (check current documentation)
        limits = {
            "gemini-2.0-flash": 1048576,  # 1M tokens
            "gemini-1.5-flash": 1048576,   # 1M tokens
            "gemini-1.5-pro": 2097152,     # 2M tokens
        }
        return limits.get(model, 1048576)
    
    def check_context_fit(self, contents, config=None):
        """Check if content fits within context window"""
        count_response = self.client.models.count_tokens(
            model=self.model,
            contents=contents,
            config=config or {},
        )
        
        tokens_used = count_response.total_tokens
        remaining_tokens = self.max_context - tokens_used
        
        return {
            "fits": tokens_used <= self.max_context,
            "tokens_used": tokens_used,
            "remaining_tokens": remaining_tokens,
            "utilization_percent": (tokens_used / self.max_context) * 100,
        }
    
    def truncate_to_fit(self, text, target_tokens=None):
        """Truncate text to fit within token limit"""
        if target_tokens is None:
            target_tokens = self.max_context * 0.8  # Use 80% of context
        
        # Binary search to find optimal truncation point
        left, right = 0, len(text)
        best_text = ""
        
        while left <= right:
            mid = (left + right) // 2
            truncated = text[:mid]
            
            count_response = self.client.models.count_tokens(
                model=self.model,
                contents=truncated,
            )
            
            if count_response.total_tokens <= target_tokens:
                best_text = truncated
                left = mid + 1
            else:
                right = mid - 1
        
        return best_text

# Usage
manager = ContextManager(client)

# Check if content fits
long_document = "...very long text..."
fit_check = manager.check_context_fit(long_document)

if not fit_check["fits"]:
    print(f"Content too large: {fit_check['tokens_used']} tokens")
    truncated = manager.truncate_to_fit(long_document)
    print(f"Truncated to fit: {len(truncated)} characters")
```

## Token Optimization Strategies

### Prompt Optimization
```javascript
class PromptOptimizer {
  constructor(ai) {
    this.ai = ai;
  }

  async optimizePrompt(originalPrompt, targetTokens = 100) {
    const variations = [
      originalPrompt,
      this.removeRedundancy(originalPrompt),
      this.useAbbreviations(originalPrompt),
      this.simplifyLanguage(originalPrompt),
    ];

    const results = [];
    for (const variation of variations) {
      const count = await this.ai.models.countTokens({
        model: "gemini-2.0-flash",
        contents: variation,
      });
      
      results.push({
        prompt: variation,
        tokens: count.totalTokens,
        reduction: originalPrompt.length - variation.length,
      });
    }

    // Find best variation under target
    const validOptions = results.filter(r => r.tokens <= targetTokens);
    return validOptions.length > 0 
      ? validOptions.reduce((best, current) => 
          current.tokens > best.tokens ? current : best
        )
      : results[0];
  }

  removeRedundancy(text) {
    return text
      .replace(/\b(very|really|quite|extremely)\s+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  useAbbreviations(text) {
    const abbreviations = {
      'for example': 'e.g.',
      'that is': 'i.e.',
      'and so on': 'etc.',
      'versus': 'vs.',
    };
    
    let result = text;
    for (const [full, abbrev] of Object.entries(abbreviations)) {
      result = result.replace(new RegExp(full, 'gi'), abbrev);
    }
    return result;
  }

  simplifyLanguage(text) {
    const simplifications = {
      'utilize': 'use',
      'demonstrate': 'show',
      'facilitate': 'help',
      'implement': 'do',
    };
    
    let result = text;
    for (const [complex, simple] of Object.entries(simplifications)) {
      result = result.replace(new RegExp(`\\b${complex}\\b`, 'gi'), simple);
    }
    return result;
  }
}
```

### Response Length Control
```python
def generate_with_token_budget(client, prompt, max_output_tokens=500):
    """Generate content within a specific token budget"""
    
    # Count input tokens first
    input_count = client.models.count_tokens(
        model="gemini-2.0-flash",
        contents=prompt,
    )
    
    print(f"Input tokens: {input_count.total_tokens}")
    
    # Generate with controlled output
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config={
            "max_output_tokens": max_output_tokens,
            "temperature": 0.7,
        },
    )
    
    # Report actual usage
    usage = response.usage_metadata
    print(f"Actual usage:")
    print(f"  Input: {usage.prompt_token_count} tokens")
    print(f"  Output: {usage.candidates_token_count} tokens")
    print(f"  Total: {usage.total_token_count} tokens")
    
    return response.text

# Usage with budget control
result = generate_with_token_budget(
    client,
    "Write a comprehensive guide to machine learning",
    max_output_tokens=300
)
```

## Cost Calculation and Monitoring

### Real-time Cost Tracking
```javascript
class CostTracker {
  constructor(ai, pricing = {}) {
    this.ai = ai;
    this.pricing = {
      inputPer1K: 0.00015,   // $0.00015 per 1K input tokens
      outputPer1K: 0.0006,   // $0.0006 per 1K output tokens
      cachedPer1K: 0.000075, // 50% discount for cached tokens
      ...pricing,
    };
    this.totalCost = 0;
    this.sessions = [];
  }

  async generateWithTracking(request) {
    const startTime = Date.now();
    
    // Count input tokens
    const inputCount = await this.ai.models.countTokens({
      model: request.model,
      contents: request.contents,
      config: request.config,
    });

    // Generate content
    const response = await this.ai.models.generateContent(request);
    
    // Calculate costs
    const usage = response.usageMetadata;
    const inputCost = (usage.promptTokenCount / 1000) * this.pricing.inputPer1K;
    const outputCost = (usage.candidatesTokenCount / 1000) * this.pricing.outputPer1K;
    const cachedCost = ((usage.cachedContentTokenCount || 0) / 1000) * this.pricing.cachedPer1K;
    const totalCost = inputCost + outputCost + cachedCost;

    // Track session
    const session = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      model: request.model,
      tokens: {
        input: usage.promptTokenCount,
        output: usage.candidatesTokenCount,
        cached: usage.cachedContentTokenCount || 0,
        total: usage.totalTokenCount,
      },
      costs: {
        input: inputCost,
        output: outputCost,
        cached: cachedCost,
        total: totalCost,
      },
    };

    this.sessions.push(session);
    this.totalCost += totalCost;

    return {
      response,
      session,
      cumulativeCost: this.totalCost,
    };
  }

  getUsageReport() {
    const totalTokens = this.sessions.reduce((sum, s) => sum + s.tokens.total, 0);
    const avgTokensPerRequest = totalTokens / this.sessions.length;
    
    return {
      totalSessions: this.sessions.length,
      totalCost: this.totalCost,
      totalTokens,
      avgTokensPerRequest,
      avgCostPerRequest: this.totalCost / this.sessions.length,
      costBreakdown: {
        input: this.sessions.reduce((sum, s) => sum + s.costs.input, 0),
        output: this.sessions.reduce((sum, s) => sum + s.costs.output, 0),
        cached: this.sessions.reduce((sum, s) => sum + s.costs.cached, 0),
      },
    };
  }
}

// Usage
const tracker = new CostTracker(ai);

const result = await tracker.generateWithTracking({
  model: "gemini-2.0-flash",
  contents: "Explain quantum computing",
  config: { maxOutputTokens: 500 },
});

console.log("Response:", result.response.text);
console.log("Session cost:", result.session.costs.total);
console.log("Total cost so far:", result.cumulativeCost);
```

## Token Counting for Different Content Types

### Structured Data
```python
import json

def count_json_tokens(client, data, model="gemini-2.0-flash"):
    """Count tokens for JSON data"""
    json_string = json.dumps(data, separators=(',', ':'))  # Compact format
    
    count_response = client.models.count_tokens(
        model=model,
        contents=json_string,
    )
    
    return {
        "json_size_chars": len(json_string),
        "json_size_bytes": len(json_string.encode('utf-8')),
        "token_count": count_response.total_tokens,
        "chars_per_token": len(json_string) / count_response.total_tokens,
    }

# Example with large JSON
large_data = {
    "users": [
        {"id": i, "name": f"User {i}", "email": f"user{i}@example.com"}
        for i in range(1000)
    ]
}

token_info = count_json_tokens(client, large_data)
print(f"JSON tokens: {token_info['token_count']}")
print(f"Efficiency: {token_info['chars_per_token']:.2f} chars/token")
```

### Code Analysis
```javascript
class CodeTokenAnalyzer {
  constructor(ai) {
    this.ai = ai;
  }

  async analyzeCodebase(files) {
    const results = [];
    
    for (const file of files) {
      const content = await fs.readFile(file.path, 'utf8');
      
      const count = await this.ai.models.countTokens({
        model: "gemini-2.0-flash",
        contents: content,
      });

      results.push({
        file: file.path,
        language: file.language,
        lines: content.split('\n').length,
        characters: content.length,
        tokens: count.totalTokens,
        tokensPerLine: count.totalTokens / content.split('\n').length,
        efficiency: content.length / count.totalTokens,
      });
    }

    return {
      files: results,
      summary: {
        totalFiles: results.length,
        totalTokens: results.reduce((sum, r) => sum + r.tokens, 0),
        totalLines: results.reduce((sum, r) => sum + r.lines, 0),
        avgTokensPerFile: results.reduce((sum, r) => sum + r.tokens, 0) / results.length,
        languageBreakdown: this.groupByLanguage(results),
      },
    };
  }

  groupByLanguage(results) {
    const breakdown = {};
    for (const result of results) {
      if (!breakdown[result.language]) {
        breakdown[result.language] = { files: 0, tokens: 0 };
      }
      breakdown[result.language].files++;
      breakdown[result.language].tokens += result.tokens;
    }
    return breakdown;
  }
}
```

## Performance Monitoring

### Token Rate Monitoring
```python
import time
from collections import deque

class TokenRateMonitor:
    def __init__(self, window_size=60):  # 60 second window
        self.window_size = window_size
        self.token_history = deque()
        self.request_history = deque()
    
    def record_usage(self, tokens):
        """Record token usage with timestamp"""
        now = time.time()
        self.token_history.append((now, tokens))
        self.request_history.append(now)
        
        # Clean old entries
        cutoff = now - self.window_size
        while self.token_history and self.token_history[0][0] < cutoff:
            self.token_history.popleft()
        while self.request_history and self.request_history[0] < cutoff:
            self.request_history.popleft()
    
    def get_current_rate(self):
        """Get current tokens per minute"""
        if not self.token_history:
            return 0
        
        total_tokens = sum(tokens for _, tokens in self.token_history)
        time_span = min(self.window_size, 
                       time.time() - self.token_history[0][0])
        
        if time_span == 0:
            return 0
        
        return (total_tokens / time_span) * 60  # tokens per minute
    
    def get_request_rate(self):
        """Get current requests per minute"""
        if not self.request_history:
            return 0
        
        time_span = min(self.window_size,
                       time.time() - self.request_history[0])
        
        if time_span == 0:
            return 0
        
        return (len(self.request_history) / time_span) * 60
    
    def should_throttle(self, max_tokens_per_minute=10000):
        """Check if we should throttle requests"""
        return self.get_current_rate() > max_tokens_per_minute

# Usage
monitor = TokenRateMonitor()

def generate_with_monitoring(client, prompt):
    # Count tokens first
    count_response = client.models.count_tokens(
        model="gemini-2.0-flash",
        contents=prompt,
    )
    
    # Check if we should throttle
    if monitor.should_throttle():
        print(f"Rate limit approaching: {monitor.get_current_rate():.0f} tokens/min")
        time.sleep(1)  # Simple throttling
    
    # Generate content
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
    )
    
    # Record usage
    monitor.record_usage(response.usage_metadata.total_token_count)
    
    return response
```

## Best Practices

### Token Efficiency Guidelines

1. **Prompt Design**
   - Use clear, concise language
   - Avoid unnecessary repetition
   - Use examples sparingly
   - Leverage system instructions for context

2. **Content Optimization**
   - Remove formatting when not needed
   - Use abbreviations appropriately
   - Compress JSON/structured data
   - Consider token-efficient encodings

3. **Context Management**
   - Monitor context window usage
   - Use context caching for repeated content
   - Implement sliding window for long conversations
   - Truncate intelligently when needed

4. **Cost Control**
   - Set maximum token limits
   - Monitor usage in real-time
   - Use cheaper models when appropriate
   - Implement request batching

### Error Handling
```javascript
async function robustTokenCounting(ai, content, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await ai.models.countTokens({
        model: "gemini-2.0-flash",
        contents: content,
      });
      return result;
    } catch (error) {
      console.warn(`Token counting attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        // Fallback: estimate tokens
        const estimatedTokens = Math.ceil(content.length / 4); // Rough estimate
        console.warn(`Using estimated token count: ${estimatedTokens}`);
        return { totalTokens: estimatedTokens, estimated: true };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

## Related Documentation

- [Context Caching](./context-caching.md) - Optimize costs with content caching
- [Text Generation](./text-generation.md) - Basic text generation capabilities
- [Pricing](./pricing.md) - Current API pricing information
- [Rate Limits](./rate-limits.md) - API usage limits and quotas
- [Performance Optimization](./performance-optimization.md) - General optimization strategies