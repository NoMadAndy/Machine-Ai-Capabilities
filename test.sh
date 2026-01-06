#!/bin/bash
# Test script for AI Capabilities WebApp

echo "🧪 Testing AI Capabilities WebApp"
echo "=================================="
echo ""

# Check if the service is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓ Service is running"
else
    echo "✗ Service is not accessible at http://localhost:8000"
    exit 1
fi

# Test health endpoint
echo ""
echo "Testing /health endpoint..."
health_response=$(curl -s http://localhost:8000/health)
if echo "$health_response" | grep -q "healthy"; then
    echo "✓ Health check passed"
else
    echo "✗ Health check failed"
    exit 1
fi

# Test capabilities endpoint
echo ""
echo "Testing /api/capabilities endpoint..."
capabilities_response=$(curl -s http://localhost:8000/api/capabilities)
if echo "$capabilities_response" | grep -q "system"; then
    echo "✓ Capabilities endpoint working"
else
    echo "✗ Capabilities endpoint failed"
    exit 1
fi

# Parse and display some key information
echo ""
echo "📊 System Information:"
echo "$capabilities_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'  Platform: {data[\"system\"][\"platform\"]}')
print(f'  CPU Cores: {data[\"system\"][\"cpu_count\"]} physical, {data[\"system\"][\"cpu_count_logical\"]} logical')
print(f'  Memory: {data[\"system\"][\"memory_total\"] / (1024**3):.2f} GB total')
print(f'  CUDA Available: {data[\"cuda\"][\"available\"]}')
print(f'  Token Capacity: {data[\"token_capacity\"][\"estimated_max_context_length\"]} tokens')
"

echo ""
echo "✅ All tests passed!"
echo "🌐 Access the web interface at: http://localhost:8000"
