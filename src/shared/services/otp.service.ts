import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  async sendOtp(phoneNumber: string, otpCode: string, channel: string = 'whatsapp-sms') {
    // In production, integrate with a real SMS provider (e.g., Twilio, InfoBip)
    this.logger.log(`[OTP] Sending OTP ${otpCode} to ${phoneNumber} via ${channel}`);
    
    // Simulate successful API call
    return {
      status: 200,
      message: 'OTP sent successfully',
    };
  }
}
