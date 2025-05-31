#!/usr/bin/env python3
"""
Fixed FastAPI Agno AI Processing API with improved large JSON handling
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
import sys

# Increase recursion limit for large JSON
sys.setrecursionlimit(10000)

# Agno imports
from agno.agent import Agent
from agno.models.google import Gemini
from agno.tools.python import PythonTools

app = FastAPI(title="Agno AI JSON to XLSX Processing API", version="2.1.0")

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
    json_data: str
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
            base_dir=Path(TEMP_DIR)
        )],
        show_tool_calls=True,
        instructions=[
            "You are an autonomous data processing AI specialist",
            "When given JSON data, analyze and convert it to optimal Excel structure",
            "Write Python code that creates well-organized XLSX files",
            "Always execute your code immediately",
            "Save files in the current working directory",
            "Use descriptive sheet names based on data content",
            "Handle large JSON data efficiently without loading everything into memory at once",
            "For large datasets, process in chunks if needed"
        ]
    )
    
    return agent

def direct_json_to_excel(json_data: str, file_name: str):
    """Direct conversion of JSON to Excel without AI (fallback)"""
    try:
        data = json.loads(json_data)
        
        # Generate file info
        file_id = str(uuid.uuid4())
        safe_filename = "".join(c for c in file_name if c.isalnum() or c in (' ', '-', '_')).strip()
        xlsx_filename = f"{safe_filename}_processed.xlsx"
        file_path = os.path.join(TEMP_DIR, f"{file_id}_{xlsx_filename}")
        
        # Handle different JSON structures
        if isinstance(data, list):
            # If it's a list of objects, create a DataFrame directly
            df = pd.json_normalize(data)
            with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Data', index=False)
        elif isinstance(data, dict):
            # If it's a dict with multiple keys, create multiple sheets
            with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                for key, value in data.items():
                    if isinstance(value, list):
                        df = pd.json_normalize(value)
                        sheet_name = str(key)[:31]  # Excel sheet name limit
                        df.to_excel(writer, sheet_name=sheet_name, index=False)
                    elif isinstance(value, dict):
                        df = pd.json_normalize([value])
                        sheet_name = str(key)[:31]
                        df.to_excel(writer, sheet_name=sheet_name, index=False)
                    else:
                        # Single value
                        df = pd.DataFrame([{key: value}])
                        df.to_excel(writer, sheet_name='Summary', index=False)
        else:
            # Single value
            df = pd.DataFrame([{'value': data}])
            with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Data', index=False)
        
        return file_id, xlsx_filename, file_path
        
    except Exception as e:
        raise Exception(f"Direct conversion failed: {str(e)}")

def convert_json_with_agno(json_data: str, file_name: str, description: str, api_key: str, model: str):
    """Convert JSON to XLSX using Agno AI agent with better handling for large data"""
    
    try:
        # Check JSON size
        json_size = len(json_data)
        print(f"📊 JSON data size: {json_size:,} characters")
        
        # For very large JSON (>100KB), use direct conversion
        if json_size > 100000:
            print("⚡ Large JSON detected, using optimized direct conversion...")
            return None  # Signal to use direct conversion
        
        # Create agent
        agent = create_agno_agent(api_key, model)
        
        # For medium-sized JSON (50KB-100KB), save to file first
        if json_size > 50000:
            json_file_path = os.path.join(TEMP_DIR, f"temp_{uuid.uuid4()}.json")
            with open(json_file_path, 'w') as f:
                f.write(json_data)
            
            prompt = f"""
            Convert the JSON data from file to a well-structured Excel file.

            File Info:
            - Base filename: {file_name}
            - Description: {description}
            - JSON file path: {json_file_path}

            Instructions:
            1. Read the JSON data from the file: {json_file_path}
            2. Analyze the structure and create an optimal Excel layout
            3. Handle the data efficiently (use chunking if needed for large data)
            4. Create meaningful sheets and columns
            5. Save as {file_name}_processed.xlsx
            6. Clean up the temporary JSON file after processing

            Write and execute Python code to accomplish this.
            """
        else:
            # For smaller JSON, include in prompt
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
        
    except RecursionError as e:
        print(f"⚠️ RecursionError in Agno: {str(e)}")
        return None  # Signal to use direct conversion
    except Exception as e:
        print(f"❌ Agno processing error: {str(e)}")
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
    """Process JSON data and convert to XLSX using Agno AI or direct conversion"""
    
    try:
        print(f"📥 Processing request for file: {request.file_name}")
        
        # Validate JSON
        try:
            json.loads(request.json_data)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Get files before processing
        files_before = set(glob.glob(os.path.join(TEMP_DIR, "*.xlsx")))
        
        # Try to process with Agno AI
        try:
            ai_response = convert_json_with_agno(
                request.json_data, 
                request.file_name, 
                request.description, 
                request.api_key, 
                request.model
            )
            
            if ai_response is None:
                # Agno signaled to use direct conversion
                print("📊 Using direct conversion for large/complex JSON...")
                file_id, xlsx_filename, file_path = direct_json_to_excel(
                    request.json_data, 
                    request.file_name
                )
                
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
                    ai_analysis="Direct conversion used for large JSON data"
                )
            
            print(f"🤖 AI Response: {ai_response[:200] if ai_response else 'No response'}...")
            
        except Exception as agno_error:
            print(f"⚠️ Agno failed, using fallback: {str(agno_error)}")
            # Use direct conversion as fallback
            file_id, xlsx_filename, file_path = direct_json_to_excel(
                request.json_data, 
                request.file_name
            )
            
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
                ai_analysis=f"Fallback conversion used due to: {str(agno_error)}"
            )
        
        # Find newly created Excel files (if Agno created them)
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
            # No file created by AI, use direct conversion
            print("⚠️ No file created by AI, using direct conversion...")
            file_id, xlsx_filename, file_path = direct_json_to_excel(
                request.json_data, 
                request.file_name
            )
            
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
                ai_analysis="Direct conversion used - AI did not create output file"
            )
        
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
        "version": "2.1.0",
        "temp_files_count": len(temp_files),
        "temp_directory": TEMP_DIR
    }

@app.get("/")
async def root():
    """API documentation"""
    
    return {
        "service": "Agno AI JSON to XLSX Processing API",
        "version": "2.1.0",
        "description": "Convert any JSON data to intelligently structured XLSX files using Agno AI",
        "endpoints": {
            "POST /process": "Process single JSON to XLSX",
            "GET /download/{file_id}": "Download generated XLSX file",
            "GET /files": "List all generated files",
            "DELETE /cleanup": "Clean up all temporary files",
            "GET /health": "Health check"
        },
        "features": [
            "Automatic fallback for large JSON files",
            "Direct conversion for files >100KB",
            "Improved error handling",
            "Multiple sheet support for complex JSON structures"
        ]
    }

if __name__ == "__main__":
    print("🚀 Starting Agno AI JSON to XLSX Processing API v2.1")
    print(f"📁 Temporary directory: {TEMP_DIR}")
    print("🌐 API will be available at: http://localhost:8001")
    print("📖 API docs at: http://localhost:8001/docs")
    print("✨ Now with improved large JSON handling!")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8001,
        reload=False
    )
