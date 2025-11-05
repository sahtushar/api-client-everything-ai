# API Client - Everything AI Backend

A secure, production-ready Node.js + Express API service that handles OpenAI calls for job description parsing, resume preprocessing, analysis, and tailoring. This backend ensures your OpenAI API key is never exposed to the browser.

## 🚀 Features

- **Secure API Key Management**: OpenAI API key is stored server-side and never exposed to clients
- **TypeScript**: Full type safety with TypeScript and ES modules
- **Modular Architecture**: Scalable folder structure supporting future features
- **Error Handling**: Centralized error handling with retry logic for OpenAI API calls
- **Request Validation**: Input validation to prevent abuse
- **CORS Support**: Configurable CORS for Chrome extension and web clients
- **Retry Logic**: Automatic retry on 429/500 errors from OpenAI API

## 📁 Project Structure

```
server/
├── src/
│   ├── app.ts                    # Main Express application
│   ├── routes/                   # API route definitions
│   │   ├── analyze.routes.ts
│   │   ├── jd.routes.ts
│   │   └── resume.routes.ts
│   ├── controllers/              # Request handlers
│   │   ├── analyze.controller.ts
│   │   ├── jd.controller.ts
│   │   └── resume.controller.ts
│   ├── services/                 # Business logic
│   │   └── openai.service.ts     # OpenAI API integration
│   ├── utils/                    # Utility functions
│   │   ├── sanitizeText.ts
│   │   └── simpleHash.ts
│   ├── middlewares/              # Express middlewares
│   │   ├── errorHandler.ts
│   │   └── validateRequest.ts
│   └── types/                    # TypeScript type definitions
│       └── index.ts
├── .env                          # Environment variables (create from .env.example)
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository** (or navigate to the project directory)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=5000
   CORS_ORIGINS=*
   ```

   For Chrome extension only:
   ```env
   CORS_ORIGINS=chrome-extension://*
   ```

   For multiple origins:
   ```env
   CORS_ORIGINS=chrome-extension://abcdefghijklmnopqrstuvwxyz123456,http://localhost:3000
   ```

5. **Build the project**:
   ```bash
   npm run build
   ```

6. **Start the server**:
   ```bash
   npm start
   ```

   Or for development with hot reload:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

## 📡 API Endpoints

### Health Check

```http
GET /health
```

Returns server status and uptime.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### Preprocess Job Description

```http
POST /api/preprocess/jd
Content-Type: application/json

{
  "jd": "Full job description text"
}
```

**Response:**
```json
{
  "structuredJD": {
    "title": "Software Engineer",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "experience": "3-5 years",
    "skills": ["JavaScript", "TypeScript", "React"],
    "responsibilities": ["Develop web applications", "..."],
    "requirements": ["Bachelor's degree", "..."],
    "qualifications": ["Strong problem-solving skills", "..."],
    "summary": "Brief summary of the role"
  }
}
```

### Preprocess Resume

```http
POST /api/preprocess/resume
Content-Type: application/json

{
  "resumeText": "Resume text"
}
```

**Response:**
```json
{
  "structuredResume": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-234-567-8900",
    "location": "San Francisco, CA",
    "summary": "Experienced software engineer...",
    "skills": ["JavaScript", "TypeScript", "React"],
    "experience": [
      {
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "duration": "2020-2023",
        "description": ["Developed web applications", "..."]
      }
    ],
    "education": [
      {
        "degree": "BS Computer Science",
        "institution": "University Name",
        "year": "2020"
      }
    ],
    "certifications": ["AWS Certified Developer", "..."]
  }
}
```

### Analyze Job Description and Resume

```http
POST /api/analyze
Content-Type: application/json

{
  "jd": "Full job description text",
  "resume": "Full resume text"
}
```

**Response:**
```json
{
  "matchScore": 85,
  "matchedSkills": ["JavaScript", "TypeScript", "React"],
  "missingSkills": ["AWS", "Docker"],
  "suggestions": [
    "Highlight your experience with cloud platforms",
    "Add more details about your backend experience"
  ],
  "sampleBullets": [
    "Developed scalable web applications using React and TypeScript",
    "Implemented CI/CD pipelines reducing deployment time by 50%"
  ],
  "summary": "Strong match with 85% compatibility. Key strengths include...",
  "structuredJD": { ... },
  "tailoredResume": { ... }
}
```

## 🔒 Security

- **API Key Protection**: OpenAI API key is stored in environment variables and never exposed in API responses
- **Input Validation**: All requests are validated for length and format
- **CORS Configuration**: Restrict CORS to specific origins in production
- **Error Handling**: Sensitive error details are only shown in development mode

## 🧪 Development

### Type Checking

```bash
npm run type-check
```

### Project Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run type-check` - Run TypeScript type checking without building

## 🚢 Deployment

### Render

1. Create a new Web Service on Render
2. Connect your Git repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables:
   - `OPENAI_API_KEY`
   - `PORT` (optional, defaults to 5000)
   - `CORS_ORIGINS` (your Chrome extension ID or allowed origins)

### Railway

1. Create a new project on Railway
2. Connect your Git repository
3. Railway will auto-detect Node.js and build
4. Add environment variables in the Railway dashboard
5. Deploy

### Vercel (Serverless)

1. Install Vercel CLI: `npm i -g vercel`
2. Create `vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/app.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "dist/app.js"
       }
     ]
   }
   ```
3. Deploy: `vercel --prod`
4. Add environment variables in Vercel dashboard

### Heroku

1. Create a `Procfile`:
   ```
   web: node dist/app.js
   ```
2. Deploy:
   ```bash
   heroku create your-app-name
   heroku config:set OPENAI_API_KEY=your_key
   git push heroku main
   ```

## 📝 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes | - |
| `PORT` | Server port | No | 5000 |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | No | `*` (all) |
| `NODE_ENV` | Environment (development/production) | No | `development` |

## 🔮 Future Enhancements

The project structure is designed to support:

- **Authentication**: JWT or API key authentication
- **Rate Limiting**: Using `express-rate-limit`
- **Logging**: Winston or Pino for structured logging
- **File Upload**: PDF resume parsing
- **Caching**: Redis for caching OpenAI responses
- **Database**: Store analysis history

## 🐛 Troubleshooting

### OpenAI API Errors

- **401 Unauthorized**: Check that `OPENAI_API_KEY` is set correctly
- **429 Too Many Requests**: The service automatically retries up to 3 times
- **500 Internal Server Error**: Check OpenAI API status

### CORS Issues

- Ensure `CORS_ORIGINS` includes your Chrome extension ID or origin
- For Chrome extensions, the origin format is `chrome-extension://<extension-id>`

### Port Already in Use

Change the `PORT` in `.env` or kill the process using the port:
```bash
lsof -ti:5000 | xargs kill
```

## 📄 License

MIT

---

✅ **This backend is ready to be deployed on Render, Railway, or Vercel Serverless functions. Update your Chrome Extension to call `POST https://your-backend-domain.com/api/analyze` instead of directly using the OpenAI API.**
