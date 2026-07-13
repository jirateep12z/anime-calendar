import { SearchXIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';

interface ScheduleEmptyStateProps {
  readonly has_active_filter: boolean;
  readonly HandleReset: () => void;
}

export function ScheduleEmptyState({
  has_active_filter,
  HandleReset
}: ScheduleEmptyStateProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>
          {has_active_filter
            ? 'ไม่พบอนิเมะที่ตรงกับคำค้นหา'
            : 'ช่วงนี้ยังไม่มีรายการออกอากาศ'}
        </EmptyTitle>
        <EmptyDescription>
          ลองเปลี่ยนคำค้นหา ตัวกรอง หรือกลับมาตรวจสอบอีกครั้งภายหลัง
        </EmptyDescription>
      </EmptyHeader>
      {has_active_filter ? (
        <EmptyContent>
          <Button type="button" variant="outline" onClick={HandleReset}>
            ล้างคำค้นหาและตัวกรอง
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
