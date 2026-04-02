# Mars AI Workspace

A full-stack architecture for Mars AI, seamlessly integrating a modern Next.js frontend, secure Next.js backend, and a flexible FastAPI microservice for heavy AI natural language processing and inference workloads.

## Project Structure (Monorepo setup)

- **/mars**: The Next.js 14+ application handling front-end chat interface, responsive styling, and basic Next API routes to proxy/gateway to the AI microservice.
- **/ai**: The FastAPI Python application dealing with intensive language models logic, OpenAI/Anthropic/Local LLM integration, and unstructured data ingestion.

### Folder Walkthrough

#### 1. `mars/` (Next.js Application)
- **`app/chat/page.tsx`**: Chat Dashboard UI, styled with TailwindCSS (darkmode themed). Responsive on all devices.
- **`app/api/chat/route.ts`**: Expressive serverless Next.js endpoint. Functions as a gateway layer pointing toward the internal FastAPI service.
- **`lib/mongodb.ts` & `models/Message.ts`**: Centralized MongoDB connection logic relying on `mongoose`. Used for saving users, sessions, and long-term user chats natively into the primary datastore.

#### 2. `ai/` (FastAPI Microservice)
- **`main.py`**: The entrypoint to the service. Manages the lifecycle and registers routes.
- **`routes/chat.py`**: Defining endpoints (like `/api/v1/generate`) which accept generation events.
- **`services/llm.py`**: Abstraction around interacting with AI Providers natively (such as the asynchronous OpenAI v1 Python SDK client).
- **`core/database.py`**: Async MongoDB integration driver (`motor`) utilized for storing system conversation logs silently in the background for auditing.
- **`requirements.txt`**: Strict lock of microservice dependencies.

## Get Started

### Prerequisites
1. **Node.js**: (v18+) For Next.js in `mars/`.
2. **Python**: (3.9+) For FastAPI in `ai/`.
3. **MongoDB Database**: Start a local instance on `mongodb://localhost:27017` or use MongoDB Atlas.

### Running the Next.js Client
1. Navigate into the UI directory: `cd mars`
2. Install dependencies: `npm install`
3. Prepare environment variables: Look at `.env.local`
4. Start the development server: `npm run dev`

### Running the FastAPI Backend
1. Navigate into the AI directory: `cd ai`
2. Construct virtual environment: `python -m venv venv` and activate it (e.g. `.\venv\Scripts\activate` on Windows)
3. Install reqs: `pip install -r requirements.txt`
4. Provision `.env` with `OPENAI_API_KEY`
5. Boot uvicorn: `uvicorn main:app --reload`
