import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, query, where, getDocs, Timestamp, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Venue as VenueType } from '../types';

interface TimeSlot {
  time: string;
  available: boolean;
  remainingCapacity: number;
}

interface ExistingBooking {
  time: string;
  date: string;
  duration: number;
}

export default function Venue() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [venue, setVenue] = useState<VenueType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingError, setBookingError] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Fetch existing bookings for the selected date
  useEffect(() => {
    async function fetchBookings() {
      console.log('Fetching bookings for:', {
        selectedDate,
        venueId: venue?.id,
        selectedPackage,
        user: user?.role
      });

      if (!selectedDate || !venue) {
        console.log('Missing required data for fetching bookings');
        setTimeSlots([]);
        return;
      }

      try {
        // Simplified query that matches security rules
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('venueId', '==', venue.id),
          where('date', '==', selectedDate),
          where('status', 'in', ['pending', 'confirmed']),
          limit(100)
        );

        console.log('Executing query with params:', {
          venueId: venue.id,
          date: selectedDate,
          status: ['pending', 'confirmed'],
          userRole: user?.role,
          isAuthenticated: !!user
        });

        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookings: ExistingBooking[] = bookingsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            time: data.time,
            date: data.date,
            duration: data.duration
          };
        });
        
        console.log('Successfully fetched bookings:', {
          count: bookings.length,
          bookings: bookings
        });

        setExistingBookings(bookings);
        generateTimeSlots(selectedDate, bookings);
      } catch (error: any) {
        console.error('Error fetching bookings:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        if (error.code === 'permission-denied') {
          console.error('Permission denied. User auth state:', {
            isAuthenticated: !!user,
            userRole: user?.role,
            userId: user?.uid
          });
        }
        setTimeSlots([]);
      }
    }
    
    if (selectedDate && selectedPackage) {
      fetchBookings();
    }
  }, [selectedDate, selectedPackage, venue, user]);

  useEffect(() => {
    async function fetchVenue() {
      if (!id) return;

      try {
        const venueDoc = await getDoc(doc(db, 'venues', id));
        if (venueDoc.exists()) {
          const venueData = venueDoc.data();
          const openingHours = venueData.openingHours || {
            monday: { open: '09:00', close: '17:00' },
            tuesday: { open: '09:00', close: '17:00' },
            wednesday: { open: '09:00', close: '17:00' },
            thursday: { open: '09:00', close: '17:00' },
            friday: { open: '09:00', close: '17:00' },
            saturday: { open: 'Closed', close: 'Closed' },
            sunday: { open: 'Closed', close: 'Closed' },
          };
          
          setVenue({ 
            id: venueDoc.id, 
            ...venueData,
            openingHours,
            packages: venueData.packages || [],
            photos: venueData.photos || [],
            capacity: venueData.capacity || 1, // Default to 1 if not specified
          } as VenueType);
        }
      } catch (error: any) {
        console.error('Error fetching venue:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVenue();
  }, [id]);

  const getDayFromDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  };

  const isTimeSlotAvailable = (
    time: string,
    duration: number,
    bookings: ExistingBooking[],
    capacity: number
  ): { available: boolean; remainingCapacity: number } => {
    const [hour, minute] = time.split(':').map(Number);
    const slotStart = hour * 60 + minute;
    const slotEnd = slotStart + duration * 60;

    // Check each minute of the proposed slot against existing bookings
    let maxOverlap = 0;
    for (let currentMinute = slotStart; currentMinute < slotEnd; currentMinute++) {
      let overlappingBookings = 0;
      
      bookings.forEach(booking => {
        const [bookingHour, bookingMinute] = booking.time.split(':').map(Number);
        const bookingStart = bookingHour * 60 + bookingMinute;
        const bookingEnd = bookingStart + booking.duration * 60;

        if (currentMinute >= bookingStart && currentMinute < bookingEnd) {
          overlappingBookings++;
        }
      });

      maxOverlap = Math.max(maxOverlap, overlappingBookings);
    }

    const remainingCapacity = capacity - maxOverlap;
    return {
      available: remainingCapacity > 0,
      remainingCapacity
    };
  };

  const generateTimeSlots = (date: string, bookings: ExistingBooking[]) => {
    console.log('Generating time slots with:', {
      venue: !!venue,
      date,
      selectedPackage,
      bookings: bookings.length,
      user: user?.role
    });

    if (!venue || !date || !selectedPackage) {
      console.log('Missing required data:', {
        hasVenue: !!venue,
        hasDate: !!date,
        hasPackage: !!selectedPackage
      });
      setTimeSlots([]);
      return;
    }

    const day = getDayFromDate(date);
    const hours = venue.openingHours[day];

    console.log('Venue hours for', day, ':', hours);

    if (!hours || hours.open === 'Closed') {
      console.log('Venue is closed on', day);
      setTimeSlots([]);
      return;
    }

    const selectedPkg = venue.packages.find(pkg => pkg.id === selectedPackage);
    console.log('Selected package:', selectedPkg);

    if (!selectedPkg) {
      console.log('Package not found:', selectedPackage);
      setTimeSlots([]);
      return;
    }

    const slots: TimeSlot[] = [];
    const [openHour, openMinute] = hours.open.split(':').map(Number);
    const [closeHour, closeMinute] = hours.close.split(':').map(Number);

    // Generate slots every 30 minutes
    for (let hour = openHour; hour < closeHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip if we're before opening minutes in the first hour
        if (hour === openHour && minute < openMinute) continue;
        // Skip if we're after closing minutes in the last hour
        if (hour === closeHour && minute > closeMinute) continue;

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        const { available, remainingCapacity } = isTimeSlotAvailable(
          timeString,
          selectedPkg.duration,
          bookings,
          venue.capacity
        );

        // Add all slots, even if not available, for debugging
        slots.push({
          time: timeString,
          available,
          remainingCapacity
        });
      }
    }

    console.log('Generated slots:', slots.length, 'Available slots:', slots.filter(s => s.available).length);
    setTimeSlots(slots);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!venue) {
      setBookingError('Venue information not found');
      return;
    }

    if (!selectedPackage || !selectedDate || !selectedTime) {
      setBookingError('Please fill in all booking details');
      return;
    }

    // Verify the slot is still available
    const selectedPkg = venue.packages.find(pkg => pkg.id === selectedPackage);
    if (!selectedPkg) {
      setBookingError('Selected package not found');
      return;
    }

    const selectedSlot = timeSlots.find(slot => slot.time === selectedTime);
    if (!selectedSlot || !selectedSlot.available) {
      setBookingError('This time slot is no longer available');
      return;
    }

    setIsBooking(true);
    setBookingError('');

    try {
      // Format date to ensure consistency
      const formattedDate = new Date(selectedDate).toISOString().split('T')[0];
      
      const bookingData = {
        venueId: venue.id,
        venueName: venue.name,
        userId: user.uid,
        userName: user.name || user.email,
        userEmail: user.email,
        packageId: selectedPkg.id,
        packageName: selectedPkg.name,
        packagePrice: selectedPkg.price,
        packageDuration: selectedPkg.duration,
        date: formattedDate,
        time: selectedTime,
        duration: selectedPkg.duration,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      console.log('Creating booking with data:', bookingData);

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
      console.log('Booking created with ID:', bookingRef.id);

      // Verify the booking was created
      const createdBooking = await getDoc(bookingRef);
      if (!createdBooking.exists()) {
        throw new Error('Booking was not created properly');
      }

      navigate('/profile', { 
        state: { 
          bookingSuccess: true,
          bookingId: bookingRef.id 
        } 
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      setBookingError('Failed to create booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Venue Not Found</h1>
        <p className="text-text-secondary mb-8">The venue you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Venue Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="page-header mb-2">{venue.name}</h1>
            <p className="text-text-secondary text-lg">{venue.location}</p>
          </div>
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <button
              onClick={() => navigate(`/superadmin/venue/${venue.id}/edit`)}
              className="btn btn-secondary"
            >
              Edit Venue
            </button>
          )}
        </div>
      </div>

      {/* Venue Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Photos */}
        <div className="md:col-span-2">
          <div className="card">
            {venue.photos && venue.photos.length > 0 ? (
              <div className="aspect-w-16 aspect-h-9 mb-4">
                <img
                  src={venue.photos[0]}
                  alt={venue.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="aspect-w-16 aspect-h-9 mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-text-disabled">No photos available</span>
              </div>
            )}
            <p className="text-text-primary text-lg mb-4">{venue.description}</p>
            <div className="flex items-center space-x-4">
              <span className={`badge ${venue.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                {venue.status}
              </span>
              <span className="badge badge-warning">{venue.type}</span>
              {venue.priceRange && (
                <span className="badge">{venue.priceRange}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Booking Form */}
        <div className="space-y-6">
          {/* Booking Form */}
          <div className="card">
            <h2 className="section-header">Make a Booking</h2>
            {!user ? (
              <div className="text-center">
                <p className="text-text-secondary mb-4">Please log in to make a booking</p>
                <button 
                  onClick={() => navigate('/login')} 
                  className="btn btn-primary"
                >
                  Log In
                </button>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-4">
                {/* Package Selection */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Select Package
                  </label>
                  <select
                    value={selectedPackage}
                    onChange={(e) => {
                      setSelectedPackage(e.target.value as string);
                      setSelectedTime(''); // Clear selected time when package changes
                    }}
                    className="input"
                    required
                  >
                    <option value="">Choose a package</option>
                    {venue?.packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - ${pkg.price} ({pkg.duration}h)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime('');
                    }}
                    className="input"
                    required
                  />
                </div>

                {/* Time Selection */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Select Time
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="input"
                    required
                    disabled={!selectedDate || !selectedPackage || timeSlots.length === 0}
                  >
                    <option value="">
                      {!selectedDate 
                        ? 'Select a date first'
                        : !selectedPackage
                        ? 'Select a package first'
                        : timeSlots.length === 0 
                          ? 'No available times' 
                          : 'Choose a time'}
                    </option>
                    {timeSlots
                      .filter(slot => slot.available)
                      .map((slot) => (
                        <option key={slot.time} value={slot.time}>
                          {slot.time} (${slot.remainingCapacity} spots available)
                        </option>
                    ))}
                  </select>
                </div>

                {bookingError && (
                  <div className="text-accent text-sm">{bookingError}</div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isBooking || !selectedTime}
                >
                  {isBooking ? 'Creating Booking...' : 'Book Now'}
                </button>
              </form>
            )}
          </div>

          {/* Packages */}
          <div className="card">
            <h2 className="section-header">Packages</h2>
            <div className="space-y-4">
              {venue.packages && venue.packages.map((pkg) => (
                <div key={pkg.id} className="p-4 border border-border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-text-primary">{pkg.name}</h3>
                    <span className="text-primary font-bold">${pkg.price}</span>
                  </div>
                  <p className="text-text-secondary text-sm mb-2">{pkg.description}</p>
                  <div className="text-sm text-text-secondary">
                    Duration: {pkg.duration} hour{pkg.duration !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 