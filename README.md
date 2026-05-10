# Exam Seating Automation System

A production-grade, highly scalable, and purely deterministic web application to automate exam seating arrangements. Built for college administrators with a focus on simplicity, speed, and accuracy.

## Features
- **Deterministic Allocation Engine**: No random seating. The algorithm ensures strictly identical outputs for identical inputs, completely eliminating ambiguity.
- **Rule-Based Arrangement**: Configurable rules for alternate seating, maximum subjects per room, and bench capacities.
- **Excel/CSV Upload**: Seamless student data upload with robust parsing and validation.
- **Printable PDF Export**: Automatically generated A4 landscape seating grids per room.
- **No-Session Database**: Backend is stateless for sessions, operating directly off the uploaded files and room configurations to maximize privacy and simplicity.

## Tech Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Zustand, SheetJS (xlsx), jsPDF.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL.

## Project Structure
The project is split into two directories: `frontend` and `backend`. 

---

## Setup Instructions

### 1. Database Setup (PostgreSQL)
Ensure PostgreSQL is running locally. Create a database named `exam_seating`.

### 2. Backend Setup
1. Open terminal in the `backend` folder.
2. Run `npm install`
3. Edit the `.env` file to match your PostgreSQL credentials:
   `DATABASE_URL="postgresql://postgres:password@localhost:5432/exam_seating?schema=public"`
4. Run Prisma migrations:
   `npx prisma migrate dev --name init`
5. Start the backend:
   `npm run dev` (API runs on http://localhost:5000)

### 3. Frontend Setup
1. Open a new terminal in the `frontend` folder.
2. Run `npm install`
3. Create a `.env` file in the frontend root:
   `VITE_API_URL=http://localhost:5000/api`
4. Start the frontend server:
   `npm run dev`
5. Open your browser to `http://localhost:5173`

## Usage Workflow
1. Navigate to **Rooms** and add your exam halls (e.g., Room 101, 5 rows, 4 columns, 2 capacity).
2. Navigate to **Upload Data** and upload an Excel file (`.xlsx`) with headers: `enrollment_no`, `subject_code`, `subject_name`.
3. Click **Process File**.
4. You will be redirected to the **Preview** page where the seats are allocated automatically.
5. Click **Export PDF** to download the printable grids.

