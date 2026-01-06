#!/bin/bash
# AI Capabilities WebApp - Easy deployment script

set -e

echo "🤖 AI Capabilities WebApp Deployment Script"
echo "==========================================="
echo ""

# Check if Docker is installed
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✓ Docker and Docker Compose found"
    echo ""
    
    # Ask user for deployment type
    echo "Select deployment type:"
    echo "1) Basic (CPU-only, lightweight)"
    echo "2) GPU-enabled (with PyTorch and CUDA support)"
    echo "3) Manual (without Docker)"
    read -p "Enter choice [1-3]: " choice
    
    case $choice in
        1)
            echo ""
            echo "🚀 Deploying basic version..."
            docker-compose down 2>/dev/null || true
            docker-compose up -d --build
            echo ""
            echo "✓ Deployment complete!"
            echo "🌐 Access the application at: http://localhost:8000"
            ;;
        2)
            echo ""
            # Check for NVIDIA Docker
            if docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi &>/dev/null; then
                echo "✓ NVIDIA Docker runtime detected"
                echo "🚀 Deploying GPU-enabled version..."
                docker-compose -f docker-compose.gpu.yml down 2>/dev/null || true
                docker-compose -f docker-compose.gpu.yml up -d --build
                echo ""
                echo "✓ Deployment complete!"
                echo "🌐 Access the application at: http://localhost:8000"
            else
                echo "⚠ NVIDIA Docker runtime not found or not working"
                echo "Please install nvidia-docker2 first:"
                echo "  https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html"
                exit 1
            fi
            ;;
        3)
            echo ""
            echo "📦 Installing Python dependencies..."
            pip3 install -r requirements.txt
            
            read -p "Install GPU/AI frameworks? [y/N]: " install_gpu
            if [[ $install_gpu == "y" || $install_gpu == "Y" ]]; then
                pip3 install -r requirements-gpu.txt
            fi
            
            echo ""
            echo "🚀 Starting application..."
            echo "Press Ctrl+C to stop"
            python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
            ;;
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac
else
    echo "⚠ Docker not found, using manual deployment"
    echo ""
    
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 is not installed"
        exit 1
    fi
    
    echo "📦 Installing Python dependencies..."
    pip3 install -r requirements.txt
    
    read -p "Install GPU/AI frameworks? [y/N]: " install_gpu
    if [[ $install_gpu == "y" || $install_gpu == "Y" ]]; then
        pip3 install -r requirements-gpu.txt
    fi
    
    echo ""
    echo "🚀 Starting application..."
    echo "Press Ctrl+C to stop"
    python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
fi
