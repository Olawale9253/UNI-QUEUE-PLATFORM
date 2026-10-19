# UniQueue 🎓⚡
**Smarter Queues. A Smoother Campus Life.**

UniQueue is a modern, multi-tenant university queue management system designed to eliminate physical waiting lines. It allows students to join queues remotely, track their real-time position, manage clearance workflows, and receive notifications when it's their turn.

## 🚀 Features

- **Real-time Queue Tracking:** Students can join queues and watch their position update live without standing in a physical line.
- **Multi-Tenant Architecture:** Designed to support multiple universities on a single platform, each with its own branding, offices, and custom features.
- **Role-Based Access Control (RBAC):** Distinct portals for Students, Staff, Admins, and Super Admins.
- **Clearance Workflows:** Step-by-step digital clearance processes for students.
- **Appointment Scheduling:** Book and manage appointments for specific university services.
- **Push Notifications:** Get alerted the moment it's your turn or when your position updates.
- **Analytics & Reporting:** Admins can track wait times, active queues, and staff performance.
- **Document Management:** Securely upload and manage required student documents.

## 🛠️ Tech Stack

**Frontend:**
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Routing:** React Router DOM

**Backend:**
- **Language:** Java (Spring Boot)
- **Database:** PostgreSQL (Hosted on Neon)
- **Migrations:** Flyway
- **Authentication:** JWT (JSON Web Tokens) with Refresh token rotation
- **Deployment:** Render (Backend) & Vercel (Frontend)

## 📂 Project Structure

```text
uniqueue/
├── uniqueue-backend/          # Spring Boot Application
│   ├── src/main/java/         # Java Source Code
│   ├── src/main/resources/    # Application properties & Flyway migrations
│   │   └── db/migration/      # V1__init.sql, V2__add_users.sql, etc.
│   └── pom.xml
└── frontend/                  # React Application
    ├── src/
    │   ├── api/               # Axios configuration & interceptors
    │   ├── components/        # Reusable UI components (Layout, Cards, Forms)
    │   ├── hooks/             # Custom React hooks (useAdaptivePoll, etc.)
    │   ├── pages/             # Route components (Login, StudentDashboard, etc.)
    │   ├── store/             # Zustand state stores (authStore, prefsStore)
    │   └── main.jsx
    ├── tailwind.config.js
    └── package.json