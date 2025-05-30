# Video Understanding

Analyze and understand video content using the Gemini API's advanced video processing capabilities.

## Overview

Gemini models can process video files to extract information, analyze content, generate descriptions, and answer questions about video scenes. The API supports various video formats and can handle both short clips and longer videos.

## Supported Video Formats

- **MP4** (recommended)
- **MOV**
- **AVI**
- **FLV**
- **MPG**
- **MPEG**
- **WEBM**
- **WMV**
- **3GPP**

## Technical Specifications

- **Maximum file size**: 2GB
- **Maximum duration**: 2 hours
- **Recommended resolution**: 720p or higher
- **Frame rate**: Up to 60 FPS
- **Audio**: Supported in video files

## Basic Video Analysis

### JavaScript/TypeScript
```javascript
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

// Upload and analyze video
async function analyzeVideo() {
  try {
    // Read video file
    const videoData = fs.readFileSync("path/to/video.mp4");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Describe what happens in this video. Include details about the setting, people, actions, and any notable events."
            },
            {
              inlineData: {
                mimeType: "video/mp4",
                data: videoData.toString("base64")
              }
            }
          ]
        }
      ]
    });
    
    console.log("Video Analysis:", response.text);
  } catch (error) {
    console.error("Error analyzing video:", error);
  }
}

analyzeVideo();
```

### Python
```python
from google import genai
import base64

client = genai.Client(api_key="YOUR_API_KEY")

def analyze_video(video_path):
    try:
        # Read and encode video
        with open(video_path, "rb") as video_file:
            video_data = base64.b64encode(video_file.read()).decode('utf-8')
        
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": "Analyze this video and provide a detailed description of the content, including scenes, actions, and any text visible."
                        },
                        {
                            "inline_data": {
                                "mime_type": "video/mp4",
                                "data": video_data
                            }
                        }
                    ]
                }
            ]
        )
        
        return response.text
    
    except Exception as e:
        print(f"Error analyzing video: {e}")
        return None

# Usage
result = analyze_video("sample_video.mp4")
print(result)
```

## Common Use Cases

### Video Summarization
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      role: "user",
      parts: [
        {
          text: "Create a concise summary of this video in bullet points. Include the main topics, key moments, and important information discussed."
        },
        {
          inlineData: {
            mimeType: "video/mp4",
            data: videoBase64
          }
        }
      ]
    }
  ]
});
```

### Scene Detection and Timestamps
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      role: "user",
      parts: [
        {
          text: "Analyze this video and identify distinct scenes or segments. For each scene, provide an approximate timestamp and description of what's happening."
        },
        {
          inlineData: {
            mimeType: "video/mp4",
            data: videoBase64
          }
        }
      ]
    }
  ]
});
```

### Object and Activity Recognition
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      role: "user",
      parts: [
        {
          text: "Identify and list all the objects, people, and activities visible in this video. Organize the response by categories."
        },
        {
          inlineData: {
            mimeType: "video/mp4",
            data: videoBase64
          }
        }
      ]
    }
  ]
});
```

### Text Extraction from Video
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      role: "user",
      parts: [
        {
          text: "Extract all visible text from this video, including signs, captions, titles, and any written content. Organize by approximate timestamp if possible."
        },
        {
          inlineData: {
            mimeType: "video/mp4",
            data: videoBase64
          }
        }
      ]
    }
  ]
});
```

## Advanced Video Analysis

### Multi-Modal Analysis with Structured Output
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      role: "user",
      parts: [
        {
          text: "Analyze this video and provide a structured analysis in JSON format with the following information: title, duration_estimate, main_subjects, key_actions, setting_description, mood_tone, and notable_objects."
        },
        {
          inlineData: {
            mimeType: "video/mp4",
            data: videoBase64
          }
        }
      ]
    }
  ],
  config: {
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          duration_estimate: { type: "string" },
          main_subjects: {
            type: "array",
            items: { type: "string" }
          },
          key_actions: {
            type: "array",
            items: { type: "string" }
          },
          setting_description: { type: "string" },
          mood_tone: { type: "string" },
          notable_objects: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["title", "main_subjects", "setting_description"]
      }
    }
  }
});
```

### Video Content Moderation
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      role: "user",
      parts: [
        {
          text: "Analyze this video for content moderation. Check for inappropriate content, violence, explicit material, or content that might violate platform guidelines. Provide a safety assessment."
        },
        {
          inlineData: {
            mimeType: "video/mp4",
            data: videoBase64
          }
        }
      ]
    }
  ],
  config: {
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_LOW_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_LOW_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_LOW_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_LOW_AND_ABOVE"
      }
    ]
  }
});
```

### Video Comparison
```javascript
async function compareVideos(video1Base64, video2Base64) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Compare these two videos and identify similarities and differences in content, style, setting, and subjects."
          },
          {
            inlineData: {
              mimeType: "video/mp4",
              data: video1Base64
            }
          },
          {
            inlineData: {
              mimeType: "video/mp4",
              data: video2Base64
            }
          }
        ]
      }
    ]
  });
  
  return response.text;
}
```

## Video Processing with Context Caching

For repeated analysis of the same video:

```javascript
// Create cached context for video
const cachedContext = await ai.models.createCachedContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType: "video/mp4",
            data: videoBase64
          }
        }
      ]
    }
  ],
  ttl: "3600s" // Cache for 1 hour
});

// Use cached context for multiple queries
const questions = [
  "What is the main topic of this video?",
  "Who are the people in this video?",
  "What actions take place?",
  "What is the setting or location?"
];

for (const question of questions) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: question }]
      }
    ],
    cachedContent: cachedContext.name
  });
  
  console.log(`Q: ${question}`);
  console.log(`A: ${response.text}\n`);
}
```

