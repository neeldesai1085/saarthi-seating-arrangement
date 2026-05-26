# Saarthi Exam Seating Automation System

A robust, full-stack automated exam seating arrangement system. This application takes Excel sheets of students and invigilators, strictly enforces exam-hall constraints (e.g., no two students of the same subject on the same bench), randomly distributes invigilators, and exports beautiful, perfectly-scaled PDFs ready for printing.

---

## 📖 How to Use the Application (Step-by-Step Guide)

### 1. Initial Setup & Deployment
1. **Database:** Ensure your PostgreSQL database is running. Update the `DATABASE_URL` in the `backend/.env` file.
2. **Backend:** Navigate to the `backend/` directory.
   - Run `npm install`
   - Run `npx prisma db push` to initialize the database schema.
   - Run `npm run dev` to start the API server.
3. **Frontend:** Navigate to the `frontend/` directory.
   - Run `npm install`
   - Run `npm run dev` to start the React web application.

### 2. Step 1: Manage Rooms
Before allocating any students, you must define the physical rooms available in your institution.
- Navigate to the **Rooms** tab in the web application.
- Add rooms by specifying the **Room Name**, number of **Rows**, and number of **Columns**.
- *Note:* The system calculates total seats as `Rows × Columns × 2` (assuming 2 seats per bench, Left and Right).

### 3. Step 2: Prepare Excel Files (Strict Conventions)
The system requires highly specific column headers to correctly parse your data.

**Student Data Excel Sheet:**
- `enrollment_no` (Required): The unique ID of the student.
- `subject_code` (Required): The code of the exam they are taking.
- `subject_name` (Optional): The full name of the subject.
- *Deduplication:* If a student is uploaded twice for the *same* subject, the system automatically removes the duplicate.

**Invigilator Data Excel Sheet (Optional):**
- `invigilator_name` (Required): The full name of the invigilator.
- *Note:* Any extra columns in either sheet are safely ignored.

### 4. Step 3: Upload Data
- Navigate to the **Upload** tab.
- Drop your Student Excel file into the first box.
- (Optional) Drop your Invigilator Excel file into the second box.
- Click **Process Files**. The system will validate the data, highlight any row errors, and if successful, navigate you to the Preview page.

### 5. Step 4: Preview & Export
- The **Preview** page instantly runs the Monte Carlo allocation algorithms and displays a visual grid of the seating plan.
- **Color Coding:** Left seats are Blue, Right seats are Green. Hover over any seat to see the subject code.
- **Warnings:** If the system is mathematically forced to leave students unallocated (due to severe constraint blocks), a red warning banner will appear.
- **Export Seating PDF:** Generates a landscape A4 PDF of the seating arrangement. The font size dynamically scales so enrollment numbers never wrap or get cut off.
- **Export Invigilator PDF:** Generates a portrait A4 PDF detailing which invigilators are assigned to which rooms.

---

## 🏗️ Project Architecture

This is a decoupled Full-Stack application. The backend serves only as a persistent configuration store for Rooms, while all heavy algorithmic lifting is done strictly client-side to ensure maximum performance and zero session-persistence bloat.

### Technology Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Zustand (State Management), Zod (Validation), SheetJS/xlsx (Excel Parsing), jsPDF & jspdf-autotable (PDF Generation).
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL.

### Design Decisions
- **Stateless Allocations:** The backend *does not* store generated seating plans. Plans are highly ephemeral and specific to the uploaded Excel sheet. Storing them would require complex session management and massive database overhead.
- **O(1) Data Structures:** The PDF generator uses precomputed HashMaps (`row-col-side` $\rightarrow$ `enrollmentNo`) to map seats instantly, destroying the $O(N^2)$ performance bottleneck typical in nested array searches.

---

## 🧠 The Seating Allocation Algorithm (Deep Dive)

The seating engine is a highly customized, **Monte Carlo Multi-Start Hybrid Room-First Lane Allocator**. It enforces hard constraints while optimizing for the highest possible packing density.

