require('dotenv').config(); // load environment variables from .env file
const express = require('express'); // import express framework
const cors = require('cors'); // import cors middleware
const { OpenAI } = require('openai'); // import openai library

const app = express(); // create an express application
app.use(cors()); // enable cors
app.use(express.json()); // parse incoming json requests

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // get openai api key from environment variables
});
const assistantId = process.env.ASSISTANT_ID; // get assistant id from environment variables

// endpoint to handle chatbot
app.post('/backend/new', async (req, res) => {
    try {
        // ensures code does not process with a blank message
        if (!req.body.content) {
            return res.status(400).json({ error: "Message cannot be blank" });
        }
        
        const userMessage = req.body.content; //setting variable to user input
        // Check if a thread already exists for the assistant
        let threadID = req.body.threadId || null;
        // If there's no existing thread create a new one
        if (!threadId) {
            const threadResponse = await openai.beta.threads.create();
            const threadId = threadResponse.id;

            // Store the threadId for future reference in threadStore (or a DB)
            threadStore[threadId] = [];
        }
        
        // add the user message to the conversation thread
        await openai.beta.threads.messages.create(threadId, {
          role: "user",
          content: userMessage,
        });

        // runs the assistant
        const runResponse = await openai.beta.threads.runs.create(threadId, {
          assistant_id: assistantId,
        });

        // checks the run status
        let run = await openai.beta.threads.runs.retrieve(threadId, runResponse.id);
        while (run.status !== "completed") {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          run = await openai.beta.threads.runs.retrieve(threadId, runResponse.id);
        }

        // display the assistant's response
        const messagesResponse = await openai.beta.threads.messages.list(threadId);
        const assistantResponses = messagesResponse.data.filter(msg => msg.role === 'assistant');
        const response = assistantResponses
            .map(msg => msg.content)
            .join('\n')
        // store the response in the thread store
        threadStore[threadId].push({ role: 'assistant', content: response });
        // send the assistant's response back to the client
        res.json({ response });

        } catch (error) {
            console.error('error occurred:', error);
            res.status(500).json({ error: 'internal server error', details: error.message });
        }
});
 // Endpoint to retrieve the status of specific run in a specific thread
app.get('/backend/threads/:threadId/runs/:runId', async (req, res) => { 
    const { threadId, runId } = req.params; 
    try {
        const run = await openai.beta.threads.runs.retrieve(threadId, runId);
        res.json({ 
            runId: run.id,
            threadId,
            status: run.status,
            requiredAction: run.requiredAction,
            lastError: run.lastError,
        });
    } catch (error) {
        console.error("error retrieving run:", error);
        res.status(500).json({ error: 'failed to retrieve run' }); // respond with an error
    }
});

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => { 
    console.log(`server is running on http://localhost:${PORT}`); 
});
