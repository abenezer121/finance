import Otp from '../models/otp.models';
import { randomInt } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { EmailService } from '../interfaces/emailservice';

type SendOtpHandler = ReturnType<typeof sendOtpFactory>;

const generateOtp = (): string => {
  return randomInt(100000, 999999).toString();
};

export const sendOtpFactory = (emailService: EmailService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { identifier } = req.body;

    if (!identifier) {
      res.status(400).json({ message: 'Identifier (email or phone) is required' });
      return 
    }

    try {
      const otp = generateOtp();

      // Save or update OTP in DB
      await Otp.findOneAndUpdate(
        { identifier },
        {
          otp,
          expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes
          isUsed: false,
        },
        { upsert: true, new: true }
      );

     
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

      if (isEmail) {
        // Use injected email service
        await emailService.sendEmail(identifier, 'Your OTP Code', `Your OTP code is: ${otp}`);
      } else {
        // TODO: Implement SMS sending logic
        console.log(`SMS not implemented yet. OTP: ${otp} for phone: ${identifier}`);
      }

      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ message: 'Failed to send OTP' });
      return 
    }
  };
};

// Verify OTP handler
export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { identifier, otp } = req.body;

  if (!identifier || !otp) {
    res.status(400).json({ message: 'Identifier and OTP are required' });
    return;
  }

  try {
    const otpRecord = await Otp.findOne({ identifier });

    if (!otpRecord) {
      res.status(400).json({ message: 'Invalid OTP' });
      return;
    }

    if (otpRecord.isUsed || otpRecord.expiredAt < new Date()) {
      res.status(400).json({ message: 'OTP expired or already used' });
      return;
    }

    if (otpRecord.otp !== otp) {
      res.status(400).json({ message: 'Invalid OTP' });
      return;
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
};