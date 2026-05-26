import { create } from 'zustand';
import type { Room, Rule, Student, SeatingPlan, Invigilator, InvigilatorPlan } from '../engine/types';
import { RoomService, RuleService } from '../services/api';
import { generateSeatingPlan } from '../engine/allocator';
import { generateInvigilatorPlan as generateInvigPlan } from '../engine/invigilatorAllocator';

interface AppState {
    rooms: Room[];
    rules: Rule | null;
    students: Student[];
    seatingPlans: SeatingPlan[];
    
    invigilators: Invigilator[];
    invigilatorPlans: InvigilatorPlan[];
    unallocatedInvigilators: Invigilator[];

    isLoading: boolean;
    error: string | null;

    fetchRooms: () => Promise<void>;
    fetchRules: () => Promise<void>;
    setStudents: (students: Student[]) => void;
    setInvigilators: (invigilators: Invigilator[]) => void;
    generatePlan: () => void;
    generateInvigilatorPlan: () => void;
    addRoom: (room: Omit<Room, 'id' | 'totalSeats'>) => Promise<void>;
    removeRoom: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
    rooms: [],
    rules: null,
    students: [],
    seatingPlans: [],
    invigilators: [],
    invigilatorPlans: [],
    unallocatedInvigilators: [],
    isLoading: false,
    error: null,

    fetchRooms: async () => {
        set({ isLoading: true });
        try {
            const rooms = await RoomService.getAll();
            set({ rooms, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    fetchRules: async () => {
        set({ isLoading: true });
        try {
            const rules = await RuleService.get();
            set({ rules, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    setStudents: (students) => {
        set({ students });
    },

    setInvigilators: (invigilators) => {
        set({ invigilators });
    },

    generatePlan: () => {
        const { rooms, students } = get();
        if (rooms.length === 0 || students.length === 0) {
            set({ error: 'Missing rooms or students' });
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const plans = generateSeatingPlan({ rooms, students });
            set({ seatingPlans: plans, isLoading: false });
        } catch (err: any) {
            set({ error: 'Failed to generate plan: ' + err.message, isLoading: false });
        }
    },

    generateInvigilatorPlan: () => {
        const { rooms, invigilators } = get();
        if (rooms.length === 0 || invigilators.length === 0) {
            set({ error: 'Missing rooms or invigilators' });
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const { plans, unallocated } = generateInvigPlan({ rooms, invigilators });
            set({ invigilatorPlans: plans, unallocatedInvigilators: unallocated, isLoading: false });
        } catch (err: any) {
            set({ error: 'Failed to generate invigilator plan: ' + err.message, isLoading: false });
        }
    },

    addRoom: async (roomData) => {
        set({ isLoading: true });
        try {
            const newRoom = await RoomService.create(roomData);
            set((state) => ({ rooms: [...state.rooms, newRoom], isLoading: false }));
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    removeRoom: async (id) => {
        set({ isLoading: true });
        try {
            await RoomService.delete(id);
            set((state) => ({
                rooms: state.rooms.filter(r => r.id !== id),
                isLoading: false,
            }));
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },
}));
