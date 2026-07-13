'use client';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle
} from '@/components/ui/field';

import type {
  AniListFormat,
  BroadcastStatus,
  ScheduleFilter as ScheduleFilterValue
} from '../types/schedule';

interface ScheduleFilterProps {
  readonly filter: ScheduleFilterValue;
  readonly HandleFilterChange: (filter: ScheduleFilterValue) => void;
  readonly HandleAdultVisibilityChange: (is_visible: boolean) => void;
}

interface FilterOption<Value extends string> {
  readonly option_value: Value;
  readonly option_label: string;
}

const FORMAT_OPTIONS: readonly FilterOption<AniListFormat>[] = [
  { option_value: 'TV', option_label: 'TV' },
  { option_value: 'ONA', option_label: 'ONA' }
];
const STATUS_OPTIONS: readonly FilterOption<BroadcastStatus>[] = [
  { option_value: 'UPCOMING', option_label: 'กำลังจะออกอากาศ' },
  { option_value: 'AIRING', option_label: 'กำลังออกอากาศ' },
  { option_value: 'AIRED', option_label: 'ออกอากาศแล้ว' }
];

function ToggleCollectionValue<Value extends string>(
  current_values: readonly Value[],
  selected_value: Value,
  is_checked: boolean
): readonly Value[] {
  if (is_checked) {
    return Object.freeze([...new Set([...current_values, selected_value])]);
  }

  return Object.freeze(
    current_values.filter(current_value => current_value !== selected_value)
  );
}

export function ScheduleFilter({
  filter,
  HandleFilterChange,
  HandleAdultVisibilityChange
}: ScheduleFilterProps) {
  return (
    <FieldGroup className="px-4 pb-4">
      <FieldSet>
        <FieldLegend>รูปแบบ</FieldLegend>
        {FORMAT_OPTIONS.map(format_option => (
          <Field key={format_option.option_value} orientation="horizontal">
            <Checkbox
              id={`format-${format_option.option_value.toLowerCase()}`}
              checked={filter.formats.includes(format_option.option_value)}
              onCheckedChange={checked_value => {
                HandleFilterChange({
                  ...filter,
                  formats: ToggleCollectionValue(
                    filter.formats,
                    format_option.option_value,
                    checked_value === true
                  )
                });
              }}
            />
            <FieldLabel
              htmlFor={`format-${format_option.option_value.toLowerCase()}`}
            >
              {format_option.option_label}
            </FieldLabel>
          </Field>
        ))}
      </FieldSet>
      <FieldSet>
        <FieldLegend>สถานะ</FieldLegend>
        {STATUS_OPTIONS.map(status_option => (
          <Field key={status_option.option_value} orientation="horizontal">
            <Checkbox
              id={`status-${status_option.option_value.toLowerCase()}`}
              checked={filter.statuses.includes(status_option.option_value)}
              onCheckedChange={checked_value => {
                HandleFilterChange({
                  ...filter,
                  statuses: ToggleCollectionValue(
                    filter.statuses,
                    status_option.option_value,
                    checked_value === true
                  )
                });
              }}
            />
            <FieldLabel
              htmlFor={`status-${status_option.option_value.toLowerCase()}`}
            >
              {status_option.option_label}
            </FieldLabel>
          </Field>
        ))}
      </FieldSet>
      <FieldSet>
        <FieldLegend>เนื้อหา</FieldLegend>
        <Field orientation="horizontal">
          <Checkbox
            id="adult-content"
            checked={filter.is_adult_content_visible}
            onCheckedChange={checked_value => {
              HandleAdultVisibilityChange(checked_value === true);
            }}
          />
          <FieldContent>
            <FieldLabel htmlFor="adult-content">แสดงเนื้อหา 18+</FieldLabel>
            <FieldTitle className="text-muted-foreground font-normal">
              ต้องยืนยันอายุก่อนเปิดใช้งาน
            </FieldTitle>
          </FieldContent>
        </Field>
      </FieldSet>
    </FieldGroup>
  );
}
