# Code Execution

Execute code directly within the Gemini model to perform calculations, data analysis, and generate dynamic content.

## Overview

Gemini models can execute Python code in a secure sandbox environment, allowing for real-time calculations, data processing, and dynamic content generation. This feature is particularly useful for mathematical computations, data analysis, and generating code-based responses.

## Basic Code Execution

### JavaScript/TypeScript
```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

// Enable code execution
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Calculate the compound interest for $10,000 invested at 5% annual rate for 10 years, compounded monthly. Show the calculation steps.",
  config: {
    tools: [
      {
        codeExecution: {}
      }
    ]
  }
});

console.log(response.text);
```

### Python
```python
from google import genai
from google.genai.types import Tool

client = genai.Client(api_key="YOUR_API_KEY")

# Create code execution tool
code_execution_tool = Tool(code_execution={})

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Solve this system of equations: 2x + 3y = 12 and x - y = 1. Show your work.",
    config={"tools": [code_execution_tool]}
)

print(response.text)
```

## Mathematical Calculations

### Complex Mathematical Problems
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `
    Calculate the following and show your work:
    1. Find the derivative of f(x) = x³ + 2x² - 5x + 3
    2. Evaluate the definite integral of f'(x) from x=0 to x=2
    3. Plot both functions on the same graph
  `,
  config: {
    tools: [
      {
        codeExecution: {}
      }
    ]
  }
});
```

### Statistical Analysis
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `
    Given this dataset: [23, 45, 67, 89, 12, 34, 56, 78, 90, 11, 33, 55, 77, 99, 22]
    Calculate:
    1. Mean, median, and mode
    2. Standard deviation and variance
    3. Create a histogram
    4. Identify any outliers using the IQR method
  `,
  config: {
    tools: [
      {
        codeExecution: {}
      }
    ]
  }
});
```

### Financial Calculations
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `
    Create a loan amortization schedule for:
    - Principal: $250,000
    - Annual interest rate: 4.5%
    - Term: 30 years
    - Monthly payments
    
    Show the first 12 months and calculate total interest paid.
  `,
  config: {
    tools: [
      {
        codeExecution: {}
      }
    ]
  }
});
```

## Data Analysis and Visualization

### Data Processing
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `
    Analyze this sales data and create visualizations:
    
    Sales Data (Month, Revenue, Units Sold):
    Jan: $45000, 150
    Feb: $52000, 173
    Mar: $48000, 160
    Apr: $61000, 203
    May: $58000, 193
    Jun: $67000, 223
    
    Create:
    1. Line chart showing revenue trend
    2. Bar chart for units sold
    3. Calculate month-over-month growth rates
    4. Predict next month's revenue using linear regression
  `,
  config: {
    tools: [
      {
        codeExecution: {}
      }
    ]
  }
});
```

### Scientific Calculations
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `
    Physics problem: A projectile is launched at 45 degrees with initial velocity 30 m/s.
    Calculate and plot:
    1. Maximum height reached
    2. Time of flight
    3. Range of the projectile
    4. Trajectory path (x vs y coordinates)
    5. Velocity components over time
    
    Use g = 9.81 m/s²
  `,
  config: {
    tools: [
      {
        codeExecution: {}
      }
    ]
  }
});
```

## Advanced Code Execution

### Machine Learning Examples
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `
    Create a simple machine learning model:
    
    Dataset: House prices based on size
    Size (sq ft): [1200, 1500, 1800, 2100, 2400, 2700, 3000]
    Price ($): [180000, 220000, 260000, 300000, 340000, 380000, 420000]
    
    1. Create a linear regression model
    2. Calculate R-squared value
    3. Predict price for a 2000 sq ft house
    4. Plot the data points and regression line
    5. Calculate prediction intervals
  `,
  config: {
    tools: [
      {
        codeExecution: {}
      }
    ]
  }
});
```

