# Live API

The Live API enables real-time, bidirectional communication with Gemini models, allowing for interactive conversations, streaming responses, and dynamic content generation. This feature is particularly useful for building conversational AI applications, real-time assistants, and interactive experiences.

## Overview

The Live API provides:
- **Real-time Communication**: Bidirectional streaming for immediate responses
- **Interactive Sessions**: Maintain context across multiple exchanges
- **Multi-modal Support**: Handle text, audio, and visual inputs simultaneously
- **Low Latency**: Optimized for responsive user experiences
- **Session Management**: Persistent conversations with state management

## Basic Implementation

### JavaScript/TypeScript

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

// Create a live session
const liveSession = await ai.models.createLiveSession({
  model: "gemini-2.0-flash",
  config: {
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000
    }
  }
});

// Send a message and receive streaming response
liveSession.send("Hello, how are you today?");

liveSession.on('message', (response) => {
  console.log('Received:', response.text);
});

liveSession.on('error', (error) => {
  console.error('Live API error:', error);
});

// Close the session when done
liveSession.close();
```

### Python

```python
from google import genai
import asyncio

client = genai.Client(api_key="YOUR_API_KEY")

async def live_chat_example():
    # Create live session
    live_session = await client.models.create_live_session(
        model="gemini-2.0-flash",
        config={
            "generation_config": {
                "temperature": 0.7,
                "max_output_tokens": 1000
            }
        }
    )
    
    # Send message
    await live_session.send("Hello, how are you today?")
    
    # Listen for responses
    async for response in live_session.listen():
        print(f"Received: {response.text}")
        
        # Break after first response for this example
        break
    
    # Close session
    await live_session.close()

# Run the example
asyncio.run(live_chat_example())
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
        APIKey: "YOUR_API_KEY",
    })
    if err != nil {
        log.Fatal(err)
    }
    defer client.Close()
    
    // Create live session
    session, err := client.Models.CreateLiveSession(ctx, &genai.LiveSessionConfig{
        Model: "gemini-2.0-flash",
        GenerationConfig: &genai.GenerationConfig{
            Temperature:     0.7,
            MaxOutputTokens: 1000,
        },
    })
    if err != nil {
        log.Fatal(err)
    }
    defer session.Close()
    
    // Send message
    err = session.Send(ctx, "Hello, how are you today?")
    if err != nil {
        log.Fatal(err)
    }
    
    // Receive response
    response, err := session.Receive(ctx)
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Received: %s\n", response.Text)
}
```

## Advanced Features

### Multi-modal Live Sessions

```javascript
// Handle audio and text in real-time
const multiModalSession = await ai.models.createLiveSession({
  model: "gemini-2.0-flash",
  config: {
    modalities: ["text", "audio"],
    audioConfig: {
      sampleRate: 16000,
      encoding: "LINEAR16"
    }
  }
});

// Send audio data
const audioData = new ArrayBuffer(/* audio bytes */);
multiModalSession.sendAudio(audioData);

// Send text alongside audio
multiModalSession.send("Please analyze this audio");

multiModalSession.on('audioResponse', (audioResponse) => {
  // Handle audio response
  console.log('Received audio response');
});

multiModalSession.on('textResponse', (textResponse) => {
  console.log('Text response:', textResponse.text);
});
```

### Session State Management

```python
# Maintain conversation context
async def persistent_conversation():
    session = await client.models.create_live_session(
        model="gemini-2.0-flash",
        config={
            "session_config": {
                "persist_context": True,
                "max_context_length": 10000
            }
        }
    )
    
    # Multiple exchanges maintaining context
    await session.send("My name is Alice")
    response1 = await session.receive()
    
    await session.send("What's my name?")
    response2 = await session.receive()  # Should remember "Alice"
    
    print(f"Response: {response2.text}")
    
    await session.close()
