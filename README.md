<p align="center">
  <h1 align="center">EcomPointer Backend API</h1>
  <p align="center">
    Enterprise-grade Multi-Tenant Commerce Backend built with NestJS, Prisma & Secure JWT Architecture
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-Framework-red" />
  <img src="https://img.shields.io/badge/Prisma-ORM-blue" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-blue" />
  <img src="https://img.shields.io/badge/JWT-Auth-green" />
  <img src="https://img.shields.io/badge/RBAC-Enabled-purple" />
  <img src="https://img.shields.io/badge/Multi--Tenant-Ready-orange" />
  <img src="https://img.shields.io/badge/License-MIT-black" />
</p>

---

# Overview

EcomPointer Backend is a scalable, multi-tenant commerce backend system designed for SaaS-based product, inventory, and brand management platforms.

The system enforces strict role-based access control (RBAC), tenant isolation, secure JWT authentication, and production-grade refresh token rotation.

It is architected for real-world commerce platforms and future horizontal scaling.

---

# Core Architecture Principles

- Multi-role system (SUPER_ADMIN, BRAND_OWNER, SHOP_OWNER-ready)
- Brand-based tenant isolation
- Service-layer ownership validation
- Soft delete architecture
- Secure refresh token rotation
- UUID-based media storage (CDN-ready)
- Modular & extensible design

---

# Implemented Modules

## Authentication & Authorization

- User Registration (Brand Owner)
- Secure Login with bcrypt hashing
- JWT Access Token (15 minutes)
- JWT Refresh Token (7 days)
- Refresh Token Rotation
- tokenVersion-based invalidation
- Hashed refresh token storage
- Secure Logout
- Role-Based Access Control (RBAC)
- JwtGuard protected routes
- Profile endpoint with role-based response logic
- Admin profile update capability

---

## User & Role Management

- SUPER_ADMIN role
- BRAND_OWNER role
- SHOP_OWNER (future-ready)
- Admin can:
  - View all users (excluding self)
  - Update any user profile
- Soft delete support
- Pagination-ready admin listing structure

---

## Product Management

- Product creation per brand
- Product update
- Soft delete support
- Brand-level isolation
- Ownership validation inside services
- Swagger-documented endpoints

---

## Product Variants

- Variant creation per product
- Variant update
- SKU support
- Variant pricing
- Stock quantity management
- Tenant isolation enforced

---

## Product Categories

- Root categories
- Nested subcategories
- Parent-child hierarchy
- Brand isolation
- Category tree structure ready

---

## Media Management (Industry-Style)

### Architecture Upgrade Implemented

- UUID-based filenames
- No internal IDs exposed in URLs
- Stored in `/uploads/media`
- CDN-ready structure
- File size limit (5MB)
- Image-only validation
- Metadata stored (mimeType, size)
- Product & Variant media support
- Ordering support
- Activation toggle
- Alt text support

### Example URL Structure

```
/uploads/media/8f39a2d9c1f3b4e5.webp
```

Future-ready for:

```
https://cdn.yourdomain.com/media/8f39a2d9c1f3.webp
```

---

# Role-Based Feature Access Matrix

| Feature | SUPER_ADMIN | BRAND_OWNER | SHOP_OWNER (Future) |
|----------|--------------|-------------|---------------------|
| Register | ❌ | ✅ | ❌ |
| Login | ✅ | ✅ | ✅ |
| View Own Profile | ✅ | ✅ | ✅ |
| Update Own Profile | ✅ | ✅ | ✅ |
| Update Any User | ✅ | ❌ | ❌ |
| View All Users | ✅ | ❌ | ❌ |
| Create Product | ❌ | ✅ | ✅ (restricted) |
| Update Product | ❌ | ✅ (own brand only) | ✅ (own business only) |
| Delete Product | ❌ | ✅ (soft delete) | ❌ |
| Create Variant | ❌ | ✅ | ✅ |
| Manage Categories | ❌ | ✅ | ❌ |
| Upload Media | ❌ | ✅ | ✅ |
| Tenant Isolation | Global | Brand-based | Business-based |

---

# Security Architecture

## JWT System

- Access + Refresh token architecture
- Secure refresh token rotation
- tokenVersion validation
- Hashed refresh token storage
- Immediate invalidation on logout
- Session hijack protection

## Validation

Global ValidationPipe configuration:

```
whitelist: true
forbidNonWhitelisted: true
transform: true
```

## Ownership Enforcement

- No reliance on URL structure
- Ownership validated in service layer
- Strict brand isolation

## Soft Delete Strategy

- Records marked deleted via flag
- Prevents data loss
- Audit-friendly design

---

# Tech Stack

| Technology | Purpose |
|------------|----------|
| NestJS | Scalable Node.js framework |
| Prisma ORM | Type-safe database access |
| PostgreSQL | Primary database |
| JWT | Authentication |
| Passport | Strategy-based auth |
| bcrypt | Password hashing |
| Multer | File upload handling |
| Swagger | API documentation |
| class-validator | DTO validation |

---

# API Documentation

Swagger UI available at:

```
http://localhost:3001/api-docs
```

Includes:

- Bearer authentication
- DTO schemas
- File upload support
- Role-protected endpoints

---

# Project Structure

```
src/
 ├── auth/
 ├── user/
 ├── product/
 ├── product-variant/
 ├── product-category/
 ├── media/
 ├── prisma/
 ├── types/
 ├── main.ts
 └── app.module.ts
```

---

# Environment Variables

Create a `.env` file:

```env
PORT=3001

DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

Never commit `.env`. Use `.env.example`.

---

# Getting Started

### Install Dependencies

```bash
npm install
```

### Run Database Migration

```bash
npx prisma migrate dev
```

### Start Development Server

```bash
npm run start:dev
```

Server runs at:

```
http://localhost:3001
```

---

# Current Status

- Authentication system complete
- Secure refresh token rotation implemented
- Role-based access control complete
- Profile system implemented
- Admin management endpoints implemented
- Product module complete
- Variant module complete
- Category module complete
- Media module upgraded to industry standard
- Swagger fully integrated
- Soft delete implemented
- Tenant isolation enforced
- Architecture production-ready

---

# Upcoming Roadmap

- Order Management Module
- Inventory auto-adjustment logic
- StorageService abstraction (S3 ready)
- Image auto-optimization (WebP conversion)
- Multi-size image generation
- Analytics & reporting module
- SaaS subscription model integration

---

# Author

Ajay Shankar Maurya  
Founder – EcomPointer  
https://4thpointer.com  

---

# License

MIT License

---

# Project Vision

Build a scalable, secure, multi-tenant SaaS commerce backend capable of supporting:

- Multi-brand garment businesses
- Inventory & stock management
- Retail & ecommerce integration
- Enterprise-grade authentication
- Future horizontal scaling