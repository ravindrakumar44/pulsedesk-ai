# PulseDesk AI — Sentiment Analysis of Incoming Calls on Helpdesk

A full-stack Helpdesk Customer Sentiment Analysis System built with **React.js + Vite + Tailwind CSS**, **ASP.NET Core 8 Web API**, **Entity Framework Core**, **MySQL**, and the **Browser Web Speech API**.

Customers can log in and submit complaints either by speaking into their microphone (transcribed in real time using `SpeechRecognition` / `webkitSpeechRecognition` in `en-IN` or `hi-IN`) or by typing manually. The ASP.NET Core backend evaluates every complaint using a modular, explainable NLP sentiment and emotion analyzer, stores the results in MySQL, and powers an interactive Administrator Command Center.

---

## Key Features

### Customer Portal
- **Authentication**: Customer registration, JWT login/logout, and profile view.
- **Voice Input (Web Speech API)**:
  - Interactive microphone button with recording/listening indicator and stop control.
  - Real-time interim speech transcription in **English (`en-IN`)** and **Hindi (`hi-IN`)**.
  - Editable transcript box — complaints are **never** auto-submitted without user confirmation.
  - Graceful fallback and clear messaging for unsupported browsers or denied microphone permissions.
- **Text Input**: Manual complaint submission with category selection (`Internet / Network Issues`, `Payment Issues`, `Product Issues`, `Technical Support`, `Account Issues`, `Other`).
- **Ticket Tracking**: Submission confirmation with immediate sentiment feedback, complaint history list, and status tracking (`Pending`, `In Progress`, `Resolved`, `Closed`).

### Support Agent Portal
- **Automatic Least-Loaded Routing**: Newly submitted customer complaints are automatically routed to the registered Agent with the fewest active (`Pending` / `In Progress`) complaints (with tie-breaking by total assigned count and ID).
- **Agent Overview**: Real-time KPIs (`Total Assigned`, `Pending`, `In Progress`, `Resolved`, `High-Priority`), status & sentiment charts, and high-priority ticket highlights.
- **Available Unassigned Queue**: Claim any unassigned complaints with atomic backend concurrency protection to prevent double-claiming.
- **My Assigned Complaints**: Filterable by status (`Pending`, `In Progress`, `Resolved`, `Closed`), priority (`High`, `Medium`, `Low`), sentiment, category, and search.
- **Resolution Workflow**: Review full complaint description, voice transcript, sentiment score, emotion, and NLP reasoning; move tickets from `Pending` to `In Progress`; enter a mandatory resolution message and mark `Resolved`.
- **Agent Profile**: Account details plus assigned and resolved ticket metrics.

### Administrator Dashboard
- **Real-Time KPIs**: Total Customers, Total Complaints, Positive / Negative / Neutral counts, and Average Sentiment Score computed directly from MySQL.
- **Interactive Charts (Recharts)**:
  - Pie chart: Sentiment distribution.
  - Stacked bar chart: Complaints by category & sentiment.
  - Line chart: Sentiment trends over time.
  - Emotion distribution & Voice-vs-Text adoption charts on the Analytics page.
- **Read-Only Oversight**:
  - Highlighted queue of open negative complaints requiring attention.
  - Filter complaints by sentiment, category, date range, or search by customer name / ticket ID.
  - Inspect full customer transcript, detected emotion, heuristic score, explanation, assigned agent, and resolution summary (status updates are handled exclusively by Agents).

### Explainable NLP Sentiment Service (`SentimentAnalysisService`)
- Implemented behind `ISentimentAnalysisService` for easy future swapping with an ML.NET or transformer model.
- Supports English and Hindi/Hinglish vocabulary with negation handling (`not happy`, `not working`), intensifiers (`very`, `extremely`), mitigators (`slightly`), contrast clauses (`but`, `however`), and emphasis cues.
- Classifies **Sentiment** (`Positive`, `Negative`, `Neutral`) and **Emotion** (`Happy`, `Satisfied`, `Angry`, `Frustrated`, `Disappointed`, `Neutral`).
- Computes a bounded heuristic score in `[-1.0, +1.0]` with a human-readable `Explanation` and keeps `ConfidenceScore` as `null` (`IsCalibratedProbability = false`) to explicitly distinguish heuristic scores from calibrated model probabilities.

---

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router DOM, Recharts, Lucide React, Axios, Web Speech API
- **Backend**: C#, ASP.NET Core 8 Web API, Entity Framework Core 8, JWT Bearer Authentication, BCrypt.Net-Next, Swagger/OpenAPI
- **Database**: MySQL 8.0 (`Pomelo.EntityFrameworkCore.MySql`)
- **Testing**: xUnit, EF Core InMemory (`Backend.Tests`)

---

## Project Structure

```text
INT402 Project/
├── HelpdeskSentiment.sln
├── Backend/
│   ├── Controllers/
│   │   ├── AdminController.cs
│   │   ├── AuthController.cs
│   │   ├── ComplaintsController.cs
│   │   └── SentimentController.cs
│   ├── Data/
│   │   ├── ApplicationDbContext.cs
│   │   └── DbInitializer.cs
│   ├── DTOs/
│   ├── Interfaces/
│   ├── Middleware/
│   ├── Migrations/
│   ├── Models/
│   ├── Services/
│   │   ├── AuthService.cs
│   │   ├── ComplaintService.cs
│   │   └── SentimentAnalysisService.cs
│   ├── Program.cs
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   └── .env.example
├── Backend.Tests/
│   ├── ComplaintServiceTests.cs
│   └── SentimentAnalysisServiceTests.cs
└── Frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── layouts/
    │   ├── pages/
    │   ├── services/
    │   └── utils/
    ├── package.json
    └── vite.config.js
```

