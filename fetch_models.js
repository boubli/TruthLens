
const axios = require('axios');

const url = 'http://20.199.129.203:11434/api/tags';

async function listModels() {
    try {
        console.log('Fetching models from ' + url + '...');
        const response = await axios.get(url, { timeout: 5000 });
        const models = response.data.models || [];
        console.log('--- INSTALLED MODELS ---');
        models.forEach(m => console.log(m.name));
        console.log('------------------------');

        const deepseek = models.find(m => m.name.includes('deepseek'));
        if (deepseek) {
            console.log('✅ DeepSeek found: ' + deepseek.name);
        } else {
            console.log('❌ DeepSeek NOT found.');
        }

    } catch (e) {
        console.error('Error fetching models:', e.message);
    }
}

listModels();
