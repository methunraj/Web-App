# Image Understanding

Analyze and understand images using the Gemini API's multimodal capabilities.

## Overview

Gemini models can process and understand images alongside text, enabling powerful multimodal applications. You can analyze image content, extract information, answer questions about images, and perform various computer vision tasks.

## Basic Image Analysis

### Upload and Analyze an Image
```javascript
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

// Upload an image file
const imageFile = await ai.files.upload({
  file: fs.createReadStream('path/to/image.jpg'),
  config: { mimeType: 'image/jpeg' }
});

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "What do you see in this image?" },
        { fileData: { mimeType: imageFile.mimeType, fileUri: imageFile.uri } }
      ]
    }
  ]
});

console.log(response.text);
```

### Pass Image Data Inline
```javascript
const imageData = fs.readFileSync('path/to/image.jpg');
const base64Image = imageData.toString('base64');

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Describe this image in detail" },
        { 
          inlineData: { 
            mimeType: 'image/jpeg', 
            data: base64Image 
          } 
        }
      ]
    }
  ]
});
```

## Common Use Cases

### Image Description and Captioning
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Generate a detailed caption for this image suitable for social media" },
        { fileData: { mimeType: imageFile.mimeType, fileUri: imageFile.uri } }
      ]
    }
  ]
});
```

### Object Detection and Identification
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "List all the objects you can identify in this image with their approximate locations" },
        { fileData: { mimeType: imageFile.mimeType, fileUri: imageFile.uri } }
      ]
    }
  ]
});
```

### Text Extraction (OCR)
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Extract all text from this image and format it as structured data" },
        { fileData: { mimeType: imageFile.mimeType, fileUri: imageFile.uri } }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        extractedText: { type: "string" },
        textBlocks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              confidence: { type: "number" },
              position: { type: "string" }
            }
          }
        }
      }
    }
  }
});
```

### Image Classification
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Classify this image into categories and provide confidence scores" },
        { fileData: { mimeType: imageFile.mimeType, fileUri: imageFile.uri } }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        primaryCategory: { type: "string" },
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
        tags: { type: "array", items: { type: "string" } }
      }
    }
  }
});
```

## Advanced Features

### Multiple Images Analysis
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Compare these images and identify the differences" },
        { fileData: { mimeType: image1.mimeType, fileUri: image1.uri } },
        { fileData: { mimeType: image2.mimeType, fileUri: image2.uri } }
      ]
    }
  ]
});
```

### Bounding Box Detection
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Identify all people in this image and provide bounding box coordinates" },
        { fileData: { mimeType: imageFile.mimeType, fileUri: imageFile.uri } }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        detections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              object: { type: "string" },
              confidence: { type: "number" },
              boundingBox: {
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" },
                  width: { type: "number" },
                  height: { type: "number" }
                }
              }
            }
          }
        }
      }
    }
  }
});
```

### Image Segmentation
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Segment this image and describe each distinct region or object" },
        { fileData: { mimeType: imageFile.mimeType, fileUri: imageFile.uri } }
      ]
    }
  ]
});
```

### Visual Question Answering
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "How many people are in this image and what are they doing?" },
        { fileData: { mimeType: imageFile.mimeType, fileUri: imageFile.uri } }
      ]
    }
  ]
});
```

## Python Examples

### Basic Image Analysis
```python
from google import genai
from PIL import Image

client = genai.Client(api_key="YOUR_API_KEY")

# Using PIL Image objects (automatically converted)
image = Image.open('path/to/image.jpg')

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=[
        "Describe what you see in this image",
        image
    ]
)

print(response.text)
```

### Upload and Process
```python
# Upload file first
file_upload = client.files.upload(
    path='path/to/image.jpg',
    config={'mime_type': 'image/jpeg'}
)

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=[
        "Analyze this image for business insights",
        {'file_data': {'mime_type': file_upload.mime_type, 'file_uri': file_upload.uri}}
    ]
)
```

