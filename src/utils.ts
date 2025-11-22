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

// Supported Philips Air Purifier models from the philips-airpurifier-coap integration
const SUPPORTED_MODELS = [
  'AC0850', 'AC0950', 'AC0951', 'AC1214', 'AC1715',
  'AC2729', 'AC2889', 'AC2936', 'AC2939', 'AC2958', 'AC2959',
  'AC3033', 'AC3036', 'AC3039', 'AC3055', 'AC3059',
  'AC3210', 'AC3220', 'AC3221', 'AC3259',
  'AC3420', 'AC3421', 'AC3737', 'AC3829', 'AC3836',
  'AC3854', 'AC3858',
  'AC4220', 'AC4221', 'AC4236', 'AC4550', 'AC4558',
  'AC5659', 'AC5660',
  'AMF765', 'AMF870',
  'CX3120', 'CX3550', 'CX5120',
  'HU1509', 'HU1510', 'HU5710'
];

/**
 * Filter devices to show only Philips Air Purifiers
 */
export function filterPhilipsDevices(devices: any[]): any[] {
  return devices.filter((device) => {
    const manufacturer = device.manufacturer?.toLowerCase() || '';
    const model = device.model?.toUpperCase() || '';
    const name = device.name_by_user?.toLowerCase() || device.name?.toLowerCase() || '';

    // Debug logging for first few devices
    if (devices.indexOf(device) < 5) {
      console.log('Device:', {
        name: device.name_by_user || device.name,
        manufacturer: device.manufacturer,
        model: device.model,
        id: device.id
      });
    }

    // Match Philips manufacturer AND model is in supported list
    const isPhilipsManufacturer = manufacturer.includes('philips');

    // Check if model matches any supported model (with or without variant suffix like /11, /20, etc.)
    const modelBase = model.replace(/\/\d+$/, ''); // Remove /11, /20, etc. suffix
    const isSupportedModel = SUPPORTED_MODELS.some(supportedModel =>
      model.startsWith(supportedModel) || modelBase === supportedModel
    );

    return isPhilipsManufacturer && isSupportedModel;
  });
}
