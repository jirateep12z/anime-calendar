import { CloudOffIcon } from 'lucide-react';
import Link from 'next/link';

import { button_variants } from '@/components/ui/button-variants';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';

export default function OfflinePage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center gap-2.5 px-4 lg:px-6">
          <span
            className="on-air-dot inline-block size-2 shrink-0"
            aria-hidden="true"
          />
          <span className="text-base font-bold tracking-tight sm:text-lg">
            Anime Calendar
          </span>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CloudOffIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>
              <h1>ยังเชื่อมต่ออินเทอร์เน็ตไม่ได้</h1>
            </EmptyTitle>
            <EmptyDescription>
              หากเคยเปิดตารางอนิเมะไว้แล้ว
              คุณยังสามารถดูข้อมูลล่าสุดที่บันทึกในอุปกรณ์นี้ได้
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link
              href="/calendar/"
              data-slot="button"
              data-variant="default"
              data-size="default"
              className={button_variants()}
            >
              เปิดตารางที่บันทึกไว้
            </Link>
          </EmptyContent>
        </Empty>
      </main>
    </div>
  );
}
