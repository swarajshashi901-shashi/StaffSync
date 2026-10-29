# StaffSync — HR Management System

A ready-to-run beginner-friendly HR management project with:
- Dashboard statistics
- Employee directory (add, search, edit, delete)
- Attendance marking and history
- Leave requests (submit, approve, reject)
- Announcements
- Persistent JSON-file storage (no database account or installation required)

## Requirements
- Node.js (LTS recommended)
- VS Code (recommended)

## Start the project on Windows

1. Extract the ZIP file.
2. Open the extracted `StaffSync` folder in VS Code.
3. Open Terminal → New Terminal.
4. Install dependencies:

   ```powershell
   npm run install:all
   ```

5. Start the backend in Terminal 1:

   ```powershell
   npm run dev:backend
   ```

   Expected: `StaffSync API running at http://localhost:5000`

6. Start the frontend in Terminal 2:

   ```powershell
   npm run dev:frontend
   ```

7. Open the local URL Vite prints, usually `http://localhost:5173`.

Keep both terminals running while using the app.

## Demo data and persistence
The backend creates `backend/data/db.json` automatically and seeds sample employees, attendance, leave requests, and announcements on first run. Changes persist in this file across restarts.

## API endpoints
- `GET /api/health`
- `GET/POST /api/employees`
- `PUT/DELETE /api/employees/:id`
- `GET/POST /api/attendance`
- `GET/POST /api/leaves`
- `PATCH /api/leaves/:id` with `{ "status": "Approved" }` or `{ "status": "Rejected" }`
- `GET/POST /api/announcements`
- `GET /api/dashboard`

## Notes
This is a local demo/academic project, not a production HR system. It does not include production-grade authentication, authorization, backups, or privacy controls. Do not store real employee personal information in this demo. JSON-file storage is intended for local development; use a secured database and authentication before deployment.
