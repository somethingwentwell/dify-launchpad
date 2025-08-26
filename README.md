# Dify Launchpad

A streamlined studio interface for launching Dify applications directly to their published URLs.

![Demo](img/demo.gif)


## Prerequisites

**⚠️ Important: You must have a running Dify instance before setting up the launchpad.**

The Dify Launchpad is a frontend interface that connects to your existing Dify backend to display and launch your published apps. It requires:

1. **Running Dify Backend**: A fully operational Dify instance (self-hosted or cloud)
2. **Published Apps**: At least one app published in your Dify instance with `enable_site: true`

### Dify Setup

If you don't have Dify running yet:

- **Self-hosted**: Follow the [Dify Quickstart](https://github.com/langgenius/dify?tab=readme-ov-file#quick-start)

Make sure you can access your Dify console (usually at `http://your-domain/console`) before proceeding.

## Quick Start

### 🐳 Docker Compose (Recommended)

1. **Clone and Configure**
   ```bash
   git clone https://github.com/somethingwentwell/dify-launchpad
   cd dify-launchpad
   cp .env.example .env
   ```

2. **Edit Configuration**
   ```bash
   # Edit .env file with your EXISTING Dify instance settings
   DIFY_BACKEND_URL=http://your-existing-dify-backend
   DIFY_APP_BASE_URL=http://your-existing-dify-domain
   LAUNCHPAD_PORT=3000
   ```
   
   **Examples:**
   - Local Dify: `DIFY_BACKEND_URL=http://localhost`
   - Docker Dify: `DIFY_BACKEND_URL=http://dify-api`
   - Remote Dify: `DIFY_BACKEND_URL=https://api.yourdify.com`

3. **Launch**
   ```bash
   docker-compose up -d
   ```

4. **Access Launchpad**
   Visit `http://localhost:3000`

### 💻 Development Setup

1. **Install Dependencies**
   ```bash
   cd web
   pnpm install
   ```

2. **Configure Environment**
   ```bash
   cp web/.env.example web/.env.local
   # Edit .env.local with your EXISTING Dify backend URLs and app base URL
   ```
   
   Key settings in `.env.local`:
   ```bash
   # Backend API (point to your existing Dify instance)
   NEXT_PUBLIC_API_PREFIX=http://localhost/console/api
   
   # App base URL (where your published Dify apps are accessed)
   NEXT_PUBLIC_APP_BASE_URL=http://localhost
   ```

3. **Start Development**
   ```bash
   cd web
   pnpm dev
   ```

4. **Open Launchpad**
   Visit `http://localhost:3000`

## License

This project follows the same license as the original Dify project.