# DataPulse

DataPulse is an internal developer tool that continuously polls registered API endpoints, tracks uptime/latency/error rates, streams live metrics to a React dashboard over WebSockets, and fires threshold-based alerts (Slack-compatible webhook) with incident logging.

## Tech Stack
- **Frontend**: React.js + TypeScript (Vite), Recharts, Native WebSocket client
- **Backend**: Node.js + Express.js (TypeScript), Native WebSocket server (`ws`)
- **Database**: PostgreSQL
- **Deployment**: AWS EC2, Nginx, PM2, GitHub Actions

## Architecture
```text
[ React Frontend ] <--(WebSocket / REST)--> [ Node.js Backend ]
        |                                       |
        |                                       +--> [ PostgreSQL DB ]
        |                                       |
        |                                       +--> [ Polling Engine Worker ]
        |                                                   |
        |                                                   +--> (Pings endpoints)
```

## Setup Instructions

### 1. Database Setup
Ensure PostgreSQL is installed and running. Create a database for the project:
```sql
CREATE DATABASE datapulse;
```

### 2. Backend Setup
```bash
cd backend
npm install
# Copy the env template and fill in your DB credentials
cp .env.example .env
# Run database schema setup and seed script
npm run db:setup
# Start the backend in development mode
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Start the Vite development server
npm run dev
```

### Environment Variables
#### Backend (`/backend/.env`)
```
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/datapulse
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

#### Frontend (`/frontend/.env`)
```
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

## Deployment Notes (EC2)
1. **Provision EC2**: Open ports 80 (HTTP), 443 (HTTPS), and 22 (SSH).
2. **Install Dependencies**: Node.js (v18+), PostgreSQL, Nginx, PM2.
3. **Configure Nginx**: Use the provided `nginx.conf` template for reverse proxying REST and WebSockets.
4. **Deploy via GitHub Actions**: Set `EC2_HOST`, `EC2_USER`, and `EC2_SSH_KEY` in GitHub repo secrets. The provided `.github/workflows/deploy.yml` automates zero-downtime PM2 reloads.

## Known Limitations
- The polling engine runs in-memory within the main Node.js process using `setInterval`. For high availability/scaling horizontally, this should be moved to a Redis-backed queue like BullMQ.
- The PostgreSQL DB does not use TimescaleDB. Rollup logic (e.g., hourly aggregations) can be added as a separate cron job or materialized view for long-term historical efficiency.
