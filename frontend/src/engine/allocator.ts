import type { AllocationInput, SeatingPlan, Seat, SubjectGroup, Student } from './types';

const groupStudents = (students: Student[]): SubjectGroup[] => {
    const map = new Map<string, SubjectGroup>();
    
    students.forEach(s => {
        if (!map.has(s.subjectCode)) {
            map.set(s.subjectCode, {
                subjectCode: s.subjectCode,
                students: [],
                totalStudents: 0
            });
        }
        const group = map.get(s.subjectCode)!;
        group.students.push(s);
        group.totalStudents += 1;
    });

    const groups = Array.from(map.values());
    groups.forEach(g => {
        g.students.sort((a, b) => a.enrollmentNo.localeCompare(b.enrollmentNo, undefined, { numeric: true, sensitivity: 'base' }));
    });
    
    return groups.sort((a, b) => b.totalStudents - a.totalStudents);
};

export const generateSeatingPlan = ({ rooms, students, rules }: AllocationInput): SeatingPlan[] => {
    const plans: SeatingPlan[] = [];
    let groups = groupStudents(students); 
    let remainingRoomsCapacity = rooms.reduce((acc, r) => acc + r.totalSeats, 0);

    for (const room of rooms) {
        if (groups.length === 0) break;

        const seats: Seat[] = [];
        const totalVerticalCols = room.columns * room.benchCapacity;
        const activeSubjects: (SubjectGroup | null)[] = new Array(totalVerticalCols).fill(null);
        let roomCapacity = room.totalSeats;

        const assignSubjectToColumn = (colIndex: number) => {
            const benchStartIndex = Math.floor(colIndex / room.benchCapacity) * room.benchCapacity;
            const subjectsOnBench = new Set(
                activeSubjects.slice(benchStartIndex, colIndex).filter(s => s !== null).map(s => s!.subjectCode)
            );

            let groupIndex = groups.findIndex(g => !subjectsOnBench.has(g.subjectCode));
            
            if (groupIndex !== -1) {
                activeSubjects[colIndex] = groups.splice(groupIndex, 1)[0];
            } else {
                const totalRemainingStudents = groups.reduce((acc, g) => acc + g.totalStudents, 0) + 
                                            activeSubjects.filter(Boolean).reduce((acc, g) => acc + g!.totalStudents, 0);
                
                if (totalRemainingStudents >= remainingRoomsCapacity && rules.fillRoomsCompletely && groups.length > 0) {
                    activeSubjects[colIndex] = groups.shift()!;
                } else {
                    activeSubjects[colIndex] = null;
                }
            }
        };

        for (let i = 0; i < totalVerticalCols; i++) {
            assignSubjectToColumn(i);
        }

        for (let r = 1; r <= room.rows; r++) {
            for (let c = 1; c <= room.columns; c++) {
                for (let b = 1; b <= room.benchCapacity; b++) {
                const side = b === 1 ? "LEFT" : (b === room.benchCapacity ? "RIGHT" : "MIDDLE");
                const verticalColIndex = ((c - 1) * room.benchCapacity) + (b - 1);
                
                let activeSubject = activeSubjects[verticalColIndex];

                if ((!activeSubject || activeSubject.students.length === 0) && rules.fillRoomsCompletely) {
                    if (activeSubject) groups.push(activeSubject); 
                    activeSubjects[verticalColIndex] = null;
                    assignSubjectToColumn(verticalColIndex);
                    activeSubject = activeSubjects[verticalColIndex];
                }

                let student: Student | null = null;

                if (activeSubject && activeSubject.students.length > 0) {
                    student = activeSubject.students.shift()!;
                    activeSubject.totalStudents--;
                    roomCapacity--;
                } else if (!rules.enforceAlternateSeating) {
                    const anyActive = activeSubjects.find(s => s && s.students.length > 0);
                    if (anyActive) {
                        student = anyActive.students.shift()!;
                        anyActive.totalStudents--;
                        roomCapacity--;
                    }
                }

                seats.push({ row: r, column: c, side, student });
                }
            }
        }

        activeSubjects.forEach(s => {
            if (s && s.students.length > 0) groups.push(s);
        });
        groups = groups.filter(g => g.students.length > 0);
        groups.sort((a, b) => b.totalStudents - a.totalStudents);
        
        remainingRoomsCapacity -= room.totalSeats;

        plans.push({
            roomId: room.id,
            roomName: room.roomName,
            seats: seats.filter(s => s.student !== null)
        });
    }

    const unallocatedStudents: Student[] = [];
    groups.forEach(g => {
        unallocatedStudents.push(...g.students);
    });
    
    if (unallocatedStudents.length > 0 && plans.length > 0) {
        plans[plans.length - 1].unallocatedStudents = unallocatedStudents;
    }

    return plans;
};