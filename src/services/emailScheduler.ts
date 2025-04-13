import { emailService } from './emailService';
import { bookingService } from './api/bookings';
import { userService } from './api/users';
import { venueService } from './api/venues';

class EmailScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60 * 60 * 1000; // Run every hour
  private readonly WEEKLY_SUMMARY_DAY = 1; // Monday (0 = Sunday, 1 = Monday, etc.)

  /**
   * Start the email scheduler
   */
  start(): void {
    if (this.intervalId) {
      console.warn('Email scheduler is already running');
      return;
    }

    // Run immediately on start
    this.processScheduledEmails();

    // Then set up interval
    this.intervalId = setInterval(() => {
      this.processScheduledEmails();
    }, this.CHECK_INTERVAL);

    console.log('Email scheduler started');
  }

  /**
   * Stop the email scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Email scheduler stopped');
    }
  }

  /**
   * Process all scheduled emails
   */
  private async processScheduledEmails(): Promise<void> {
    try {
      const now = new Date();
      
      // Check if we should send weekly summaries (every Monday)
      if (now.getDay() === this.WEEKLY_SUMMARY_DAY && now.getHours() === 8) {
        await this.sendWeeklySummaries();
      }
      
      console.log('Email scheduler processed scheduled tasks');
    } catch (error) {
      console.error('Error processing scheduled emails:', error);
    }
  }

  /**
   * Send weekly summaries to users
   */
  private async sendWeeklySummaries(): Promise<void> {
    try {
      // Get all users
      const users = await userService.getUsers();
      
      for (const user of users) {
        try {
          // Get upcoming bookings for the user in the next 7 days
          const upcomingBookings = await this.getUpcomingBookingsForUser(user.id, 7);
          
          if (upcomingBookings.length > 0) {
            await this.sendWeeklySummaryEmail(user, upcomingBookings);
          }
        } catch (error) {
          console.error(`Failed to send weekly summary for user ${user.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to send weekly summaries:', error);
    }
  }

  /**
   * Get upcoming bookings for a user within the specified number of days
   */
  private async getUpcomingBookingsForUser(userId: string, days: number): Promise<any[]> {
    // This is a placeholder implementation
    // In a real implementation, you would query the database for upcoming bookings
    // within the specified date range
    const bookings = await bookingService.getBookings({ userId, status: 'confirmed' });
    
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= now && bookingDate <= futureDate;
    });
  }

  /**
   * Send a weekly summary email to a user
   */
  private async sendWeeklySummaryEmail(user: any, upcomingBookings: any[]): Promise<void> {
    try {
      // Send the email using the emailService
      await emailService.sendWeeklySummary(user, upcomingBookings);
    } catch (error) {
      console.error('Failed to send weekly summary email:', error);
    }
  }
}

export const emailScheduler = new EmailScheduler(); 