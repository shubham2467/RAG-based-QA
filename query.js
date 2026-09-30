import * as dotenv from 'dotenv';
dotenv.config();

import readlineSync from 'readline-sync';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from "@google/genai";


const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


const History = [];


// --------------------------------------------------
// QUERY REWRITING
// --------------------------------------------------

async function transformQuery(question) {

    History.push({
        role: 'user',
        parts: [{ text: question }]
    });


    const response = await ai.models.generateContent({

        model:"gemini-3.5-flash-lite",

        contents: History,

        config: {

            systemInstruction: `
You are a query rewriting expert.

Based on the provided chat history, rephrase the
Follow Up user Question into a complete,
standalone question that can be understood
without the chat history.

Only output the rewritten question and nothing else.
`
        }
    });


    History.pop();


    return response.text;
}



// --------------------------------------------------
// CHAT
// --------------------------------------------------

async function chatting(question) {


    // Step 1: Rewrite question

    const queries = await transformQuery(question);

    console.log("\nSearching for:", queries);



    // Step 2: Convert question into embedding

    const embeddingResponse = await ai.models.embedContent({

        model: "gemini-embedding-2",

        contents: queries

    });


    const queryVector =
        embeddingResponse.embeddings[0].values;



    // Step 3: Connect Pinecone

    const pinecone = new Pinecone({

        apiKey: process.env.PINECONE_API_KEY

    });


    const pineconeIndex = pinecone.Index(
        process.env.PINECONE_INDEX_NAME
    );



    // Step 4: Search Pinecone

    const searchResults =
        await pineconeIndex.query({

            topK: 10,

            vector: queryVector,

            includeMetadata: true

        });



    // Step 5: Get context

    const context = searchResults.matches

        .map(match => match.metadata.text)

        .join("\n\n---\n\n");



    // Step 6: Add question to history

    History.push({

        role: 'user',

        parts: [{ text: queries }]

    });



    // Step 7: Ask Gemini

    const response = await ai.models.generateContent({

        model: "gemini-3.5-flash",

        contents: History,

        config: {

            systemInstruction: `
You have to behave like a Data Structure
and Algorithm Expert.

You will be given a context of relevant
information and a user question.

Your task is to answer the user's question
based ONLY on the provided context.

If the answer is not in the context,
you must say:

"I could not find the answer in the provided document."

Keep your answers clear, concise,
and educational.

Context:

${context}
`
        }

    });



    // Step 8: Store answer in history

    History.push({

        role: 'model',

        parts: [{ text: response.text }]

    });



    // Step 9: Show answer

    console.log("\n");
    console.log(response.text);

}



// --------------------------------------------------
// MAIN
// --------------------------------------------------

async function main() {

    const userProblem =
        readlineSync.question("Ask me anything--> ");


    await chatting(userProblem);


    main();

}


main();