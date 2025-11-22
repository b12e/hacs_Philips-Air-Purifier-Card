import { HomeAssistant } from 'custom-card-helpers';
import { DetectedEntities } from './types';

/**
 * Get all entities for a specific device
 */
export function getDeviceEntities(
  hass: HomeAssistant,
  deviceId: string,
): string[] {
  const entities: string[] = [];

  Object.keys(hass.states).forEach((entityId) => {
    const state = hass.states[entityId];
    if (state.attributes.device_id === deviceId) {
      entities.push(entityId);
    }
  });

  return entities;
}

/**
 * Detect and categorize entities from a Philips Air Purifier device
 */
export function detectPhilipsEntities(
  hass: HomeAssistant,
  deviceId: string,
): DetectedEntities {
  const entities = getDeviceEntities(hass, deviceId);
  const detected: DetectedEntities = {};

  entities.forEach((entityId) => {
    const [domain, ...nameParts] = entityId.split('.');
    const name = nameParts.join('.').toLowerCase();

    // Detect fan entity
    if (domain === 'fan') {
      detected.fan = entityId;
    }

    // Detect sensor entities
    if (domain === 'sensor') {
      if (name.includes('pm2') || name.includes('pm25')) {
        detected.pm25 = entityId;
      } else if (name.includes('humidity')) {
        detected.humidity = entityId;
      } else if (name.includes('temperature')) {
        detected.temperature = entityId;
      } else if (name.includes('allergen') || name.includes('iai')) {
        detected.allergen_index = entityId;
      } else if (name.includes('pre_filter') || name.includes('prefilter')) {
        detected.filter_pre = entityId;
      } else if (name.includes('hepa')) {
        detected.filter_hepa = entityId;
      } else if (name.includes('carbon') || name.includes('active_carbon')) {
        detected.filter_carbon = entityId;
      }
    }

    // Detect switch entities
    if (domain === 'switch') {
      if (name.includes('child_lock') || name.includes('childlock')) {
        detected.child_lock = entityId;
      }
    }

    // Detect light entities
    if (domain === 'light') {
      if (name.includes('display') || name.includes('light')) {
        detected.display_light = entityId;
      }
    }
  });

  return detected;
}

/**
 * Get all devices from Home Assistant
 */
export async function getDevices(hass: HomeAssistant): Promise<any[]> {
  try {
    const devices = await hass.callWS({
      type: 'config/device_registry/list',
    });
    return Array.isArray(devices) ? devices : [];
  } catch (error) {
    console.error('Error fetching devices:', error);
    return [];
  }
}

/**
 * Filter devices to show only Philips Air Purifiers
 */
export function filterPhilipsDevices(devices: any[]): any[] {
  return devices.filter((device) => {
    const manufacturer = device.manufacturer?.toLowerCase() || '';
    const model = device.model?.toLowerCase() || '';
    const name = device.name_by_user?.toLowerCase() || device.name?.toLowerCase() || '';

    return (
      manufacturer.includes('philips') &&
      (model.includes('air') || model.includes('purifier') ||
       name.includes('air') || name.includes('purifier'))
    );
  });
}
