import { WifiOffIcon } from 'lucide-react';

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FormatBangkokTime } from '../utils/schedule-time';

export type ScheduleRefreshStatus =
  'IDLE' | 'FETCHING' | 'CACHED_WARNING' | 'OFFLINE';

interface ScheduleStatusBarProps {
  readonly range_label: string;
  readonly refresh_status: ScheduleRefreshStatus;
  readonly last_updated_at: number | null;
  readonly HandleRetry: () => void;
}

export function ScheduleStatusBar({
  range_label,
  refresh_status,
  last_updated_at,
  HandleRetry
}: ScheduleStatusBarProps) {
  if (refresh_status === 'OFFLINE') {
    return (
      <Alert>
        <WifiOffIcon aria-hidden="true" />
        <AlertTitle>ออฟไลน์—กำลังใช้ข้อมูลที่บันทึกไว้</AlertTitle>
        <AlertDescription>
          {range_label}
          {last_updated_at !== null
            ? ` • อัปเดตล่าสุด ${FormatBangkokTime(last_updated_at / 1000)} น.`
            : ''}
        </AlertDescription>
      </Alert>
    );
  }

  if (refresh_status === 'CACHED_WARNING') {
    return (
      <Alert>
        <WifiOffIcon aria-hidden="true" />
        <AlertTitle>อัปเดตข้อมูลไม่สำเร็จ</AlertTitle>
        <AlertDescription>กำลังแสดงข้อมูลที่บันทึกไว้</AlertDescription>
        <AlertAction>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={HandleRetry}
          >
            ลองใหม่
          </Button>
        </AlertAction>
      </Alert>
    );
  }

  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span>{range_label}</span>
      <span aria-hidden="true">•</span>
      {refresh_status === 'FETCHING' ? (
        <span className="flex items-center gap-2">
          <Spinner />
          กำลังอัปเดตข้อมูล...
        </span>
      ) : last_updated_at !== null ? (
        <span>อัปเดตล่าสุด {FormatBangkokTime(last_updated_at / 1000)} น.</span>
      ) : (
        <span>รอการอัปเดตข้อมูล</span>
      )}
    </div>
  );
}
