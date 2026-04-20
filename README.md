# long-web

React front-end for the `long` project.

## Features
- React 19 + TypeScript
- Vite
- Dockerized (Nginx)
- GitHub Actions CI/CD to same server as `long`

## Setup
1. Clone the repository.
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## Deployment
Automatic deployment via GitHub Actions on push to `main` branch.
Requires following secrets in GitHub repository:
- `HOST`: Server IP/hostname
- `USERNAME`: SSH username
- `SSH_KEY`: SSH private key
- `GITHUB_TOKEN`: Automatically provided by GitHub

The container runs on port 9000 by default (similar to `long`).
If both are on same server, you might need to change the port of one of them or use a reverse proxy.
Currently both are set to port 9000.
