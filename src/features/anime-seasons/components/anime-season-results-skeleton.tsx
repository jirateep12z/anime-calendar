import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Cn } from '@/lib/utils';

const SEASON_CARD_COUNT = 6;

function LoadingBlock({ className }: { readonly className: string }) {
  return <Skeleton className={Cn('motion-reduce:animate-none', className)} />;
}

function AnimeSeasonCardSkeleton() {
  return (
    <li className="min-w-0">
      <Card className="relative h-full p-0">
        <div className="grid h-full grid-cols-[7rem_minmax(0,1fr)] items-stretch sm:grid-cols-[8rem_minmax(0,1fr)]">
          <LoadingBlock className="h-full min-h-44 rounded-none" />
          <div className="flex min-h-44 min-w-0 flex-col gap-3 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <LoadingBlock className="h-8 w-16" />
              <LoadingBlock className="h-3 w-10" />
            </div>
            <div className="flex flex-col gap-1.5">
              <LoadingBlock className="h-5 w-full" />
              <LoadingBlock className="h-5 w-3/4" />
              <LoadingBlock className="h-3 w-1/2" />
            </div>
            <div className="flex flex-col gap-1.5">
              <LoadingBlock className="h-3 w-full" />
              <LoadingBlock className="h-3 w-5/6" />
            </div>
            <div className="mt-auto flex flex-wrap gap-1.5">
              <LoadingBlock className="h-5 w-20 rounded-sm" />
              <LoadingBlock className="h-5 w-12 rounded-sm" />
            </div>
          </div>
        </div>
        <LoadingBlock className="absolute top-2 left-2 size-10" />
      </Card>
    </li>
  );
}

export function AnimeSeasonResultsSkeleton() {
  return (
    <ul
      aria-hidden="true"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: SEASON_CARD_COUNT }, (_, card_index) => (
        <AnimeSeasonCardSkeleton key={card_index} />
      ))}
    </ul>
  );
}
