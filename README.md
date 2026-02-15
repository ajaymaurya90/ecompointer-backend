🚀 EcomPointer Backend API

Production-ready backend built with NestJS, Prisma, and secure JWT Authentication with Refresh Token Rotation.

This project is the foundation for a scalable inventory & product management system with role-based access control.

🏗 Tech Stack

NestJS – Scalable Node.js framework

Prisma ORM – Type-safe database access

PostgreSQL (configurable)

JWT (Access + Refresh Tokens)

Passport.js

bcrypt

Swagger (OpenAPI)

class-validator / class-transformer

🔐 Authentication Architecture

This backend implements a secure JWT authentication system with refresh token rotation.

Implemented Features

User Registration

Login with bcrypt-hashed passwords

Access Token (15 minutes)

Refresh Token (7 days)

Refresh Token Rotation

tokenVersion-based invalidation

Hashed refresh token storage

Secure Logout

Role-Based Access Control (RBAC)

Global Request Validation

Swagger API Documentation

🔄 Refresh Token Rotation (Security Model)

Each user has:

tokenVersion: number
refreshToken: string | null

Flow:

User logs in → receives tokens (version 0)

On refresh:

JWT is verified

tokenVersion is validated

Stored refresh token hash is compared

tokenVersion is incremented

New tokens issued

Old refresh tokens become invalid immediately

Protection Against:

Refresh token reuse

Replay attacks

Token theft misuse

Session hijacking

🛡 Security Measures

bcrypt password hashing

Hashed refresh tokens in database

Token version validation

JWT expiration enforced

Global ValidationPipe:

whitelist: true

forbidNonWhitelisted: true

transform: true

Role-based guards

Protected routes via JwtGuard

📘 API Documentation (Swagger)

Swagger UI available at:

http://localhost:3000/api-docs


Features:

Interactive API testing

Bearer token authorization

DTO schema visualization

Versioned API metadata

📂 Project Structure
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

🔑 Environment Variables

Create a .env file in the root:

PORT=3000

DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret


⚠️ Never commit .env to Git.
Include .env.example instead.

▶️ Getting Started
1️⃣ Install Dependencies
npm install

2️⃣ Setup Database
npx prisma migrate dev

3️⃣ Start Development Server
npm run start:dev


Server runs on:

http://localhost:3000

🔐 Auth Endpoints
Method	Endpoint	Description
POST	/auth/register	Register a new brand owner
POST	/auth/login	Login & receive tokens
POST	/auth/refresh	Rotate refresh token
POST	/auth/logout	Logout & invalidate session
GET	/auth/profile	Get authenticated user profile
🧪 Manual Auth Test Flow

Register a user

Login

Copy refresh token

Call /auth/refresh

Reuse old refresh token → expect 401 Unauthorized

Logout

Attempt refresh again → expect failure

📌 Current Status

✅ Auth module complete
✅ Secure refresh token rotation
✅ Role-based guard implementation
✅ Swagger integration
✅ Clean code with architectural comments

🚧 Upcoming Modules

Product Management

Inventory Tracking

Order System

Brand ownership isolation

Advanced RBAC

Multi-tenant scalability

👨‍💻 Author

Ajay Maurya
https://4thpointer.com

ajay@4thpointer.com

📄 License

MIT License

🔥 Project Goal

Build a scalable, secure, and production-ready backend system suitable for real-world inventory and product management platforms.