import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getAssets, 
  getBookings, 
  createBooking, 
  getEmployees
} from '../services/api';
import type { Asset, Booking, Employee } from '../services/types';
import { useToast } from '../components/Toast';
import { 
  CalendarRange, 
  Plus, 
  Clock, 
  MapPin, 
  Car, 
  DoorOpen, 
  Info,
  CalendarDays
} from 'lucide-react';

export const ResourceBooking: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // Data State
  const [resources, setResources] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Form State
  const [newBooking, setNewBooking] = useState({
    title: '',
    assetTag: '',
    employeeId: currentUser?.id || '',
    startTime: '',
    endTime: '',
    purpose: ''
  });

  const loadData = () => {
    // Select assets that are shared resources (like vehicles, rooms, testbeds)
    const allAssets = getAssets();
    const sharedResources = allAssets.filter(
      a => ['cat-2', 'cat-3', 'cat-4'].includes(a.categoryId) // Vehicles, rooms, test devices
    );
    setResources(sharedResources);
    setBookings(getBookings());
    setEmployees(getEmployees());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { title, assetTag, employeeId, startTime, endTime, purpose } = newBooking;
    
    if (!title.trim() || !assetTag || !employeeId || !startTime || !endTime || !purpose.trim()) {
      showToast('Please fill out all form inputs.', 'warning');
      return;
    }

    try {
      createBooking({
        title: title.trim(),
        assetTag,
        employeeId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        purpose: purpose.trim()
      });

      showToast(`Booking "${title}" confirmed!`, 'success');
      setIsBookModalOpen(false);
      setNewBooking({
        title: '',
        assetTag: '',
        employeeId: currentUser?.id || '',
        startTime: '',
        endTime: '',
        purpose: ''
      });
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Booking conflict detected.', 'error');
    }
  };

  // Filtered resources
  const filteredResources = resources.filter(res => 
    selectedCategory === 'All' || res.categoryId === selectedCategory
  );

  // Helper to get matching resource icon
  const getResourceIcon = (catId: string) => {
    if (catId === 'cat-2') return Car; // Vehicle
    if (catId === 'cat-3') return DoorOpen; // Room
    return CalendarRange; // Generic / Test device
  };

  // Helper: Format Time Strings
  const formatTimeRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const dateOpt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const timeOpt: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };

    const startDate = start.toLocaleDateString([], dateOpt);
    const endDate = end.toLocaleDateString([], dateOpt);

    const startTime = start.toLocaleTimeString([], timeOpt);
    const endTime = end.toLocaleTimeString([], timeOpt);

    if (startDate === endDate) {
      return `${startDate} • ${startTime} - ${endTime}`;
    }
    return `${startDate} ${startTime} - ${endDate} ${endTime}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full overflow-y-auto max-h-[105vh] pb-10 pr-2">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Resource Booking Planner</h2>
          <p className="text-xs text-slate-400">Reserve shared corporate assets like conference rooms, testing devices, or corporate vehicles.</p>
        </div>

        <button
          onClick={() => {
            setNewBooking(prev => ({ ...prev, employeeId: currentUser?.id || '' }));
            setIsBookModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Book a Resource
        </button>
      </div>

      {/* Categories filter banner */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            selectedCategory === 'All'
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Shared Resources
        </button>
        <button
          onClick={() => setSelectedCategory('cat-3')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
            selectedCategory === 'cat-3'
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <DoorOpen className="w-3.5 h-3.5" /> Meeting Rooms
        </button>
        <button
          onClick={() => setSelectedCategory('cat-2')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
            selectedCategory === 'cat-2'
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Car className="w-3.5 h-3.5" /> Fleet Vehicles
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Shared Resources Grid */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <CalendarDays className="w-4.5 h-4.5 text-indigo-400" /> Available Units
          </h3>

          <div className="flex flex-col gap-3">
            {filteredResources.map(res => {
              const ResIcon = getResourceIcon(res.categoryId);
              return (
                <div 
                  key={res.tag}
                  className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3 group hover:border-slate-700 transition-all cursor-pointer"
                  onClick={() => {
                    setNewBooking(prev => ({ ...prev, assetTag: res.tag }));
                    setIsBookModalOpen(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-950 p-2.5 rounded-xl text-indigo-400 border border-slate-850">
                      <ResIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 font-outfit">{res.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{res.tag}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                      Available
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 justify-end">
                      <MapPin className="w-3 h-3" /> {res.location.split(' ')[0]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Bookings Visual Planner */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="border-b border-slate-800/80 px-6 py-4 flex justify-between items-center bg-slate-900/60">
            <h3 className="font-semibold text-sm text-slate-200">Corporate Booking Schedule</h3>
            <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-semibold">
              {bookings.length} Bookings
            </span>
          </div>

          <div className="p-6 flex-grow flex flex-col gap-4 overflow-y-auto">
            {bookings.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No active bookings scheduled.</p>
            ) : (
              bookings.map(bkg => {
                const isOverdue = new Date(bkg.endTime) < new Date();
                
                return (
                  <div 
                    key={bkg.id}
                    className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${
                      isOverdue 
                        ? 'bg-slate-950/45 border-slate-900/80 opacity-50' 
                        : 'bg-slate-950 border-slate-800/85 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-200 font-outfit">{bkg.title}</h4>
                        <p className="text-[10px] text-indigo-450 mt-1 flex items-center gap-1 font-semibold">
                          <span className="font-mono bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">{bkg.assetTag}</span> 
                          • {bkg.assetName}
                        </p>
                      </div>

                      <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        isOverdue 
                          ? 'bg-slate-700/10 text-slate-400 border-slate-700/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {isOverdue ? 'Completed' : 'Confirmed'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 italic">
                      " {bkg.purpose} "
                    </p>

                    <div className="flex flex-wrap items-center justify-between border-t border-slate-800/60 pt-2.5 text-[10px] text-slate-500">
                      <p className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-bold text-slate-350">{formatTimeRange(bkg.startTime, bkg.endTime)}</span>
                      </p>
                      <p>
                        Booked by: <span className="font-semibold text-slate-350">{bkg.employeeName}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal: Book shared resource */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col gap-4 animate-scale-in">
            
            <div className="flex items-center gap-2 text-indigo-400">
              <CalendarRange className="w-5 h-5" />
              <h3 className="text-lg font-bold text-slate-200 font-outfit">Book Shared Resource</h3>
            </div>

            <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Booking Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Review Workshop"
                  value={newBooking.title}
                  onChange={(e) => setNewBooking({ ...newBooking, title: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Select Shared Asset</label>
                <select
                  required
                  value={newBooking.assetTag}
                  onChange={(e) => setNewBooking({ ...newBooking, assetTag: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium"
                >
                  <option value="" disabled>Select Room / Vehicle</option>
                  {resources.map(res => (
                    <option key={res.tag} value={res.tag}>{res.name} ({res.tag})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Booking Requester</label>
                <select
                  required
                  value={newBooking.employeeId}
                  onChange={(e) => setNewBooking({ ...newBooking, employeeId: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium"
                >
                  <option value="" disabled>Select Employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newBooking.startTime}
                    onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newBooking.endTime}
                    onChange={(e) => setNewBooking({ ...newBooking, endTime: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Booking Purpose</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain usage requirements, destinations, or sync goals..."
                  value={newBooking.purpose}
                  onChange={(e) => setNewBooking({ ...newBooking, purpose: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-3 rounded-xl flex gap-2 items-start text-[10px] font-semibold leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>The system automatically interrogates SQL bookings data. If overlapping timelines exist, bookings will be rejected instantly.</p>
              </div>

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-250 hover:bg-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/10"
                >
                  Submit Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
