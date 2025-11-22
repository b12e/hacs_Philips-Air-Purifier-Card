import {
  HassEntityAttributeBase,
  HassEntityBase,
  HassServiceTarget,
} from 'home-assistant-js-websocket';
import { TemplateResult, nothing } from 'lit';

export * from 'home-assistant-js-websocket';

export type TemplateNothing = typeof nothing;
export type Template = TemplateResult | TemplateNothing;

export type PurifierEntityState = 'on' | 'off' | 'unavailable' | 'unknown';

export interface PurifierEntityAttributes extends HassEntityAttributeBase {
  preset_mode?: string;
  preset_modes?: string[];
  percentage?: number;
  percentage_step?: number;
  supported_features?: number;
  use_time?: number;
  device_id?: string;
}

export interface PurifierEntity extends HassEntityBase {
  attributes: PurifierEntityAttributes;
  state: PurifierEntityState;
}

export interface DetectedEntities {
  fan?: string;
  pm25?: string;
  humidity?: string;
  temperature?: string;
  allergen_index?: string;
  filter_pre?: string;
  filter_hepa?: string;
  filter_carbon?: string;
  child_lock?: string;
  display_light?: string;
  [key: string]: string | undefined;
}

export interface PurifierCardConfig {
  type: string;
  device_id?: string;
  entity?: string; // Kept for backward compatibility
  show_name: boolean;
  show_state: boolean;
  show_preset_modes: boolean;
  show_sensors: boolean;
  show_toolbar: boolean;
  compact_view: boolean;
  layout: 'vertical' | 'horizontal';
  detected_entities?: DetectedEntities;
}

export interface SliderValue {
  value: number;
}
