import { Skeleton } from '@/components/ui/skeleton';

export function ScheduleLoadingState() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-label="กำลังโหลดตาราง"
    >
      {Array.from({ length: 8 }, (_, skeleton_index) => (
        <Skeleton key={skeleton_index} className="h-48 rounded-xl" />
      ))}
    </div>
  );
}
