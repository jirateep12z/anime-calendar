'use client';

import { Dialog } from '@/components/ui/dialog';
import { AnimeDetailDialogLayout } from './anime-detail-dialog-layout';

import type { ReactNode } from 'react';
import type { AnimeDetailModel } from '../types/anime-detail';

interface AnimeDetailDialogProps {
  readonly detail_model: AnimeDetailModel | null;
  readonly actions?: ReactNode;
  readonly HandleClose: () => void;
}

export function AnimeDetailDialog({
  detail_model,
  actions,
  HandleClose
}: AnimeDetailDialogProps) {
  if (detail_model === null) {
    return <Dialog open={false} />;
  }

  return (
    <Dialog
      open
      onOpenChange={is_open => {
        if (!is_open) HandleClose();
      }}
    >
      <AnimeDetailDialogLayout
        title={detail_model.title}
        description={detail_model.description}
        cover_image_url={detail_model.cover_image_url}
        format={detail_model.format}
        episode_label={detail_model.episode_label}
        status_label={detail_model.status_label}
        is_adult={detail_model.is_adult}
        rows={detail_model.rows}
        body_description={detail_model.body_description}
        anilist_url={detail_model.anilist_url}
        actions={actions}
      />
    </Dialog>
  );
}
