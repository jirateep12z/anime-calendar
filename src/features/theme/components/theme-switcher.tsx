'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';

import { UseIsMounted } from '../hooks/use-is-mounted';
import { UseAppDispatch, UseAppSelector } from '../hooks/use-redux';
import { SetTheme } from '../store/theme-slice';

import type { ThemeMode } from '../types/theme';

function IsThemeMode(theme_mode: string): theme_mode is ThemeMode {
  return (
    theme_mode === 'light' || theme_mode === 'dark' || theme_mode === 'system'
  );
}

export function ThemeSwitcher() {
  const dispatch = UseAppDispatch();
  const { theme, is_hydrated } = UseAppSelector(state => state.theme);
  const is_mounted = UseIsMounted();
  const is_client_hydrated = is_mounted && is_hydrated;
  const visible_theme = is_client_hydrated ? theme : 'system';
  const ThemeIcon =
    visible_theme === 'light'
      ? SunIcon
      : visible_theme === 'dark'
        ? MoonIcon
        : MonitorIcon;

  const HandleThemeChange = (selected_theme: string) => {
    if (!IsThemeMode(selected_theme)) return;
    dispatch(SetTheme(selected_theme));
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="เปลี่ยนธีม"
              disabled={!is_client_hydrated}
            >
              <ThemeIcon aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">เปลี่ยนธีม</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={visible_theme}
            onValueChange={HandleThemeChange}
          >
            <DropdownMenuRadioItem value="light">
              <SunIcon aria-hidden="true" />
              <span>โหมดสว่าง</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <MoonIcon aria-hidden="true" />
              <span>โหมดมืด</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <MonitorIcon aria-hidden="true" />
              <span>ตามระบบ</span>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
