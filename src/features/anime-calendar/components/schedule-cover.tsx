'use client';

import { ImageOffIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { Cn } from '@/lib/utils';

interface ScheduleCoverProps {
  readonly cover_image_url: string | null;
  readonly title: string;
  readonly className?: string;
  readonly sizes?: string;
}

export function ScheduleCover({
  cover_image_url,
  title,
  className,
  sizes = '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw'
}: ScheduleCoverProps) {
  const [is_image_broken, set_is_image_broken] = useState(false);

  if (cover_image_url === null || is_image_broken) {
    return (
      <div
        role="img"
        aria-label={`ไม่มีภาพปกสำหรับ ${title}`}
        className={Cn(
          'bg-muted text-muted-foreground relative flex aspect-[2/3] w-full items-center justify-center overflow-hidden',
          className
        )}
      >
        <ImageOffIcon aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className={Cn('relative aspect-[2/3] w-full overflow-hidden', className)}
    >
      <Image
        src={cover_image_url}
        alt={`ภาพปก ${title}`}
        fill
        sizes={sizes}
        quality={75}
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => set_is_image_broken(true)}
      />
    </div>
  );
}
