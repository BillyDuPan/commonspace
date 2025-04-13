import { bookingService } from './api/bookings';

class BookingStatusUpdater {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // Run every 5 minutes

  start(): void {
    if (this.intervalId) {
      console.warn('Booking status updater is already running');
      return;
    }

    // Run immediately on start
    this.updateStatuses();

    // Then set up interval
    this.intervalId = setInterval(() => {
      this.updateStatuses();
    }, this.UPDATE_INTERVAL);

    console.log('Booking status updater started');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Booking status updater stopped');
    }
  }

  private async updateStatuses(): Promise<void> {
    try {
      await bookingService.checkAndUpdateBookingStatuses();
      console.log('Booking statuses updated successfully');
    } catch (error) {
      console.error('Error updating booking statuses:', error);
    }
  }
}

export const bookingStatusUpdater = new BookingStatusUpdater(); 