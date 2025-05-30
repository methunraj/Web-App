# Google Gen AI SDK Documentation

This folder contains comprehensive documentation for the Google Gen AI SDK, organized by topic and functionality.

## Documentation Structure

### Getting Started
- [Overview](./overview.md) - Introduction to the Gemini API
- [Quickstart](./quickstart.md) - Get started with your first API request
- [API Keys](./api-keys.md) - Setting up authentication
- [Libraries](./libraries.md) - SDK installation and setup
- [OpenAI Compatibility](./openai-compatibility.md) - Using OpenAI-compatible interfaces

### Models
- [All Models](./all-models.md) - Available models and their capabilities
- [Pricing](./pricing.md) - Cost information for API usage
- [Rate Limits](./rate-limits.md) - Usage limits and quotas
- [Billing Info](./billing-info.md) - Billing and payment information

### Model Capabilities
- [Text Generation](./text-generation.md) - Generate text content
- [Image Generation](./image-generation.md) - Create images from text
- [Video Generation](./video-generation.md) - Generate videos using Veo
- [Speech Generation](./speech-generation.md) - Text-to-speech capabilities
- [Music Generation](./music-generation.md) - AI music creation
- [Long Context](./long-context.md) - Working with large context windows
- [Structured Output](./structured-output.md) - JSON and schema-based responses
- [Thinking](./thinking.md) - Advanced reasoning capabilities
- [Function Calling](./function-calling.md) - Tool integration and function calls
- [Document Understanding](./document-understanding.md) - Process and analyze documents
- [Image Understanding](./image-understanding.md) - Analyze and describe images
- [Video Understanding](./video-understanding.md) - Process video content
- [Audio Understanding](./audio-understanding.md) - Analyze audio files
- [Code Execution](./code-execution.md) - Run code within the model
- [URL Context](./url-context.md) - Process web content

### Guides
- [Prompt Engineering](./prompt-engineering.md) - Best practices for prompts
- [Live API](./live-api.md) - Real-time API interactions
- [Context Caching](./context-caching.md) - Optimize performance with caching
- [Files API](./files-api.md) - Upload and manage files
- [Token Counting](./token-counting.md) - Understand token usage
- [Embeddings](./embeddings.md) - Vector representations

### Resources
- [Migrate to Gen AI SDK](./migrate-to-gen-ai-sdk.md) - Upgrade from older SDKs
- [Release Notes](./release-notes.md) - Latest updates and changes
- [API Troubleshooting](./api-troubleshooting.md) - Common issues and solutions

### Policies
- [Terms of Service](./terms-of-service.md) - Usage terms and conditions
- [Available Regions](./available-regions.md) - Geographic availability
- [Additional Usage Policies](./additional-usage-policies.md) - Additional guidelines

### Advanced Topics
- [System Instructions](./system-instructions.md) - Configure model behavior
- [API Versions](./api-versions.md) - Version management
- [Vertex AI Integration](./vertex-ai-integration.md) - Cloud platform integration
- [CrewAI Example](./crewai-example.md) - Multi-agent workflows

## Quick Reference

### Installation
```bash
# New SDK (recommended)
npm install @google/genai
```

### Basic Usage
```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Explain how AI works",
});

console.log(response.text);
```

## Support

For additional help and support:
- Visit the [official documentation](https://ai.google.dev/gemini-api/docs)
- Check the [API reference](https://ai.google.dev/api)
- Browse the [cookbook](https://ai.google.dev/gemini-api/cookbook)
- Join the [community](https://ai.google.dev/gemini-api/community)