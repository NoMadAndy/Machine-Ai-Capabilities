// Main script for AI Capabilities Detector

let capabilitiesData = null;

// Load capabilities data on page load
window.addEventListener('DOMContentLoaded', () => {
    refreshData();
});

async function refreshData() {
    showLoading(true);
    
    try {
        const response = await fetch('/api/capabilities');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        capabilitiesData = await response.json();
        displayCapabilities(capabilitiesData);
        updateTimestamp();
        showLoading(false);
    } catch (error) {
        console.error('Error fetching capabilities:', error);
        showError('Failed to fetch capabilities: ' + error.message);
        showLoading(false);
    }
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
    document.getElementById('content').style.display = show ? 'none' : 'block';
}

function showError(message) {
    const content = document.getElementById('content');
    content.innerHTML = `<div class="card error-message"><h2>Error</h2><p>${message}</p></div>`;
    content.style.display = 'block';
}

function updateTimestamp() {
    const now = new Date();
    document.getElementById('last-updated').textContent = now.toLocaleString();
}

function displayCapabilities(data) {
    displaySystemInfo(data.system);
    displayCudaInfo(data.cuda);
    displayNvidiaSmiInfo(data.nvidia_smi);
    displayRocmInfo(data.rocm);
    displayFrameworksInfo(data.frameworks);
    displayTokenCapacity(data.token_capacity);
    displayRawData(data);
}

function displaySystemInfo(system) {
    const container = document.getElementById('system-info');
    container.innerHTML = '';
    
    const formatBytes = (bytes) => {
        const gb = bytes / (1024 ** 3);
        return gb.toFixed(2) + ' GB';
    };
    
    const items = [
        { label: 'Platform', value: system.platform },
        { label: 'Processor', value: system.processor || 'Unknown' },
        { label: 'Architecture', value: system.architecture },
        { label: 'Python Version', value: system.python_version },
        { label: 'CPU Cores (Physical)', value: system.cpu_count },
        { label: 'CPU Cores (Logical)', value: system.cpu_count_logical },
        { label: 'Total Memory', value: formatBytes(system.memory_total) },
        { label: 'Available Memory', value: formatBytes(system.memory_available) },
        { label: 'Memory Usage', value: system.memory_percent.toFixed(1) + '%' }
    ];
    
    if (system.cpu_freq) {
        items.push({ label: 'CPU Frequency (Current)', value: system.cpu_freq.current.toFixed(0) + ' MHz' });
    }
    
    items.forEach(item => {
        container.innerHTML += `
            <div class="info-item">
                <strong>${item.label}</strong>
                <span>${item.value}</span>
            </div>
        `;
    });
}

