import type { AllocationInput, SeatingPlan, SubjectGroup, Student } from './types';

// ── helpers ──────────────────────────────────────────────────────────

/** Number of remaining students in a group (pointer-based). */
const remaining = (g: SubjectGroup): number => g.students.length - g.cursor;

/** Take the next student from a group. Returns null if exhausted. */
const take = (g: SubjectGroup): Student | null => {
    if (g.cursor >= g.students.length) return null;
    return g.students[g.cursor++];
};

/** Fisher-Yates shuffle (in-place). */
const shuffle = <T>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

/** Group students by subjectCode, sort within each group by enrollmentNo, sort groups by size desc. */
const buildGroups = (students: Student[]): SubjectGroup[] => {
    const map = new Map<string, Student[]>();
    for (const s of students) {
        let list = map.get(s.subjectCode);
        if (!list) { list = []; map.set(s.subjectCode, list); }
        list.push(s);
    }
    const groups: SubjectGroup[] = [];
    for (const [code, list] of map) {
        list.sort((a, b) => a.enrollmentNo.localeCompare(b.enrollmentNo, undefined, { numeric: true, sensitivity: 'base' }));
        groups.push({ subjectCode: code, students: list, cursor: 0 });
    }
    sortGroups(groups);
    return groups;
};

/** Sort groups in-place by remaining count desc, with random tie-breaking. */
const sortGroups = (groups: SubjectGroup[]): void => {
    groups.sort((a, b) => {
        const diff = remaining(b) - remaining(a);
        if (diff !== 0) return diff;
        // Random tie-break when groups are equally sized
        return Math.random() - 0.5;
    });
};

/**
 * Pick the best group for a seat, respecting bench constraint.
 *
 * @param preferred - Subject to prefer for vertical continuity (same as row above, same side).
 * @param forbidden - Subject on the OTHER side of this bench. Must never match.
 */
const pickGroup = (
    groups: SubjectGroup[],
    roomActive: Set<string>,
    preferred: string | null,
    forbidden: string | null,
): SubjectGroup | null => {
    // Priority 0: preferred subject (vertical continuity) if bench-safe
    if (preferred && preferred !== forbidden) {
        const g = groups.find(g => g.subjectCode === preferred && remaining(g) > 0);
        if (g) return g;
    }
    // Priority 1: room-active subject that is bench-safe (minimize subjects per room)
    for (const code of roomActive) {
        if (code === forbidden) continue;
        const g = groups.find(g => g.subjectCode === code && remaining(g) > 0);
        if (g) return g;
    }
    // Priority 2: any subject that is bench-safe (introduces new subject)
    sortGroups(groups);
    for (const g of groups) {
        if (remaining(g) > 0 && g.subjectCode !== forbidden) return g;
    }
    // Priority 3: no valid subject → leave seat empty
    return null;
};

// ── main allocator ──────────────────────────────────────────────────

const generateSinglePlan = ({ rooms, students }: AllocationInput): SeatingPlan[] => {
    const groups = buildGroups(students);
    const totalStudents = students.length;

    // Phase 3: Randomize room order
    const shuffledRooms = shuffle([...rooms]);

    // Phase 4: Global room packing plan – compute rows needed per room
    const roomRowsMap = new Map<string, number>();
    let budgetLeft = totalStudents;
    for (const room of shuffledRooms) {
        if (budgetLeft <= 0) { roomRowsMap.set(room.id, 0); continue; }
        const seatsPerRow = room.columns * 2;
        const maxSeats = room.rows * seatsPerRow;
        const consume = Math.min(budgetLeft, maxSeats);
        const rowsNeeded = Math.ceil(consume / seatsPerRow);
        roomRowsMap.set(room.id, rowsNeeded);
        budgetLeft -= consume;
    }

    // Initialise plan map (keeps original room order for output)
    const plansMap = new Map<string, SeatingPlan>();
    for (const room of rooms) {
        plansMap.set(room.id, { roomId: room.id, roomName: room.roomName, seats: [], unallocatedStudents: [] });
    }

    // Phase 5-7: Room-level bench-atomic allocation
    for (const room of shuffledRooms) {
        const rowsNeeded = roomRowsMap.get(room.id)!;
        if (rowsNeeded === 0) continue;
        if (groups.every(g => remaining(g) === 0)) break;

        const roomPlan = plansMap.get(room.id)!;
        const roomActive = new Set<string>();

        // Track the current subject flowing down each column-side for vertical continuity.
        // Key: "col-side" → subjectCode of the last student placed in that lane.
        const laneSubject = new Map<string, string>();

        // Column-major, bench-atomic:
        for (let c = 1; c <= room.columns; c++) {
            for (let r = 1; r <= rowsNeeded; r++) {

                // ── LEFT seat ──
                const leftPreferred = laneSubject.get(`${c}-LEFT`) ?? null;
                const leftGroup = pickGroup(groups, roomActive, leftPreferred, null);

                let leftSubject: string | null = null;
                if (leftGroup && remaining(leftGroup) > 0) {
                    const student = take(leftGroup)!;
                    roomPlan.seats.push({ row: r, column: c, side: 'LEFT', student });
                    leftSubject = leftGroup.subjectCode;
                    laneSubject.set(`${c}-LEFT`, leftSubject);
                    roomActive.add(leftSubject);
                }

                // ── RIGHT seat ──
                const rightPreferred = laneSubject.get(`${c}-RIGHT`) ?? null;
                const rightGroup = pickGroup(groups, roomActive, rightPreferred, leftSubject);

                if (rightGroup && remaining(rightGroup) > 0) {
                    const student = take(rightGroup)!;
                    roomPlan.seats.push({ row: r, column: c, side: 'RIGHT', student });
                    laneSubject.set(`${c}-RIGHT`, rightGroup.subjectCode);
                    roomActive.add(rightGroup.subjectCode);
                }
            }
        }
    }

    // Phase 8: Assemble output in original room order and collect unallocated
    const plans = rooms.map(r => plansMap.get(r.id)!);
    const unallocated: Student[] = [];
    for (const g of groups) {
        for (let i = g.cursor; i < g.students.length; i++) {
            unallocated.push(g.students[i]);
        }
    }
    if (unallocated.length > 0 && plans.length > 0) {
        plans[plans.length - 1].unallocatedStudents = unallocated;
    }

    return plans;
};

/**
 * Monte Carlo Optimization Wrapper
 * Runs the randomized allocator multiple times and returns the plan
 * that leaves the fewest unallocated students (minimizing blank spaces).
 */
export const generateSeatingPlan = (input: AllocationInput): SeatingPlan[] => {
    let bestPlans: SeatingPlan[] | null = null;
    let minUnallocated = Infinity;

    const ITERATIONS = 100; // 100 passes is near-instant in JS for typical inputs

    for (let i = 0; i < ITERATIONS; i++) {
        const currentPlans = generateSinglePlan(input);
        
        // Count total unallocated
        const lastRoom = currentPlans[currentPlans.length - 1];
        const unallocatedCount = lastRoom && lastRoom.unallocatedStudents ? lastRoom.unallocatedStudents.length : input.students.length;
        
        if (unallocatedCount < minUnallocated) {
            minUnallocated = unallocatedCount;
            bestPlans = currentPlans;
            
            // If we found a perfect packing, we can stop early
            if (minUnallocated === 0) break;
        }
    }

    return bestPlans || generateSinglePlan(input);
};