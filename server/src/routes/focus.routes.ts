import { Router } from 'express';
import * as FocusCtrl from '../controllers/focus.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createFocusSessionSchema } from '../validators/focus.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', FocusCtrl.getFocusHistory);
router.post('/', validateBody(createFocusSessionSchema), FocusCtrl.recordFocusSession);

export default router;
