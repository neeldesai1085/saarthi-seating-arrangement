export type Room = {
    id: string;
    roomName: string;
    rows: number;
    columns: number;
    totalSeats: number;
};

export type Rule = {
    id: string;
    enforceAlternateSeating: boolean;
    fillRoomsCompletely: boolean;
};

export type Student = {
    enrollmentNo: string;
    subjectCode: string;
    subjectName: string;
};

export type SubjectGroup = {
    subjectCode: string;
    students: Student[];
    /** Pointer-based cursor for O(1) consumption. Index of the next student to allocate. */
    cursor: number;
};

export type Seat = {
    row: number;
    column: number;
    side: "LEFT" | "RIGHT";
    student: Student | null;
};

export type SeatingPlan = {
    roomId: string;
    roomName: string;
    seats: Seat[];
    unallocatedStudents: Student[];
};

export type AllocationInput = {
    rooms: Room[];
    students: Student[];
};

export type Invigilator = {
    id: string;
    name: string;
};

export type InvigilatorPlan = {
    roomId: string;
    roomName: string;
    invigilators: Invigilator[];
};

export type InvigilatorAllocationInput = {
    rooms: Room[];
    invigilators: Invigilator[];
};
