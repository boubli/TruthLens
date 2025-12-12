
const axios = require('axios');

const OLLAMA_URL = 'http://20.199.129.203:11434';

async function testConnection() {
    console.log(`[TEST] Attempting to connect to Azure Ollama at: ${OLLAMA_URL}...`);
    try {
        const start = Date.now();
        const response = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 10000 });
        const duration = Date.now() - start;

        console.log(`[SUCCESS] Connected in ${duration}ms`);
        console.log(`[INFO] Status: ${response.status}`);
        console.log(`[INFO] Models Found:`, response.data.models?.map(m => m.name));
    } catch (error) {
        console.error(`[FAILED] Connection Error:`, error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error(' -> Server is reachable but Port 11434 is closed or Ollama is not listening.');
            console.error(' -> FIX: Ensure Ollama is running with OLLAMA_HOST=0.0.0.0');
        } else if (error.code === 'ETIMEDOUT') {
            console.error(' -> Connection Timed Out. Firewall/NSG is likely blocking the port.');
            console.error(' -> FIX: Check Azure Network Security Group Inbound Rules for Port 11434.');
        } else {
            console.error(' -> Details:', error.response?.data || error);
        }
    }
}

testConnection();
