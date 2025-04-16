import { Booking, User, Venue, Package } from '../types';

// You can replace this with your preferred email service provider
// Options include: SendGrid, Mailgun, AWS SES, etc.
// This is a placeholder implementation that you'll need to customize

interface EmailTemplate {
  subject: string;
  body: string;
}

class EmailService {
  /**
   * Sends an email using the configured email provider
   */
  private async sendEmail(to: string, subject: string, body: string): Promise<void> {
    try {
      // This is where you'd integrate with your email service provider's API
      // Example with SendGrid:
      /*
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const msg = {
        to,
        from: this.FROM_EMAIL,
        subject,
        html: body,
      };
      
      await sgMail.send(msg);
      */
      
      // For now, let's just log the email for development purposes
      console.log('📧 Sending email:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      
      // Return a resolved promise since we're not actually sending the email yet
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Booking created notification
   */
  async sendBookingConfirmation(booking: Booking, user: User, venue: Venue, packageInfo: Package): Promise<void> {
    const template = this.getBookingConfirmationTemplate(booking, user, venue, packageInfo);
    return this.sendEmail(user.email, template.subject, template.body);
  }

  /**
   * Booking status changed notification
   */
  async sendBookingStatusUpdate(booking: Booking, user: User, venue: Venue): Promise<void> {
    const template = this.getBookingStatusUpdateTemplate(booking, user, venue);
    return this.sendEmail(user.email, template.subject, template.body);
  }

  /**
   * Booking reminder (24 hours before)
   */
  async sendBookingReminder(booking: Booking, user: User, venue: Venue): Promise<void> {
    const template = this.getBookingReminderTemplate(booking, user, venue);
    return this.sendEmail(user.email, template.subject, template.body);
  }

  /**
   * Post-booking feedback request
   */
  async sendFeedbackRequest(booking: Booking, user: User, venue: Venue): Promise<void> {
    const template = this.getFeedbackRequestTemplate(booking, user, venue);
    return this.sendEmail(user.email, template.subject, template.body);
  }

  /**
   * Welcome email for new users
   */
  async sendWelcomeEmail(user: User): Promise<void> {
    const template = this.getWelcomeEmailTemplate(user);
    return this.sendEmail(user.email, template.subject, template.body);
  }

  /**
   * Weekly summary email with upcoming bookings
   */
  async sendWeeklySummary(user: User, upcomingBookings: Booking[]): Promise<void> {
    const template = this.getWeeklySummaryTemplate(user, upcomingBookings);
    return this.sendEmail(user.email, template.subject, template.body);
  }

  // Email templates - these could be moved to separate template files for better organization

  private getBookingConfirmationTemplate(booking: Booking, user: User, venue: Venue, packageInfo: Package): EmailTemplate {
    return {
      subject: `Your CommonSpace Booking at ${venue.name} is Confirmed`,
      body: `
        <div>
          <h2>Booking Confirmation</h2>
          <p>Hi ${user.name},</p>
          <p>Your booking at ${venue.name} has been confirmed.</p>
          <div style="margin: 20px 0; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h3>Booking Details</h3>
            <p><strong>Venue:</strong> ${venue.name}</p>
            <p><strong>Package:</strong> ${packageInfo.name}</p>
            <p><strong>Date:</strong> ${new Date(booking.date.seconds * 1000).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${booking.time}</p>
            <p><strong>Duration:</strong> ${booking.duration} hours</p>
            <p><strong>Status:</strong> ${booking.status}</p>
          </div>
          <p>If you need to make any changes to your booking, please log in to your account.</p>
          <p>Thank you for choosing CommonSpace!</p>
        </div>
      `
    };
  }

  private getBookingStatusUpdateTemplate(booking: Booking, user: User, venue: Venue): EmailTemplate {
    let statusMessage = '';
    
    switch (booking.status) {
      case 'confirmed':
        statusMessage = 'Your booking has been confirmed.';
        break;
      case 'cancelled':
        statusMessage = 'Your booking has been cancelled.';
        break;
      case 'completed':
        statusMessage = 'Your booking has been marked as completed.';
        break;
      case 'in_progress':
        statusMessage = 'Your booking is now in progress.';
        break;
      case 'no_show':
        statusMessage = 'You were marked as a no-show for your booking.';
        break;
      default:
        statusMessage = `Your booking status has been updated to ${booking.status}.`;
    }
    
    return {
      subject: `Booking Status Update - ${venue.name}`,
      body: `
        <div>
          <h2>Booking Status Update</h2>
          <p>Hi ${user.name},</p>
          <p>${statusMessage}</p>
          <div style="margin: 20px 0; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h3>Booking Details</h3>
            <p><strong>Venue:</strong> ${venue.name}</p>
            <p><strong>Date:</strong> ${new Date(booking.date.seconds * 1000).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${booking.time}</p>
          </div>
          <p>If you have any questions, please contact us.</p>
        </div>
      `
    };
  }

  private getBookingReminderTemplate(booking: Booking, user: User, venue: Venue): EmailTemplate {
    return {
      subject: `Reminder: Your Booking at ${venue.name} Tomorrow`,
      body: `
        <div>
          <h2>Booking Reminder</h2>
          <p>Hi ${user.name},</p>
          <p>This is a friendly reminder about your booking at ${venue.name} tomorrow.</p>
          <div style="margin: 20px 0; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h3>Booking Details</h3>
            <p><strong>Venue:</strong> ${venue.name}</p>
            <p><strong>Date:</strong> ${new Date(booking.date.seconds * 1000).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${booking.time}</p>
            <p><strong>Address:</strong> ${venue.address}</p>
          </div>
          <p>We look forward to seeing you!</p>
        </div>
      `
    };
  }

  private getFeedbackRequestTemplate(booking: Booking, user: User, venue: Venue): EmailTemplate {
    return {
      subject: `How was your experience at ${venue.name}?`,
      body: `
        <div>
          <h2>Share Your Feedback</h2>
          <p>Hi ${user.name},</p>
          <p>Thank you for using CommonSpace! We hope you enjoyed your time at ${venue.name}.</p>
          <p>We'd love to hear about your experience. Please take a moment to leave your feedback.</p>
          <div style="margin: 20px 0; text-align: center;">
            <a href="https://commonspace.com/feedback/${booking.id}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Leave Feedback</a>
          </div>
          <p>Your feedback helps us improve our service and assists other users in finding the perfect space for their needs.</p>
        </div>
      `
    };
  }

  private getWelcomeEmailTemplate(user: User): EmailTemplate {
    return {
      subject: `Welcome to CommonSpace, ${user.name}!`,
      body: `
        <div>
          <h2>Welcome to CommonSpace!</h2>
          <p>Hi ${user.name},</p>
          <p>Thank you for joining CommonSpace! We're excited to have you as part of our community.</p>
          <p>With CommonSpace, you can:</p>
          <ul>
            <li>Discover and book cafes and coworking spaces</li>
            <li>Manage your bookings in one place</li>
            <li>Receive real-time updates on your bookings</li>
          </ul>
          <div style="margin: 20px 0; text-align: center;">
            <a href="https://commonspace.com/explore" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Explore Spaces</a>
          </div>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Happy booking!</p>
        </div>
      `
    };
  }

  private getWeeklySummaryTemplate(user: User, bookings: Booking[]): EmailTemplate {
    // Format bookings list HTML
    let bookingsHtml = '';
    
    if (bookings.length === 0) {
      bookingsHtml = '<p>You have no upcoming bookings for this week.</p>';
    } else {
      bookingsHtml = '<div>';
      bookings.forEach(booking => {
        bookingsHtml += `
          <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px;">
            <p style="margin: 0;"><strong>${booking.venueName}</strong></p>
            <p style="margin: 5px 0;">Package: ${booking.packageName}</p>
            <p style="margin: 5px 0;">Date: ${new Date(booking.date.seconds * 1000).toLocaleDateString()}</p>
            <p style="margin: 5px 0;">Time: ${booking.time}</p>
            <p style="margin: 5px 0;">Duration: ${booking.duration} hours</p>
            <p style="margin: 5px 0;">Status: ${booking.status}</p>
          </div>
        `;
      });
      bookingsHtml += '</div>';
    }
    
    return {
      subject: `Your Weekly CommonSpace Summary`,
      body: `
        <div>
          <h2>Your Weekly CommonSpace Summary</h2>
          <p>Hi ${user.name},</p>
          <p>Here's a summary of your upcoming bookings:</p>
          ${bookingsHtml}
          <p>Login to your account to manage your bookings or find new spaces.</p>
          <div style="margin: 20px 0; text-align: center;">
            <a href="https://commonspace.com/profile" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">View Your Profile</a>
          </div>
          <p>Thank you for using CommonSpace!</p>
        </div>
      `
    };
  }
}

export const emailService = new EmailService(); 