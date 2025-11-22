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
    show_name: config.show_name ?? true,
    show_state: config.show_state ?? true,
    show_preset_modes: config.show_preset_modes ?? true,
    show_sensors: config.show_sensors ?? true,
    show_toolbar: config.show_toolbar ?? true,
    compact_view: config.compact_view ?? false,
    layout: config.layout ?? 'vertical',
    detected_entities: config.detected_entities ?? {},
  };
}
