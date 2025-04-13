import React from 'react';

interface StatsCardsProps {
  stats: {
    totalUsers: number;
    totalVenues: number;
    totalBookings: number;
    activeVenues: number;
  };
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="card">
        <div className="text-text-secondary text-sm font-medium mb-1">Total Users</div>
        <div className="text-3xl font-bold text-primary">{stats.totalUsers}</div>
      </div>
      <div className="card">
        <div className="text-text-secondary text-sm font-medium mb-1">Total Venues</div>
        <div className="text-3xl font-bold text-primary">{stats.totalVenues}</div>
      </div>
      <div className="card">
        <div className="text-text-secondary text-sm font-medium mb-1">Active Venues</div>
        <div className="text-3xl font-bold text-primary">{stats.activeVenues}</div>
      </div>
      <div className="card">
        <div className="text-text-secondary text-sm font-medium mb-1">Total Bookings</div>
        <div className="text-3xl font-bold text-primary">{stats.totalBookings}</div>
      </div>
    </div>
  );
}; 