import { Router } from 'express';
import * as AICtrl from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/chat', AICtrl.chat);
router.get('/conversations', AICtrl.getConversations);
router.post('/plan-day', AICtrl.planDay);
router.post('/breakdown', AICtrl.breakdownGoal);
router.post('/prioritize', AICtrl.prioritizePending);
router.post('/reschedule-suggestions', AICtrl.getRescheduleSuggestions);
router.post('/apply-plan', AICtrl.applyPlan);

export default router;
