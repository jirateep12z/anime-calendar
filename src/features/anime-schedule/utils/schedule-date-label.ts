import { TZDate } from '@date-fns/tz';

import { BANGKOK_TIME_ZONE } from '../constants/schedule';

function CreateDateFromKey(date_key: string): TZDate {
  const [year_text, month_text, day_text] = date_key.split('-');
  const year = Number(year_text);
  const month_index = Number(month_text) - 1;
  const day = Number(day_text);

  if (![year, month_index, day].every(Number.isInteger)) {
    throw new RangeError('รูปแบบวันที่ต้องเป็น yyyy-MM-dd');
  }

  return new TZDate(year, month_index, day, BANGKOK_TIME_ZONE);
}

export function FormatScheduleDayLabel(date_key: string): string {
  return new Intl.DateTimeFormat('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: BANGKOK_TIME_ZONE
  }).format(CreateDateFromKey(date_key));
}

export function FormatScheduleTabLabel(date_key: string): {
  readonly weekday_label: string;
  readonly date_label: string;
} {
  const schedule_date = CreateDateFromKey(date_key);

  return Object.freeze({
    weekday_label: new Intl.DateTimeFormat('th-TH', {
      weekday: 'short',
      timeZone: BANGKOK_TIME_ZONE
    }).format(schedule_date),
    date_label: new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      timeZone: BANGKOK_TIME_ZONE
    }).format(schedule_date)
  });
}
