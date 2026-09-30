import * as dotenv from "dotenv";
dotenv.config();

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Pinecone } from "@pinecone-database/pinecone";


// Pinecone
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

const pineconeIndex = pinecone.Index(
    process.env.PINECONE_INDEX_NAME
);


// Load PDF
const loader = new PDFLoader("./document.pdf");

const docs = await loader.load();

console.log("PDF pages:", docs.length);


// Chunk PDF
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 10
});

const chunkedDocs = await splitter.splitDocuments(docs);

console.log("Total chunks:", chunkedDocs.length);


// Gemini batch embedding
async function createEmbeddings(texts) {

    const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": process.env.GEMINI_API_KEY
            },

            body: JSON.stringify({
                requests: texts.map(text => ({
                    model: "models/gemini-embedding-2",

                    content: {
                        parts: [
                            {
                                text: text
                            }
                        ]
                    }
                }))
            })
        }
    );


    if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
    }


    return await response.json();
}


// Process chunks
const BATCH_SIZE = 50;

for (
    let start = 0;
    start < chunkedDocs.length;
    start += BATCH_SIZE
) {

    const batch = chunkedDocs.slice(
        start,
        start + BATCH_SIZE
    );


    console.log(
        `Embedding ${start + 1} - ${start + batch.length} of ${chunkedDocs.length}`
    );


    const result = await createEmbeddings(
        batch.map(doc => doc.pageContent)
    );


    const records = batch.map((doc, index) => ({
        id: `chunk-${start + index}`,

        values: result.embeddings[index].values,

        metadata: {
            text: doc.pageContent
        }
    }));


    await pineconeIndex.upsert({
        records: records
    });


    console.log("Stored in Pinecone");


    // Small pause between batches
    if (start + BATCH_SIZE < chunkedDocs.length) {
        console.log("Waiting before next batch...");
        await new Promise(resolve => setTimeout(resolve, 35000));
    }
}


console.log("\nIndexing completed successfully!");