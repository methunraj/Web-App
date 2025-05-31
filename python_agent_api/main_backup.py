#!/usr/bin/env python3
"""
Fixed FastAPI Agno AI Processing API
Integrates with the working Agno AI JSON to XLSX converter
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import pandas as pd
import tempfile
import uuid
from datetime import datetime, timedelta
import threading
import time
import os
import uvicorn
import glob
from pathlib import Path

# Agno imports
from agno.agent import Agent
from agno.models.google import Gemini
from agno.tools.python import PythonTools

app = FastAPI(title="Agno AI JSON to XLSX Processing API", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global storage for temporary files
temp_files = {}
TEMP_DIR = tempfile.mkdtemp(prefix="agno_xlsx_")

class ProcessRequest(BaseModel):
    json_data: str  # Changed from extracted_data to json_data
    file_name: Optional[str] = "data"
    description: Optional[str] = ""
    api_key: str
    model: Optional[str] = "gemini-2.0-flash"

class ProcessResponse(BaseModel):
    success: bool
    file_id: Optional[str] = None
    file_name: Optional[str] = None
    download_url: Optional[str] = None
    ai_analysis: Optional[str] = None
    error: Optional[str] = None

class BatchProcessRequest(BaseModel):
    json_files: List[Dict[str, str]]  # List of {json_data, file_name, description}
    api_key: str
    model: Optional[str] = "gemini-2.0-flash"

class BatchProcessResponse(BaseModel):
    success: bool
    processed_files: Optional[List[Dict[str, str]]] = None
    processed_count: Optional[int] = None
    error: Optional[str] = None

def cleanup_expired_files():
    """Clean up files older than 1 hour"""
    current_time = datetime.now()
    expired_files = []
    
    for file_id, file_info in temp_files.items():
        if current_time - file_info['created_at'] > timedelta(hours=1):
            expired_files.append(file_id)
    
    for file_id in expired_files:
        file_path = temp_files[file_id]['path']
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        if file_id in temp_files:
            del temp_files[file_id]

def create_agno_agent(api_key: str, model: str = "gemini-2.0-flash"):
    """Create Agno agent for JSON to XLSX conversion"""
    
    # Set environment variable
    os.environ["GOOGLE_API_KEY"] = api_key
    
    # Create agent with working directory set to temp dir
    agent = Agent(
        model=Gemini(
            id=model,
            api_key=api_key
        ),
        tools=[PythonTools(
            run_code=True,
            pip_install=True,
            base_dir=Path(TEMP_DIR)  # Set working directory to temp dir
        )],
        show_tool_calls=True,
        instructions=[
            "You are an autonomous data processing AI specialist",
            "When given JSON data, analyze and convert it to optimal Excel structure",
            "Write Python code that creates well-organized XLSX files",
            "Always execute your code immediately",
            "Save files in the current working directory",
            "Use descriptive sheet names based on data content",
            "Handle any JSON structure intelligently"
        ]
    )
    
    return agent

def convert_json_with_agno(json_data: str, file_name: str, description: str, api_key: str, model: str):
    """Convert JSON to XLSX using Agno AI agent"""
    
    try:
        # Create agent
        agent = create_agno_agent(api_key, model)
        
        # Create the prompt for AI
        prompt = f"""
        Convert this JSON data to a well-structured Excel file:

        JSON Data:
        {json_data}

        File Info:
        - Base filename: {file_name}
        - Description: {description}

        Instructions:
        1. Analyze the JSON structure thoroughly
        2. Decide the optimal Excel organization (sheets, columns, relationships)
        3. Write Python code to create the Excel file
        4. Use a descriptive filename based on the content
        5. Execute the code immediately to create the file
        6. Confirm the file was created successfully

        Create the most logical and user-friendly Excel structure for this data.
        """
        
        # Get response from agent
        response = agent.run(prompt)
        
        return response.content
        
    except Exception as e:
        raise Exception(f"Agno AI processing failed: {str(e)}")

# Start cleanup thread
def periodic_cleanup():
    while True:
        time.sleep(300)  # Clean up every 5 minutes
        cleanup_expired_files()

cleanup_thread = threading.Thread(target=periodic_cleanup, daemon=True)
cleanup_thread.start()

@app.post("/process", response_model=ProcessResponse)
async def process_json_data(request: ProcessRequest):
    """Process JSON data and convert to XLSX using Agno AI"""
    
    try:
        print(f"📥 Processing request for file: {request.file_name}")
        
        # Validate JSON
        try:
            json.loads(request.json_data)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Get files before processing
        files_before = set(glob.glob(os.path.join(TEMP_DIR, "*.xlsx")))
        
        # Process with Agno AI
        ai_response = convert_json_with_agno(
            request.json_data, 
            request.file_name, 
            request.description, 
            request.api_key, 
            request.model
        )
        
        print(f"🤖 AI Response: {ai_response[:200]}...")
        
        # Find newly created Excel files
        files_after = set(glob.glob(os.path.join(TEMP_DIR, "*.xlsx")))
        new_files = files_after - files_before
        
        if new_files:
            # Use the most recently created file
            newest_file = max(new_files, key=os.path.getmtime)
            
            # Generate file ID
            file_id = str(uuid.uuid4())
            original_filename = os.path.basename(newest_file)
            
            # Create managed filename
            managed_filename = f"{file_id}_{original_filename}"
            managed_path = os.path.join(TEMP_DIR, managed_filename)
            
            # Move file to managed location
            os.rename(newest_file, managed_path)
            
            # Store file info
            temp_files[file_id] = {
                'path': managed_path,
                'filename': original_filename,
                'created_at': datetime.now(),
                'original_json': request.json_data[:500] + "..." if len(request.json_data) > 500 else request.json_data
            }
            
            print(f"✅ File created successfully: {original_filename}")
            
            return ProcessResponse(
                success=True,
                file_id=file_id,
                file_name=original_filename,
                download_url=f"/download/{file_id}",
                ai_analysis=ai_response
            )
        
        else:
            # Fallback: Create basic Excel file if AI didn't create one
            print("⚠️ No file created by AI, creating fallback...")
            
            try:
                data = json.loads(request.json_data)
                
                # Create basic DataFrame
                if isinstance(data, list):
                    df = pd.json_normalize(data)
                elif isinstance(data, dict):
                    # Handle nested dictionaries
                    df = pd.json_normalize([data])
                else:
                    df = pd.DataFrame([{'value': data}])
                
                # Generate file info
                file_id = str(uuid.uuid4())
                safe_filename = "".join(c for c in request.file_name if c.isalnum() or c in (' ', '-', '_')).strip()
                xlsx_filename = f"{safe_filename}_processed.xlsx"
                file_path = os.path.join(TEMP_DIR, f"{file_id}_{xlsx_filename}")
                
                # Create Excel file
                with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                    df.to_excel(writer, sheet_name='Data', index=False)
                
                # Store file info
                temp_files[file_id] = {
                    'path': file_path,
                    'filename': xlsx_filename,
                    'created_at': datetime.now(),
                    'original_json': request.json_data[:500] + "..." if len(request.json_data) > 500 else request.json_data
                }
                
                return ProcessResponse(
                    success=True,
                    file_id=file_id,
                    file_name=xlsx_filename,
                    download_url=f"/download/{file_id}",
                    ai_analysis="Fallback processing used - basic Excel structure created"
                )
                
            except Exception as fallback_error:
                raise HTTPException(status_code=500, detail=f"Both AI and fallback processing failed: {str(fallback_error)}")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error processing data: {str(e)}")
        return ProcessResponse(
            success=False,
            error=f"Processing failed: {str(e)}"
        )

@app.get("/download/{file_id}")
async def download_file(file_id: str):
    """Download a generated XLSX file"""
    
    if file_id not in temp_files:
        raise HTTPException(status_code=404, detail="File not found or expired")
    
    file_info = temp_files[file_id]
    file_path = file_info['path']
    
    if not os.path.exists(file_path):
        # Clean up the reference if file doesn't exist
        if file_id in temp_files:
            del temp_files[file_id]
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=file_path,
        filename=file_info['filename'],
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@app.post("/batch-process", response_model=BatchProcessResponse)
async def batch_process_json(request: BatchProcessRequest):
    """Process multiple JSON files in batch"""
    
    try:
        processed_files = []
        errors = []
        
        for i, file_data in enumerate(request.json_files):
            try:
                print(f"📝 Processing batch file {i+1}/{len(request.json_files)}")
                
                # Create individual process request
                process_request = ProcessRequest(
                    json_data=file_data.get('json_data', '{}'),
                    file_name=file_data.get('file_name', f'batch_file_{i+1}'),
                    description=file_data.get('description', ''),
                    api_key=request.api_key,
                    model=request.model
                )
                
                # Process the file
                result = await process_json_data(process_request)
                
                if result.success:
                    processed_files.append({
                        'file_id': result.file_id,
                        'file_name': result.file_name,
                        'download_url': result.download_url
                    })
                else:
                    errors.append(f"File {i+1}: {result.error}")
                    
            except Exception as e:
                errors.append(f"File {i+1}: {str(e)}")
        
        success = len(processed_files) > 0
        error_msg = "; ".join(errors) if errors else None
        
        return BatchProcessResponse(
            success=success,
            processed_files=processed_files,
            processed_count=len(processed_files),
            error=error_msg
        )
        
    except Exception as e:
        print(f"❌ Batch processing error: {str(e)}")
        return BatchProcessResponse(
            success=False,
            processed_count=0,
            error=f"Batch processing failed: {str(e)}"
        )

@app.get("/files")
async def list_files():
    """List all current temporary files"""
    
    file_list = []
    for file_id, file_info in temp_files.items():
        file_list.append({
            'file_id': file_id,
            'filename': file_info['filename'],
            'created_at': file_info['created_at'].isoformat(),
            'download_url': f"/download/{file_id}",
            'preview': file_info.get('original_json', 'N/A')[:100] + "..."
        })
    
    return {
        'success': True,
        'files': file_list,
        'count': len(file_list)
    }

@app.delete("/cleanup")
async def cleanup_all_files():
    """Clean up all temporary files"""
    
    try:
        files_deleted = 0
        for file_id, file_info in list(temp_files.items()):
            file_path = file_info['path']
            if os.path.exists(file_path):
                os.remove(file_path)
                files_deleted += 1
            del temp_files[file_id]
        
        return {
            'success': True, 
            'message': f'Cleaned up {files_deleted} files'
        }
        
    except Exception as e:
        return {
            'success': False, 
            'error': str(e)
        }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    
    return {
        "status": "healthy", 
        "service": "Agno AI JSON to XLSX Processing API",
        "version": "2.0.0",
        "temp_files_count": len(temp_files),
        "temp_directory": TEMP_DIR
    }

@app.get("/")
async def root():
    """API documentation"""
    
    return {
        "service": "Agno AI JSON to XLSX Processing API",
        "version": "2.0.0",
        "description": "Convert any JSON data to intelligently structured XLSX files using Agno AI",
        "endpoints": {
            "POST /process": "Process single JSON to XLSX",
            "POST /batch-process": "Process multiple JSON files",
            "GET /download/{file_id}": "Download generated XLSX file",
            "GET /files": "List all generated files",
            "DELETE /cleanup": "Clean up all temporary files",
            "GET /health": "Health check"
        },
        "usage": {
            "single_file": "POST /process with {json_data, file_name, description, api_key}",
            "batch_files": "POST /batch-process with {json_files: [{json_data, file_name, description}], api_key}"
        }
    }

if __name__ == "__main__":
    print("🚀 Starting Agno AI JSON to XLSX Processing API")
    print(f"📁 Temporary directory: {TEMP_DIR}")
    print("🌐 API will be available at: http://localhost:8001")
    print("📖 API docs at: http://localhost:8001/docs")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8001,
        reload=False
    )