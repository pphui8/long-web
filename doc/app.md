# Application Functionality

## Overview
The `long-web` project is a specialized LLM (Large Language Model) chat platform designed to mimic the interface and workflow of modern AI chat applications. It is tailored for specific domains, providing a focused environment for AI-driven interactions.

## Core Pages

### 1. Login Page
- **Purpose:** Secure entry point for the application.
- **Access Control:** The system uses a **predefined and fixed user set**. There is no public registration or "Sign Up" functionality, ensuring that access is restricted to authorized personnel.
- **Authentication:** Utilizes JWT (JSON Web Tokens) for session management, handled securely via the `AuthService`.

### 2. Chat Page
- **Purpose:** The primary interface for interacting with the LLM.
- **Functionality:** 
  - Provides a conversational UI for sending prompts and receiving AI responses.
  - Connects to backend APIs that interface with LLM providers (e.g., via `llm.pphui8.com`).
  - Maintains conversation context and history for the duration of the session.

## Key Features

### Domain-Specific Focus
Unlike general-purpose chat bots, this application is optimized for specific functions or domains, allowing for more relevant and specialized AI responses.

### LLM Integration
The frontend communicates with a backend API (configured to `llm.pphui8.com/api`) which serves as a proxy to powerful Large Language Models. This architecture abstracts the complexity of model management and provides a consistent interface for the web client.

### Secure Session Management
- **Automatic Token Refresh:** To support long-running chat sessions, the application proactively refreshes authentication tokens before they expire.
- **Centralized API Handling:** All communication with the LLM and authentication services is routed through a hardened Axios instance with automatic error handling and credential injection.

## User Workflow
1. **Authentication:** User logs in using their fixed, predefined credentials.
2. **Interaction:** User enters the Chat view and begins a dialogue with the AI.
3. **Session Maintenance:** The system handles background token management to keep the user authenticated during extended use.
4. **Conclusion:** User logs out, clearing their session and stopping any background processes.
