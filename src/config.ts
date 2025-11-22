import { PurifierCardConfig } from './types';
import localize from './localize';

export default function buildConfig(
  config?: Partial<PurifierCardConfig>,
): PurifierCardConfig {
  if (!config) {
    throw new Error(localize('error.invalid_config'));
  }

  // Note: We don't throw an error if both device_id and entity are missing
  // to allow the card picker preview to work. The error will be shown
  // in the card UI itself when trying to render without an entity.

  return {
    type: 'custom:philips-purifier-card',
    ...config,
    device_id: config.device_id,
    entity: config.entity,

    // Display options
    show_name: config.show_name ?? true,
    show_state: config.show_state ?? true,
    show_icon: config.show_icon ?? true,
    icon_animation: config.icon_animation ?? true,
    fill_container: config.fill_container ?? false,

    // Preset modes
    show_preset_modes: config.show_preset_modes ?? true,
    collapsible_preset_modes: config.collapsible_preset_modes ?? false,
    visible_preset_modes: config.visible_preset_modes ?? [],

    // Sensors
    show_sensors: config.show_sensors ?? true,
    sensors_in_separate_card: config.sensors_in_separate_card ?? true,
    visible_sensors: config.visible_sensors ?? [],

    // Controls
    show_child_lock: config.show_child_lock ?? true,
    collapse_controls_when_off: config.collapse_controls_when_off ?? false,
    hide_sensors_when_off: config.hide_sensors_when_off ?? false,

    // Legacy (for backward compatibility)
    show_toolbar: config.show_toolbar ?? true,
    show_power_button: config.show_power_button,
    compact_view: config.compact_view ?? false,
    layout: config.layout ?? 'vertical',
    collapsible_controls: config.collapsible_controls,

    detected_entities: config.detected_entities ?? {},
  };
}
