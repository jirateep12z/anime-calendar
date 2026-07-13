import { Button } from '@/components/ui/button';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
      className="gap-4 sm:flex-row sm:flex-wrap sm:items-end"
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
          <SelectTrigger
            id="completed-bookmark-year"
            className="min-h-10 w-full"
          >
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
      <Field className="sm:w-auto">
        <FieldTitle id="completed-bookmark-season-label">
          {'ฤดูกาลที่เริ่มฉาย'}
        </FieldTitle>
        <ToggleGroup
          type="single"
          variant="outline"
          value={SerializeFilterValue(filter.season)}
          aria-labelledby="completed-bookmark-season-label"
          className="grid w-full grid-cols-2 sm:flex sm:w-fit sm:flex-wrap"
          onValueChange={HandleSeasonChange}
        >
          {season_options.map(option => (
            <ToggleGroupItem
              key={SerializeFilterValue(option.filter_value)}
              value={SerializeFilterValue(option.filter_value)}
              className="min-h-10"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      <Button
        type="button"
        variant="outline"
        className="min-h-10 shrink-0"
        disabled={!has_active_filters}
        onClick={() => HandleFilterChange(DEFAULT_COMPLETED_BOOKMARK_FILTER)}
      >
        {'ล้างตัวกรอง'}
      </Button>
    </FieldGroup>
  );
}
