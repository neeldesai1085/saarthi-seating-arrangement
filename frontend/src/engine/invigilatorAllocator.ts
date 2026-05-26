import type { InvigilatorAllocationInput, InvigilatorPlan, Invigilator } from './types';

/** Fisher-Yates shuffle (in-place) */
const shuffle = <T>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

export const generateInvigilatorPlan = ({ rooms, invigilators }: InvigilatorAllocationInput): {
    plans: InvigilatorPlan[];
    unallocated: Invigilator[];
} => {
    if (rooms.length === 0) return { plans: [], unallocated: invigilators };
    if (invigilators.length === 0) {
        return {
            plans: rooms.map(r => ({ roomId: r.id, roomName: r.roomName, invigilators: [] })),
            unallocated: []
        };
    }

    // 1. Shuffle invigilators randomly for this generation
    const shuffledInvigilators = shuffle([...invigilators]);
    
    // 2. Math for equal distribution
    const R = rooms.length;
    const I = shuffledInvigilators.length;
    const MAX_PER_ROOM = 4;
    
    const I_alloc = Math.min(I, R * MAX_PER_ROOM);
    const baseAmount = Math.floor(I_alloc / R);
    const remainder = I_alloc % R;

    const plans: InvigilatorPlan[] = [];
    let cursor = 0;

    for (let i = 0; i < R; i++) {
        // First 'remainder' rooms get baseAmount + 1, rest get baseAmount
        const countForRoom = baseAmount + (i < remainder ? 1 : 0);
        
        const roomInvigilators = shuffledInvigilators.slice(cursor, cursor + countForRoom);
        cursor += countForRoom;

        plans.push({
            roomId: rooms[i].id,
            roomName: rooms[i].roomName,
            invigilators: roomInvigilators
        });
    }

    const unallocated = shuffledInvigilators.slice(cursor);

    return { plans, unallocated };
};
