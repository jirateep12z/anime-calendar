'use client';

import { ShieldAlertIcon } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface AdultConfirmationDialogProps {
  readonly is_open: boolean;
  readonly HandleConfirm: () => void;
  readonly HandleCancel: () => void;
}

export function AdultConfirmationDialog({
  is_open,
  HandleConfirm,
  HandleCancel
}: AdultConfirmationDialogProps) {
  return (
    <AlertDialog open={is_open}>
      <AlertDialogContent onEscapeKeyDown={HandleCancel}>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <ShieldAlertIcon aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>ยืนยันการแสดงเนื้อหา 18+</AlertDialogTitle>
          <AlertDialogDescription>
            เนื้อหานี้อาจไม่เหมาะสมสำหรับผู้ที่มีอายุต่ำกว่า 18 ปี
            การยืนยันเป็นเพียงการตั้งค่าบนอุปกรณ์นี้ ไม่ใช่การตรวจสอบอายุจริง
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={HandleCancel}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction onClick={HandleConfirm}>
            ฉันมีอายุ 18 ปีขึ้นไป
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
