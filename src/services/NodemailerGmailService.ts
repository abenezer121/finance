import nodemailer from 'nodemailer';
import { EmailService } from '../interfaces/emailservice';

export type EmailProvider = 'gmail' | 'outlook';

export class NodemailerEmailService implements EmailService {
  private transporter;

  constructor(
    private readonly provider: EmailProvider,
    private readonly email: string,
    private readonly password: string
  ) {
    let serviceConfig: any;

   
      serviceConfig = {
        service: this.provider,
        auth: {
          user: this.email,
          pass: this.password,
        },
      };
 

    this.transporter = nodemailer.createTransport(serviceConfig);
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const mailOptions = {
      from: this.email,
      to,
      subject,
      text: body,
    };

    await this.transporter.sendMail(mailOptions);
  }
}