## Supported Image Formats

- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **WebP** (.webp)
- **HEIC** (.heic)
- **HEIF** (.heif)

## Technical Details

### Image Size Limits
- Maximum file size: 20MB
- Maximum dimensions: 3072 x 3072 pixels
- Minimum dimensions: 32 x 32 pixels

### Best Practices

1. **Image Quality**: Use high-quality images for better analysis
2. **File Size**: Optimize images to reduce upload time while maintaining quality
3. **Format**: JPEG and PNG are most reliable
4. **Lighting**: Well-lit images produce better results

### Performance Optimization

```javascript
// Resize large images before upload
const sharp = require('sharp');

const optimizedImage = await sharp('large-image.jpg')
  .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 85 })
  .toBuffer();

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Analyze this optimized image" },
        { inlineData: { mimeType: 'image/jpeg', data: optimizedImage.toString('base64') } }
      ]
    }
  ]
});
```

## Context Caching for Images

For repeated analysis of the same images, use context caching:

```javascript
const cache = await ai.caches.create({
  model: "gemini-2.0-flash",
  config: {
    contents: [
      {
        parts: [
          { fileData: { mimeType: imageFile.mimeType, fileUri: imageFile.uri } }
        ]
      }
    ],
    systemInstruction: "You are an expert image analyst."
  }
});

// Use cached content for multiple queries
const response1 = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "What objects are in this image?",
  config: { cachedContent: cache.name }
});

const response2 = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "What colors are dominant in this image?",
  config: { cachedContent: cache.name }
});
```

## Error Handling

```javascript
try {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        parts: [
          { text: "Analyze this image" },
          { fileData: { mimeType: imageFile.mimeType, fileUri: imageFile.uri } }
        ]
      }
    ]
  });
  
  console.log(response.text);
} catch (error) {
  if (error.message.includes('file not found')) {
    console.log('Image file not found or expired');
  } else if (error.message.includes('unsupported format')) {
    console.log('Image format not supported');
  } else if (error.message.includes('file too large')) {
    console.log('Image file exceeds size limit');
  } else {
    console.log('Error processing image:', error.message);
  }
}
```

## Real-world Applications

### E-commerce Product Analysis
```javascript
const productAnalysis = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Analyze this product image for e-commerce listing" },
        { fileData: { mimeType: imageFile.mimeType, fileUri: imageFile.uri } }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        productName: { type: "string" },
        category: { type: "string" },
        features: { type: "array", items: { type: "string" } },
        suggestedTags: { type: "array", items: { type: "string" } },
        description: { type: "string" },
        estimatedPrice: { type: "string" }
      }
    }
  }
});
```

### Medical Image Analysis
```javascript
const medicalAnalysis = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Describe the anatomical structures visible in this medical image. Note: This is for educational purposes only and should not be used for diagnosis." },
        { fileData: { mimeType: imageFile.mimeType, fileUri: imageFile.uri } }
      ]
    }
  ]
});
```

### Document Processing
```javascript
const documentAnalysis = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      parts: [
        { text: "Extract and structure all information from this document image" },
        { fileData: { mimeType: imageFile.mimeType, fileUri: imageFile.uri } }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        documentType: { type: "string" },
        extractedText: { type: "string" },
        keyFields: {
          type: "object",
          properties: {
            title: { type: "string" },
            date: { type: "string" },
            author: { type: "string" },
            summary: { type: "string" }
          }
        },
        tables: {
          type: "array",
          items: {
            type: "object",
            properties: {
              headers: { type: "array", items: { type: "string" } },
              rows: { type: "array", items: { type: "array", items: { type: "string" } } }
            }
          }
        }
      }
    }
  }
});
```

## What's Next

- Explore [Video Understanding](./video-understanding.md) for motion analysis
- Learn about [Files API](./files-api.md) for file management
- Check out [Context Caching](./context-caching.md) for performance optimization
- Review [Multimodal inputs](./text-generation.md) for combining text and images