import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
export const getRooms = async (req: Request, res: Response) => {
    try {
        const rooms = await prisma.room.findMany();
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
};
export const createRoom = async (req: Request, res: Response) => {
    try {
        const { roomName, rows, columns, benchCapacity } = req.body;
        const totalSeats = rows * columns * benchCapacity;
        const room = await prisma.room.create({
            data: { roomName, rows, columns, benchCapacity, totalSeats },
        });
        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create room' });
    }
};
export const updateRoom = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { roomName, rows, columns, benchCapacity } = req.body;
        const totalSeats = rows * columns * benchCapacity;
        const room = await prisma.room.update({
            where: { id },
            data: { roomName, rows, columns, benchCapacity, totalSeats },
        });
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update room' });
    }
};
export const deleteRoom = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.room.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete room' });
    }
};