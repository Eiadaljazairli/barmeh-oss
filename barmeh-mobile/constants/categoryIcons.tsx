import React from 'react';
import {
  Home,
  Car,
  Smartphone,
  Sofa,
  Shirt,
  Wrench,
  Package,
  LayoutGrid,
  Sparkles,
  type LucideProps,
} from 'lucide-react-native';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  realestate: Home,
  cars: Car,
  electronics: Smartphone,
  furniture: Sofa,
  clothing: Shirt,
  beauty: Sparkles,
  services: Wrench,
  other: Package,
  ALL: LayoutGrid,
};

interface GetIconOptions {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function renderCategoryIcon(
  slug: string | undefined,
  opts: GetIconOptions = {}
): React.ReactElement | null {
  if (!slug) return null;
  const Icon = ICON_MAP[slug];
  if (!Icon) return null;
  return (
    <Icon
      size={opts.size ?? 24}
      color={opts.color ?? '#5f6368'}
      strokeWidth={opts.strokeWidth ?? 2}
    />
  );
}

export function hasLucideIcon(slug: string | undefined): boolean {
  return !!slug && slug in ICON_MAP;
}
