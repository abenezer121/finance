import axios from 'axios';
import { EmailService } from '../interfaces/emailservice';

export class HttpEmailService implements EmailService {
  constructor(private readonly baseUrl: string) {}

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    await axios.post(`${this.baseUrl}/send`, {
      to,
      subject,
      body,
    });
  }
}