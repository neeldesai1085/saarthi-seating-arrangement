import { Router } from 'express';
import { getRooms, createRoom, updateRoom, deleteRoom, reorderRooms } from '../controllers/roomController.js';

const router = Router();

router.get('/', getRooms);
router.post('/', createRoom);
router.put('/reorder', reorderRooms);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);

export default router;