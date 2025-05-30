# Audio Understanding

Analyze and understand audio content using the Gemini API's multimodal capabilities.

## Overview

Gemini models can process and understand audio files alongside text, enabling powerful audio analysis applications. You can transcribe speech, analyze audio content, extract information, and perform various audio processing tasks.

## Basic Audio Analysis

### Upload and Analyze an Audio File
```javascript
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

// Upload an audio file
const audioFile = await ai.files.upload({
  file: fs.createReadStream('path/to/audio.mp3'),
  config: { mimeType: 'audio/mp3' }
});

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Transcribe this audio and provide a summary" },
        { fileData: { mimeType: audioFile.mimeType, fileUri: audioFile.uri } }
      ]
    }
  ]
});

console.log(response.text);
```

### Pass Audio Data Inline
```javascript
const audioData = fs.readFileSync('path/to/audio.wav');
const base64Audio = audioData.toString('base64');

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "What is being discussed in this audio?" },
        { 
          inlineData: { 
            mimeType: 'audio/wav', 
            data: base64Audio 
          } 
        }
      ]
    }
  ]
});
```

## Common Use Cases

### Speech Transcription
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Provide a complete transcription of this audio with speaker identification if multiple speakers are present" },
        { fileData: { mimeType: audioFile.mimeType, fileUri: audioFile.uri } }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        transcription: { type: "string" },
        speakers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              speaker: { type: "string" },
              segments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    startTime: { type: "string" },
                    endTime: { type: "string" }
                  }
                }
              }
            }
          }
        },
        confidence: { type: "number", minimum: 0, maximum: 1 }
      }
    }
  }
});
```

### Audio Content Analysis
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Analyze this audio content and extract key information" },
        { fileData: { mimeType: audioFile.mimeType, fileUri: audioFile.uri } }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        contentType: {
          type: "string",
          enum: ["conversation", "lecture", "interview", "music", "podcast", "meeting", "other"]
        },
        summary: { type: "string" },
        keyTopics: { type: "array", items: { type: "string" } },
        sentiment: {
          type: "string",
          enum: ["positive", "negative", "neutral", "mixed"]
        },
        language: { type: "string" },
        duration: { type: "string" },
        actionItems: { type: "array", items: { type: "string" } }
      }
    }
  }
});
```

### Meeting Transcription and Analysis
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Transcribe this meeting audio and provide a structured summary with action items" },
        { fileData: { mimeType: audioFile.mimeType, fileUri: audioFile.uri } }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        meetingTitle: { type: "string" },
        participants: { type: "array", items: { type: "string" } },
        agenda: { type: "array", items: { type: "string" } },
        keyDecisions: { type: "array", items: { type: "string" } },
        actionItems: {
          type: "array",
          items: {
            type: "object",
            properties: {
              task: { type: "string" },
              assignee: { type: "string" },
              deadline: { type: "string" },
              priority: { type: "string", enum: ["high", "medium", "low"] }
            }
          }
        },
        nextSteps: { type: "array", items: { type: "string" } },
        fullTranscript: { type: "string" }
      }
    }
  }
});
```

### Podcast/Interview Analysis
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Analyze this podcast/interview and create a comprehensive summary" },
        { fileData: { mimeType: audioFile.mimeType, fileUri: audioFile.uri } }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        host: { type: "string" },
        guest: { type: "string" },
        mainTopics: { type: "array", items: { type: "string" } },
        keyQuotes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              speaker: { type: "string" },
              quote: { type: "string" },
              timestamp: { type: "string" }
            }
          }
        },
        summary: { type: "string" },
        insights: { type: "array", items: { type: "string" } },
        recommendations: { type: "array", items: { type: "string" } }
      }
    }
  }
});
```

## Advanced Features

### Timestamp References
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Transcribe this audio and include timestamps for each sentence or major topic change" },
        { fileData: { mimeType: audioFile.mimeType, fileUri: audioFile.uri } }
      ]
    }
  ]
});
```

### Multi-language Audio
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Detect the language(s) spoken in this audio and provide transcription with language identification" },
        { fileData: { mimeType: audioFile.mimeType, fileUri: audioFile.uri } }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        detectedLanguages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              language: { type: "string" },
              confidence: { type: "number" },
              segments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    startTime: { type: "string" },
                    endTime: { type: "string" }
                  }
                }
              }
            }
          }
        },
        mixedLanguage: { type: "boolean" }
      }
    }
  }
});
```

### Audio Quality Assessment
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Assess the audio quality and provide transcription with quality notes" },
        { fileData: { mimeType: audioFile.mimeType, fileUri: audioFile.uri } }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        transcription: { type: "string" },
        audioQuality: {
          type: "object",
          properties: {
            overall: { type: "string", enum: ["excellent", "good", "fair", "poor"] },
            clarity: { type: "string", enum: ["clear", "somewhat_clear", "unclear"] },
            backgroundNoise: { type: "string", enum: ["none", "minimal", "moderate", "significant"] },
            volume: { type: "string", enum: ["optimal", "too_loud", "too_quiet", "inconsistent"] }
          }
        },
        transcriptionConfidence: { type: "number", minimum: 0, maximum: 1 },
        issues: { type: "array", items: { type: "string" } }
      }
    }
  }
});
```

## Python Examples

### Basic Audio Transcription
```python
from google import genai

