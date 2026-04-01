# FeedPulse

FeedPulse is an AI-assisted product feedback platform. It provides a public feedback form for collecting bug reports and feature requests, and an authenticated admin dashboard for triaging submissions with AI-generated categorization, sentiment, priority scoring, tags, and weekly trend summaries (Gemini).

## Tech Stack

**Frontend**
- Next.js (App Router) + React
- TypeScript
- Tailwind CSS

**Backend**
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT authentication
- Gemini integration via Google GenAI SDK (`@google/genai`)

## How to Run Locally (Step-by-Step)

### 0) Prerequisites
- Node.js 18+ (recommended)
- A MongoDB instance (local or MongoDB Atlas)
- (Optional) Gemini API key for AI features

> Note: Env files are ignored by Git (`backend/.gitignore` and `frontend/.gitignore`).

### 1) Backend setup (API)

1. Open a terminal and go to the backend:
	```bash
	cd backend
	```

2. Install dependencies:
	```bash
	npm install
	```

3. Create `backend/.env`:

	**Recommended (matches the frontend default API URL):**
	```env
	# Required
	MONGODB_URI=mongodb://127.0.0.1:27017/feedpulse
	JWT_SECRET=change_me_to_a_long_random_string

	# Recommended (frontend defaults to http://localhost:5000)
	PORT=5000

	# Optional (demo admin login)
	ADMIN_EMAIL=admin@feedpulse.com
	ADMIN_PASSWORD=admin123
	JWT_EXPIRES_IN=7d

	# Optional (enables AI analysis + weekly summary)
	GEMINI_API_KEY=
	GEMINI_MODEL=gemini-3-flash-preview
	```

4. Start the API in dev mode:
	```bash
	npm run dev
	```

5. Verify it’s running:
	- Health check: http://localhost:5000/health

> If you don’t set `PORT=5000`, the backend defaults to `4000`. In that case, set `NEXT_PUBLIC_API_URL=http://localhost:4000` on the frontend.

### 2) Frontend setup (Next.js)

1. Open a second terminal and go to the frontend:
	```bash
	cd frontend
	```

2. Install dependencies:
	```bash
	npm install
	```

3. (Optional) Create `frontend/.env.local` if your backend is not on port 5000:
	```env
	NEXT_PUBLIC_API_URL=http://localhost:4000
	```

4. Start the frontend:
	```bash
	npm run dev
	```

5. Open the app:
	- Home (feedback form): http://localhost:3000
	- Admin login: http://localhost:3000/admin/login
	- Admin dashboard: http://localhost:3000/admin/dashboard

## Quick Start with Docker (Recommended)

The easiest way to run the entire application (backend, frontend, and MongoDB) is with Docker Compose. This method requires only Docker and Docker Compose to be installed—no Node.js installation needed.

### Prerequisites

- Docker and Docker Compose (Download from [docker.com](https://www.docker.com/products/docker-desktop))

### Steps

1. **Clone and navigate to the project:**
	```bash
	git clone https://github.com/SupunLiyanage88/FeedPulse
	cd FeedPulse
	```

2. **(Optional) Create a `.env` file at the project root** for sensitive environment variables:
	```env
	# Optional: Override defaults for production/security
	JWT_SECRET=your_secure_random_string_here
	GEMINI_API_KEY=your_gemini_api_key_here
	ADMIN_EMAIL=admin@feedpulse.com
	ADMIN_PASSWORD=admin123
	```

	> If you skip this, Docker will use safe defaults (JWT_SECRET will default to a placeholder—change this for production).

3. **Start the entire application:**
	```bash
	docker-compose up --build
	```

	This command:
	- Builds Docker images for the backend and frontend
	- Starts MongoDB (automatically initialized)
	- Starts the Express backend API
	- Starts the Next.js frontend
	- Connects everything together on a Docker network

	> **First run may take 2–3 minutes** due to dependency installation and building. Subsequent runs are much faster.

4. **Wait until all services are healthy:**
	```
	feedpulse-db        | Connection successful
	feedpulse-backend   | Server running on http://localhost:5000
	feedpulse-frontend  | Ready in Xs
	```

5. **Access the application:**
	- **Frontend (feedback form):** http://localhost:3000
	- **Admin login:** http://localhost:3000/admin/login
	- **Admin dashboard:** http://localhost:3000/admin/dashboard
	- **Backend health check:** http://localhost:5000/health
	- **MongoDB:** localhost:27017 (exposed for debugging, default credentials: none)

6. **Default admin credentials:**
	```
	Email: admin@feedpulse.com
	Password: admin123
	```

### Docker Troubleshooting

**Ports already in use?**
```bash
# Stop and remove all FeedPulse containers
docker-compose down

# OR free up specific ports and try again
docker ps  # check what's running
docker kill <container_id>
```

**Rebuild from scratch?**
```bash
docker-compose down -v        # Remove volumes (deletes database)
docker-compose up --build     # Rebuild and start fresh
```

**Check logs:**
```bash
docker-compose logs -f backend   # Backend logs
docker-compose logs -f frontend  # Frontend logs
docker-compose logs -f mongodb   # Database logs
```

**Verify services:**
```bash
docker-compose ps               # Show all running services
curl http://localhost:5000/health  # Health check API
```

### Docker Compose Configuration

The `docker-compose.yml` file defines:
- **backend**: Express.js API with health checks
- **frontend**: Next.js application with automatic API pointing

All services automatically connect through a shared Docker network (`feedpulse-network`).

## Environment Variables

### Backend (`backend/.env`)

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `MONGODB_URI` | Yes | — | MongoDB connection string used by the API |
| `JWT_SECRET` | Yes | — | Secret used to sign/verify JWTs for admin requests |
| `PORT` | No | `4000` | API port (set to `5000` to match the frontend default) |
| `ADMIN_EMAIL` | No | `admin@feedpulse.com` | Demo/admin login email (hardcoded check) |
| `ADMIN_PASSWORD` | No | `admin123` | Demo/admin login password (hardcoded check) |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiration (e.g. `12h`, `1d`, `7d`) |
| `GEMINI_API_KEY` | No | — | Enables Gemini analysis and weekly summaries |
| `GEMINI_MODEL` | No | `gemini-3-flash-preview` | Gemini model name |
| `NODE_ENV` | No | — | When `development`, API errors may include stack traces |

### Frontend (`frontend/.env.local`)

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:5000` | Backend base URL used by the Next.js app |

## Screenshots

### Feedback Form
![Feedback Form](docs/screenshots/feedback-form.png)

### Admin Login
![Admin Login](docs/screenshots/admin-login.png)

### Admin Dashboard
![Admin Dashboard](docs/screenshots/admin-dashboard.png)

## Notes

- AI analysis is triggered asynchronously after feedback submission. If `GEMINI_API_KEY` is not set, feedback still saves normally, but AI fields will remain empty.
- Admin routes require `Authorization: Bearer <token>` after logging in.

## What I’d Build Next (With More Time)

- Expand admin capabilities: roles/permissions, assignment, internal notes, and audit logs.
- Improve data quality and safety: spam protection (CAPTCHA), stronger rate limiting, and moderation tooling.
- Add integrations/exports (CSV export, webhooks, Slack/email notifications) for closing the feedback loop.
