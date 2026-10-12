import { Router } from 'express';
import * as AnalyticsCtrl from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', AnalyticsCtrl.getAnalytics);

export default router;
