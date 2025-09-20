// Test cases for the enhanced "thinking buddy" prompt
// This file can be used to manually validate our new approach

const testCases = [
    {
        input: "I'm planning a trip to Paris",
        expectedStyle: "Casual questions that encourage depth",
        expectedExamples: ["in what month?", "with whom?", "what kind of trip?"]
    },
    {
        input: "I'm starting a new job",
        expectedStyle: "Friendly curiosity about details",
        expectedExamples: ["in which field?", "what's exciting?", "any concerns?"]
    },
    {
        input: "I bought a new car",
        expectedStyle: "Natural follow-up questions",
        expectedExamples: ["what type?", "why this one?", "how's it different?"]
    },
    {
        input: "My presentation went well",
        expectedStyle: "Encouraging elaboration",
        expectedExamples: ["what topic?", "audience reaction?", "what worked?"]
    },
    {
        input: "I'm thinking about moving",
        expectedStyle: "Thoughtful exploration",
        expectedExamples: ["where to?", "why now?", "what's motivating?"]
    },
    {
        input: "I had a great weekend",
        expectedStyle: "Friendly interest in details",
        expectedExamples: ["what happened?", "with friends?", "best part?"]
    }
];

// Key principles for the new prompt:
// 1. FAST - Simple context analysis, no complex processing
// 2. INTELLIGENT - Contextual questions that encourage depth
// 3. CASUAL - Like a friend's inner voice, not formal AI
// 4. QUESTION FORMAT - Always end with ? to prompt thinking
// 5. UNIVERSAL - Works across all topics and domains
// 6. DEPTH-FOCUSED - Goes deeper rather than broader

console.log("Test cases ready for validation:");
testCases.forEach((test, index) => {
    console.log(`${index + 1}. "${test.input}"`);
    console.log(`   Expected: ${test.expectedExamples.join(', ')}`);
    console.log(`   Style: ${test.expectedStyle}\n`);
});

// Usage: Open the app, speak these phrases, pause, and check if suggestions match the friendly, depth-encouraging style