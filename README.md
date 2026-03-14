# Blog Management Platform

A production-ready, enterprise-grade blog and content management system built with modern web technologies. Features multi-tenancy, advanced analytics, RSS automation, and comprehensive role-based access control.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.0-black.svg)](https://www.fastify.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-green.svg)](https://orm.drizzle.team/)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)

## Overview

This platform provides a complete solution for managing blog content across multiple organizations (tenants). It's designed for content platforms that need sophisticated user management, analytics, and content aggregation capabilities.

### Key Capabilities

- **Multi-Tenant Architecture**: Complete data isolation between organizations
- **Content Management**: Rich text editing with Markdown, SEO optimization, categorization
- **RSS Automation**: Automatic content aggregation from external RSS feeds
- **Advanced Analytics**: Event tracking and metrics aggregation
- **Role-Based Access Control**: Granular permissions for users and administrators
- **Banner Management**: Targeted promotional content with scheduling
- **Audit Logging**: Comprehensive activity tracking for compliance

## Features

### Blog Management
- Full CRUD operations for blog posts, categories, and tags
- Rich Markdown editor with live preview
- Automatic table of contents generation
- FAQ support with structured data
- SEO fields (meta title, description, keywords)
- Read time estimation
- Featured posts and content collections
- Multi-category support with primary/secondary categories

### Multi-Tenant System
- Complete data isolation between tenants
- Platform admin dashboard for system-wide management
- Tenant-specific user management and permissions
- Organization-level analytics and settings

### RSS Automation
- RSS feed source management
- Automatic feed fetching and processing
- Content aggregation pipeline
- Feed item categorization and filtering

### Analytics
- Event tracking (page views, post views, engagement)
- Daily metrics aggregation
- Dashboard with visualizations
- Tenant-scoped analytics
- Session tracking

### Banner Management
- Header and CTA banner creation
- Path-based targeting with regex patterns
- User segment targeting (guests vs authenticated)
- Scheduling with start/end dates
- Active/inactive status management

### Featured Collections
- Curated content collections
- Drag-and-drop ordering
- Active/inactive management
- Homepage customization support

### User Management
- JWT-based authentication
- Role-based access control (RBAC)
- User impersonation for support
- Profile management
- Session management

### Branch/Location Management
- Physical location tracking
- Geocoding with latitude/longitude
- Manager assignments
- GSTIN support (India tax ID)
- Location types: farm, outlet, warehouse, office

### File Upload System
- Multi-tenant file storage
- File type validation
- Optional ClamAV virus scanning
- Orphan cleanup for unused files
- Image optimization support

### Audit Logging
- Comprehensive activity tracking
- Before/after value storage
- Actor tracking (user/admin)
- Impersonation tracking

## Tech Stack

### Frontend (`/web`)

| Category | Technology |
|----------|------------|
| Framework | **Next.js 16** (App Router) |
| Language | **TypeScript 5** |
| React | **19** (with React Compiler) |
| Styling | **Tailwind CSS 4** |
| UI Components | **Radix UI / Base UI** |
| Forms | **TanStack Form** + **Zod** |
| Data Fetching | **TanStack Query 5** |
| Tables | **TanStack Table 8** |
| Markdown | **@uiw/react-md-editor** + **react-markdown** |
| Maps | **Leaflet** + **react-leaflet** |
| Animations | **Framer Motion**, **GSAP** |
| Drag & Drop | **@dnd-kit** |
| Icons | **Lucide React** |
| Auth | **CASL** for authorization |
| Linting | **Biome** |

### Backend (`/server`)

| Category | Technology |
|----------|------------|
| Framework | **Fastify 5** |
| Language | **TypeScript 5.9** |
| Database | **PostgreSQL** |
| ORM | **Drizzle ORM** + **Drizzle Kit** |
| Validation | **Zod 4** + **drizzle-zod** |
| Auth | **bcryptjs**, **jsonwebtoken**, **CASL** |
| File Uploads | **@fastify/multipart** |
| Security | **@fastify/helmet**, **@fastify/cors** |
| Rate Limiting | **@fastify/rate-limit** |
| API Docs | **@fastify/swagger** + **swagger-ui** |
| Metrics | **prom-client** |
| Testing | **Vitest 4** |
| UUID | **uuidv7** |

## Architecture

### Multi-Tenant Design

The system supports two distinct user types:

- **Platform Users**: Super administrators with system-wide access
- **Tenant Users**: Organization-scoped users with isolated data

```
Database Schema:
├── platform_user (super admins)
├── tenant_user (organization users)
├── tenants (organizations)
└── All data scoped by tenant_id where applicable
```

### Route Structure

```
/api/platform/*     → Platform admin routes
/api/tenant/*       → Tenant-scoped routes
/api/public/*       → Public/unauthenticated routes
/api/auth/*         → Authentication routes
```

### Event-Driven Architecture

Implements an outbox pattern for reliable event processing:

- **Event Bus**: In-memory pub/sub (swappable with Redis)
- **Outbox Pattern**: Events stored in `outbox_events` table
- **Event Types**: tenant.created, branch.created, auth.user.registered, etc.
- **Idempotency**: `processed_events` table prevents duplicates

See [server/EVENTS.md](./server/EVENTS.md) for detailed documentation.

### Permission System (RBAC)

- **Subjects**: BLOG_POST, BLOG_CATEGORY, BLOG_TAG, TENANT, USER, ROLE, BANNER, ANALYTICS
- **Actions**: CREATE, READ, UPDATE, DELETE, DISPLAY_LINK, MANAGE
- **Module Policies**: Centralized in `modulePolicies.ts`

### Core Patterns

#### CRUD Factory
Generic CRUD route generator supporting pagination, sorting, filtering, search, soft delete, and event emission.

#### Filter Builder
SQL filter construction with operators (eq, neq, gt, gte, lt, lte, contains, startsWith, endsWith, in, between) and logical groups (AND/OR).

#### Cache Layer
LRU cache implementation for query result caching, tag-based invalidation, and request deduplication.

## Getting Started

### Prerequisites

- **Node.js** 20+ 
- **PostgreSQL** 15+
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blog-management-platform
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install web dependencies
   cd ../web
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env` files in both `server/` and `web/` directories:

   **Server (`server/.env`)**:
   ```env
   NODE_ENV=development
   PORT=3020
   
   # Security (change these in production!)
   COOKIE_SECRET=your-cookie-secret
   JWT_SECRET=your-jwt-secret
   SESSION_TOKEN_PEPPER=your-session-pepper
   
   # Database
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=postgres
   DATABASE_PASSWORD=your-password
   DATABASE_NAME=blog
   DATABASE_SSL=false
   
   # CORS
   ALLOWED_ORIGINS=http://localhost:3015,http://127.0.0.1:3015
   
   # File Uploads
   UPLOAD_MAX_BYTES=5242880
   UPLOAD_SCAN_MODE=none
   ```

   **Web (`web/.env`)**:
   ```env
   PORT=3002
   NEXT_PUBLIC_SERVER_URL=http://localhost:3020
   ```

4. **Set up the database**
   ```bash
   cd server
   npm run db:migrate
   npm run db:seed:landing  # Optional: seed with sample data
   ```

5. **Start the development servers**

   Terminal 1 - Server:
   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 - Web:
   ```bash
   cd web
   npm run dev
   ```

6. **Access the application**
   - Web App: http://localhost:3015
   - API Server: http://localhost:3020
   - API Documentation: http://localhost:3020/documentation

### Database Studio

To explore and manage the database using Drizzle Studio:

```bash
cd server
npm run db:studio
```

## Configuration

### Environment Variables

#### Server Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3020` |
| `REQUEST_TIMEOUT_MS` | Request timeout | `30000` |
| `CONNECTION_TIMEOUT_MS` | Connection timeout | `10000` |
| `COOKIE_SECRET` | Cookie signing secret | required |
| `JWT_SECRET` | JWT signing secret | required |
| `SESSION_TOKEN_PEPPER` | Session token pepper | required |
| `SESSION_TTL_DAYS` | Session duration | `7` |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |
| `COOKIE_SECURE` | Secure cookie flag | `false` |

#### Database Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USER` | Database user | `postgres` |
| `DATABASE_PASSWORD` | Database password | required |
| `DATABASE_NAME` | Database name | `blog` |
| `DATABASE_SSL` | Enable SSL | `false` |
| `DATABASE_POOL_MAX` | Max pool connections | `20` |

#### File Upload Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `UPLOAD_MAX_BYTES` | Max upload size | `5242880` (5MB) |
| `UPLOAD_ALLOWED_MIME` | Allowed MIME types | image types, PDF, text |
| `UPLOAD_SCAN_MODE` | Virus scan mode | `none` |
| `UPLOAD_SCAN_COMMAND` | Scan command | `clamscan` |

See `server/.env.example` for the complete list of configuration options.

## API Documentation

The API is fully documented with OpenAPI/Swagger. Once the server is running, access the interactive documentation at:

```
http://localhost:3020/documentation
```

### Authentication

The API uses JWT-based authentication with cookie-based sessions:

1. **Login**: `POST /api/auth/login`
2. **Token Refresh**: Automatic via refresh tokens
3. **Logout**: `POST /api/auth/logout`

### Rate Limiting

Different rate limits apply to different endpoint types:

- **Global**: 100 requests per minute
- **Authentication**: 5 requests per minute
- **Uploads**: 10 requests per minute
- **Tenant-specific**: Configurable per tenant

### Key Endpoints

```
# Platform Admin
GET    /api/platform/dashboard
GET    /api/platform/tenants
GET    /api/platform/users
GET    /api/platform/blog-posts
GET    /api/platform/analytics

# Tenant
GET    /api/tenant/dashboard
GET    /api/tenant/blog-posts
GET    /api/tenant/categories
GET    /api/tenant/branches
GET    /api/tenant/users

# Public
GET    /api/public/blog-posts
GET    /api/public/categories
GET    /api/public/tags
GET    /api/public/featured
```

## Development

### Available Scripts

**Server:**

```bash
npm run dev              # Development with hot reload
npm run build            # Build TypeScript
npm run start            # Production start
npm run typecheck        # TypeScript type checking
npm run lint             # Biome linting
npm run test             # Run Vitest tests
npm run test:watch       # Run tests in watch mode

# Database
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes
npm run db:studio        # Launch Drizzle Studio
npm run db:reset         # Reset database
npm run db:seed:landing  # Seed landing page data
```

**Web:**

```bash
npm run dev              # Next.js dev server (port 3015)
npm run build            # Production build
npm run start            # Production server
npm run typecheck        # TypeScript type checking
npm run lint             # Biome linting
npm run check:links      # Check markdown links
```

### Code Structure

```
server/
├── src/
│   ├── modules/         # Feature modules (blog, auth, analytics, etc.)
│   ├── core/           # Core utilities (crudFactory, filterBuilder, cache)
│   ├── events/         # Event bus and handlers
│   ├── middlewares/    # Fastify middlewares
│   ├── audit/          # Audit logging
│   └── database/       # Drizzle schema and connection
├── drizzle/            # Database migrations
└── uploads/            # Uploaded files storage

web/
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── (auth)/     # Auth routes
│   │   ├── (public)/   # Public pages
│   │   ├── platform/   # Admin dashboard
│   │   └── tenant/     # Tenant dashboard
│   ├── modules/        # Feature modules
│   ├── components/     # Shared components
│   ├── lib/            # Utilities
│   ├── hooks/          # React hooks
│   └── providers/      # Context providers
├── public/             # Static assets
└── docs/               # Documentation
```

### Adding New Features

1. **Database**: Add schema in `server/src/database/schema.ts`
2. **API Routes**: Create routes in `server/src/modules/<feature>/`
3. **Frontend Pages**: Add pages in `web/src/app/`
4. **Components**: Create components in `web/src/modules/<feature>/`

See [web/docs/cache-and-query-examples.md](./web/docs/cache-and-query-examples.md) for frontend data fetching patterns.

## Deployment

### Production Build

1. **Build the server:**
   ```bash
   cd server
   npm run build
   ```

2. **Build the web app:**
   ```bash
   cd web
   npm run build
   ```

### Docker Deployment

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: blog
      POSTGRES_PASSWORD: your-password
      POSTGRES_DB: blog
    volumes:
      - postgres_data:/var/lib/postgresql/data

  server:
    build: ./server
    environment:
      NODE_ENV: production
      DATABASE_HOST: postgres
      DATABASE_PASSWORD: your-password
      # ... other env vars
    depends_on:
      - postgres

  web:
    build: ./web
    environment:
      NEXT_PUBLIC_SERVER_URL: https://api.yourdomain.com
    depends_on:
      - server

volumes:
  postgres_data:
```

### Environment Security

**Production Checklist:**

- [ ] Change all default secrets (COOKIE_SECRET, JWT_SECRET, etc.)
- [ ] Enable HTTPS
- [ ] Set `COOKIE_SECURE=true`
- [ ] Set `CSRF_COOKIE_SAME_SITE=strict`
- [ ] Configure CORS with specific origins
- [ ] Enable rate limiting
- [ ] Set up ClamAV for file scanning
- [ ] Configure backup strategy for database and uploads

## Security

### Implemented Security Features

- **CSRF Protection**: Token-based CSRF prevention
- **Rate Limiting**: Multi-tier rate limiting (global, auth, tenant, user)
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configurable CORS with origin whitelist
- **XSS Protection**: Content Security Policy headers
- **File Upload Security**: MIME type validation, size limits, optional virus scanning
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **Password Security**: bcrypt hashing with configurable rounds
- **JWT Security**: Secure token handling with refresh rotation

### Best Practices

1. **Secrets Management**: Never commit secrets to version control
2. **HTTPS**: Always use HTTPS in production
3. **Database**: Use connection pooling and prepared statements
4. **File Uploads**: Validate file types and scan for malware
5. **Rate Limiting**: Configure appropriate limits for your use case
6. **Audit Logging**: Enable comprehensive audit logging for compliance

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- Use **Biome** for linting and formatting
- Follow **TypeScript** strict mode
- Write **tests** for new features
- Update **documentation** for API changes

### Reporting Issues

Please use GitHub Issues to report bugs or request features:

1. Check if the issue already exists
2. Provide a clear description
3. Include steps to reproduce
4. Add relevant code samples or logs

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please:

1. Check the [documentation](./web/docs/)
2. Search [existing issues](https://github.com/your-repo/issues)
3. Create a new issue with detailed information

---

Built with modern technologies for modern content management.