### Hard Constraints
1. **Bench Atomicity:** Two students taking the *same subject* can **never** sit on the same bench (Left and Right).
2. **Sequential Roll Order:** Students within the same subject must be seated in strict sequential enrollment order.
3. **Column-Major Front-Loading:** Rooms must be filled column by column, front to back. Only the required rows should be filled so students aren't scattered at the back of massive halls.

### The Phases of Allocation
1. **Parsing & Grouping:** Students are grouped by `subjectCode`. Each subject queue is sorted by `enrollmentNo`.
2. **Global Packing Plan:** The algorithm calculates the total seats needed globally and assigns a strict `rowsNeeded` budget to each room. This guarantees front-loaded seating.
3. **Random Room Shuffle:** The array of rooms is shuffled using a Fisher-Yates algorithm to ensure the fill order is completely randomized on every generation.
4. **Bench-Atomic Loop:** The engine iterates Column-Major (Column 1 $\rightarrow$ Row 1 $\rightarrow$ Left, Right). It decides the Left and Right seats simultaneously. 
5. **Constraint Enforcement (`pickGroup`):**
   - *Priority 1:* Pick a subject that is already active in the room (to minimize the number of subjects per room) and does not match the other side of the bench.
   - *Priority 2:* Introduce a new subject that doesn't match the other side of the bench.
   - *Priority 3:* If no valid subject exists, the engine is forced to **leave the seat empty**.
   - *Tie-breaking:* If two subjects have the exact same number of remaining students, a random coin-flip tie-breaker decides who gets the lane.

### The Monte Carlo Optimization Wrapper
Because the constraints are so strict, a single random pass might hit a "dead end" where it is forced to leave a seat empty, resulting in unallocated students. 
To solve this, the core algorithm is wrapped in a Monte Carlo loop:
- It silently runs the core allocator **100 times** in the background (taking $<5$ milliseconds).
- It tracks the number of unallocated students per run.
- It automatically returns the specific random permutation that resulted in the **fewest blank spaces** (hunting for a perfect 0-unallocated packing).

---

## 👨‍🏫 Invigilator Allocation Algorithm

The invigilator module distributes staff across the active rooms using mathematical fair-share distribution.

### Constraints & Math
1. **Shuffle:** The invigilator list is fully randomized.
2. **Capacities:** Minimum 3 per room, Maximum 4 per room.
3. **Equal Distribution:** 
   - `baseAmount = Math.floor(Total Invigilators / Total Rooms)`
   - `remainder = Total Invigilators % Total Rooms`
   - The first `remainder` rooms receive `baseAmount + 1`, and the rest receive `baseAmount`.
   - *Example:* 14 invigilators across 3 rooms $\rightarrow$ exactly `4, 4, 4` (2 left unassigned).
4. **Graceful Degradation:** If you provide too few invigilators (e.g., 5 for 3 rooms), the system will allocate `2, 2, 1` and display a warning banner, rather than crashing or blocking generation.

---

## 🛠️ Troubleshooting & FAQ

**Q: My Excel file isn't parsing properly.**
A: Ensure your headers exactly match `enrollment_no` and `subject_code`. While the system auto-trims whitespace and ignores case, major typos will cause row failures. Check the red validation error box on the Upload page for specific row issues.

**Q: Why are there students left unallocated even though I have enough seats?**
A: This happens due to the "No Same-Subject Bench" constraint. If you only have 1 subject left to allocate, the algorithm is forced to leave the other half of the bench empty. Try uploading a more diverse mix of subjects, or more students in general, to give the Monte Carlo optimizer room to find perfect pairings.

**Q: The PDF text is too small.**
A: The PDF engine mathematically scales the text to guarantee the longest enrollment number in the room fits without wrapping. If the font is tiny, it's because either your room has a massive number of columns (e.g., 15+ columns), or one of your students has an unusually long enrollment number string. 

**Q: Can I save the seating arrangement to the database?**
A: No, seating plans are ephemeral by design. You should export the PDF immediately once you are satisfied with the random layout. If you refresh the page, you will need to re-upload the Excel sheet.