---

## Local Setup Instructions

### Prerequisites
- **.NET SDK 8.0+** (tested with .NET SDK 10.0.400 targeting `net8.0`)
- **Node.js 18+** & **npm**
- **MySQL Server 8.0** running locally on port `3306`

### 1. Configure Database & Secrets
Copy [Backend/.env.example](Backend/.env.example) to `Backend/.env` (which is gitignored) and set your local MySQL password and JWT secret:

```powershell
Copy-Item Backend\.env.example Backend\.env
```

Then update `ConnectionStrings__DefaultConnection` in `Backend/.env`:
```env
ConnectionStrings__DefaultConnection="Server=localhost;Port=3306;Database=helpdesk_sentiment_db;User=root;Password=YOUR_MYSQL_PASSWORD;"
```

*(Alternatively, for local-only testing you can set `ConnectionStrings:DefaultConnection` via `dotnet user-secrets` or environment variables—never commit real passwords to Git.)*

### 2. Apply EF Core Migrations & Seed Sample Data
When the backend starts in `Development` mode, `DbInitializer` automatically runs `Database.MigrateAsync()` to create `helpdesk_sentiment_db` and its tables (`Users`, `Complaints`, `SentimentAnalyses`), seeds the initial local Admin account, and populates realistic sample complaints analyzed by `SentimentAnalysisService`.

You can also apply migrations manually via CLI:
```powershell
cd Backend
dotnet ef database update
```

### 3. Run the Backend API
```powershell
cd Backend
dotnet run
```
The API listens on `http://localhost:5150` (Swagger UI at `http://localhost:5150/swagger`).

### 4. Run the Frontend App
In a new terminal:
```powershell
cd Frontend
npm install
npm run dev
```
Open `http://localhost:5173` in **Google Chrome** or **Microsoft Edge** (recommended for full Web Speech API voice recognition).

### 5. Run Backend Tests
```powershell
dotnet test HelpdeskSentiment.sln
```

---

## Local Development Demo Accounts

When running in `Development` mode, the following accounts are seeded automatically (or use the quick-fill buttons on the Login screen):

- **Admin Account**:
  - Email: `admin@pulsedesk.local`
  - Password: `Admin@12345`
- **Support Agent Accounts**:
  - Email: `agent@pulsedesk.local` (or `agent2@pulsedesk.local`)
  - Password: `Agent@12345`
- **Sample Customer Accounts**:
  - Email: `aarav.sharma@example.com` (or `priya.nair@example.com`, `rohan.verma@example.com`, `sneha.patel@example.com`)
  - Password: `Customer@123`

> **Production Note**: In non-development environments, configure `ConnectionStrings__DefaultConnection`, `Jwt__Key`, `AdminSeed__Email`, and `AdminSeed__Password` via environment variables or secret stores, and keep `SeedData__EnableSampleData=false`.

---

## Testing APIs with Postman

Base URL: `http://localhost:5150/api`

1. **Register a Customer** — `POST /api/auth/register`
   ```json
   {
     "fullName": "Test User",
     "email": "testuser@example.com",
     "password": "Password123!",
     "phoneNumber": "+91-9876500000"
   }
   ```
2. **Login** — `POST /api/auth/login`
   ```json
   {
     "email": "aarav.sharma@example.com",
     "password": "Customer@123"
   }
   ```
   Copy the returned `token` and set `Authorization: Bearer <token>` on subsequent requests.
3. **Preview Sentiment Analysis** — `POST /api/sentiment/analyze`
   ```json
   {
     "text": "My internet connection is completely broken and support never replied!"
   }
   ```
4. **Submit a Complaint (Customer Token)** — `POST /api/complaints`
   ```json
   {
     "complaintTitle": "Frequent broadband drops",
     "complaintDescription": "Internet drops every 15 minutes and I am very frustrated.",
     "complaintCategory": "Internet / Network Issues",
     "inputMethod": "Voice",
     "transcript": "Internet drops every 15 minutes and I am very frustrated."
   }
   ```
5. **View My Complaints (Customer Token)** — `GET /api/complaints/my`
6. **Support Agent Workflow (Agent Token)** — Login with `agent@pulsedesk.local` / `Agent@12345`:
   - `GET /api/agent/dashboard`
   - `GET /api/agent/available-complaints`
   - `POST /api/agent/complaints/1/claim`
   - `GET /api/agent/my-complaints?status=Pending`
   - `PUT /api/agent/complaints/1/status` with body `{ "status": "In Progress" }`
   - `POST /api/agent/complaints/1/resolve` with body `{ "resolutionMessage": "Issue resolved after line reset." }`
   - `GET /api/agent/profile`
7. **Admin Dashboard & Analytics (Admin Token, Read-Only Oversight)** — Login with `admin@pulsedesk.local` / `Admin@12345`:
   - `GET /api/admin/dashboard`
   - `GET /api/admin/complaints?sentiment=Negative`
   - `GET /api/admin/analytics`
   - `GET /api/admin/customers`
   - `POST /api/admin/agents` (provision a new Support Agent account)
