// Current Kaapeh House business hours
export const BUSINESS_HOURS: Record<number, { open: number; close: number }> = {
  0: { open: 9, close: 20 },  // Sunday: 9 AM - 8 PM
  1: { open: 7, close: 21 },   // Monday: 7 AM - 9 PM
  2: { open: 7, close: 21 },   // Tuesday: 7 AM - 9 PM
  3: { open: 7, close: 21 },   // Wednesday: 7 AM - 9 PM
  4: { open: 7, close: 21 },   // Thursday: 7 AM - 9 PM
  5: { open: 7, close: 21 },   // Friday: 7 AM - 9 PM
  6: { open: 8, close: 20 },    // Saturday: 8 AM - 8 PM
};

// For testing purposes, set this to a Date object to override the current time (good for testing outside of business hours)
// Set to null to use the actual current time
// Example: export const TEST_CURRENT_TIME = new Date('2024-01-15T14:30:00'); // Monday, 2:30 PM
export const TEST_CURRENT_TIME: Date | null = null;

const getCurrentTime = (): Date => {
  return TEST_CURRENT_TIME || new Date();
};

export const isWithinBusinessHours = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const businessHours = BUSINESS_HOURS[dayOfWeek];
  if (!businessHours) {
    return false;
  }

  const openMinutes = businessHours.open * 60;
  const closeMinutes = businessHours.close * 60;

  return totalMinutes >= openMinutes && totalMinutes < closeMinutes;
};

export const isOutsideBusinessHours = (): boolean => {
  const now = getCurrentTime();
  const dayOfWeek = now.getDay();
  const businessHours = BUSINESS_HOURS[dayOfWeek];
  
  if (!businessHours) {
    return true;
  }

  const openingTime = getOpeningTime(now);
  const closingTime = getClosingTime(now);

  return now < openingTime || now >= closingTime;
};

export const getOpeningTime = (date: Date): Date => {
  const dayOfWeek = date.getDay();
  const businessHours = BUSINESS_HOURS[dayOfWeek];
  if (!businessHours) {
    throw new Error('Business is closed on this day');
  }

  const openingTime = new Date(date);
  openingTime.setHours(businessHours.open, 0, 0, 0);
  return openingTime;
};

export const getClosingTime = (date: Date): Date => {
  const dayOfWeek = date.getDay();
  const businessHours = BUSINESS_HOURS[dayOfWeek];
  if (!businessHours) {
    throw new Error('Business is closed on this day');
  }

  const closingTime = new Date(date);
  closingTime.setHours(businessHours.close, 0, 0, 0);
  return closingTime;
};

const roundUpToInterval = (date: Date, intervalMinutes: number): Date => {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const remainder = minutes % intervalMinutes;
  
  if (remainder === 0) {
    rounded.setMinutes(minutes + intervalMinutes);
  } else {
    rounded.setMinutes(minutes + (intervalMinutes - remainder));
  }
  
  rounded.setSeconds(0, 0);
  rounded.setMilliseconds(0);
  return rounded;
};


// Used to generate time slots for the current day starting from now
// First slot: closest 15-minute interval from current time
// Subsequent slots: 15-minute intervals
export const generateTimeSlotsForToday = (): Date[] => {
  const now = getCurrentTime();
  const slots: Date[] = [];

  // Check if business is open today
  const dayOfWeek = now.getDay();
  const businessHours = BUSINESS_HOURS[dayOfWeek];
  if (!businessHours) {
    return [];
  }

  // Get opening and closing times for today
  const openingTime = getOpeningTime(now);
  const closingTime = getClosingTime(now);

  console.log('Time slot generation:', {
    now: now.toLocaleString(),
    openingTime: openingTime.toLocaleString(),
    closingTime: closingTime.toLocaleString(),
    dayOfWeek: now.getDay(),
  });

  // Calculate the first slot based on the 2-minute buffer rule
  let currentSlot: Date;
  const nowMinutes = now.getMinutes();
  const nowHours = now.getHours();
  const remainder = nowMinutes % 15; // How many minutes past the 15-minute interval
  
  if (remainder <= 2) {
    // Within 2 minutes of a 15-minute interval (e.g., 8:00-8:02, 8:15-8:17)
    // Use the next 15-minute interval
    currentSlot = new Date(now);
    const nextInterval = Math.floor(nowMinutes / 15) * 15 + 15;
    if (nextInterval >= 60) {
      // Roll over to next hour
      currentSlot.setHours(nowHours + 1, nextInterval - 60, 0, 0);
    } else {
      currentSlot.setMinutes(nextInterval, 0, 0);
    }
    console.log('Within 2-min buffer: using next 15-min interval:', currentSlot.toLocaleString());
  } else {
    // More than 2 minutes past the interval (e.g., 8:03-8:14, 8:18-8:29)
    // Skip the next 15-minute interval, use 30 minutes after current interval
    currentSlot = new Date(now);
    const currentInterval = Math.floor(nowMinutes / 15) * 15;
    const targetMinutes = currentInterval + 30;
    if (targetMinutes >= 60) {
      // Roll over to next hour
      currentSlot.setHours(nowHours + 1, targetMinutes - 60, 0, 0);
    } else {
      currentSlot.setMinutes(targetMinutes, 0, 0);
    }
    console.log('Past 2-min buffer: skipping next interval, using +30min:', currentSlot.toLocaleString());
  }
  
  // If the first slot is before opening time, start from opening time
  if (currentSlot < openingTime) {
    currentSlot = new Date(openingTime);
    console.log('Adjusted to opening time:', currentSlot.toLocaleString());
  }

  // Ensure first slot is always after current time
  if (currentSlot <= now) {
    // If somehow we got a slot that's not after now, add 15 more minutes
    currentSlot = new Date(now);
    currentSlot.setMinutes(currentSlot.getMinutes() + 15);
    currentSlot.setSeconds(0, 0);
    currentSlot.setMilliseconds(0);
    console.log('Adjusted to be after now:', currentSlot.toLocaleString());
  }

  // Generate slots until closing time
  let slotCount = 0;
  while (currentSlot < closingTime && slotCount < 100) { // Safety limit
    slots.push(new Date(currentSlot));
    slotCount++;
    
    // After first slot, use 15-minute intervals
    currentSlot.setMinutes(currentSlot.getMinutes() + 15);
  }

  console.log('Generated', slots.length, 'time slots');
  return slots;
};

