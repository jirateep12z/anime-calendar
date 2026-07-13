'use client';

import {
  BookmarkButton,
  BookmarkList,
  UseBookmarks
} from '@/features/anime-bookmarks/client';
import { CreateAnimeDetailFromCatalog } from '@/features/anime-schedule';
import { AnimeDetailDialog } from '@/features/anime-schedule/client';
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
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { UsePwa } from '@/features/pwa/client';
import {
  BellOffIcon,
  DownloadIcon,
  LoaderCircleIcon,
  ShareIcon,
  TriangleAlertIcon,
  XIcon
} from 'lucide-react';
import { UseNotifications } from '../hooks/use-notifications';

import type { BookmarkCatalogEntry } from '@/features/anime-bookmarks';
import type {
  AnimeDetailModel,
  ScheduleEntry
} from '@/features/anime-schedule';
import type { NotificationCapabilityStatus } from '../types/notification';

interface NotificationSettingsSheetProps {
  readonly schedule_entries?: readonly ScheduleEntry[];
  readonly open: boolean;
  readonly OnOpenChange: (open: boolean) => void;
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
  OnOpenChange
}: NotificationSettingsSheetProps) {
  const {
    preferences,
    capability_status,
    sync_error_message,
    EnableNotifications,
    DisableNotifications,
    ChangeNotificationMode,
    RetryPendingMutations
  } = UseNotifications();
  const { bookmark_count } = UseBookmarks();
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
    <Sheet open={open} onOpenChange={OnOpenChange}>
      <SheetContent side="right" showCloseButton={false}>
        <SheetHeader className="border-b">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <SheetTitle>การแจ้งเตือน</SheetTitle>
              <SheetDescription>
                ตั้งค่าสำหรับอุปกรณ์นี้โดยไม่ต้องเข้าสู่ระบบ
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
              >
                <XIcon aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div
          data-layout="notification-content"
          className="min-h-0 flex-1 overflow-y-auto px-4 pb-6"
        >
          <FieldGroup className="gap-5">
            {capability_content ? (
              <Alert>
                <BellOffIcon aria-hidden="true" />
                <AlertTitle>{capability_content.title}</AlertTitle>
                <AlertDescription>
                  {capability_content.description}
                </AlertDescription>
              </Alert>
            ) : (
              <section
                aria-labelledby="notification-enabled-title"
                data-layout="notification-master"
                className="bg-muted/30 rounded-lg p-4"
              >
                <Field orientation="horizontal" className="gap-4">
                  <FieldContent className="min-w-0">
                    <FieldLabel
                      id="notification-enabled-title"
                      htmlFor="notification-enabled"
                    >
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
                    className="shrink-0"
                    aria-label="เปิดการแจ้งเตือน"
                    onCheckedChange={HandleEnabledChange}
                  />
                </Field>
              </section>
            )}

            <section
              aria-labelledby="notification-mode-title"
              data-layout="notification-mode"
              className="border-t pt-5"
            >
              <Field data-disabled={capability_status !== 'SUPPORTED'}>
                <FieldTitle id="notification-mode-title">
                  เรื่องที่ต้องการแจ้ง
                </FieldTitle>
                <FieldDescription>
                  มีบุ๊กมาร์กบนอุปกรณ์นี้{' '}
                  {bookmark_count.toLocaleString('th-TH')} เรื่อง
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
            </section>

            <div data-layout="notification-bookmarks" className="border-t pt-5">
              <BookmarkList
                schedule_entries={schedule_entries}
                is_adult_content_visible={
                  preferences.is_adult_confirmed &&
                  preferences.is_adult_content_visible
                }
                HandleOpenDetail={(catalog_entry: BookmarkCatalogEntry) =>
                  set_selected_detail_model(
                    CreateAnimeDetailFromCatalog(
                      catalog_entry,
                      Math.floor(Date.now() / 1_000)
                    )
                  )
                }
              />
            </div>

            {install_status === 'AVAILABLE' ? (
              <section
                aria-labelledby="notification-install-title"
                data-layout="notification-install"
                className="border-t pt-5"
              >
                <Field>
                  <FieldTitle id="notification-install-title">
                    ติดตั้งบนอุปกรณ์
                  </FieldTitle>
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
                      <DownloadIcon
                        data-icon="inline-start"
                        aria-hidden="true"
                      />
                    )}
                    ติดตั้งแอป
                  </Button>
                </Field>
              </section>
            ) : null}

            {install_status === 'IOS_GUIDANCE' ? (
              <div
                data-layout="notification-install-guidance"
                className="border-t pt-5"
              >
                <Alert>
                  <ShareIcon aria-hidden="true" />
                  <AlertTitle>ติดตั้งบน iPhone หรือ iPad</AlertTitle>
                  <AlertDescription>
                    แตะปุ่มแชร์ แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}

            {sync_error_message ? (
              <section
                aria-labelledby="notification-sync-status-title"
                data-layout="notification-sync-status"
                className="border-t pt-5"
              >
                <Alert variant="destructive">
                  <TriangleAlertIcon aria-hidden="true" />
                  <AlertTitle id="notification-sync-status-title">
                    ยังซิงก์การตั้งค่าไม่ได้
                  </AlertTitle>
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
              </section>
            ) : null}
          </FieldGroup>
        </div>
      </SheetContent>
      <AnimeDetailDialog
        detail_model={selected_detail_model}
        actions={
          selected_detail_model ? (
            <BookmarkButton
              anilist_media_id={selected_detail_model.anilist_media_id}
              title={selected_detail_model.title}
              catalog_entry={selected_detail_model.catalog_entry}
            />
          ) : null
        }
        HandleClose={() => set_selected_detail_model(null)}
      />
    </Sheet>
  );
}