client = genai.Client(api_key="YOUR_API_KEY")

# Upload audio file
audio_file = client.files.upload(
    path='path/to/audio.mp3',
    config={'mime_type': 'audio/mp3'}
)

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=[
        "Transcribe this audio file",
        {'file_data': {'mime_type': audio_file.mime_type, 'file_uri': audio_file.uri}}
    ]
)

print(response.text)
```

### Structured Audio Analysis
```python
from google.genai.types import GenerateContentConfig

schema = {
    "type": "object",
    "properties": {
        "transcription": {"type": "string"},
        "summary": {"type": "string"},
        "key_points": {
            "type": "array",
            "items": {"type": "string"}
        },
        "sentiment": {
            "type": "string",
            "enum": ["positive", "negative", "neutral"]
        }
    }
}

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=[
        "Analyze this audio and provide structured output",
        {'file_data': {'mime_type': audio_file.mime_type, 'file_uri': audio_file.uri}}
    ],
    config=GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=schema
    )
)
```

## Supported Audio Formats

- **MP3** (.mp3)
- **WAV** (.wav)
- **AIFF** (.aiff)
- **AAC** (.aac)
- **OGG** (.ogg)
- **FLAC** (.flac)

## Technical Details

### Audio File Limits
- Maximum file size: 20MB
- Maximum duration: 9.5 hours
- Minimum duration: 1 second
- Sample rate: 8kHz to 48kHz

### Best Practices

1. **Audio Quality**: Use clear, high-quality recordings
2. **File Format**: WAV and MP3 are most reliable
3. **Background Noise**: Minimize background noise for better transcription
4. **Speaking Pace**: Clear, moderate speaking pace improves accuracy

### Performance Optimization

```javascript
// Compress audio before upload if needed
const ffmpeg = require('fluent-ffmpeg');

ffmpeg('large-audio.wav')
  .audioCodec('mp3')
  .audioBitrate(128)
  .output('compressed-audio.mp3')
  .on('end', async () => {
    const audioFile = await ai.files.upload({
      file: fs.createReadStream('compressed-audio.mp3'),
      config: { mimeType: 'audio/mp3' }
    });
    
    // Process the compressed audio
  });
```

## Token Counting for Audio

```javascript
const tokenCount = await ai.models.countTokens({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Transcribe this audio" },
        { fileData: { mimeType: audioFile.mimeType, fileUri: audioFile.uri } }
      ]
    }
  ]
});

console.log(`Total tokens: ${tokenCount.totalTokens}`);
```

## Error Handling

```javascript
try {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        parts: [
          { text: "Transcribe this audio" },
          { fileData: { mimeType: audioFile.mimeType, fileUri: audioFile.uri } }
        ]
      }
    ]
  });
  
  console.log(response.text);
} catch (error) {
  if (error.message.includes('file not found')) {
    console.log('Audio file not found or expired');
  } else if (error.message.includes('unsupported format')) {
    console.log('Audio format not supported');
  } else if (error.message.includes('file too large')) {
    console.log('Audio file exceeds size limit');
  } else if (error.message.includes('duration too long')) {
    console.log('Audio duration exceeds limit');
  } else {
    console.log('Error processing audio:', error.message);
  }
}
```

## Real-world Applications

### Customer Service Call Analysis
```javascript
const callAnalysis = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Analyze this customer service call for quality assurance" },
        { fileData: { mimeType: audioFile.mimeType, fileUri: audioFile.uri } }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        callSummary: { type: "string" },
        customerIssue: { type: "string" },
        resolution: { type: "string" },
        agentPerformance: {
          type: "object",
          properties: {
            professionalism: { type: "number", minimum: 1, maximum: 5 },
            helpfulness: { type: "number", minimum: 1, maximum: 5 },
            efficiency: { type: "number", minimum: 1, maximum: 5 }
          }
        },
        customerSatisfaction: { type: "string", enum: ["satisfied", "neutral", "dissatisfied"] },
        improvementAreas: { type: "array", items: { type: "string" } }
      }
    }
  }
});
```

### Educational Content Processing
```javascript
const lectureAnalysis = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Process this educational lecture and create study materials" },
        { fileData: { mimeType: audioFile.mimeType, fileUri: audioFile.uri } }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        lectureTitle: { type: "string" },
        subject: { type: "string" },
        keyTopics: { type: "array", items: { type: "string" } },
        definitions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              term: { type: "string" },
              definition: { type: "string" }
            }
          }
        },
        studyQuestions: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
        transcript: { type: "string" }
      }
    }
  }
});
```

### Voice Note Organization
```javascript
const voiceNoteAnalysis = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Organize this voice note and extract actionable items" },
        { fileData: { mimeType: audioFile.mimeType, fileUri: audioFile.uri } }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        transcription: { type: "string" },
        category: { type: "string", enum: ["personal", "work", "idea", "reminder", "meeting"] },
        priority: { type: "string", enum: ["high", "medium", "low"] },
        actionItems: { type: "array", items: { type: "string" } },
        dueDate: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        summary: { type: "string" }
      }
    }
  }
});
```

## What's Next

- Explore [Video Understanding](./video-understanding.md) for audiovisual content
- Learn about [Files API](./files-api.md) for file management
- Check out [Context Caching](./context-caching.md) for performance optimization
- Review [Multimodal inputs](./text-generation.md) for combining audio with text