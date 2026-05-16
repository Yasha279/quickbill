import express from 'express';
import { login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { loginValidation } from '../validations/authValidation.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post('/login', loginValidation, validate, login);
router.get('/me', protect, getMe);

export default router;
