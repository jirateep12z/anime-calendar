import Link from 'next/link';

import { button_variants } from '@/components/ui/button-variants';

export default function OfflinePage() {
  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6 py-12">
      <section className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">
          ยังเชื่อมต่ออินเทอร์เน็ตไม่ได้
        </h1>
        <p className="text-muted-foreground">
          หากเคยเปิดตารางอนิเมะไว้แล้ว
          คุณยังสามารถดูข้อมูลล่าสุดที่บันทึกในอุปกรณ์นี้ได้
        </p>
        <Link
          href="/calendar/"
          data-slot="button"
          data-variant="default"
          data-size="default"
          className={button_variants()}
        >
          เปิดตารางที่บันทึกไว้
        </Link>
      </section>
    </main>
  );
}
