# SmartEHR Medical Records Demo

This is a new local development implementation. It is not the original SmartEHR application and its schema is not a hospital/HIS schema. All records in the migrations are fictional synthetic demo data.

## Setup

1. Copy `backend/.env.example` to `backend/.env` and review the SQL Server settings. Windows Authentication uses `mssql/msnodesqlv8` with an explicit `ODBC Driver 18 for SQL Server` connection string. The project no longer relies on msnodesqlv8's Windows default (`SQL Server Native Client 11.0`).
2. Copy `frontend/.env.example` to `frontend/.env` if you need a different API base URL.
3. Install dependencies with `npm ci` in both `frontend` and `backend`.

## Run

```powershell
cd backend
npm run db       # creates SmartEHR_Demo, applies migrations and synthetic seed data
npm run dev      # http://localhost:3001
```

In another terminal:

```powershell
cd frontend
npm run dev      # http://localhost:5173
```

The demo role is selectable in the top bar. `ADMIN` and `AUDITOR` have full demo access, including document management and Code Chart Access management; `RECORDS_VIEWER` is read-only.

## API

- `GET /api/health`
- `GET /api/patients?search=`
- `GET /api/patients/:patientId`
- `GET /api/admissions/:admissionId`
- `GET /api/documents/admissions/:admissionId/documents`
- `GET /api/documents/:documentId`
- `POST /api/documents`

The upload endpoint accepts JSON metadata plus optional base64 content and stores files under `backend/uploads/demo/` with a generated safe filename.
