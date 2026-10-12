import { Router } from 'express';
import * as NotifCtrl from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', NotifCtrl.getNotifications);
router.patch('/:id/read', NotifCtrl.markAsRead);
router.post('/mark-all-read', NotifCtrl.markAllAsRead);

export default router;
