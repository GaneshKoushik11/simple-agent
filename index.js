require("dotenv").config()
const express = require("express")
const Groq = require("groq-sdk")
const {calculator, getCurrentTime} = require("./tools")
const app = express()

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

const tools = [
    {
        type: "function",
        function: {
            name: "calculator",
            description: "Perform Mathematical Calculations",
            parameters: {
                type: "object",
                properties: {
                    a: { type: "number"},
                    b: { type: "number"},
                    operation: {
                        type: "string",
                        enum: ["add", "subtract", "multiply", "divide"]
                    }
                },
                required: ["a", "b", "operation"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getCurrentTime",
            description: "Get current time",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    }
]

async function  executeTool(toolCall) {
    const args = JSON.parse(toolCall.function.arguments || "{}");

    switch(toolCall.function.name){
        case "calculator":
            return calculator(args.a, args.b, args.operation)
        case "getCurrentTime":
            return getCurrentTime()
        default:
            return "Tool Not Foumd"
    }
}

async function  agent(userInput) {
    const messages = [
        {
            role: "system",
            content: `
                You are a helpful AI assistant.
                Use tools whenever required.
                When you have enough information, answer the user.
            `
        },
        {
            role: "user",
            content: userInput,
        },
    ];

    const MAX_STEPS = 5;

    for(let step = 1; step <= MAX_STEPS; step++){
        console.log(`\n========== Step ${step} ==========`);

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages,
            tools,
            tool_choice: "auto"
        });

        const assistantMessage = response.choices[0].message
        messages.push(assistantMessage)

        //No tool? Agent is finished
        if(!assistantMessage.tool_calls){
            console.log("\nFinal Answer:");
            console.log(assistantMessage.content);
            return;
        }

        //Execute every requested tool
        for(const toolCall of assistantMessage.tool_calls){
            console.log("\nTool Requested:");
            console.log(toolCall.function.name);

            const result = await executeTool(toolCall)
            console.log("Tool Result:", result);

            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: String(result)
            });
        }
    }
    console.log("Max Steps Reached")
}
agent("What is 45 multiplied by 20? Also tell me the current time.")
  .then(() => console.log("\nAgent execution completed."))
  .catch((err) => console.error(err));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
})