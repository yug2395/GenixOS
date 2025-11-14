import React, { useEffect, useMemo, useState } from 'react';

interface CalendarEvent {
  id: string;
  year: number;
  month: number;
  day: number;
  description: string;
}

const STORAGE_KEY = 'genix-calendar-events';

function generateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `event-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function loadEvents(): CalendarEvent[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as CalendarEvent[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

function saveEvents(events: CalendarEvent[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // ignore
  }
}

function getMonthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleString(undefined, { month: 'long' });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function buildCalendar(year: number, month: number) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month - 1, 1).getDay() || 7; // Monday=1 .. Sunday=7

  const cells = [];
  for (let i = 1; i < firstDay; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  return cells;
}

const GenixCalendar: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadEvents());
  const [selectedDay, setSelectedDay] = useState<number | null>(
    today.getDate()
  );
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  const monthEvents = useMemo(
    () => events.filter((event) => event.year === year && event.month === month),
    [events, year, month]
  );

  const dayEvents = useMemo(() => {
    if (selectedDay == null) {
      return [];
    }
    return monthEvents.filter((event) => event.day === selectedDay);
  }, [monthEvents, selectedDay]);

  const cells = useMemo(() => buildCalendar(year, month), [year, month]);

  const handlePrevious = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const handleNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  const resetForm = () => {
    setDescription('');
    setSelectedDay(null);
    setEditingId(null);
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
    resetForm();
  };

  const editEvent = (event: CalendarEvent) => {
    setSelectedDay(event.day);
    setDescription(event.description);
    setEditingId(event.id);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!description.trim() || selectedDay == null) {
      return;
    }

    if (editingId) {
      setEvents((prev) =>
        prev.map((existing) =>
          existing.id === editingId
            ? { ...existing, description: description.trim(), day: selectedDay, month, year }
            : existing
        )
      );
    } else {
      const newEvent: CalendarEvent = {
        id: generateId(),
        year,
        month,
        day: selectedDay,
        description: description.trim(),
      };
      setEvents((prev) => [...prev, newEvent]);
    }
    resetForm();
  };

  return (
    <div className="w-full h-full bg-slate-900 text-white flex flex-col">
      <header className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="text-sm text-slate-300">
            Navigate months, manage events, and keep track of your schedule.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrevious}
            className="px-3 py-1 rounded bg-slate-800 border border-slate-600 hover:bg-slate-700"
          >
            Prev
          </button>
          <span className="text-lg font-medium">
            {getMonthName(month)} {year}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="px-3 py-1 rounded bg-slate-800 border border-slate-600 hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-auto">
        <section className="col-span-2 border-r border-slate-800 p-6">
          <div className="grid grid-cols-7 gap-2 text-center text-slate-300 mb-3 text-sm uppercase tracking-wide">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map((day, index) => {
              if (day == null) {
                return (
                  <div key={`empty-${index}`} className="h-16 rounded bg-slate-800 opacity-40" />
                );
              }

              const hasEvent = monthEvents.some((event) => event.day === day);
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`h-16 rounded border ${
                    isSelected
                      ? 'border-genix-yellow bg-slate-800'
                      : 'border-slate-700 bg-slate-800 hover:bg-slate-700'
                  } flex flex-col items-center justify-center transition`}
                >
                  <span className="text-lg font-semibold">{day}</span>
                  {hasEvent && (
                    <span className="mt-1 text-xs text-genix-yellow font-medium">● Event</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-semibold border-b border-slate-700 pb-2 mb-3">
              {selectedDay ? `Events on ${selectedDay}/${month}/${year}` : 'Select a day'}
            </h2>
            {dayEvents.length === 0 ? (
              <p className="text-sm text-slate-400">No events scheduled for this day.</p>
            ) : (
              <ul className="space-y-3">
                {dayEvents.map((event) => (
                  <li key={event.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <div className="text-sm text-slate-300">{event.description}</div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => editEvent(event)}
                        className="px-3 py-1 text-xs rounded bg-genix-yellow text-slate-900 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEvent(event.id)}
                        className="px-3 py-1 text-xs rounded bg-red-600 text-white font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-lg font-semibold mb-3">
              {editingId ? 'Edit Event' : 'Add New Event'}
            </h3>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <label className="block text-sm">
                <span className="text-slate-300">Day</span>
                <input
                  type="number"
                  min={1}
                  max={getDaysInMonth(year, month)}
                  value={selectedDay ?? ''}
                  onChange={(event) => setSelectedDay(Number(event.target.value))}
                  className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-genix-yellow"
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-300">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-genix-yellow"
                  rows={3}
                  required
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded bg-genix-yellow text-slate-900 font-semibold"
                >
                  {editingId ? 'Update Event' : 'Add Event'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded bg-slate-800 border border-slate-600 text-sm"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default GenixCalendar;

