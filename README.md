# Student Portal & Administrative AI Dashboard

This project is a modern, responsive, and full-stack web application designed for academic management and student service tracking. It features an AI-Augmented Admin Dashboard and a Student Self-Service Portal. It uses **React (TypeScript) with Vite** on the frontend and an **Express (TypeScript)** backend proxy to run secure AI workflows via Gemini.

---

## 🛠️ Tech Stack & Key Integrations

- **Frontend Framework**: React 18+ with TypeScript & Vite
- **Styling**: Tailwind CSS
- **Animations**: Motion (framer-motion)
- **Database & Auth**: Google Firebase (Firestore for Cloud state & Firebase Auth for identity)
- **Backend Service**: Express Server (`server.ts`)
- **AI Integration**: Google `@google/genai` TypeScript SDK (powered by Gemini)

---

## 🚀 Step-by-Step Local Setup (VS Code)

To run this project locally on your machine, follow these steps:

### 1. Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (Version 18.x or 20.x is recommended)
- [Visual Studio Code (VS Code)](https://code.visualstudio.com/)

---

### 2. Exporting and Opening the Project
1. In the Google AI Studio interface, go to the top-right settings/export menu and click **Export as ZIP** (or export directly to your GitHub).
2. Extract the downloaded ZIP file to a folder on your computer.
3. Open **VS Code**, go to `File -> Open Folder...` (or `Open...` on macOS), and select the extracted folder.
4. Open an integrated terminal in VS Code (`Ctrl + ~` or `Cmd + ~`).

---

### 3. Install Dependencies
Run the following command in the VS Code terminal to install all required dependencies (frontend, backend, UI components):
```bash
npm install
```

---

### 4. Setup Environment Variables
Create a file named `.env` in the root directory (same level as `package.json`). Populate it with your variables:

```env
# Google Gemini API Key - Create one for free at https://aistudio.google.com/
GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"

# Optional: Host address for production reference
APP_URL="http://localhost:3000"
```

> **Note**: Firebase configuration is automatically integrated! The project already contains the fully configured `firebase-applet-config.json` at the root, which the frontend code uses directly. As long as you have internet connectivity, your local application will securely communicate with your cloud-hosted Firebase instances automatically.

---

### 5. Running the Application locally

#### Development Mode (Fast refresh + Express Server)
To run the full stack (Frontend + Backend APIs simultaneously) in development mode, run:
```bash
npm run dev
```
Once started, open your browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

#### Production Mode (Build and Run)
To compile the application into production-optimized assets and run the standalone server:
```bash
# Build frontend files and compile backend TypeScript server to a bundle
npm run build

# Start the compiled server
npm start
```

---

## 📂 Project Architecture

```
├── server.ts                    # Full-Stack Express server entrypoint (Vite middleware in Dev)
├── firebase-applet-config.json  # Pre-configured client Firebase keys
├── firestore.rules              # Security rules for Firestore collections
├── package.json                 # Scripts and package dependencies
├── src/
│   ├── main.tsx                 # Client entry point
│   ├── App.tsx                  # Client Routing & Navigation guards
│   ├── lib/
│   │   └── firebase.ts          # Firebase Initialization & Client handlers
│   ├── components/
│   │   ├── AIChatbox.tsx        # Interactive AI Assistant Drawer component
│   │   └── layout/
│   │       └── DashboardLayout.tsx  # Shared sidebar navigation & session status header
│   └── pages/
│       ├── LandingPage.tsx      # Public introduction page
│       ├── LoginPage.tsx        # Login & Registration terminal (with Safe-Mode / Admin credentials bypass)
│       ├── DashboardOverview.tsx # Real-time academic metrics & charts
│       ├── Attendance.tsx       # AI Attendance Scanning, analytics, and registers
│       ├── MarksEntry.tsx       # Grading panel with OCR/AI-assisted grade parsing
│       ├── Performance.tsx      # Student performance analysis, trends, and reports
│       ├── StudentsPage.tsx     # Student database management (CRUDS)
│       └── StudentPortal.tsx    # Dedicated Portal for Student view (Grades, Att, and Requests)
```

---

## 🔑 Key Features & Credentials

### Academic Portal Roles
1. **Admin / Faculty Role**:
   - Allows access to Attendance Tracking, Performance metrics, Student Database, and Marks Terminal.
   - **Bypass Login Mode**: If you want to bypass standard Firebase authentication, use any valid email address format alongside the password `BhuvanGowda15`. It logs you directly into the Admin dashboard and handles local state seamlessly.
2. **Student Role**:
   - Accessible by registering standard student emails or logging in through the main login portal.
   - Features grade card visualizers, attendance analytics, document requests, and student history tracking.

---

## 🛠️ Customizing the Database / rules
If you wish to configure your own independent Firebase database instead of the default pre-provisioned one:
1. Create a project at the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** and **Authentication** (Email/Password provider).
3. Copy your project configuration object and replace the content of `firebase-applet-config.json`.
4. Deploy the database rules in `firestore.rules` using the Firebase CLI or copy them directly to the Firebase Console Rules tab.
