# AI Capabilities Detector 🤖

A web application that measures and displays the AI/ML capabilities of the executing server, including GPU support, CUDA availability, and token processing capacity.

## Features

- **System Information**: CPU, RAM, platform details
- **CUDA Detection**: Automatic detection of NVIDIA CUDA availability and version
- **GPU Information**: Detailed GPU specifications, memory, and count
- **AMD ROCm Support**: Detection of AMD GPU technologies
- **AI Framework Detection**: Checks for PyTorch, TensorFlow, Transformers, ONNX Runtime
- **Token Capacity Estimation**: Estimates maximum context length and suggests suitable models
- **Real-time Updates**: Refresh capabilities on demand
- **Beautiful UI**: Modern, responsive web interface

## Screenshots

The application provides a comprehensive dashboard showing:
- System specifications (CPU, RAM, Platform)
- CUDA/GPU information with memory details
- AI framework availability
- Estimated token processing capacity
- Suggested AI models based on hardware

## Quick Start with Docker Compose

### Prerequisites

- Docker and Docker Compose installed
- (Optional) NVIDIA Docker runtime for GPU support

### Deployment

1. Clone this repository:
```bash
git clone https://github.com/NoMadAndy/Machine-Ai-Capabilities.git
cd Machine-Ai-Capabilities
```

2. Deploy with Docker Compose:
```bash
docker-compose up -d
```

3. Access the application:
```
http://localhost:8000
```

### For GPU Support

If you have NVIDIA GPUs and want to enable CUDA support:

1. Install NVIDIA Docker runtime:
```bash
# Ubuntu/Debian
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

2. The docker-compose.yml is already configured for GPU support!

## Manual Deployment

### Without Docker

1. Install Python 3.11+:
```bash
sudo apt-get install python3.11 python3-pip
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
cd app
python main.py
```

4. Access at `http://localhost:8000`

## Automatic Redeployment

### GitHub Actions

The repository includes a GitHub Actions workflow that:
- Builds the Docker image on every push to main/master
- Tests the image
- (Optional) Deploys to your server via SSH

### Setup Automatic Deployment to Your Server

1. Add these secrets to your GitHub repository:
   - `SSH_PRIVATE_KEY`: Your SSH private key for server access
   - `SERVER_HOST`: Your server hostname or IP
   - `SERVER_USER`: SSH username

2. Uncomment the deployment steps in `.github/workflows/deploy.yml`

3. Ensure your server has:
   - Docker and Docker Compose installed
   - SSH access enabled
   - Directory `/opt/ai-capabilities-webapp` created with proper permissions

### Watchtower (Alternative Auto-Update)

For automatic container updates, use Watchtower:

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  ai-capabilities-detector \
  --interval 300
```

## API Endpoints

### GET `/`
Serves the main web interface

### GET `/api/capabilities`
Returns JSON with all detected capabilities:
```json
{
  "system": { ... },
  "cuda": { ... },
  "nvidia_smi": { ... },
  "rocm": { ... },
  "frameworks": { ... },
  "token_capacity": { ... }
}
```

### GET `/health`
Health check endpoint for monitoring

## Configuration

### Environment Variables

- `PYTHONUNBUFFERED=1`: Ensures Python output is not buffered (useful for logs)

### Port Configuration

Default port is 8000. To change it:

**docker-compose.yml:**
```yaml
ports:
  - "YOUR_PORT:8000"
```

**Or when running manually:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port YOUR_PORT
```

## Architecture

```
Machine-Ai-Capabilities/
├── app/
│   ├── main.py           # FastAPI backend
│   ├── static/
│   │   ├── style.css     # Styling
│   │   └── script.js     # Frontend logic
│   └── templates/
│       └── index.html    # Main HTML template
├── .github/
│   └── workflows/
│       └── deploy.yml    # CI/CD pipeline
├── Dockerfile            # Container definition
├── docker-compose.yml    # Orchestration
├── requirements.txt      # Python dependencies
└── README.md            # This file
```

## Technology Stack

- **Backend**: Python 3.11, FastAPI, Uvicorn
- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **Detection**: PyTorch, psutil, subprocess
- **Deployment**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

## Development

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run in development mode:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Testing

Test the API:
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/capabilities
```

## Troubleshooting

### CUDA Not Detected

1. Ensure NVIDIA drivers are installed: `nvidia-smi`
2. Check Docker has GPU support: `docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi`
3. Verify docker-compose GPU configuration

### Port Already in Use

Change the port in docker-compose.yml:
```yaml
ports:
  - "8080:8000"  # Use 8080 instead
```

### Container Won't Start

Check logs:
```bash
docker-compose logs -f
```

## License

MIT License - feel free to use this for your projects!

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## Support

For issues or questions, please open a GitHub issue.
