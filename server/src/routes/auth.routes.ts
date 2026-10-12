import { Router } from 'express';
import * as AuthCtrl from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updatePasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', validateBody(registerSchema), AuthCtrl.register);
router.post('/login', validateBody(loginSchema), AuthCtrl.login);
router.post('/logout', AuthCtrl.logout);
router.get('/me', requireAuth, AuthCtrl.getMe);
router.put('/profile', requireAuth, validateBody(updateProfileSchema), AuthCtrl.updateProfile);
router.put('/password', requireAuth, validateBody(updatePasswordSchema), AuthCtrl.updatePassword);
router.get('/export', requireAuth, AuthCtrl.exportData);
router.post('/delete-account', requireAuth, AuthCtrl.deleteAccount);

export default router;
