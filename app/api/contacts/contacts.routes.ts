import express from 'express';
import { getContactsMessageCount } from './contacts.controller';
const router = express.Router();

router.get('/count', getContactsMessageCount);

module.exports = router;

// GET DETAILED MESSAGES
// http://localhost:3000/sms/messages/detail?year=2019&month=1&day=1

// GET MESSAGE COUNT
// http://localhost:3000/sms/messages/count?year=2019month=1