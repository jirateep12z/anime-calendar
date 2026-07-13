import { CloudOffIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';

interface ScheduleErrorStateProps {
  readonly HandleRetry: () => void;
}

export function ScheduleErrorState({ HandleRetry }: ScheduleErrorStateProps) {
  return (
    <Empty role="alert">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CloudOffIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>ไม่สามารถโหลดตารางออกอากาศได้</EmptyTitle>
        <EmptyDescription>โปรดลองอีกครั้ง</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" onClick={HandleRetry}>
          ลองใหม่
        </Button>
      </EmptyContent>
    </Empty>
  );
}
