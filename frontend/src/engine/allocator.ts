import type { AllocationInput, SeatingPlan, SubjectGroup, Student } from './types';

const sortGroups = (groups: SubjectGroup[]) => {
    groups.sort((a, b) => {
        if (b.totalStudents !== a.totalStudents) return b.totalStudents - a.totalStudents;
        return a.subjectCode.localeCompare(b.subjectCode);
    });
};

const groupStudents = (students: Student[]): SubjectGroup[] => {
    const map = new Map<string, SubjectGroup>();
    students.forEach(s => {
        if (!map.has(s.subjectCode)) {
            map.set(s.subjectCode, { subjectCode: s.subjectCode, students: [], totalStudents: 0 });
        }
        const g = map.get(s.subjectCode)!;
        g.students.push(s);
        g.totalStudents++;
    });
    const groups = Array.from(map.values());
    groups.forEach(g => {
        g.students.sort((a, b) => a.enrollmentNo.localeCompare(b.enrollmentNo, undefined, { numeric: true, sensitivity: 'base' }));
    });
    sortGroups(groups);
    return groups;
};

/**
 * HARD CONSTRAINT: Never same subject on both sides of same bench.
 * Leave seats EMPTY rather than violate this.
 *
 * Priority chain per seat:
 *   1. Vertical continuity (same as seat in front) + bench-safe
 *   2. Room-active subject + bench-safe (keeps room to 2 subjects)
 *   3. Any subject + bench-safe (introduces new subject if needed)
 *   4. Leave seat empty (never violate bench constraint)
 *
 * Fill order: Column-major (col → side → row) for sequential enrollment numbers.
 * Precomputed rows ensure compact front-filling.
 */
export const generateSeatingPlan = ({ rooms, students }: AllocationInput): SeatingPlan[] => {
    const groups = groupStudents(students);

    const plansMap = new Map<string, SeatingPlan>();
    rooms.forEach(room => {
        plansMap.set(room.id, { roomId: room.id, roomName: room.roomName, seats: [], unallocatedStudents: [] });
    });

    for (const room of rooms) {
        if (groups.every(g => g.students.length === 0)) break;

        // --- Precompute rows needed ---
        const totalRemaining = groups.reduce((s, g) => s + g.students.length, 0);
        const distinctWithStudents = groups.filter(g => g.students.length > 0).length;
        // If only 1 subject, each row can only seat `columns` students (one side per bench)
        const effectiveSeatsPerRow = distinctWithStudents >= 2 ? room.columns * 2 : room.columns;
        const studentsForRoom = Math.min(totalRemaining, room.rows * effectiveSeatsPerRow);
        if (studentsForRoom === 0) continue;
        const rowsNeeded = Math.ceil(studentsForRoom / effectiveSeatsPerRow);

        const roomPlan = plansMap.get(room.id)!;
        const roomActiveSubjects = new Set<string>();

        // Track what subject is assigned to each column-side for bench constraint checking
        // Key: "col-side", Value: subjectCode
        const columnSideSubject = new Map<string, string>();

        // --- Fill: column → side → row (column-major for sequential enrollment) ---
        for (let c = 1; c <= room.columns; c++) {
            for (const side of ["LEFT", "RIGHT"] as const) {
                // Determine which subject this column-side should use
                let chosenGroup: SubjectGroup | null = null;

                // What subject is on the OTHER side of this column?
                const otherSideKey = `${c}-${side === "LEFT" ? "RIGHT" : "LEFT"}`;
                const otherSideSubject = columnSideSubject.get(otherSideKey) ?? null;

                // Priority 1: Reuse a room-active subject that's bench-safe
                if (!chosenGroup) {
                    for (const subCode of roomActiveSubjects) {
                        if (subCode === otherSideSubject) continue; // bench constraint
                        const g = groups.find(g => g.subjectCode === subCode && g.students.length > 0);
                        if (g) { chosenGroup = g; break; }
                    }
                }

                // Priority 2: Any subject that's bench-safe (may introduce new subject)
                if (!chosenGroup) {
                    sortGroups(groups);
                    chosenGroup = groups.find(g =>
                        g.students.length > 0 && g.subjectCode !== otherSideSubject
                    ) ?? null;
                }

                // Priority 3: LEAVE EMPTY (never violate bench constraint)
                if (!chosenGroup) continue;

                // --- Fill this column-side with students from chosenGroup ---
                columnSideSubject.set(`${c}-${side}`, chosenGroup.subjectCode);
                roomActiveSubjects.add(chosenGroup.subjectCode);

                for (let r = 1; r <= rowsNeeded; r++) {
                    if (chosenGroup.students.length === 0) {
                        // Subject exhausted mid-column. Find replacement (bench-safe).
                        const exhaustedSubject: string = chosenGroup.subjectCode;
                        sortGroups(groups);

                        // Try room-active first
                        let replacement: SubjectGroup | null = null;
                        for (const subCode of roomActiveSubjects) {
                            if (subCode === otherSideSubject || subCode === exhaustedSubject) continue;
                            const g: SubjectGroup | undefined = groups.find(g => g.subjectCode === subCode && g.students.length > 0);
                            if (g) { replacement = g; break; }
                        }
                        // Then any bench-safe subject
                        if (!replacement) {
                            replacement = groups.find(g =>
                                g.students.length > 0 && g.subjectCode !== otherSideSubject
                            ) ?? null;
                        }

                        if (!replacement) break; // No bench-safe subject available, leave remaining empty
                        chosenGroup = replacement;
                        roomActiveSubjects.add(chosenGroup.subjectCode);
                    }

                    const student = chosenGroup.students.shift()!;
                    chosenGroup.totalStudents--;
                    roomPlan.seats.push({ row: r, column: c, side, student });

                    if (chosenGroup.totalStudents === 0) {
                        groups.splice(groups.indexOf(chosenGroup), 1);
                    }
                }
            }
        }

        // Clean up exhausted groups
        sortGroups(groups);
    }

    const plans = Array.from(plansMap.values());

    // Unallocated students
    const unallocated: Student[] = [];
    groups.forEach(g => unallocated.push(...g.students));
    if (unallocated.length > 0 && plans.length > 0) {
        plans[plans.length - 1].unallocatedStudents = unallocated;
    }

    return plans;
};