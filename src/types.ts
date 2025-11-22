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

  // Display options
  show_name: boolean;
  show_state: boolean;
  show_icon: boolean; // Show/hide the power button/icon
  icon_animation?: boolean; // Animate the fan icon when on
  fill_container?: boolean;

  // Preset modes
  show_preset_modes: boolean;
  collapsible_preset_modes?: boolean; // Show preset modes behind a button
  visible_preset_modes?: string[]; // Which preset modes to show (empty = all)

  // Sensors
  show_sensors: boolean;
  sensors_in_separate_card?: boolean; // Show sensors in separate card below
  visible_sensors?: string[]; // Which sensors to show (pm25, iai, humidity, temperature)

  // Controls
  show_child_lock?: boolean;
  collapse_controls_when_off?: boolean; // Hide sensors and buttons when device is off

  // Legacy
  show_toolbar: boolean; // Deprecated
  show_power_button?: boolean; // Deprecated
  compact_view: boolean; // Deprecated
  layout: 'vertical' | 'horizontal'; // Deprecated
  collapsible_controls?: boolean; // Deprecated

  detected_entities?: DetectedEntities;
}

export interface SliderValue {
  value: number;
}
