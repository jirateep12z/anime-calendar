import { redirect } from 'next/navigation';

const CALENDAR_PATH = '/calendar/';

export default function RootRedirectPage() {
  redirect(CALENDAR_PATH);
}
