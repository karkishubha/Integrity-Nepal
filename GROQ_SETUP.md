# Setting up Groq API for Query Answering

The dashboard now supports Groq API for natural language query interpretation. This enables the system to understand your governance questions and answer them based on the complaint dataset.

## Steps to activate Groq:

### 1. Get a Groq API Key
- Visit [console.groq.com](https://console.groq.com)
- Sign up for a free account
- Generate an API key from the dashboard

### 2. Set the environment variable

**Windows PowerShell (in the backend folder):**
```powershell
$env:GROQ_API_KEY = "your-groq-api-key-here"
```

**Or create a `.env` file in the backend folder:**
```
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=mixtral-8x7b-32768
```

### 3. Restart the backend server
```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## How it works:

- When you ask a question like **"Which region has the highest bribery cases?"**, Groq interprets it and extracts:
  - The corruption type (Bribery)
  - Which aggregation to run (count by region)
  - Which region should be highlighted

- The dashboard then:
  - Highlights the top region on the Nepal map
  - Shows all relevant cases in the cases panel
  - Displays a summary with the answer

## Fallback behavior:

If Groq is not configured, the system falls back to pattern-matching heuristics that work offline but are less intelligent.

## Models available:

Groq has fast, free models:
- `mixtral-8x7b-32768` (default, recommended)
- `llama2-70b-4096`
- `gemma-7b-it`

All are free with Groq's API.
