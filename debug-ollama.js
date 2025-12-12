
const axios = require('axios');

const url = 'http://20.199.129.203:11434/api/tags';

async function test() {
    try {
        console.log('Testing connection to:', url);
        const res = await axios.get(url, { timeout: 10000 });
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) {
            console.error('Response status:', e.response.status);
            console.error('Response data:', e.response.data);
        } else if (e.request) {
            console.error('No response received');
        } else {
            console.error('Error setting up request:', e.message);
        }
    }
}

test();
