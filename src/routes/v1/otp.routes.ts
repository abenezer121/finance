import express from 'express';
import { sendOtpFactory, verifyOtp } from '../../controllers/otp.controller';
import { NodemailerEmailService , EmailProvider } from '../../services/NodemailerGmailService';
import config from '../../config/config';

const router = express.Router();

// const emailService = new HttpEmailService('https://your-email-service.com ');

const getEmailProvider = (service : string) : EmailProvider  =>  {
    switch(service) {
        case "gmail":
            return "gmail"
        case "outlook":
            return "outlook"
        default :
        return "gmail"
    }
}


const emailService = new NodemailerEmailService(getEmailProvider(config.service), config.user, config.password);

const sendOtp = sendOtpFactory(emailService);

router.post('/send-otp', (req , res , next)=>{
    sendOtp(req, res , next).catch(next)
});
router.post('/verify-otp', (req , res,  next)=>{
    verifyOtp(req , res , next).catch(next)
});

export default router;

