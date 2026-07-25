import os
import uuid
import shutil
from typing import List
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

# Document processing libraries
import dxpdf
from pdf2docx import Converter
from pypdf import PdfWriter, PdfReader

app = FastAPI(title="DocFlow Studio API")

# Allow your Vercel frontend to communicate with this Render backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace "*" with your actual Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_files"
os.makedirs(TEMP_DIR, exist_ok=True)

def cleanup_file(filepath: str):
    """Deletes temporary files after they are returned to the user."""
    if os.path.exists(filepath):
        os.remove(filepath)

@app.post("/api/word-to-pdf")
async def word_to_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename.endswith(('.doc', '.docx')):
        raise HTTPException(status_code=400, detail="Invalid format. Must be a Word document.")
        
    job_id = str(uuid.uuid4())
    input_path = f"{TEMP_DIR}/{job_id}_{file.filename}"
    output_path = f"{TEMP_DIR}/{job_id}_converted.pdf"
    
    # Save the uploaded Word file
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Convert using dxpdf
        dxpdf.convert_file(input_path, output_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # Schedule cleanup for both files
    background_tasks.add_task(cleanup_file, input_path)
    background_tasks.add_task(cleanup_file, output_path)
    
    return FileResponse(output_path, filename=f"{file.filename.split('.')[0]}-converted.pdf")

@app.post("/api/pdf-to-word")
async def pdf_to_word(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid format. Must be a PDF.")
        
    job_id = str(uuid.uuid4())
    input_path = f"{TEMP_DIR}/{job_id}_{file.filename}"
    output_path = f"{TEMP_DIR}/{job_id}_converted.docx"
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        cv = Converter(input_path)
        cv.convert(output_path)
        cv.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    background_tasks.add_task(cleanup_file, input_path)
    background_tasks.add_task(cleanup_file, output_path)
    
    return FileResponse(output_path, filename=f"{file.filename.split('.')[0]}-converted.docx")

@app.post("/api/merge-pdf")
async def merge_pdf(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Please upload at least two PDFs to merge.")
        
    job_id = str(uuid.uuid4())
    output_path = f"{TEMP_DIR}/{job_id}_merged.pdf"
    merger = PdfWriter()
    
    input_paths = []
    
    # Save and append all files
    for file in files:
        path = f"{TEMP_DIR}/{job_id}_{file.filename}"
        input_paths.append(path)
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        merger.append(path)
        
    merger.write(output_path)
    merger.close()
    
    # Schedule cleanup
    for path in input_paths:
        background_tasks.add_task(cleanup_file, path)
    background_tasks.add_task(cleanup_file, output_path)
    
    return FileResponse(output_path, filename="merged-document.pdf")

@app.post("/api/split-pdf")
async def split_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # To keep the frontend setup extremely simple, this logic currently extracts just the first page.
    job_id = str(uuid.uuid4())
    input_path = f"{TEMP_DIR}/{job_id}_{file.filename}"
    output_path = f"{TEMP_DIR}/{job_id}_split.pdf"
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    reader = PdfReader(input_path)
    writer = PdfWriter()
    
    # Extract page 1
    if len(reader.pages) > 0:
        writer.add_page(reader.pages[0])
        
    with open(output_path, "wb") as f:
        writer.write(f)
        
    background_tasks.add_task(cleanup_file, input_path)
    background_tasks.add_task(cleanup_file, output_path)
    
    return FileResponse(output_path, filename=f"{file.filename.split('.')[0]}-split.pdf")
