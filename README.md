# NestJS Authentication

Step-by-step authentication with NestJS, JWT and bcrypt.

**Flow:** register → hash password → login → receive tokens → protect routes → refresh tokens → logout

## Setup

```bash
npm install
cp .env.example .env
npm run start:dev
```

The server runs on http://localhost:3000. Data is stored in a local SQLite file (`database.sqlite`, via sql.js, no native build needed).

## Endpoints

| Method | Route            | Access    | Description                                  |
|--------|------------------|-----------|----------------------------------------------|
| GET    | `/`              | Public    | Public welcome route                         |
| POST   | `/auth/register` | Public    | Create account (password hashed with bcrypt) |
| POST   | `/auth/login`    | Public    | Returns `accessToken` + `refreshToken`       |
| POST   | `/auth/refresh`  | Public    | Send `refreshToken`, get a new token pair    |
| POST   | `/auth/logout`   | Protected | Invalidates the stored refresh token         |
| GET    | `/users/me`      | Protected | Current user profile                         |

Protected routes need the header `Authorization: Bearer <accessToken>`.

## How it works

1. **Register** (`AuthService.register`): checks the email is unused and stores a bcrypt hash of the password.
2. **Login** (`AuthService.login`): compares the password with the hash, then issues an access token (15 min) and a refresh token (7 days).
3. **Protected routes**: `JwtAuthGuard` is registered globally, so every route requires a valid access token.
4. **Public routes**: add the `@Public()` decorator to skip the guard.
5. **Refresh**: the refresh token is verified, compared with its stored hash, and rotated (a new pair is issued; the old refresh token stops working).
6. **Logout**: the stored refresh token hash is cleared, so the refresh token can no longer be used.

## Try it with curl

```bash
curl -X POST localhost:3000/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","name":"Abel","password":"secret123"}'

curl -X POST localhost:3000/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"secret123"}'

curl localhost:3000/users/me -H 'Authorization: Bearer <accessToken>'

curl -X POST localhost:3000/auth/refresh -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<refreshToken>"}'

curl -X POST localhost:3000/auth/logout -H 'Authorization: Bearer <accessToken>'
```

## Project structure

```
src/
  main.ts
  app.module.ts
  app.controller.ts          (public route)
  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    decorators/ (public, current-user)
    dto/ (register, login, refresh)
    guards/jwt-auth.guard.ts
    strategies/jwt.strategy.ts
  users/
    user.entity.ts
    users.module.ts
    users.service.ts
    users.controller.ts      (protected route)
```
