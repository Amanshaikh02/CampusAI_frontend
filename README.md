# Campus AI

A full-stack intelligent campus management platform with dedicated portals for Students, Faculty, and Administrators.

---

## 📁 Project Structure

```text
campus-ai/
├── backend/            # Express, Node.js & MongoDB backend API
│   ├── config/         # Database and server configuration
│   ├── controllers/    # API controllers
│   ├── middleware/     # Auth, session, and validation middleware
│   ├── models/         # Mongoose schema models
│   ├── routes/         # Express API route declarations
│   ├── scripts/        # Utility & migration scripts
│   ├── utils/          # Academic and date helper utilities
│   ├── .env            # Backend environment variables
│   ├── package.json    # Backend dependencies and scripts
│   └── server.js       # Main API entry point
├── frontend/           # React frontend application
│   ├── public/         # Static assets and index.html
│   ├── src/            # React source code (components, pages, context, services)
│   ├── build/          # Production build output
│   ├── package.json    # Frontend dependencies and scripts
│   ├── postcss.config.js
│   └── tailwind.config.js
├── .gitignore          # Unified workspace .gitignore
└── README.md           # Project documentation
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend server runs at `http://localhost:5000` by default.

### 2. Frontend Setup

In a separate terminal:

```bash
cd frontend
npm install
npm start
```

The frontend client runs at `http://localhost:3000` by default.

---

## ⚙️ Available Scripts

### In `backend/`:
- `npm start` – Runs the backend server using Node.js.
- `npm run dev` – Runs the backend server with Nodemon (live reload).

### In `frontend/`:
- `npm start` – Starts the React development server.
- `npm run build` – Bundles the application for production to `frontend/build`.
- `npm test` – Runs test suites via React Scripts.
- `npm run dev` – Runs both frontend and backend concurrently.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
- `PORT` – Backend server port (default: `5000`)
- `MONGO_URI` – MongoDB Atlas connection string
- `JWT_SECRET` – JWT authentication secret key
- `JWT_REFRESH_SECRET` – Refresh token secret key
- `CLIENT_URL` – Allowed CORS origin (`http://localhost:3000`)
