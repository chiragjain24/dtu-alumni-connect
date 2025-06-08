# DTU Alumni Connect 🎓

> **⚠️ Project Status: Currently In Progress**  

## Overview

DTU Alumni Connect is a full-stack Twitter clone specifically designed for DTU (Delhi Technological University) alumni networking. The platform replicates Twitter's interface and functionality to create a familiar, engaging environment for alumni to connect, share opportunities, and build professional relationships.

## 🚀 Tech Stack

### Frontend
- **React 19** - Latest React version with modern features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Shadcn UI** - Beautiful, accessible component library
- **Tanstack Query** - Powerful data fetching and caching
- **TailwindCSS** - Utility-first CSS framework
- **React Router v7** - Client-side routing

### Backend
- **Bun** - Fast JavaScript runtime and package manager
- **Hono** - Lightweight, fast web framework
- **TypeScript** - Type-safe server development
- **Drizzle ORM** - Type-safe database ORM
- **PostgreSQL (Neon)** - Cloud-native PostgreSQL database
- **Better-Auth** - Modern authentication library
- **Cloudflare Workers** - Edge deployment ready

### Development & Deployment
- **Bun Workspaces** - Monorepo management
- **ESLint** - Code linting
- **Drizzle Kit** - Database migrations
- **Wrangler** - Cloudflare Workers deployment
- **UploadThing** - File upload service

## 📁 Project Structure

```
dtu-alumni/
├── frontend/          # React frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Hono API backend
│   ├── src/
│   ├── package.json
│   ├── drizzle.config.ts
│   └── wrangler.jsonc
├── package.json       # Root workspace configuration
├── bun.lock           # Lock file for dependencies
└── README.md
```