### Algorithm Implementation
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `
    Implement and demonstrate these sorting algorithms:
    
    Array to sort: [64, 34, 25, 12, 22, 11, 90, 88, 76, 50, 42]
    
    1. Bubble Sort
    2. Quick Sort
    3. Merge Sort
    
    For each algorithm:
    - Show the implementation
    - Count the number of comparisons
    - Measure execution time
    - Visualize the sorting process for the first few steps
  `,
  config: {
    tools: [
      {
        codeExecution: {}
      }
    ]
  }
});
```

### Cryptography and Security
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `
    Demonstrate basic cryptographic concepts:
    
    1. Implement Caesar cipher encryption/decryption
    2. Create a simple hash function
    3. Generate and verify digital signatures using RSA
    4. Show password strength analysis
    
    Test with the message: "Hello, World!"
  `,
  config: {
    tools: [
      {
        codeExecution: {}
      }
    ]
  }
});
```

## Interactive Code Sessions

### Multi-step Problem Solving
```javascript
// Step 1: Initial calculation
const step1 = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Create a function to calculate factorial and test it with numbers 1-10. Store the results in a list.",
  config: {
    tools: [{ codeExecution: {} }]
  }
});

// Step 2: Build on previous results
const step2 = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Using the factorial results from before, calculate the probability of getting exactly k successes in n trials using the binomial probability formula. Test with n=10, k=3, p=0.3.",
  config: {
    tools: [{ codeExecution: {} }]
  }
});

// Step 3: Visualization
const step3 = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Create a bar chart showing the binomial probability distribution for n=10, p=0.3 for all possible values of k (0 to 10).",
  config: {
    tools: [{ codeExecution: {} }]
  }
});
```

### Code Debugging and Optimization
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `
    Debug and optimize this Python code:
    
    def fibonacci(n):
        if n <= 1:
            return n
        return fibonacci(n-1) + fibonacci(n-2)
    
    # Test with n=35
    result = fibonacci(35)
    print(result)
    
    Problems:
    1. This is very slow for large n
    2. Optimize using memoization
    3. Compare performance between original and optimized versions
    4. Show the call tree for n=5 to illustrate the problem
  `,
  config: {
    tools: [
      {
        codeExecution: {}
      }
    ]
  }
});
```

## Real-world Applications

### Business Analytics
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `
    Business scenario: E-commerce conversion analysis
    
    Data:
    - Website visitors: 10,000/month
    - Conversion rate: 2.5%
    - Average order value: $75
    - Customer acquisition cost: $25
    - Customer lifetime value: $300
    
    Calculate:
    1. Monthly revenue
    2. Customer acquisition ROI
    3. Break-even point for marketing spend
    4. Sensitivity analysis: how does 10% increase in conversion rate affect profit?
    5. Create a dashboard visualization
  `,
  config: {
    tools: [
      {
        codeExecution: {}
      }
    ]
  }
});
```

### Scientific Research
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `
    Climate data analysis:
    
    Temperature data (°C) for 12 months:
    [15.2, 17.8, 22.1, 28.3, 33.7, 38.9, 41.2, 39.8, 35.4, 29.1, 22.7, 16.9]
    
    Rainfall data (mm) for 12 months:
    [45, 38, 52, 23, 12, 5, 2, 8, 15, 28, 41, 48]
    
    Analysis:
    1. Calculate seasonal averages
    2. Find correlation between temperature and rainfall
    3. Identify climate patterns
    4. Create combined visualization
    5. Predict next year's values using trend analysis
  `,
  config: {
    tools: [
      {
        codeExecution: {}
      }
    ]
  }
});
```

### Educational Tools
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `
    Create an interactive math lesson on quadratic equations:
    
    1. Explain the general form: ax² + bx + c = 0
    2. Implement the quadratic formula
    3. Show how to complete the square
    4. Graph several examples: x² - 4x + 3, 2x² + 3x - 2, x² - 6x + 9
    5. Find roots, vertex, and axis of symmetry for each
    6. Create an interactive plot showing how changing coefficients affects the parabola
  `,
  config: {
    tools: [
      {
        codeExecution: {}
      }
    ]
  }
});
```

