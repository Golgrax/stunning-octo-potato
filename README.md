# Lumina Café ☕

A modern, full-stack café application featuring a React frontend, Express backend, real-time updates via Socket.IO, and AI-powered recommendations using Gemini.

## 🚀 Quick Start

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Up Environment:**
    - Open the `.env` file in the root directory.
    - Replace `YOUR_API_KEY` with your actual [Google Gemini API Key](https://aistudio.google.com/app/apikey).
    ```env
    API_KEY=your_actual_api_key_here
    ```

3.  **Initialize Database:**
    ```bash
    npm run init-db
    ```

4.  **Start the App:**
    ```bash
    npm start
    ```
    This runs both the backend (port 3001) and frontend (port 5173) concurrently.

    - **Frontend:** http://localhost:5173
    - **Backend:** http://localhost:3001

---

## 🔑 Built-in Accounts

Use these credentials to log in to the **Admin Portal**:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@lumina.cafe` | `admin123` | Full Dashboard Access |
| **Employee** | `employee@lumina.cafe` | `employee123` | Full Dashboard Access |
| **Customer** | `alice@lumina.cafe` | `customer123` | *Denied Admin Access* |

---

## 🛠️ Troubleshooting

### 1. AI Recommendation Error (400)
If you see `API key not valid` in the console:
- Ensure you have pasted your valid API Key into the `.env` file.
- The file line should look like: `API_KEY=AIzaSy...` (no quotes needed).
- Restart the server (`Ctrl+C` then `npm start`) after changing the `.env` file.

### 2. "Network Error" or White Screen
- Ensure you are using `npm start` which runs both servers.
- If running in a cloud environment (like GitHub Codespaces), ensure the proxy is working (already configured in `vite.config.ts`).

### 3. Database Issues
- If data seems missing or corrupted, reset the database:
    ```bash
    npm run reset-db
    ```

## 🏗️ Architecture

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express, Better-SQLite3
- **Real-time:** Socket.IO (WebSockets)
- **AI:** Google Gemini (via `@google/genai` SDK)

---
*Generated for Gemini API Demo*
