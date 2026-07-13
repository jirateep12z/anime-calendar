import {
  CalendarDaysIcon,
  CalendarRangeIcon,
  CircleCheckIcon
} from 'lucide-react';

export const APP_NAVIGATION_ITEMS = Object.freeze([
  { href: '/calendar', label: 'ตาราง', icon: CalendarDaysIcon },
  { href: '/calendar/seasons', label: 'ฤดูกาล', icon: CalendarRangeIcon },
  { href: '/calendar/completed', label: 'จบแล้ว', icon: CircleCheckIcon }
] as const);
