# Task Manager (MERN Stack Edition)

This project has been fully migrated from Next.js and Prisma to a custom, decoupled MERN Stack (MongoDB, Express, React, Node.js) architecture.

## 🚀 Technology Stack
- **Frontend**: React (Vite) + Tailwind CSS + Axios + @hello-pangea/dnd (Drag and Drop) + Recharts & ChartJS (Analytics) + tsParticles (Interactive background design)
- **Backend**: Node.js + Express.js + Mongoose (MongoDB Atlas integration)
- **Authentication**: Custom HTTP-only cookies session storage with multi-tab Session-ID fallback
- **AI Integrations**: Groq API (using Llama-3.3-70b) for automatic task breakdowns and smart schedule optimizations
- **Notifications**: Email notifications via Gmail SMTP using Nodemailer for daily plans and task status updates

---

## 📂 Directory Structure
- `/backend`: Contains the Express.js server, Mongoose models, Express controllers, route handlers, and middleware.
- `/frontend`: Contains the React dashboard SPA utilizing Vite, Tailwind, and custom UI components.

---

## ⚙️ Configuration & Environment Variables

### Backend (`/backend/.env`)
Ensure you configure the `.env` file in the `backend/` directory with the following variables:
```env
DATABASE_URL=mongodb+srv://...
JWT_SECRET=your_super_secret_jwt_key
GROQ_API_KEY=gsk_...
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
PORT=5000
CLIENT_URL=http://localhost:5173
```

### Frontend (`/frontend/.env`)
The frontend uses a single variable to dynamically point to the backend server:
```env
VITE_API_URL=http://localhost:5000
```

---

## 🛠️ Installation and Setup

From the root directory, you can run the helper scripts:

1. **Install all dependencies** (Backend & Frontend):
   ```bash
   npm run install:all
   ```

2. **Run both servers in development mode** (concurrently):
   ```bash
   npm run dev
   ```

3. **Or run them individually**:
   - Backend: `npm run dev:backend`
   - Frontend: `npm run dev:frontend`
