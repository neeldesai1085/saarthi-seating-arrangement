import type { AllocationInput, SeatingPlan, SubjectGroup, Student } from './types';

interface GlobalSeat {
    roomId: string;
    roomName: string;
    row: number;
    column: number;
    side: "LEFT" | "RIGHT";
    student: Student | null;
    benchId: string;
}

const sortGroups = (groups: SubjectGroup[]) => {
    groups.sort((a, b) => {
        if (b.totalStudents !== a.totalStudents) {
            return b.totalStudents - a.totalStudents;
        }
        return a.subjectCode.localeCompare(b.subjectCode);
    });
};

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
    
    sortGroups(groups);
    return groups;
};

export const generateSeatingPlan = ({ rooms, students, rules }: AllocationInput): SeatingPlan[] => {
    const groups = groupStudents(students);
    
    // 1. Build Global Seat Array with precomputed row limits
    const globalSeats: GlobalSeat[] = [];
    let remainingStudents = students.length;
    
    for (const room of rooms) {
        if (remainingStudents <= 0) break;
        
        const seatsPerRow = room.columns * 2;
        const studentsForThisRoom = Math.min(remainingStudents, room.rows * seatsPerRow);
        const rowsNeeded = Math.ceil(studentsForThisRoom / seatsPerRow);
        remainingStudents -= studentsForThisRoom;
        
        // Column-major within the precomputed rows only
        for (let c = 1; c <= room.columns; c++) {
            for (let r = 1; r <= rowsNeeded; r++) {
                const sides: Array<"LEFT" | "RIGHT"> = ["LEFT", "RIGHT"];
                for (const side of sides) {
                    globalSeats.push({
                        roomId: room.id,
                        roomName: room.roomName,
                        row: r,
                        column: c,
                        side,
                        student: null,
                        benchId: `${room.id}-C${c}-R${r}`
                    });
                }
            }
        }
    }

    // 2. Global Allocation Loop
    let currentSeatIndex = 0;
    
    while (groups.length > 0 && currentSeatIndex < globalSeats.length) {
        const seat = globalSeats[currentSeatIndex];
        
        let prioritySubject: string | null = null;
        const avoidSubjects = new Set<string>();

        // Force vertical uniformity: Look at the seat directly in front (same col, same side, row - 1)
        if (seat.row > 1) {
            for (let i = currentSeatIndex - 1; i >= 0; i--) {
                const pastSeat = globalSeats[i];
                if (pastSeat.roomId === seat.roomId && pastSeat.column === seat.column) {
                    if (pastSeat.row === seat.row - 1 && pastSeat.side === seat.side && pastSeat.student) {
                        prioritySubject = pastSeat.student.subjectCode;
                        break;
                    }
                } else if (pastSeat.roomId !== seat.roomId || pastSeat.column !== seat.column) {
                    break; 
                }
            }
        }

        if (rules.enforceAlternateSeating) {
            // Horizontal alternating: Avoid the subject of the horizontally adjacent seat to the left
            let leftAdjacentSeat = null;
            for (let i = currentSeatIndex - 1; i >= 0; i--) {
                const pastSeat = globalSeats[i];
                if (pastSeat.roomId !== seat.roomId) continue;

                // Same bench, different side (the seat right next to us)
                if (pastSeat.column === seat.column && pastSeat.row === seat.row) {
                    leftAdjacentSeat = pastSeat;
                    break;
                }
                
                // Adjacent bench (previous column, same row)
                if (pastSeat.column === seat.column - 1 && pastSeat.row === seat.row) {
                    leftAdjacentSeat = pastSeat;
                    break;
                }
            }

            if (leftAdjacentSeat && leftAdjacentSeat.student) {
                avoidSubjects.add(leftAdjacentSeat.student.subjectCode);
            }
        }

        let selectedGroupIndex = -1;

        // Priority: continue the same subject from the row above
        if (prioritySubject) {
            selectedGroupIndex = groups.findIndex(g => g.subjectCode === prioritySubject);
        }

        // Otherwise pick the largest group that doesn't violate adjacency
        if (selectedGroupIndex === -1) {
            selectedGroupIndex = groups.findIndex(g => !avoidSubjects.has(g.subjectCode));
        }
        
        // Fallback: pick the absolute largest if no other option
        if (selectedGroupIndex === -1 && groups.length > 0) {
            selectedGroupIndex = 0;
        }

        if (selectedGroupIndex !== -1) {
            const group = groups[selectedGroupIndex];
            seat.student = group.students.shift()!;
            group.totalStudents--;

            if (group.totalStudents === 0) {
                groups.splice(selectedGroupIndex, 1);
            }
            sortGroups(groups);
            
            currentSeatIndex++;
        } else {
            break;
        }
    }

    // 3. Reconstruct Seating Plans per Room
    const plansMap = new Map<string, SeatingPlan>();
    
    rooms.forEach(room => {
        plansMap.set(room.id, {
            roomId: room.id,
            roomName: room.roomName,
            seats: [],
            unallocatedStudents: []
        });
    });

    globalSeats.forEach(seat => {
        if (seat.student) {
            plansMap.get(seat.roomId)!.seats.push({
                row: seat.row,
                column: seat.column,
                side: seat.side,
                student: seat.student
            });
        }
    });

    const plans = Array.from(plansMap.values());

    // 4. Handle remaining unallocated students
    const unallocatedStudents: Student[] = [];
    groups.forEach(g => {
        unallocatedStudents.push(...g.students);
    });

    if (unallocatedStudents.length > 0 && plans.length > 0) {
        plans[plans.length - 1].unallocatedStudents = unallocatedStudents;
    }

    return plans;
};