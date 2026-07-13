import type { ReactNode } from 'react';

interface PanelHeaderBandProps {
  readonly icon: ReactNode;
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly close: ReactNode;
}

export function PanelHeaderBand({
  icon,
  title,
  description,
  close
}: PanelHeaderBandProps) {
  return (
    <div className="brand-screen [&_[data-slot=dialog-description]]:text-muted-foreground [&_[data-slot=sheet-description]]:text-muted-foreground relative flex items-start gap-3 border-b p-4 pr-12 sm:p-5 sm:pr-14 [&_[data-slot=dialog-title]]:text-lg [&_[data-slot=dialog-title]]:leading-tight [&_[data-slot=dialog-title]]:font-bold [&_[data-slot=sheet-title]]:text-lg [&_[data-slot=sheet-title]]:leading-tight [&_[data-slot=sheet-title]]:font-bold">
      <span
        aria-hidden="true"
        className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title}
        {description}
      </div>
      <div className="absolute top-3 right-3">{close}</div>
    </div>
  );
}