```

### Function Calling in Live Sessions

```javascript
// Define tools for live session
const tools = [
  {
    name: "get_weather",
    description: "Get current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City name"
        }
      },
      required: ["location"]
    }
  }
];

const liveSession = await ai.models.createLiveSession({
  model: "gemini-2.0-flash",
  tools: tools,
  config: {
    functionCallingConfig: {
      mode: "AUTO"
    }
  }
});

liveSession.on('functionCall', async (functionCall) => {
  if (functionCall.name === 'get_weather') {
    const weather = await getWeatherData(functionCall.args.location);
    
    // Send function response back
    liveSession.sendFunctionResponse({
      name: functionCall.name,
      response: weather
    });
  }
});

liveSession.send("What's the weather in New York?");
```

## Real-world Use Cases

### Interactive Customer Support

```javascript
class LiveCustomerSupport {
  constructor(apiKey) {
    this.ai = new GoogleGenAI({ apiKey });
    this.activeSessions = new Map();
  }
  
  async createSupportSession(customerId) {
    const session = await this.ai.models.createLiveSession({
      model: "gemini-2.0-flash",
      systemInstruction: "You are a helpful customer support agent. Be polite, professional, and solution-oriented.",
      config: {
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500
        }
      }
    });
    
    this.activeSessions.set(customerId, session);
    
    session.on('message', (response) => {
      this.sendToCustomer(customerId, response.text);
    });
    
    return session;
  }
  
  async handleCustomerMessage(customerId, message) {
    const session = this.activeSessions.get(customerId);
    if (session) {
      await session.send(message);
    }
  }
  
  sendToCustomer(customerId, message) {
    // Send response to customer via your preferred channel
    console.log(`To customer ${customerId}: ${message}`);
  }
}
```

### Real-time Language Translation

```python
class LiveTranslator:
    def __init__(self, api_key):
        self.client = genai.Client(api_key=api_key)
        self.sessions = {}
    
    async def create_translation_session(self, source_lang, target_lang):
        session = await self.client.models.create_live_session(
            model="gemini-2.0-flash",
            system_instruction=f"Translate from {source_lang} to {target_lang}. Provide only the translation.",
            config={
                "generation_config": {
                    "temperature": 0.1,
                    "max_output_tokens": 200
                }
            }
        )
        
        session_id = f"{source_lang}-{target_lang}"
        self.sessions[session_id] = session
        
        return session_id
    
    async def translate_text(self, session_id, text):
        session = self.sessions.get(session_id)
        if session:
            await session.send(text)
            response = await session.receive()
            return response.text
        return None
```

### Voice-Enabled Assistant

```javascript
class VoiceAssistant {
  constructor(apiKey) {
    this.ai = new GoogleGenAI({ apiKey });
    this.session = null;
  }
  
  async initialize() {
    this.session = await this.ai.models.createLiveSession({
      model: "gemini-2.0-flash",
      config: {
        modalities: ["text", "audio"],
        audioConfig: {
          sampleRate: 16000,
          encoding: "LINEAR16"
        },
        generationConfig: {
          temperature: 0.7
        }
      }
    });
    
    this.session.on('audioResponse', (audioData) => {
      this.playAudio(audioData);
    });
    
    this.session.on('textResponse', (response) => {
      console.log('Assistant:', response.text);
    });
  }
  
  async processVoiceInput(audioBuffer) {
    if (this.session) {
      await this.session.sendAudio(audioBuffer);
    }
  }
  
  playAudio(audioData) {
    // Implement audio playback
    console.log('Playing audio response');
  }
}
```

## Performance Optimization

### Connection Management

```javascript
// Implement connection pooling
class LiveAPIManager {
  constructor(apiKey, maxConnections = 10) {
    this.ai = new GoogleGenAI({ apiKey });
    this.connectionPool = [];
    this.maxConnections = maxConnections;
  }
  
