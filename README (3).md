# RAG-Based Document Q&A System

A Retrieval-Augmented Generation (RAG) system that lets you ask questions about your PDF documents and get answers grounded in the actual document content.

## Features

- **PDF loading and chunking:** Loads PDFs and splits them into chunks for processing
- **Embeddings and vector storage:** Generates embeddings and stores them in Pinecone for semantic search
- **Similarity retrieval:** Finds the most relevant chunks for each question
- **Grounded answers:** Gemini generates responses using only the retrieved document context
- **Query rewriting:** Rewrites follow-up questions into standalone queries to improve retrieval
- **Function calling:** Explores tool/function calling for AI agent workflows

## Tech Stack

- Node.js / JavaScript
- Google Gemini API (LLM and embeddings)
- LangChain
- Pinecone (vector database)

## How It Works

```
PDF → Chunking → Embeddings → Pinecone
                                  ↓
Question → Query Rewriting → Similarity Search → Relevant Chunks → Gemini → Answer
```

1. **Ingest:** Load the PDF, split it into chunks, embed each chunk, and store the vectors in Pinecone.
2. **Query:** Rewrite the user's question (using chat history for follow-ups), embed it, and retrieve the top matching chunks.
3. **Answer:** Pass the retrieved context and the question to Gemini to generate a grounded response.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A [Gemini API key](https://aistudio.google.com/app/apikey)
- A [Pinecone](https://www.pinecone.io/) account and index

### Installation

```bash
git clone https://github.com/shubham2467/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name
```

### Usage

1. Place your PDF in the project folder and update the file path in the ingest script.
2. Index the document:

   ```bash
   node index.js
   ```

3. Start asking questions:

   ```bash
   node query.js
   ```

> Adjust the file names above (`index.js`, `query.js`) to match your project.

## Project Structure

```
├── index.js        # Loads PDF, chunks, embeds, stores in Pinecone
├── query.js        # Query rewriting, retrieval, and answer generation
├── package.json
├── .env            # API keys (not committed)
└── README.md
```

## Author

**Shubham Kumar**
[GitHub](https://github.com/shubham2467) · [LinkedIn](https://linkedin.com/in/shubham-kumar)
