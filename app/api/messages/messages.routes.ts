import express from 'express';
import { getMessageCount, getDetailedMessages } from './messages.controller';
const router = express.Router();

router.get('/detail/:year/:month/:day', getDetailedMessages);
router.get('/count', getMessageCount);

module.exports = router;

// GET DETAILED MESSAGES
// http://localhost:3000/sms/messages/detail?year=2019&month=1&day=1

// GET MESSAGE COUNT
// http://localhost:3000/sms/messages/count?year=2019month=1