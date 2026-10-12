import { Router } from 'express';
import * as TaskCtrl from '../controllers/task.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
  taskQuerySchema,
} from '../validators/task.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', validateQuery(taskQuerySchema), TaskCtrl.getTasks);
router.post('/', validateBody(createTaskSchema), TaskCtrl.createTask);
router.get('/:id', TaskCtrl.getTaskById);
router.patch('/:id', validateBody(updateTaskSchema), TaskCtrl.updateTask);
router.patch('/:id/toggle', TaskCtrl.toggleTaskStatus);
router.delete('/:id', TaskCtrl.deleteTask);

// Subtasks
router.post('/:taskId/subtasks', validateBody(createSubtaskSchema), TaskCtrl.createSubtask);
router.patch('/subtasks/:subtaskId', validateBody(updateSubtaskSchema), TaskCtrl.updateSubtask);
router.delete('/subtasks/:subtaskId', TaskCtrl.deleteSubtask);

export default router;