## Code Execution with Structured Output

```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Calculate statistics for the dataset [1,2,3,4,5,6,7,8,9,10] and return results in JSON format.",
  config: {
    tools: [
      {
        codeExecution: {}
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          dataset: {
            type: "array",
            items: { type: "number" }
          },
          statistics: {
            type: "object",
            properties: {
              mean: { type: "number" },
              median: { type: "number" },
              mode: { type: "number" },
              std_dev: { type: "number" },
              variance: { type: "number" },
              min: { type: "number" },
              max: { type: "number" },
              range: { type: "number" }
            }
          },
          code_executed: { type: "string" }
        },
        required: ["dataset", "statistics"]
      }
    }
  }
});
```

## Error Handling and Debugging

```javascript
async function executeCodeSafely(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        tools: [
          {
            codeExecution: {}
          }
        ]
      }
    });
    
    // Check if code execution was successful
    if (response.candidates[0].finishReason === "STOP") {
      return {
        success: true,
        result: response.text,
        executionTime: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        error: "Code execution was blocked or failed",
        finishReason: response.candidates[0].finishReason
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Usage
const result = await executeCodeSafely(
  "Calculate the square root of -1 and handle any errors appropriately."
);

if (result.success) {
  console.log("Execution successful:", result.result);
} else {
  console.error("Execution failed:", result.error);
}
```

## Best Practices

### Code Execution Guidelines

1. **Clear Instructions**: Provide specific requirements for calculations
2. **Error Handling**: Ask the model to include error handling in code
3. **Visualization**: Request charts and graphs for better understanding
4. **Step-by-step**: Break complex problems into smaller steps
5. **Validation**: Ask for result verification and sanity checks

### Performance Optimization

```javascript
// Good: Specific and focused request
const goodPrompt = "Calculate the mean and standard deviation of this dataset: [1,2,3,4,5]. Show the formulas used and verify the results.";

// Better: Include visualization and validation
const betterPrompt = "Calculate statistics for dataset [1,2,3,4,5], create a histogram, and verify results using built-in functions. Explain any discrepancies.";

// Best: Comprehensive analysis with multiple approaches
const bestPrompt = "Analyze dataset [1,2,3,4,5]: calculate descriptive statistics, test for normality, create visualizations, and compare manual calculations with library functions. Provide insights about the data distribution.";
```

### Security Considerations

1. **Sandbox Environment**: Code runs in a secure, isolated environment
2. **No External Access**: Cannot access external APIs or file systems
3. **Resource Limits**: Execution time and memory are limited
4. **Safe Libraries**: Only approved Python libraries are available

### Available Python Libraries

The code execution environment includes:

- **NumPy**: Numerical computing
- **Pandas**: Data manipulation and analysis
- **Matplotlib**: Plotting and visualization
- **SciPy**: Scientific computing
- **Scikit-learn**: Machine learning
- **SymPy**: Symbolic mathematics
- **Statistics**: Built-in statistical functions
- **Math**: Mathematical functions
- **Random**: Random number generation

## Limitations

1. **Python Only**: Currently supports Python code execution only
2. **No Persistence**: Variables and data don't persist between requests
3. **Time Limits**: Long-running computations may be terminated
4. **Memory Limits**: Large datasets may exceed memory constraints
5. **No File I/O**: Cannot read from or write to external files
6. **No Network Access**: Cannot make HTTP requests or access external APIs

## What's Next

- Learn about [Function Calling](./function-calling.md) for external tool integration
- Explore [Structured Output](./structured-output.md) for formatted results
- Check out [System Instructions](./system-instructions.md) for behavior customization
- Review [API Troubleshooting](./api-troubleshooting.md) for common issues