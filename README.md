# Laptop Cafe Booking App

A React + TypeScript web app to help laptop workers book workspace time at cafes, using Firebase.

## Features

### Admin Features
- [ ] Firebase Auth (admin role)
- [ ] Venue CRUD interface
- [ ] Upload photos
- [ ] Set pricing & time slots
- [ ] View/manage bookings

### User Features
- [ ] Firebase Auth (user role)
- [ ] Browse venues
- [ ] View venue details
- [ ] Book & manage time slots
- [ ] View booking history

## Tech Stack

- Frontend: React + TypeScript
- Backend Services: Firebase (Firestore, Auth, Storage)
- State Management: React Context
- Routing: React Router v6
- Styling: Tailwind CSS
- Tooling: Vite

## Setup Instructions

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a Firebase project:
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password)
   - Enable Firestore
   - Enable Storage
   - Get your Firebase configuration

4. Create a `.env` file in the root directory with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. Start the development server:
```bash
npm run dev
```

## Development Progress

- [x] Project initialized (Vite + React + Tailwind)
- [x] Firebase SDK configured
- [x] Role-based auth (admin, user)
- [x] Auth forms + context
- [x] Venue CRUD (Firestore)
- [x] Photo upload (Firebase Storage)
- [x] Booking logic
- [x] Booking calendar UI

## Folder Structure

```
src/
  assets/          # Static assets
  components/      # Reusable components
  context/         # React Context providers
  hooks/          # Custom hooks
  pages/          # Page components
    - Home.tsx
    - Login.tsx
    - Dashboard.tsx
    - Venue.tsx
    - Booking.tsx
  routes/         # Routing configuration
  services/       # Firebase services
  types/          # TypeScript types
  App.tsx         # Root component
  main.tsx        # Entry point
```

## Firebase Data Structure

```plaintext
users/
  {uid} → name, email, role ['admin' | 'user'], favorites: [venueId]

venues/
  {venueId} → name, location, description, photos[], openingHours, packages[], adminId

bookings/
  {bookingId} → venueId, userId, date, timeSlot, package, status
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
