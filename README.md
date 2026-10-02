# HelpDesk Pro

A modern IT support ticketing system built with React, Vite, and Firebase. Public users can submit and track support tickets, while administrators sign in to a protected dashboard to manage, triage, and resolve them.

---

## Demo Admin Login

The admin login form is **pre-filled** with the demo credentials below, so you can simply open the app, go to the admin login page, and click **Sign In** — no typing required.

| Field    | Value                   |
| -------- | ----------------------- |
| Email    | `AdminMarlon@gmail.com` |
| Password | `Admin123`              |

> These credentials are provided for demonstration and review purposes only.

---

## Features

- **Submit a ticket** — any user can open a support request with a category, priority, and description.
- **Track my tickets** — users look up the tickets tied to their email address and follow their status.
- **Ticket details & notes** — view a ticket's full history and add notes to the conversation.
- **Admin dashboard** — a protected area for staff to view, filter, and update every ticket.
- **Status workflow** — tickets move through **Open → In Progress → Resolved**.
- **Secure admin auth** — admin routes are guarded by Firebase Authentication.

## Tech Stack

- **React 19** — UI library
- **Vite** — build tool and dev server with hot module replacement
- **React Router** — client-side routing
- **Firebase Authentication** — admin sign-in
- **Cloud Firestore** — ticket and notes storage
- **ESLint** — linting

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- A Firebase project with **Authentication** (Email/Password) and **Cloud Firestore** enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/MarlonHaynes/helpdesk-pro.git
cd helpdesk-pro

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root with your Firebase project settings:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> `.env` is git-ignored and should never be committed.

### Create the Admin User

In the **Firebase Console → Authentication → Users → Add user**, add an Email/Password user:

- **Email:** `AdminMarlon@gmail.com`
- **Password:** `Admin123`

This is the account the pre-filled login form signs in with.

### Running the App

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview

# Lint the codebase
npm run lint
```

The dev server runs at `http://localhost:5173` by default.

## Usage

1. Open the app and submit a ticket from the home page, or track existing tickets by email.
2. Go to the **Admin Login** page — the demo credentials are already filled in.
3. Click **Sign In** to reach the dashboard and manage tickets.

## Project Structure

```
helpdesk-pro/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI (layout, tickets)
│   ├── firebase/          # Firebase initialization
│   ├── pages/             # Route pages (Home, Submit, Admin, etc.)
│   ├── routes/            # Protected route wrapper
│   ├── services/          # Auth, ticket, and storage logic
│   ├── styles/            # Global and app styles
│   ├── utils/             # Constants and helpers
│   ├── App.jsx            # Route definitions
│   └── main.jsx           # App entry point
├── .env                    # Firebase config (not committed)
├── index.html
├── package.json
└── vite.config.js
```

## Author

**Marlon Haynes** — [Web Alchemist Labs](https://github.com/MarlonHaynes)
GitHub: [@MarlonHaynes](https://github.com/MarlonHaynes)