// Generate time slots starting from a minimum time (for editing existing orders)
// Uses 15-minute intervals
// The first slot must be AFTER the minTime (not equal to it)
export const generateTimeSlotsFromMinTime = (minTime: Date): Date[] => {
  const slots: Date[] = [];
  const now = getCurrentTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check if business is open today
  const dayOfWeek = today.getDay();
  const businessHours = BUSINESS_HOURS[dayOfWeek];
  if (!businessHours) {
    return []; // Closed today
  }

  // Get closing time for today
  const closingTime = getClosingTime(today);

  // Start from minimum time, round up to next 15-minute interval
  // Ensure it's strictly after minTime (not equal to it)
  let currentSlot = roundUpToInterval(new Date(minTime), 15);
  
  // If rounding up resulted in the same time (already on 15-min interval), add 15 more minutes
  if (currentSlot.getTime() <= minTime.getTime()) {
    currentSlot.setMinutes(currentSlot.getMinutes() + 15);
  }
  
  // Ensure we don't go before opening time
  const openingTime = getOpeningTime(today);
  if (currentSlot < openingTime) {
    currentSlot = new Date(openingTime);
  }

  // Generate slots until closing time
  while (currentSlot < closingTime) {
    slots.push(new Date(currentSlot));
    currentSlot.setMinutes(currentSlot.getMinutes() + 15);
  }

  return slots;
};

export const formatTime = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
};

export const formatDateDisplay = (date: Date): string => {
  const today = getCurrentTime();
  const isToday = 
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) {
    const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    return `TODAY, ${month} ${day}`;
  }

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const dayName = dayNames[date.getDay()];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  return `${dayName} ${month} ${day}`;
};

export const parseCustomTime = (timeString: string, baseDate: Date): Date | null => {
  // Remove extra spaces and convert to uppercase
  const cleaned = timeString.trim().toUpperCase();
  
  // Try to match patterns like "1:12 PM", "1:12PM", "13:12", etc.
  const patterns = [
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
    /^(\d{1,2}):(\d{2})(AM|PM)$/i,
    /^(\d{1,2}):(\d{2})$/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();

      // Validate minutes
      if (minutes < 0 || minutes >= 60) {
        return null;
      }

      // Handle 12-hour format
      if (ampm === 'AM' || ampm === 'PM') {
        if (hours < 1 || hours > 12) {
          return null;
        }
        if (ampm === 'PM' && hours !== 12) {
          hours += 12;
        } else if (ampm === 'AM' && hours === 12) {
          hours = 0;
        }
      } else {
        // 24-hour format
        if (hours < 0 || hours >= 24) {
          return null;
        }
      }

      const result = new Date(baseDate);
      result.setHours(hours, minutes, 0, 0);
      return result;
    }
  }

  return null;
};

export const validateCustomTime = (
  customTime: Date,
  firstSlot: Date,
  baseDate: Date,
  minTime?: Date
): { valid: boolean; error?: string } => {

  if (minTime && customTime < minTime) {
    return { valid: false, error: 'New pickup time must be at or after the current pickup time.' };
  }

  if (customTime < firstSlot) {
    return { valid: false, error: 'Time must be after the first available time slot.' };
  }

  if (!isWithinBusinessHours(customTime)) {
    return { valid: false, error: 'Time must be within business hours.' };
  }

  const customDay = new Date(customTime.getFullYear(), customTime.getMonth(), customTime.getDate());
  const baseDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  if (customDay.getTime() !== baseDay.getTime()) {
    return { valid: false, error: 'Time must be on the same day' };
  }

  return { valid: true };
};

