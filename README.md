# Interview Mocker (InterviewAce)

An AI-powered coding interview platform designed to help users practice and prepare for technical interviews. The platform provides a full-fledged coding environment, integrated with AI (Google Gemini & Groq) to evaluate code, give feedback, and simulate real interview scenarios.

## 🚀 Features
- **Interactive Code Editor:** Write and execute code directly in the browser using the Monaco Editor.
- **AI-Powered Feedback:** Receive detailed feedback, hints, and code analysis using Google Generative AI (Gemini) and Groq.
- **User Authentication:** Secure user signup, login, and JWT-based authentication.
- **Code Metrics & Analysis:** Get insights into your code complexity using Radon.
- **Progress Tracking:** Visualize your interview performance and progress with interactive charts (Recharts).
- **Company Wise Questions:** Practice questions specific to top tech companies.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Routing:** React Router DOM
- **Code Editor:** `@monaco-editor/react`
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Notifications:** React Hot Toast

### Backend
- **Framework:** FastAPI
- **Server:** Uvicorn
- **Database:** SQLite with SQLAlchemy (ORM)
- **Data Validation:** Pydantic
- **Authentication:** JWT (python-jose) & bcrypt (passlib)
- **AI Integrations:** `google-generativeai` (Gemini) & `groq`
- **Code Analysis:** `radon`

## 📂 Project Structure

```text
Interview Mocker/
├── backend/                  # FastAPI backend
│   ├── app/                  # Application code (routes, models, schemas, services)
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Environment variables template
│   └── main.py               # Entry point for FastAPI
├── frontend/                 # React frontend
│   ├── src/                  # React components, pages, and assets
│   ├── package.json          # Node.js dependencies
│   └── vite.config.js        # Vite configuration
└── README.md                 # Project documentation
```

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js & npm (or yarn)

### 1. Clone the repository
```bash
git clone <repository-url>
cd "Interview Mocker"
```

### 2. Backend Setup
```bash
cd backend

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database URI, JWT secret, and API keys (Gemini, Groq)

# Run the FastAPI server
uvicorn main:app --reload
```
The backend server will run at `http://localhost:8000`. API documentation is available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
The frontend application will be accessible at `http://localhost:5173`.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📝 License
This project is licensed under the MIT License.
