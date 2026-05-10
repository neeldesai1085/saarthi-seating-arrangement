import { Router } from 'express';
import { getRules, updateRules } from '../controllers/ruleController.js';

const router = Router();

router.get('/', getRules);
router.put('/', updateRules);

export default router;
