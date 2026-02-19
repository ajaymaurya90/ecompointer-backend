<p align="center">
  <h1 align="center">EcomPointer Backend API</h1>
  <p align="center">
    Production-ready backend built with NestJS, Prisma & Secure JWT Authentication
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-Framework-red" />
  <img src="https://img.shields.io/badge/Prisma-ORM-blue" />
  <img src="https://img.shields.io/badge/JWT-Secure-green" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-blue" />
  <img src="https://img.shields.io/badge/License-MIT-black" />
</p>

---

## Overview

EcomPointer Backend is a scalable and production-ready backend system for product and inventory management platforms.

The system provides secure authentication, brand-based data isolation, and a modular product management architecture suitable for multi-tenant commerce systems.

---

## Implemented Features

### Authentication & Security

- User Registration (Brand Owner)
- Secure Login with bcrypt password hashing
- JWT Access Token (15 minutes)
- JWT Refresh Token (7 days)
- Refresh Token Rotation
- tokenVersion-based session invalidation
- Hashed refresh token storage
- Secure Logout
- Role-Based Access Control (RBAC)
- Global ValidationPipe configuration
- Protected routes using JwtGuard

### Product Management

- Product creation per brand
- Product update
- Product soft delete support
- Brand-based product isolation
- Swagger-documented endpoints

### Product Variants

- Variant creation per product
- Variant update
- Variant-level pricing
- Variant SKU support
- Stock quantity management

### Product Categories

- Create root categories
- Create subcategories (parent-child structure)
- Fetch categories by brand
- Hierarchical category support
- Brand isolation for categories

### Media Management

- Attach media to products
- Primary image support
- Media sorting support
- Media activation toggle
- Alt text support

---

## Tech Stack

| Technology | Purpose |
|------------|----------|
| NestJS | Scalable Node.js framework |
| Prisma ORM | Type-safe database access |
| PostgreSQL | Primary database |
| JWT | Access & Refresh token authentication |
| Passport.js | Strategy-based authentication |
| bcrypt | Password hashing |
| Swagger | API documentation |
| class-validator | Request validation |

---

## Authentication Architecture

- Access + Refresh token system
- Secure refresh token rotation
- Hashed refresh token storage
- Token version invalidation
- Role-based access control
- Brand ownership isolation

---

## Refresh Token Rotation Security Model

Each user contains:

```
tokenVersion: number
refreshToken: string | null
```

Flow:

1. User logs in → receives tokens (version 0)
2. On refresh:
   - JWT is verified
   - tokenVersion is validated
   - Stored refresh token hash is compared
   - tokenVersion is incremented
   - New tokens issued
3. Old refresh tokens become invalid immediately

Protected Against:

- Refresh token reuse
- Replay attacks
- Token theft misuse
- Session hijacking

---

## Security Measures

- bcrypt password hashing
- Hashed refresh tokens in database
- Token version validation
- JWT expiration enforcement
- Global ValidationPipe:
  ```
  whitelist: true
  forbidNonWhitelisted: true
  transform: true
  ```
- Role-based guards
- Brand ownership validation inside services
- Swagger secured with bearer authentication

---

## API Documentation

Swagger UI available at:

```
http://localhost:3000/api-docs
```

Features:

- Interactive API testing
- Bearer token authorization
- DTO schema visualization
- Versioned API metadata

---

## Project Structure

```
src/
 ├── auth/
 │    ├── auth.controller.ts
 │    ├── auth.service.ts
 │    ├── auth.module.ts
 │    ├── jwt.strategy.ts
 │    ├── jwt.guard.ts
 │    ├── guards/
 │    ├── decorators/
 │    ├── dto/
 │    └── types/
 │
 ├── product/
 │    ├── product.controller.ts
 │    ├── product.service.ts
 │    ├── product.module.ts
 │    └── dto/
 │
 ├── product-variant/
 │    ├── product-variant.controller.ts
 │    ├── product-variant.service.ts
 │    ├── product-variant.module.ts
 │    └── dto/
 │
 ├── product-category/
 │    ├── product-category.controller.ts
 │    ├── product-category.service.ts
 │    ├── product-category.module.ts
 │    └── dto/
 │
 ├── media/
 │    ├── media.controller.ts
 │    ├── media.service.ts
 │    ├── media.module.ts
 │    └── dto/
 │
 ├── prisma/
 ├── main.ts
 └── app.module.ts
```

---

## Environment Variables

Create a `.env` file:

```env
PORT=3000

DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

Never commit `.env` to Git.  
Use `.env.example` instead.

---

## Getting Started

### Install Dependencies

```bash
npm install
```

### Setup Database

```bash
npx prisma migrate dev
```

### Start Development Server

```bash
npm run start:dev
```

Server runs at:

```
http://localhost:3000
```

---

## Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new brand owner |
| POST | `/auth/login` | Login & receive tokens |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Logout & invalidate session |
| GET | `/auth/profile` | Get authenticated profile |

---

## Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/products` | Create product |
| GET | `/products` | Get brand products |
| GET | `/products/:id` | Get product by id |
| PATCH | `/products/:id` | Update product |
| DELETE | `/products/:id` | Soft delete product |

---

## Product Variant Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/product-variants` | Create variant |
| GET | `/product-variants/product/:productId` | Get variants by product |
| PATCH | `/product-variants/:id` | Update variant |
| DELETE | `/product-variants/:id` | Delete variant |

---

## Category Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/categories` | Create category |
| GET | `/categories` | Get categories by brand |

---

## Media Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/media` | Attach media to product |
| PATCH | `/media/:id` | Update media |
| DELETE | `/media/:id` | Remove media |

---

## Current Status

- Auth module complete
- Secure refresh token rotation implemented
- Role-based guard implementation
- Product module complete
- Product Variant module complete
- Product Category module complete
- Media module complete
- Swagger integration
- Brand-level data isolation enforced
- Clean modular architecture

---

## Upcoming Improvements

- Inventory auto-adjustment logic
- Order management module
- Image upload integration (S3 / Cloud storage)
- Admin dashboard
- Multi-tenant scalability enhancements

---

## Author

Ajay Maurya  
https://4thpointer.com  
ajay@4thpointer.com  

---

## License

MIT License

---

## Project Goal

Build a scalable, secure, and production-ready backend system suitable for real-world inventory and product management platforms with multi-brand isolation and enterprise-grade authentication.
