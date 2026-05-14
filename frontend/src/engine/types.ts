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
};

export type SubjectGroup = {
    subjectCode: string;
    students: Student[];
    totalStudents: number;
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
    unallocatedStudents?: Student[];
};

export type AllocationInput = {
    rooms: Room[];
    students: Student[];
    rules: Rule;
};
