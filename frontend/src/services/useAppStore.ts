import { create } from "zustand";
import type { Room, Rule, Student, SeatingPlan } from "../engine/types";
import { RoomService, RuleService } from "../services/api";
import { generateSeatingPlan } from "../engine/allocator";

interface AppState {
    rooms: Room[];
    rules: Rule | null;
    students: Student[];
    seatingPlans: SeatingPlan[];
    isLoading: boolean;
    error: string | null;

    fetchRooms: () => Promise<void>;
    fetchRules: () => Promise<void>;
    setStudents: (students: Student[]) => void;
    generatePlan: () => void;
    addRoom: (room: Omit<Room, "id" | "totalSeats">) => Promise<void>;
    removeRoom: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
    rooms: [],
    rules: null,
    students: [],
    seatingPlans: [],
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

    generatePlan: () => {
        const { rooms, students, rules } = get();
        if (!rules) {
            set({ error: "Rules not loaded" });
            return;
        }
        if (rooms.length === 0 || students.length === 0) {
            set({ error: "Missing rooms or students" });
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const plans = generateSeatingPlan({ rooms, students, rules });
            set({ seatingPlans: plans, isLoading: false });
        } catch (err: any) {
            set({
                error: "Failed to generate plan: " + err.message,
                isLoading: false,
            });
        }
    },

    addRoom: async (roomData) => {
        set({ isLoading: true });
        try {
            const newRoom = await RoomService.create(roomData);
            set((state) => ({
                rooms: [...state.rooms, newRoom],
                isLoading: false,
            }));
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    removeRoom: async (id) => {
        set({ isLoading: true });
        try {
            await RoomService.delete(id);
            set((state) => ({
                rooms: state.rooms.filter((r) => r.id !== id),
                isLoading: false,
            }));
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },
}));
