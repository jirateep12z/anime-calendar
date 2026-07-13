'use client';

import {
  FilterIcon,
  LayoutGridIcon,
  ListIcon,
  RefreshCwIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { ScheduleFilter } from './schedule-filter';

import type {
  ScheduleFilter as ScheduleFilterValue,
  ScheduleViewMode
} from '../types/schedule';

interface ScheduleToolbarProps {
  readonly view_mode: ScheduleViewMode;
  readonly filter: ScheduleFilterValue;
  readonly is_refreshing: boolean;
  readonly HandleViewModeChange: (view_mode: ScheduleViewMode) => void;
  readonly HandleFilterChange: (filter: ScheduleFilterValue) => void;
  readonly HandleAdultVisibilityChange: (is_visible: boolean) => void;
  readonly HandleRefresh: () => void;
}

export function ScheduleToolbar({
  view_mode,
  filter,
  is_refreshing,
  HandleViewModeChange,
  HandleFilterChange,
  HandleAdultVisibilityChange,
  HandleRefresh
}: ScheduleToolbarProps) {
  const HandleToggleViewMode = (selected_view_mode: string) => {
    if (selected_view_mode === 'WEEKLY' || selected_view_mode === 'TIMELINE') {
      HandleViewModeChange(selected_view_mode);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-3"
      aria-label="เครื่องมือตาราง"
    >
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={view_mode}
        aria-label="รูปแบบการแสดงผล"
        onValueChange={HandleToggleViewMode}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="WEEKLY" aria-label="แสดงแบบการ์ด">
              <LayoutGridIcon aria-hidden="true" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom">แสดงแบบการ์ด</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="TIMELINE" aria-label="แสดงแบบรายการ">
              <ListIcon aria-hidden="true" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom">แสดงแบบรายการ</TooltipContent>
        </Tooltip>
      </ToggleGroup>
      <Sheet>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" aria-label="เปิดตัวกรอง">
            <FilterIcon data-icon="inline-start" aria-hidden="true" />
            ตัวกรอง
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>ตัวกรองตาราง</SheetTitle>
            <SheetDescription>
              เลือกรูปแบบ สถานะ และเนื้อหาที่ต้องการแสดง
            </SheetDescription>
          </SheetHeader>
          <ScheduleFilter
            filter={filter}
            HandleFilterChange={HandleFilterChange}
            HandleAdultVisibilityChange={HandleAdultVisibilityChange}
          />
        </SheetContent>
      </Sheet>
      <Field orientation="horizontal" className="ml-auto w-auto">
        <Switch
          id="hide-aired"
          checked={filter.is_aired_hidden}
          onCheckedChange={is_checked => {
            HandleFilterChange({ ...filter, is_aired_hidden: is_checked });
          }}
        />
        <FieldLabel htmlFor="hide-aired" className="hidden sm:inline-flex">
          ซ่อนที่ฉายแล้ว
        </FieldLabel>
      </Field>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={is_refreshing}
            aria-label={is_refreshing ? 'กำลังรีเฟรชข้อมูล' : 'รีเฟรชข้อมูล'}
            onClick={HandleRefresh}
          >
            {is_refreshing ? (
              <Spinner />
            ) : (
              <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {is_refreshing ? 'กำลังรีเฟรชข้อมูล' : 'รีเฟรชข้อมูล'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
