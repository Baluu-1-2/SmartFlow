import { Router } from 'express';
import * as TagCtrl from '../controllers/tag.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', TagCtrl.getTags);
router.post('/', TagCtrl.createTag);
router.delete('/:id', TagCtrl.deleteTag);

export default router;
