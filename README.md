<p align="center">
  <h1 align="center">🚀 EcomPointer Backend API</h1>
  <p align="center">
    Production-ready backend built with NestJS, Prisma & Secure JWT Authentication
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-Framework-red" />
  <img src="https://img.shields.io/badge/Prisma-ORM-blue" />
  <img src="https://img.shields.io/badge/JWT-Secure-green" />
  <img src="https://img.shields.io/badge/License-MIT-black" />
</p>

---

## 📌 Overview

EcomPointer Backend is a scalable authentication and foundation layer for a product & inventory management system.

It implements a **production-grade JWT authentication system** with secure refresh token rotation and role-based access control (RBAC).

---

# 🏗 Tech Stack

| Technology | Purpose |
|------------|----------|
| **NestJS** | Scalable Node.js framework |
| **Prisma ORM** | Type-safe database access |
| **PostgreSQL** | Primary database |
| **JWT** | Access & Refresh token authentication |
| **Passport.js** | Strategy-based authentication |
| **bcrypt** | Password hashing |
| **Swagger** | API documentation |
| **class-validator** | Request validation |

---

# 🔐 Authentication Architecture

### ✅ Implemented Features

- User Registration
- Login with bcrypt-hashed passwords
- Access Token (15 minutes)
- Refresh Token (7 days)
- Refresh Token Rotation
- tokenVersion-based invalidation
- Hashed refresh token storage
- Secure Logout
- Role-Based Access Control (RBAC)
- Global Request Validation
- Swagger API Documentation

---

# 🔄 Refresh Token Rotation (Security Model)

Each user contains:

```ts
tokenVersion: number
refreshToken: string | null
```

### 🔁 Flow

1. User logs in → receives tokens (version 0)
2. On refresh:
   - JWT is verified
   - tokenVersion is validated
   - Stored refresh token hash is compared
   - tokenVersion is incremented
   - New tokens issued
3. Old refresh tokens become invalid immediately

---

### 🛡 Protected Against

- Refresh token reuse
- Replay attacks
- Token theft misuse
- Session hijacking

---

# 🛡 Security Measures

- bcrypt password hashing
- Hashed refresh tokens in database
- Token version validation
- JWT expiration enforcement
- Global ValidationPipe:
  ```ts
  whitelist: true
  forbidNonWhitelisted: true
  transform: true
  ```
- Role-based guards
- Protected routes via JwtGuard

---

# 📘 API Documentation

Swagger UI available at:

```
http://localhost:3000/api-docs
```

### Features

- Interactive API testing
- Bearer token authorization
- DTO schema visualization
- Versioned API metadata

---

# 📂 Project Structure

```
src/
 ├── auth/
 │    ├── auth.controller.ts
 │    ├── auth.service.ts
 │    ├── auth.module.ts
 │    ├── jwt.strategy.ts
 │    ├── jwt.guard.ts
 │    ├── guards/
 │    │     └── roles.guard.ts
 │    ├── decorators/
 │    │     └── roles.decorator.ts
 │    ├── dto/
 │    │     ├── register.dto.ts
 │    │     └── login.dto.ts
 │    └── types/
 │          └── jwt-user.type.ts
 │
 ├── prisma/
 ├── main.ts
 └── app.module.ts
```

---

# 🔑 Environment Variables

Create a `.env` file:

```env
PORT=3000

DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

⚠️ **Never commit `.env` to Git**  
Use `.env.example` instead.

---

# ▶️ Getting Started

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Setup Database

```bash
npx prisma migrate dev
```

### 3️⃣ Start Development Server

```bash
npm run start:dev
```

Server runs at:

```
http://localhost:3000
```

---

# 🔐 Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new brand owner |
| POST | `/auth/login` | Login & receive tokens |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Logout & invalidate session |
| GET | `/auth/profile` | Get authenticated profile |

---

# 🧪 Manual Test Flow

1. Register user
2. Login
3. Copy refresh token
4. Call `/auth/refresh`
5. Reuse old refresh token → expect **401 Unauthorized**
6. Logout
7. Attempt refresh again → expect failure

---

# 📌 Current Status

- ✅ Auth module complete  
- ✅ Secure refresh token rotation  
- ✅ Role-based guard implementation  
- ✅ Swagger integration  
- ✅ Clean architectural structure  

---

# 🚧 Upcoming Modules

- Product Management
- Inventory Tracking
- Order System
- Brand ownership isolation
- Advanced RBAC
- Multi-tenant scalability

---

# 👨‍💻 Author

**Ajay Maurya**  
🌐 https://4thpointer.com  
📧 ajay@4thpointer.com  

---

# 📄 License

MIT License

---

# 🎯 Project Goal

Build a scalable, secure, and production-ready backend system suitable for real-world inventory and product management platforms.
