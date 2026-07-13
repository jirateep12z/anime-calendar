import { Badge } from '@/components/ui/badge';
import { Cn } from '@/lib/utils';

import type { BroadcastStatus } from '../types/schedule';

type AnimeStatusBadgeStatus = BroadcastStatus | 'ADULT';

const STATUS_CLASS_NAME_BY_STATUS: Readonly<
  Record<AnimeStatusBadgeStatus, string>
> = {
  UPCOMING: 'bg-status-upcoming/12 text-status-upcoming',
  AIRING: 'bg-status-airing/12 text-status-airing',
  AIRED: 'bg-status-aired/12 text-status-aired',
  ADULT: 'bg-status-adult/12 text-status-adult'
};

interface AnimeStatusBadgeProps extends Omit<
  React.ComponentProps<typeof Badge>,
  'variant'
> {
  readonly status: AnimeStatusBadgeStatus;
}

export function AnimeStatusBadge({
  status,
  className,
  ...props
}: AnimeStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={Cn(STATUS_CLASS_NAME_BY_STATUS[status], className)}
      {...props}
    />
  );
}