function displayCudaInfo(cuda) {
    const container = document.getElementById('cuda-info');
    container.innerHTML = '';
    
    if (cuda.available) {
        container.innerHTML = `
            <div class="success-message">
                <span class="status-badge status-available">✓ CUDA Available</span>
                <p style="margin-top: 10px;"><strong>CUDA Version:</strong> ${cuda.version}</p>
                <p><strong>GPU Count:</strong> ${cuda.gpu_count}</p>
            </div>
        `;
        
        if (cuda.gpus && cuda.gpus.length > 0) {
            cuda.gpus.forEach((gpu, index) => {
                const memoryTotal = (gpu.memory_total / (1024 ** 3)).toFixed(2);
                const memoryAllocated = (gpu.memory_allocated / (1024 ** 3)).toFixed(2);
                const memoryCached = (gpu.memory_cached / (1024 ** 3)).toFixed(2);
                
                container.innerHTML += `
                    <div class="gpu-card">
                        <h3>GPU ${gpu.id}: ${gpu.name}</h3>
                        <div class="gpu-details">
                            <div class="gpu-detail-item">
                                <strong>Total Memory</strong><br>
                                ${memoryTotal} GB
                            </div>
                            <div class="gpu-detail-item">
                                <strong>Allocated Memory</strong><br>
                                ${memoryAllocated} GB
                            </div>
                            <div class="gpu-detail-item">
                                <strong>Cached Memory</strong><br>
                                ${memoryCached} GB
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    } else {
        container.innerHTML = `
            <div class="error-message">
                <span class="status-badge status-unavailable">✗ CUDA Not Available</span>
                ${cuda.error ? `<p style="margin-top: 10px;"><strong>Reason:</strong> ${cuda.error}</p>` : ''}
            </div>
        `;
    }
}

function displayNvidiaSmiInfo(nvidiaSmi) {
    const container = document.getElementById('nvidia-smi-info');
    container.innerHTML = '';
    
    if (nvidiaSmi && nvidiaSmi.available) {
        container.innerHTML = `
            <div class="success-message">
                <span class="status-badge status-available">✓ NVIDIA SMI Available</span>
            </div>
        `;
        
        if (nvidiaSmi.gpus && nvidiaSmi.gpus.length > 0) {
            nvidiaSmi.gpus.forEach((gpu, index) => {
                container.innerHTML += `
                    <div class="gpu-card">
                        <h3>${gpu.name}</h3>
                        <div class="gpu-details">
                            <div class="gpu-detail-item">
                                <strong>Driver Version</strong><br>
                                ${gpu.driver_version}
                            </div>
                            <div class="gpu-detail-item">
                                <strong>Total Memory</strong><br>
                                ${gpu.memory_total}
                            </div>
                            <div class="gpu-detail-item">
                                <strong>Used Memory</strong><br>
                                ${gpu.memory_used}
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    } else {
        container.innerHTML = `
            <div class="error-message">
                <span class="status-badge status-unavailable">✗ NVIDIA SMI Not Available</span>
                ${nvidiaSmi && nvidiaSmi.error ? `<p style="margin-top: 10px;"><strong>Reason:</strong> ${nvidiaSmi.error}</p>` : ''}
            </div>
        `;
    }
}

function displayRocmInfo(rocm) {
    const container = document.getElementById('rocm-info');
    container.innerHTML = '';
    
    if (rocm.available) {
        container.innerHTML = `
            <div class="success-message">
                <span class="status-badge status-available">✓ AMD ROCm Available</span>
                ${rocm.output ? `<pre style="margin-top: 10px;">${rocm.output}</pre>` : ''}
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="error-message">
                <span class="status-badge status-unavailable">✗ AMD ROCm Not Available</span>
                ${rocm.error ? `<p style="margin-top: 10px;"><strong>Reason:</strong> ${rocm.error}</p>` : ''}
            </div>
        `;
    }
}

function displayFrameworksInfo(frameworks) {
    const container = document.getElementById('frameworks-info');
    container.innerHTML = '';
    
    Object.entries(frameworks).forEach(([name, info]) => {
        const status = info.available ? 'available' : 'unavailable';
        const badge = info.available ? '✓' : '✗';
        const version = info.version ? ` (v${info.version})` : '';
        
        container.innerHTML += `
            <div class="info-item">
                <strong>${name.charAt(0).toUpperCase() + name.slice(1)}</strong>
                <span class="status-badge status-${status}">${badge} ${info.available ? 'Installed' : 'Not Installed'}${version}</span>
            </div>
        `;
    });
}

function displayTokenCapacity(tokenCapacity) {
    const container = document.getElementById('token-capacity');
    container.innerHTML = '';
    
    if (tokenCapacity.estimated_max_context_length > 0) {
        container.innerHTML = `
            <div class="success-message">
                <div class="metric">${tokenCapacity.estimated_max_context_length.toLocaleString()} tokens</div>
                <p><strong>Estimated Maximum Context Length</strong></p>
                
                ${tokenCapacity.suggested_models.length > 0 ? `
                    <div style="margin-top: 20px;">
                        <strong>Suggested Models:</strong>
                        <ul class="model-list">
                            ${tokenCapacity.suggested_models.map(model => `<li>${model}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="error-message">
                <p>Unable to estimate token capacity. Limited resources detected.</p>
            </div>
        `;
    }
}

function displayRawData(data) {
    const container = document.getElementById('raw-data');
    container.textContent = JSON.stringify(data, null, 2);
}

function toggleRawData() {
    const rawData = document.getElementById('raw-data');
    rawData.style.display = rawData.style.display === 'none' ? 'block' : 'none';
}
