"""
AI Capabilities Measurement WebApp
Detects and reports AI-related hardware and software capabilities of the server
"""
import os
import platform
import subprocess
import psutil
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from typing import Dict, List, Optional
import json

app = FastAPI(title="AI Capabilities Detector")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")


def check_cuda() -> Dict:
    """Check CUDA availability and version"""
    cuda_info = {
        "available": False,
        "version": None,
        "gpu_count": 0,
        "gpus": []
    }
    
    try:
        import torch
        if torch.cuda.is_available():
            cuda_info["available"] = True
            cuda_info["version"] = torch.version.cuda
            cuda_info["gpu_count"] = torch.cuda.device_count()
            
            for i in range(torch.cuda.device_count()):
                gpu = {
                    "id": i,
                    "name": torch.cuda.get_device_name(i),
                    "memory_total": torch.cuda.get_device_properties(i).total_memory,
                    "memory_allocated": torch.cuda.memory_allocated(i),
                    "memory_cached": torch.cuda.memory_reserved(i)
                }
                cuda_info["gpus"].append(gpu)
    except ImportError:
        cuda_info["error"] = "PyTorch not installed"
    except Exception as e:
        cuda_info["error"] = str(e)
    
    return cuda_info


def check_nvidia_smi() -> Optional[Dict]:
    """Check NVIDIA GPU info via nvidia-smi"""
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,driver_version,memory.total,memory.used", "--format=csv,noheader"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            gpus = []
            for line in lines:
                parts = line.split(',')
                if len(parts) >= 4:
                    gpus.append({
                        "name": parts[0].strip(),
                        "driver_version": parts[1].strip(),
                        "memory_total": parts[2].strip(),
                        "memory_used": parts[3].strip()
                    })
            return {"available": True, "gpus": gpus}
    except FileNotFoundError:
        return {"available": False, "error": "nvidia-smi not found"}
    except Exception as e:
        return {"available": False, "error": str(e)}
    
    return None


def check_rocm() -> Dict:
    """Check AMD ROCm availability"""
    rocm_info = {
        "available": False,
        "version": None
    }
    
    try:
        result = subprocess.run(
            ["rocm-smi", "--showproductname"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            rocm_info["available"] = True
            rocm_info["output"] = result.stdout.strip()
    except FileNotFoundError:
        rocm_info["error"] = "rocm-smi not found"
    except Exception as e:
        rocm_info["error"] = str(e)
    
    return rocm_info


def check_system_info() -> Dict:
    """Get system information"""
    return {
        "platform": platform.platform(),
        "processor": platform.processor(),
        "architecture": platform.machine(),
        "python_version": platform.python_version(),
        "cpu_count": psutil.cpu_count(logical=False),
        "cpu_count_logical": psutil.cpu_count(logical=True),
        "cpu_freq": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None,
        "memory_total": psutil.virtual_memory().total,
        "memory_available": psutil.virtual_memory().available,
        "memory_percent": psutil.virtual_memory().percent
    }


def estimate_token_capacity() -> Dict:
    """Estimate token processing capacity based on available resources"""
    memory = psutil.virtual_memory()
    cuda_info = check_cuda()
    
    # Rough estimates based on typical model sizes
    estimates = {
        "estimated_max_context_length": 0,
        "suggested_models": []
    }
    
    # If CUDA is available, use GPU memory
    if cuda_info["available"] and cuda_info["gpus"]:
        gpu_memory = max([gpu["memory_total"] for gpu in cuda_info["gpus"]])
        gpu_memory_gb = gpu_memory / (1024**3)
        
        if gpu_memory_gb >= 24:
            estimates["estimated_max_context_length"] = 32768
            estimates["suggested_models"] = ["LLaMA 2 70B", "GPT-3.5 equivalent"]
        elif gpu_memory_gb >= 16:
            estimates["estimated_max_context_length"] = 16384
            estimates["suggested_models"] = ["LLaMA 2 13B", "Mistral 7B"]
        elif gpu_memory_gb >= 8:
            estimates["estimated_max_context_length"] = 8192
            estimates["suggested_models"] = ["LLaMA 2 7B", "Phi-2"]
        elif gpu_memory_gb >= 4:
            estimates["estimated_max_context_length"] = 4096
            estimates["suggested_models"] = ["Small quantized models"]
    else:
        # CPU-only estimation based on RAM
        ram_gb = memory.total / (1024**3)
        
        if ram_gb >= 32:
            estimates["estimated_max_context_length"] = 8192
            estimates["suggested_models"] = ["Small quantized models on CPU"]
        elif ram_gb >= 16:
            estimates["estimated_max_context_length"] = 4096
            estimates["suggested_models"] = ["Tiny quantized models on CPU"]
        elif ram_gb >= 8:
            estimates["estimated_max_context_length"] = 2048
            estimates["suggested_models"] = ["Very small models only"]
    
    return estimates


def check_ai_frameworks() -> Dict:
    """Check availability of various AI frameworks"""
    frameworks = {}
    
    # PyTorch
    try:
        import torch
        frameworks["pytorch"] = {
            "available": True,
            "version": torch.__version__
        }
    except ImportError:
        frameworks["pytorch"] = {"available": False}
    
    # TensorFlow
    try:
        import tensorflow as tf
        frameworks["tensorflow"] = {
            "available": True,
            "version": tf.__version__
        }
    except ImportError:
        frameworks["tensorflow"] = {"available": False}
    
    # Transformers
    try:
        import transformers
        frameworks["transformers"] = {
            "available": True,
            "version": transformers.__version__
        }
    except ImportError:
        frameworks["transformers"] = {"available": False}
    
    # ONNX Runtime
    try:
        import onnxruntime
        frameworks["onnxruntime"] = {
            "available": True,
            "version": onnxruntime.__version__
        }
    except ImportError:
        frameworks["onnxruntime"] = {"available": False}
    
    return frameworks


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Serve the main HTML page"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/capabilities")
async def get_capabilities():
    """Get all AI capabilities information"""
    capabilities = {
        "system": check_system_info(),
        "cuda": check_cuda(),
        "nvidia_smi": check_nvidia_smi(),
        "rocm": check_rocm(),
        "frameworks": check_ai_frameworks(),
        "token_capacity": estimate_token_capacity()
    }
    
    return capabilities


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