  async getSession() {
    if (this.connectionPool.length > 0) {
      return this.connectionPool.pop();
    }
    
    if (this.activeConnections < this.maxConnections) {
      return await this.createNewSession();
    }
    
    // Wait for available session
    return await this.waitForAvailableSession();
  }
  
  async createNewSession() {
    const session = await this.ai.models.createLiveSession({
      model: "gemini-2.0-flash",
      config: {
        keepAlive: true,
        timeout: 300000 // 5 minutes
      }
    });
    
    this.activeConnections++;
    return session;
  }
  
  releaseSession(session) {
    // Reset session state and return to pool
    session.reset();
    this.connectionPool.push(session);
  }
}
```

### Latency Optimization

```python
# Optimize for low latency
async def create_low_latency_session():
    session = await client.models.create_live_session(
        model="gemini-2.0-flash",
        config={
            "generation_config": {
                "temperature": 0.7,
                "max_output_tokens": 100,  # Shorter responses
                "top_p": 0.8,
                "top_k": 40
            },
            "performance_config": {
                "priority": "low_latency",
                "streaming_mode": "immediate",
                "buffer_size": 1024
            }
        }
    )
    
    return session
```

## Error Handling and Resilience

### Automatic Reconnection

```javascript
class ResilientLiveSession {
  constructor(ai, config) {
    this.ai = ai;
    this.config = config;
    this.session = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  async connect() {
    try {
      this.session = await this.ai.models.createLiveSession(this.config);
      this.setupEventHandlers();
      this.reconnectAttempts = 0;
    } catch (error) {
      await this.handleConnectionError(error);
    }
  }
  
  setupEventHandlers() {
    this.session.on('error', async (error) => {
      console.error('Session error:', error);
      await this.handleConnectionError(error);
    });
    
    this.session.on('disconnect', async () => {
      console.log('Session disconnected, attempting reconnection...');
      await this.reconnect();
    });
  }
  
  async handleConnectionError(error) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      await this.reconnect();
    } else {
      throw new Error(`Failed to establish connection after ${this.maxReconnectAttempts} attempts`);
    }
  }
  
  async reconnect() {
    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
    
    await new Promise(resolve => setTimeout(resolve, delay));
    await this.connect();
  }
}
```

### Message Queue for Reliability

```python
import asyncio
from collections import deque

class ReliableLiveSession:
    def __init__(self, client, config):
        self.client = client
        self.config = config
        self.session = None
        self.message_queue = deque()
        self.processing = False
    
    async def send_with_retry(self, message, max_retries=3):
        self.message_queue.append(message)
        
        if not self.processing:
            await self.process_queue()
    
    async def process_queue(self):
        self.processing = True
        
        while self.message_queue:
            message = self.message_queue.popleft()
            
            for attempt in range(3):
                try:
                    if not self.session:
                        await self.connect()
                    
                    await self.session.send(message)
                    break
                    
                except Exception as e:
                    if attempt == 2:  # Last attempt
                        # Re-queue message for later
                        self.message_queue.appendleft(message)
                        break
                    
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        self.processing = False
    
    async def connect(self):
        self.session = await self.client.models.create_live_session(
            **self.config
        )
```

## Security Best Practices

### Authentication and Authorization

```javascript
// Implement secure session management
class SecureLiveAPI {
  constructor(apiKey) {
    this.ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        timeout: 30000,
        headers: {
          'User-Agent': 'MyApp/1.0'
        }
      }
    });
    this.userSessions = new Map();
  }
  
  async createUserSession(userId, permissions) {
    // Validate user permissions
    if (!this.validatePermissions(permissions)) {
      throw new Error('Insufficient permissions');
    }
    
    const session = await this.ai.models.createLiveSession({
      model: "gemini-2.0-flash",
      config: {
        userContext: {
          userId,
          permissions
        },
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
      }
    });
    
    this.userSessions.set(userId, session);
    return session;
  }
  
  validatePermissions(permissions) {
    // Implement your permission validation logic
    return permissions.includes('live_api_access');
  }
}
```

### Input Sanitization

```python
import re
from typing import List

