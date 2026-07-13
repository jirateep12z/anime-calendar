import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DEFAULT_COMPLETED_BOOKMARK_FILTER } from '../constants/completed-bookmarks';

import type {
  CompletedBookmarkFilter,
  CompletedBookmarkView
} from '../types/completed-bookmark';

interface CompletedBookmarkToolbarProps {
  readonly filter: CompletedBookmarkFilter;
  readonly year_options: CompletedBookmarkView['year_options'];
  readonly season_options: CompletedBookmarkView['season_options'];
  readonly HandleFilterChange: (filter: CompletedBookmarkFilter) => void;
}

function SerializeFilterValue(filter_value: string | number): string {
  return String(filter_value).toLowerCase();
}

export function CompletedBookmarkToolbar({
  filter,
  year_options,
  season_options,
  HandleFilterChange
}: CompletedBookmarkToolbarProps) {
  const has_active_filters =
    filter.season_year !== 'ALL' || filter.season !== 'ALL';
  const HandleYearChange = (selected_value: string) => {
    const selected_option = year_options.find(
      option => SerializeFilterValue(option.filter_value) === selected_value
    );

    if (selected_option) {
      HandleFilterChange({
        ...filter,
        season_year: selected_option.filter_value
      });
    }
  };
  const HandleSeasonChange = (selected_value: string) => {
    const selected_option = season_options.find(
      option => SerializeFilterValue(option.filter_value) === selected_value
    );

    if (selected_option) {
      HandleFilterChange({ ...filter, season: selected_option.filter_value });
    }
  };

  return (
    <FieldGroup
      className="gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      aria-label={'ตัวกรองเรื่องที่จบแล้ว'}
    >
      <Field className="sm:w-40">
        <FieldLabel htmlFor="completed-bookmark-year">
          {'ปีที่เริ่มฉาย'}
        </FieldLabel>
        <Select
          value={SerializeFilterValue(filter.season_year)}
          onValueChange={HandleYearChange}
        >
          <SelectTrigger id="completed-bookmark-year" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              {year_options.map(option => (
                <SelectItem
                  key={SerializeFilterValue(option.filter_value)}
                  value={SerializeFilterValue(option.filter_value)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field className="sm:w-52">
        <FieldLabel htmlFor="completed-bookmark-season">
          {'ฤดูกาลที่เริ่มฉาย'}
        </FieldLabel>
        <Select
          value={SerializeFilterValue(filter.season)}
          onValueChange={HandleSeasonChange}
        >
          <SelectTrigger id="completed-bookmark-season" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              {season_options.map(option => (
                <SelectItem
                  key={SerializeFilterValue(option.filter_value)}
                  value={SerializeFilterValue(option.filter_value)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Button
        type="button"
        variant="outline"
        disabled={!has_active_filters}
        onClick={() => HandleFilterChange(DEFAULT_COMPLETED_BOOKMARK_FILTER)}
      >
        {'ล้างตัวกรอง'}
      </Button>
    </FieldGroup>
  );
}
