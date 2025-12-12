#!/bin/bash

# Azure VM Setup Script for TruthLens AI (SearXNG + Ollama + DeepSeek)
# Author: TruthLens Agent
# Target OS: Ubuntu / Debian

set -e # Exit on error

echo "=================================================="
echo "   TruthLens AI Server Setup (Azure VM)"
echo "   Components: Docker, SearXNG, Ollama, DeepSeek"
echo "=================================================="

# 1. Update System
echo "[+] Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker & Docker Compose (if not installed)
if ! command -v docker &> /dev/null; then
    echo "[+] Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "[+] Docker installed."
else
    echo "[.] Docker already installed."
fi

# 3. Install Ollama (Self-Hosted AI)
if ! command -v ollama &> /dev/null; then
    echo "[+] Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "[.] Ollama already installed."
fi

# 4. Configure Ollama for External Access (0.0.0.0)
echo "[+] Configuring Ollama service..."
sudo mkdir -p /etc/systemd/system/ollama.service.d
echo "[Service]
Environment=\"OLLAMA_HOST=0.0.0.0\"
Environment=\"OLLAMA_ORIGINS=*\"" | sudo tee /etc/systemd/system/ollama.service.d/override.conf

# Reload and Restart Ollama
sudo systemctl daemon-reload
sudo systemctl restart ollama

echo "[+] Ollama configured to listen on 0.0.0.0 (Port 11434)"

# 5. Pull DeepSeek Models
echo "[+] Pulling DeepSeek models (this may take a while)..."
# Using 7b models which are suitable for typical VMs. 67b requires massive GPU RAM.
ollama pull deepseek-llm:7b
ollama pull deepseek-coder:6.7b

echo "[+] Models installed: deepseek-llm:7b, deepseek-coder:6.7b"

# 6. Setup SearXNG (Docker)
echo "[+] Setting up SearXNG..."
mkdir -p ~/searxng
cd ~/searxng

# Create docker-compose.yml for SearXNG
cat <<EOF > docker-compose.yml
version: '3.7'
services:
  searxng:
    image: searxng/searxng:latest
    container_name: searxng
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - ./searxng:/etc/searxng
    environment:
      - BASE_URL=http://$(curl -s ifconfig.me):8080/
      - INSTANCE_NAME=TruthLens-Search
EOF

# Create settings.yml with JSON format enabled
mkdir -p searxng
cat <<EOF > searxng/settings.yml
use_default_settings: true
server:
  port: 8080
  bind_address: "0.0.0.0"
  secret_key: "truthlens-admin-secret-key-change-this" # Change this!
search:
  safe_search: 0
  formats:
    - html
    - json
EOF

echo "[+] Starting SearXNG..."
sudo docker check || true # ensure docker is running
sudo docker compose up -d

# 7. Firewall Rules (UFW) - Optional check
if command -v ufw &> /dev/null; then
    echo "[+] Configuring UFW Firewall..."
    sudo ufw allow 22/tcp
    sudo ufw allow 8080/tcp # SearXNG
    sudo ufw allow 11434/tcp # Ollama
    # sudo ufw enable # Use with caution on remote SSH!
fi

echo "=================================================="
echo "   SETUP COMPLETE!"
echo "=================================================="
echo "1. Ollama is running on Port 11434"
echo "   Test: curl http://localhost:11434/api/tags"
echo ""
echo "2. SearXNG is running on Port 8080"
echo "   Test: http://$(curl -s ifconfig.me):8080"
echo ""
echo "3. DeepSeek Models Installed:"
echo "   - deepseek-llm:7b"
echo "   - deepseek-coder:6.7b"
echo ""
echo "IMPORTANT: Ensure Azure Network Security Group (NSG) allows Inbound Traffic on ports 8080 and 11434."
