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
├── backend/
├── frontend/
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js & npm (or yarn)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!
