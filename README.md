# Pharmacy E-Commerce (Hackathon)

Full-stack pharmacy e-commerce project with:

- Backend: ASP.NET Core Web API (.NET 10) + EF Core + PostgreSQL
- Frontend: Angular 21 + Tailwind CSS
- Auth: JWT with HttpOnly cookie-based session

## Project Structure

- `backendApi/` - API, business logic, EF Core models/migrations
- `frontend/` - Angular app (UI + API integration)

```text
hcl-hackathon/
├── backendApi/
│   ├── Controllers/
│   ├── Services/
│   ├── Repositories/
│   ├── Models/
│   ├── DTOs/
│   ├── Data/
│   ├── Configurations/
│   ├── Middleware/
│   ├── Migrations/
│   ├── Program.cs
│   └── appsettings.json
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── core/
│   │       │   ├── config/
│   │       │   └── services/
│   │       ├── pages/
│   │       │   ├── auth/
│   │       │   ├── products/
│   │       │   ├── cart/
│   │       │   ├── checkout/
│   │       │   └── orders/
│   │       ├── app.config.ts
│   │       ├── app.routes.ts
│   │       └── app.ts
│   ├── scripts/
│   │   └── sync-env.mjs
│   ├── .env
│   └── package.json
├── .gitignore
└── README.md
```

## Prerequisites

- .NET SDK 10
- Node.js 20+ and npm
- PostgreSQL running locally

## Backend Setup (`backendApi`)

1. Update DB/JWT config in `backendApi/appsettings.json` if needed:
   - `ConnectionStrings:DefaultConnection`
   - `JwtSettings`
2. Restore/build:

```bash
cd backendApi
dotnet restore
dotnet build
```

3. Run migrations:

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

4. Start API:

```bash
dotnet run
```

Backend runs on URL shown in terminal (example: `http://localhost:5100`).

## Frontend Setup (`frontend`)

1. Set backend URL in `frontend/.env`:

```env
BACKEND_URL=http://localhost:5100
```

2. Install deps and run:

```bash
cd frontend
npm install
npm start
```

3. Build:

```bash
npm run build
```

`sync-env` runs automatically before `start` and `build` to generate API config.

## Authentication Notes

- Login sets JWT in HttpOnly cookie (`auth_token`) with 7-day expiry.
- Login response does **not** expose token in JSON.
- Protected frontend requests should use credentials (`withCredentials: true`).

## API Docs

In development mode:

- OpenAPI JSON: `/swagger/v1/swagger.json`
- Swagger UI: `/swagger`

## Main API Routes

- Auth: `POST /api/users/register`, `POST /api/users/login`
- Products: `GET /api/products`, `GET /api/products/{id}`
- Cart: `POST /api/cart/add`, `GET /api/cart/{userId}`, `PUT /api/cart/update`, `DELETE /api/cart/remove`
- Prescriptions: `POST /api/prescriptions/upload`, `GET /api/prescriptions/{userId}`, `PUT /api/prescriptions/{id}/review` (ADMIN)
- Orders: `POST /api/orders`, `GET /api/orders/{id}`, `GET /api/orders/user/{id}`, `PUT /api/orders/{id}/status` (ADMIN)

## Quick Run (2 terminals)

Terminal 1:

```bash
cd backendApi
dotnet run
```

Terminal 2:

```bash
cd frontend
npm start
```
