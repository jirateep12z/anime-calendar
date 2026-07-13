'use client';

import { AnimeDetailDialog } from '@/features/anime-calendar/components/anime-detail-dialog';
import { CreateAnimeDetailFromCatalog } from '@/features/anime-calendar/services/create-anime-detail-model';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle
} from '@/components/ui/field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { UseNotifications } from '@/features/anime-notifications/hooks/use-notifications';
import { UsePwa } from '@/features/pwa/hooks/use-pwa';
import {
  BellOffIcon,
  DownloadIcon,
  LoaderCircleIcon,
  ShareIcon,
  TriangleAlertIcon
} from 'lucide-react';

import type { AnimeDetailModel } from '@/features/anime-calendar/types/anime-detail';
import type { ScheduleEntry } from '@/features/anime-calendar/types/schedule';
import type {
  BookmarkCatalogEntry,
  NotificationCapabilityStatus
} from '../types/notification';
import { BookmarkList } from './bookmark-list';

interface NotificationSettingsSheetProps {
  readonly schedule_entries?: readonly ScheduleEntry[];
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

const CAPABILITY_CONTENT: Readonly<
  Record<
    Exclude<NotificationCapabilityStatus, 'SUPPORTED'>,
    { readonly title: string; readonly description: string }
  >
> = Object.freeze({
  UNSUPPORTED: Object.freeze({
    title: 'เบราว์เซอร์นี้ไม่รองรับ Web Push',
    description:
      'คุณยังเพิ่มบุ๊กมาร์กและเปิดตารางแบบออฟไลน์ได้ แต่จะไม่ได้รับการแจ้งเตือนจากระบบ'
  }),
  PERMISSION_DENIED: Object.freeze({
    title: 'สิทธิ์การแจ้งเตือนถูกปิดอยู่',
    description:
      'เปิดสิทธิ์ Notifications ในการตั้งค่าเว็บไซต์ของเบราว์เซอร์ แล้วโหลดหน้านี้ใหม่'
  }),
  IOS_INSTALL_REQUIRED: Object.freeze({
    title: 'ต้องติดตั้งแอปก่อนเปิดการแจ้งเตือน',
    description:
      'แตะปุ่มแชร์ แล้วเลือก “เพิ่มไปยังหน้าจอโฮม” จากนั้นเปิดแอปผ่านไอคอนบนหน้าจอโฮม'
  })
});

export function NotificationSettingsSheet({
  schedule_entries = [],
  open,
  onOpenChange
}: NotificationSettingsSheetProps) {
  const {
    preferences,
    capability_status,
    bookmark_count,
    sync_error_message,
    EnableNotifications,
    DisableNotifications,
    ChangeNotificationMode,
    RetryPendingMutations
  } = UseNotifications();
  const { install_status, InstallPwa } = UsePwa();
  const [is_updating, set_is_updating] = useState(false);
  const [is_installing, set_is_installing] = useState(false);
  const [selected_detail_model, set_selected_detail_model] =
    useState<AnimeDetailModel | null>(null);

  const HandleEnabledChange = async (is_enabled: boolean) => {
    set_is_updating(true);
    try {
      if (is_enabled) {
        await EnableNotifications();
      } else {
        await DisableNotifications();
      }
    } finally {
      set_is_updating(false);
    }
  };

  const HandleModeChange = async (notification_mode: string) => {
    if (notification_mode !== 'ALL' && notification_mode !== 'BOOKMARKS') {
      return;
    }

    set_is_updating(true);
    try {
      await ChangeNotificationMode(notification_mode);
    } finally {
      set_is_updating(false);
    }
  };

  const HandleInstall = async () => {
    set_is_installing(true);
    try {
      await InstallPwa();
    } finally {
      set_is_installing(false);
    }
  };

  const capability_content =
    capability_status === 'SUPPORTED'
      ? null
      : CAPABILITY_CONTENT[capability_status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>การแจ้งเตือน</SheetTitle>
          <SheetDescription>
            ตั้งค่าสำหรับอุปกรณ์นี้โดยไม่ต้องเข้าสู่ระบบ
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto px-4 pb-6">
          <FieldGroup>
            {capability_content ? (
              <Alert>
                <BellOffIcon aria-hidden="true" />
                <AlertTitle>{capability_content.title}</AlertTitle>
                <AlertDescription>
                  {capability_content.description}
                </AlertDescription>
              </Alert>
            ) : (
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="notification-enabled">
                    เปิดการแจ้งเตือน
                  </FieldLabel>
                  <FieldDescription>
                    แจ้งตรงเวลาออกอากาศ หรือย้อนหลังไม่เกิน 5 นาที
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="notification-enabled"
                  checked={preferences.is_notification_enabled}
                  disabled={is_updating}
                  aria-label="เปิดการแจ้งเตือน"
                  onCheckedChange={HandleEnabledChange}
                />
              </Field>
            )}

            <Field data-disabled={capability_status !== 'SUPPORTED'}>
              <FieldTitle>เรื่องที่ต้องการแจ้ง</FieldTitle>
              <FieldDescription>
                มีบุ๊กมาร์กบนอุปกรณ์นี้ {bookmark_count.toLocaleString('th-TH')}{' '}
                เรื่อง
              </FieldDescription>
              <ToggleGroup
                type="single"
                variant="outline"
                className="grid w-full grid-cols-2"
                value={preferences.notification_mode}
                disabled={capability_status !== 'SUPPORTED' || is_updating}
                aria-label="เรื่องที่ต้องการแจ้ง"
                onValueChange={HandleModeChange}
              >
                <ToggleGroupItem value="ALL">ทุกเรื่อง</ToggleGroupItem>
                <ToggleGroupItem value="BOOKMARKS">
                  เฉพาะบุ๊กมาร์ก
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>

            <BookmarkList
              schedule_entries={schedule_entries}
              HandleOpenDetail={(catalog_entry: BookmarkCatalogEntry) =>
                set_selected_detail_model(
                  CreateAnimeDetailFromCatalog(
                    catalog_entry,
                    Math.floor(Date.now() / 1_000)
                  )
                )
              }
            />

            {install_status === 'AVAILABLE' ? (
              <Field>
                <FieldTitle>ติดตั้งบนอุปกรณ์</FieldTitle>
                <FieldDescription>
                  เปิดตารางล่าสุดและจัดการบุ๊กมาร์กได้สะดวกขึ้น
                </FieldDescription>
                <Button
                  type="button"
                  variant="outline"
                  disabled={is_installing}
                  onClick={() => void HandleInstall()}
                >
                  {is_installing ? (
                    <LoaderCircleIcon
                      data-icon="inline-start"
                      className="animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  ) : (
                    <DownloadIcon data-icon="inline-start" aria-hidden="true" />
                  )}
                  ติดตั้งแอป
                </Button>
              </Field>
            ) : null}

            {install_status === 'IOS_GUIDANCE' ? (
              <Alert>
                <ShareIcon aria-hidden="true" />
                <AlertTitle>ติดตั้งบน iPhone หรือ iPad</AlertTitle>
                <AlertDescription>
                  แตะปุ่มแชร์ แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”
                </AlertDescription>
              </Alert>
            ) : null}

            {sync_error_message ? (
              <Alert variant="destructive">
                <TriangleAlertIcon aria-hidden="true" />
                <AlertTitle>ยังซิงก์การตั้งค่าไม่ได้</AlertTitle>
                <AlertDescription>{sync_error_message}</AlertDescription>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => void RetryPendingMutations()}
                >
                  ลองอีกครั้ง
                </Button>
              </Alert>
            ) : null}
          </FieldGroup>
        </div>
      </SheetContent>
      <AnimeDetailDialog
        detail_model={selected_detail_model}
        HandleClose={() => set_selected_detail_model(null)}
      />
    </Sheet>
  );
}