## Real-world Applications

### Educational Content Analysis
```javascript
const educationalAnalysis = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      role: "user",
      parts: [
        {
          text: "Analyze this educational video and create a study guide with key concepts, important points, and questions for review."
        },
        {
          inlineData: {
            mimeType: "video/mp4",
            data: videoBase64
          }
        }
      ]
    }
  ]
});
```

### Security and Surveillance
```javascript
const securityAnalysis = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      role: "user",
      parts: [
        {
          text: "Analyze this security footage and identify any unusual activities, people entering/leaving, or events that require attention."
        },
        {
          inlineData: {
            mimeType: "video/mp4",
            data: videoBase64
          }
        }
      ]
    }
  ]
});
```

### Sports Analysis
```javascript
const sportsAnalysis = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      role: "user",
      parts: [
        {
          text: "Analyze this sports video and provide commentary on player performance, key plays, strategies, and game highlights."
        },
        {
          inlineData: {
            mimeType: "video/mp4",
            data: videoBase64
          }
        }
      ]
    }
  ]
});
```

### Product Demo Analysis
```javascript
const productAnalysis = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      role: "user",
      parts: [
        {
          text: "Analyze this product demonstration video and extract key features, benefits, usage instructions, and selling points."
        },
        {
          inlineData: {
            mimeType: "video/mp4",
            data: videoBase64
          }
        }
      ]
    }
  ]
});
```

## Performance Optimization

### Video Preprocessing
```javascript
// Optimize video before analysis
function optimizeVideo(videoPath) {
  const ffmpeg = require('fluent-ffmpeg');
  
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .videoCodec('libx264')
      .size('720x480')
      .fps(30)
      .videoBitrate('1000k')
      .output('optimized_video.mp4')
      .on('end', () => resolve('optimized_video.mp4'))
      .on('error', reject)
      .run();
  });
}

// Use optimized video
const optimizedPath = await optimizeVideo('original_video.mp4');
const optimizedData = fs.readFileSync(optimizedPath);
```

### Chunked Video Processing
```javascript
// Process long videos in chunks
async function processLongVideo(videoPath, chunkDuration = 60) {
  const chunks = await splitVideoIntoChunks(videoPath, chunkDuration);
  const results = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunkData = fs.readFileSync(chunks[i]);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Analyze this video chunk (${i + 1}/${chunks.length}) and describe the content.`
            },
            {
              inlineData: {
                mimeType: "video/mp4",
                data: chunkData.toString("base64")
              }
            }
          ]
        }
      ]
    });
    
    results.push({
      chunk: i + 1,
      timestamp: `${i * chunkDuration}s - ${(i + 1) * chunkDuration}s`,
      analysis: response.text
    });
  }
  
  return results;
}
```

## Error Handling

```javascript
async function robustVideoAnalysis(videoPath) {
  try {
    // Check file size
    const stats = fs.statSync(videoPath);
    if (stats.size > 2 * 1024 * 1024 * 1024) { // 2GB limit
      throw new Error('Video file too large. Maximum size is 2GB.');
    }
    
    // Check file format
    const supportedFormats = ['.mp4', '.mov', '.avi', '.webm'];
    const fileExtension = path.extname(videoPath).toLowerCase();
    if (!supportedFormats.includes(fileExtension)) {
      throw new Error(`Unsupported video format: ${fileExtension}`);
    }
    
    const videoData = fs.readFileSync(videoPath);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Analyze this video content."
            },
            {
              inlineData: {
                mimeType: getMimeType(fileExtension),
                data: videoData.toString("base64")
              }
            }
          ]
        }
      ]
    });
    
    return {
      success: true,
      analysis: response.text,
      fileSize: stats.size,
      format: fileExtension
    };
    
  } catch (error) {
    console.error('Video analysis error:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

function getMimeType(extension) {
  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.flv': 'video/x-flv',
    '.wmv': 'video/x-ms-wmv'
  };
  
  return mimeTypes[extension] || 'video/mp4';
}
```

## Best Practices

### Video Quality Guidelines

1. **Resolution**: Use 720p or higher for better analysis accuracy
2. **Compression**: Balance file size with quality
3. **Frame Rate**: 30 FPS is usually sufficient
4. **Audio**: Include audio for comprehensive analysis
5. **Lighting**: Ensure good lighting for object recognition

### Prompt Engineering for Videos

```javascript
// Specific and detailed prompts work better
const goodPrompt = "Analyze this cooking video and identify: 1) ingredients used, 2) cooking techniques demonstrated, 3) equipment shown, 4) step-by-step process, and 5) final dish presentation.";

// Generic prompts may give less useful results
const poorPrompt = "What's in this video?";
```

### Cost Optimization

1. **Compress videos** before analysis
2. **Use context caching** for repeated analysis
3. **Process in chunks** for long videos
4. **Optimize prompts** to get desired information in fewer requests

## What's Next

- Learn about [Audio Understanding](./audio-understanding.md) for audio-only analysis
- Explore [Image Understanding](./image-understanding.md) for frame-by-frame analysis
- Check out [Multimodal Inputs](./multimodal-inputs.md) for combining video with other media
- Review [Context Caching](./context-caching.md) for efficient repeated analysis