import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { Venue, OpeningHours, Package } from '../types';
import { useAuth } from '../context/AuthContext';

const DEFAULT_OPENING_HOURS = {
  monday: { open: '09:00', close: '17:00' },
  tuesday: { open: '09:00', close: '17:00' },
  wednesday: { open: '09:00', close: '17:00' },
  thursday: { open: '09:00', close: '17:00' },
  friday: { open: '09:00', close: '17:00' },
  saturday: { open: '10:00', close: '16:00' },
  sunday: { open: '10:00', close: '16:00' },
} as const;

type DayOfWeek = keyof typeof DEFAULT_OPENING_HOURS;

const generateId = () => Math.random().toString(36).substring(2, 15);

const createDefaultPackage = () => ({
  id: generateId(),
  name: '',
  price: 0,
  duration: 1,
  description: '',
});

export default function EditVenue() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [venue, setVenue] = useState<Partial<Venue>>({
    name: '',
    location: '',
    description: '',
    type: 'cafe',
    photos: [],
    openingHours: DEFAULT_OPENING_HOURS,
    packages: [createDefaultPackage()],
    status: 'active',
    priceRange: '$$',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchVenue() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const venueDoc = await getDoc(doc(db, 'venues', id));
        if (venueDoc.exists()) {
          setVenue({ ...venueDoc.data(), id: venueDoc.id } as Venue);
        }
      } catch (error) {
        console.error('Error fetching venue:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVenue();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVenue(prev => ({ ...prev, [name]: value }));
  };

  const handleOpeningHoursChange = (day: DayOfWeek, type: 'open' | 'close', value: string) => {
    setVenue(prev => ({
      ...prev,
      openingHours: {
        ...(prev.openingHours || DEFAULT_OPENING_HOURS),
        [day]: {
          ...(prev.openingHours?.[day] || DEFAULT_OPENING_HOURS[day]),
          [type]: value,
        },
      },
    }));
  };

  const handlePackageChange = (index: number, field: keyof Package, value: string | number) => {
    setVenue(prev => ({
      ...prev,
      packages: prev.packages?.map((pkg, i) =>
        i === index ? { ...pkg, [field]: value, id: pkg.id || generateId() } : pkg
      ) || [],
    }));
  };

  const addPackage = () => {
    setVenue(prev => ({
      ...prev,
      packages: [...(prev.packages || []), createDefaultPackage()],
    }));
  };

  const removePackage = (index: number) => {
    setVenue(prev => ({
      ...prev,
      packages: prev.packages?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!venue.name) newErrors.name = 'Name is required';
    if (!venue.location) newErrors.location = 'Location is required';
    if (!venue.description) newErrors.description = 'Description is required';
    if (!venue.packages?.length) newErrors.packages = 'At least one package is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user) {
      setErrors({ submit: 'You must be logged in to create or edit a venue.' });
      return;
    }
    
    setSaving(true);
    try {
      // Upload images if any
      const uploadedUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const imageRef = ref(storage, `venues/${id || Date.now()}/${file.name}`);
          await uploadBytes(imageRef, file);
          return getDownloadURL(imageRef);
        })
      );

      const venueData = {
        ...venue,
        ownerId: user.id,
        photos: [...(venue.photos || []), ...uploadedUrls],
        updatedAt: new Date().toISOString(),
      };

      if (id) {
        await updateDoc(doc(db, 'venues', id), venueData);
      } else {
        const newVenueRef = doc(collection(db, 'venues'));
        await setDoc(newVenueRef, venueData);
      }

      navigate('/venue/spaces');
    } catch (error) {
      console.error('Error saving venue:', error);
      setErrors({ submit: 'Failed to save venue. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? 'Edit Venue' : 'Add New Venue'}
          </h1>
          <button
            onClick={() => navigate('/superadmin')}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={venue.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter venue name"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={venue.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter location"
                />
                {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={venue.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter venue description"
                />
                {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Type
                </label>
                <select
                  name="type"
                  value={venue.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="cafe">Cafe</option>
                  <option value="cowork">Coworking Space</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  name="priceRange"
                  value={venue.priceRange}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="$">$ (Budget)</option>
                  <option value="$$">$$ (Moderate)</option>
                  <option value="$$$">$$$ (Expensive)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Opening Hours</h2>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(venue.openingHours || DEFAULT_OPENING_HOURS).map(([day, hours]) => (
                <div key={day} className="flex items-center space-x-4">
                  <span className="w-24 text-sm font-medium text-gray-700 capitalize">
                    {day}
                  </span>
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleOpeningHoursChange(day as DayOfWeek, 'open', e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleOpeningHoursChange(day as DayOfWeek, 'close', e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Packages */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Packages</h2>
              <button
                type="button"
                onClick={addPackage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Package
              </button>
            </div>
            {errors.packages && <p className="text-red-600 text-sm mb-4">{errors.packages}</p>}
            <div className="space-y-6">
              {venue.packages?.map((pkg, index) => (
                <div key={pkg.id || index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Package Name
                      </label>
                      <input
                        type="text"
                        value={pkg.name}
                        onChange={(e) => handlePackageChange(index, 'name', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="e.g., Basic Package"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (per hour)
                      </label>
                      <input
                        type="number"
                        value={pkg.price}
                        onChange={(e) => handlePackageChange(index, 'price', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter price"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (hours)
                      </label>
                      <input
                        type="number"
                        value={pkg.duration}
                        onChange={(e) => handlePackageChange(index, 'duration', parseInt(e.target.value))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter duration"
                        min="1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={pkg.description}
                        onChange={(e) => handlePackageChange(index, 'description', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Package description"
                      />
                    </div>
                  </div>
                  {venue.packages!.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePackage(index)}
                      className="mt-4 text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove Package
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Photos</h2>
            <div className="space-y-4">
              {venue.photos && venue.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {venue.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Venue photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Photos
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/superadmin')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : id ? 'Update Venue' : 'Create Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 