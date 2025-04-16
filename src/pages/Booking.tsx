import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Venue, Package } from '../types';

export default function Booking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchVenue() {
      if (!id) return;

      try {
        const venueDoc = await getDoc(doc(db, 'venues', id));
        if (venueDoc.exists()) {
          setVenue({ id: venueDoc.id, ...venueDoc.data() } as Venue);
        }
      } catch (error) {
        console.error('Error fetching venue:', error);
        setError('Failed to load venue details');
      } finally {
        setLoading(false);
      }
    }

    fetchVenue();
  }, [id]);

  const handleBooking = async () => {
    if (!user || !venue || !selectedPackage || !selectedDate || !selectedTime) {
      setError('Please fill in all booking details');
      return;
    }

    try {
      const endTime = new Date(`${selectedDate}T${selectedTime}`);
      endTime.setHours(endTime.getHours() + selectedPackage.duration);

      const booking = {
        venueId: venue.id,
        userId: user.uid,
        date: selectedDate,
        timeSlot: {
          start: selectedTime,
          end: endTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
        },
        packageId: selectedPackage.id,
        status: 'pending',
      };

      await addDoc(collection(db, 'bookings'), booking);
      navigate('/');
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Failed to create booking');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!venue) {
    return <div className="text-center py-8">Venue not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="page-header mb-8">Book {venue.name}</h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Start Time
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="input"
            >
              <option value="">Select a time</option>
              {/* Generate time slots */}
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0');
                return (
                  <option key={hour} value={`${hour}:00`}>
                    {`${hour}:00`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Package Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Package
            </label>
            <div className="grid gap-4">
              {venue.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`border rounded-lg p-4 cursor-pointer ${
                    selectedPackage?.id === pkg.id ? 'border-secondary bg-secondary/10'
                      : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <h3 className="text-lg font-medium mb-1">{pkg.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{pkg.description}</p>
                  <p className="font-semibold">
                    ${pkg.price.toFixed(2)} / {pkg.duration}h
                  </p>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            onClick={handleBooking}
            disabled={!selectedDate || !selectedTime || !selectedPackage}
            className="btn btn-primary"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
} 