class SafeLiveSession:
    def __init__(self, client, config):
        self.client = client
        self.config = config
        self.session = None
        self.blocked_patterns = [
            r'\b(?:password|secret|token|key)\b',
            r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',  # Credit card
            r'\b\d{3}-\d{2}-\d{4}\b'  # SSN
        ]
    
    def sanitize_input(self, text: str) -> str:
        """Remove sensitive information from input"""
        sanitized = text
        
        for pattern in self.blocked_patterns:
            sanitized = re.sub(pattern, '[REDACTED]', sanitized, flags=re.IGNORECASE)
        
        return sanitized
    
    async def safe_send(self, message: str):
        sanitized_message = self.sanitize_input(message)
        
        if not self.session:
            await self.connect()
        
        await self.session.send(sanitized_message)
    
    async def connect(self):
        self.session = await self.client.models.create_live_session(
            **self.config
        )
```

## Monitoring and Analytics

### Session Metrics

```javascript
class LiveAPIMetrics {
  constructor() {
    this.metrics = {
      sessionsCreated: 0,
      messagesProcessed: 0,
      averageLatency: 0,
      errorRate: 0,
      activeConnections: 0
    };
    this.latencyHistory = [];
  }
  
  recordSessionCreated() {
    this.metrics.sessionsCreated++;
    this.metrics.activeConnections++;
  }
  
  recordSessionClosed() {
    this.metrics.activeConnections--;
  }
  
  recordMessageProcessed(latency) {
    this.metrics.messagesProcessed++;
    this.latencyHistory.push(latency);
    
    // Keep only last 100 measurements
    if (this.latencyHistory.length > 100) {
      this.latencyHistory.shift();
    }
    
    this.updateAverageLatency();
  }
  
  updateAverageLatency() {
    const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
    this.metrics.averageLatency = sum / this.latencyHistory.length;
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
}
```

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   ```javascript
   // Increase timeout settings
   const session = await ai.models.createLiveSession({
     model: "gemini-2.0-flash",
     config: {
       timeout: 60000, // 60 seconds
       keepAlive: true
     }
   });
   ```

2. **Memory Leaks**
   ```javascript
   // Properly clean up sessions
   session.on('close', () => {
     session.removeAllListeners();
     session = null;
   });
   ```

3. **Rate Limiting**
   ```python
   import asyncio
   from asyncio import Semaphore
   
   # Implement rate limiting
   class RateLimitedLiveAPI:
       def __init__(self, client, max_concurrent=5):
           self.client = client
           self.semaphore = Semaphore(max_concurrent)
       
       async def send_message(self, session, message):
           async with self.semaphore:
               await session.send(message)
               await asyncio.sleep(0.1)  # Small delay between requests
   ```

## Best Practices

1. **Session Lifecycle Management**
   - Always close sessions when done
   - Implement proper cleanup in error scenarios
   - Use connection pooling for high-traffic applications

2. **Error Handling**
   - Implement exponential backoff for reconnections
   - Queue messages during connection issues
   - Log errors for debugging and monitoring

3. **Performance**
   - Use appropriate model sizes for your use case
   - Optimize generation parameters for latency vs quality
   - Implement caching where appropriate

4. **Security**
   - Validate and sanitize all inputs
   - Implement proper authentication
   - Use safety settings to filter harmful content

## Related Documentation

- [Text Generation](./text-generation.md) - Basic text generation capabilities
- [Function Calling](./function-calling.md) - Tool integration in live sessions
- [System Instructions](./system-instructions.md) - Configuring model behavior
- [Context Caching](./context-caching.md) - Performance optimization
- [Token Counting](./token-counting.md) - Managing token usage

---

*For the latest updates and detailed API reference, visit the [official documentation](https://ai.google.dev/gemini-api/docs/live).*