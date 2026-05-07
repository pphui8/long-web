# Project Architecture

## Overview
`long-web` is a React-based web application designed to demonstrate and test JWT (JSON Web Token) authentication flows. It provides a dashboard for managing authentication states, performing login/logout operations, and accessing protected resources.

## Tech Stack
- **Frontend:** React 19 (TypeScript)
- **Build Tool:** Vite
- **HTTP Client:** Axios
- **Deployment:** Docker & Nginx

## Core Components

### 1. API Layer (`src/api.ts`)
The project uses a centralized Axios instance for all backend communication.
- **Base URL:** `/api`
- **Interceptors:**
  - **Request:** Automatically attaches the `Authorization: Bearer <token>` header if a token is available.
  - **Response:** Monitors for `401 Unauthorized` errors and clears the local session if the token is invalid or expired.
- **Token Management:** Implements a simple observer pattern to notify other parts of the application when the access token changes.

### 2. Authentication Service (`src/authService.ts`)
A dedicated service class that manages the authentication lifecycle.
- **Login/Logout:** Handles credential submission and session termination.
- **Proactive Refresh:** Automatically schedules a token refresh 90 seconds before the current token expires, using the `exp` claim from the JWT.
- **State Sync:** Ensures that auto-refresh logic stays in sync with the token state managed in the API layer.

### 3. User Interface (`src/App.tsx`)
The main application component provides an interactive dashboard:
- **Connectivity Testing:** A "Ping" utility to verify backend availability.
- **Authentication Controls:** Forms for login and buttons for manual token refresh or logout.
- **Protected Resources:** Logic to test access to authenticated-only endpoints.
- **Developer Tools:** Integrated log viewer and JWT decoder for real-time debugging of the auth flow.

## Data Flow
1. **Authentication:** User logs in -> `AuthService` performs request -> Token received and stored in `api.ts`.
2. **Synchronization:** `api.ts` notifies `App.tsx` (via subscription) to update the UI state.
3. **Automatic Maintenance:** `AuthService` parses the JWT and sets a timer to refresh the token before expiration.
4. **Authorized Requests:** The Axios instance automatically injects the token into all outgoing requests to `/api/*`.
5. **Session Expiry:** If the backend returns a `401`, the interceptor clears the token, triggering a UI update and stopping the refresh timer.

## Infrastructure & Deployment
- **Containerization:** A `Dockerfile` is provided to build a production image.
- **Web Server:** Uses Nginx to serve static assets and potentially proxy API requests.
- **CI/CD:** GitHub Actions workflow (`react.yml`) for automated build processes.
