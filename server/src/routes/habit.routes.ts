import { Router } from 'express';
import * as HabitCtrl from '../controllers/habit.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  createHabitSchema,
  updateHabitSchema,
  toggleHabitDateSchema,
} from '../validators/habit.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', HabitCtrl.getHabits);
router.post('/', validateBody(createHabitSchema), HabitCtrl.createHabit);
router.patch('/:id', validateBody(updateHabitSchema), HabitCtrl.updateHabit);
router.post('/:id/toggle-date', validateBody(toggleHabitDateSchema), HabitCtrl.toggleHabitDate);
router.delete('/:id', HabitCtrl.deleteHabit);

export default router;
