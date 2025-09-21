const { exec } = require('child_process');
const path = require('path');

console.log('🧪 Running Voice Autocomplete Tests...\n');

const tests = [
    'tests/unit/speech-transcriber.test.js',
    'tests/integration/end-to-end.test.js'
];

async function runTests() {
    for (const test of tests) {
        console.log(`\n🔍 Running ${test}...`);
        
        try {
            await new Promise((resolve, reject) => {
                exec(`node ${test}`, (error, stdout, stderr) => {
                    if (stdout) console.log(stdout);
                    if (stderr) console.error(stderr);
                    
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.error(`❌ Test failed: ${test}`);
            console.error(error.message);
            process.exit(1);
        }
    }
    
    console.log('\n✅ All tests passed!');
}

runTests().catch(console.error);