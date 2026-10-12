import { Router } from 'express';
import * as ProjectCtrl from '../controllers/project.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', ProjectCtrl.getProjects);
router.post('/', validateBody(createProjectSchema), ProjectCtrl.createProject);
router.get('/:id', ProjectCtrl.getProjectById);
router.patch('/:id', validateBody(updateProjectSchema), ProjectCtrl.updateProject);
router.delete('/:id', ProjectCtrl.deleteProject);

export default router;
