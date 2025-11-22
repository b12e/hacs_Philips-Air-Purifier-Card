import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  HomeAssistant,
  LovelaceCardConfig,
  fireEvent,
} from 'custom-card-helpers';
import { PurifierCardConfig, Template } from './types';
import localize from './localize';
import styles from './editor.css';
import { getDevices, filterPhilipsDevices, detectPhilipsEntities } from './utils';

type ConfigElement = HTMLInputElement & {
  configValue?: keyof PurifierCardConfig;
};

@customElement('purifier-card-editor')
export class PurifierCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private config!: Partial<PurifierCardConfig>;

  @state() private devices: any[] = [];
  @state() private areas: any[] = [];

  @state() private expandedSections: Set<string> = new Set(['display']);

  public async setConfig(config: LovelaceCardConfig & PurifierCardConfig) {
    // Ensure config is always initialized with defaults
    this.config = {
      ...config,
      type: config?.type || 'custom:philips-purifier-card',
      show_name: config?.show_name ?? true,
      show_state: config?.show_state ?? true,
      show_preset_modes: config?.show_preset_modes ?? true,
      show_sensors: config?.show_sensors ?? true,
      show_toolbar: config?.show_toolbar ?? true,
      compact_view: config?.compact_view ?? false,
      layout: config?.layout || 'vertical',
      show_child_lock: config?.show_child_lock ?? true,
      sensors_in_separate_card: config?.sensors_in_separate_card ?? true,
      collapsible_preset_modes: config?.collapsible_preset_modes ?? false,
      fill_container: config?.fill_container ?? false,
      collapse_controls_when_off: config?.collapse_controls_when_off ?? false,
      hide_sensors_when_off: config?.hide_sensors_when_off ?? false,
    };

    // Load devices
    if (this.hass) {
      await this.loadDevices();
    }

    // Auto-detect entities if device_id is set
    if (this.config?.device_id && this.hass) {
      const detected = await detectPhilipsEntities(this.hass, this.config.device_id);

      // Create new config object instead of modifying frozen one
      this.config = {
        ...this.config,
        detected_entities: detected,
      };

      // Set the fan entity as the primary entity
      if (detected.fan && !this.config.entity) {
        this.config = {
          ...this.config,
          entity: detected.fan,
        };
      }
    }

    // Backward compatibility: if only entity is set, use it
    if (!this.config?.device_id && this.config?.entity) {
      const entityState = this.hass?.states[this.config.entity];
      const deviceId = entityState?.attributes.device_id;
      if (deviceId && typeof deviceId === 'string') {
        const detected = await detectPhilipsEntities(this.hass!, deviceId);

        // Create new config object instead of modifying frozen one
        this.config = {
          ...this.config,
          device_id: deviceId,
          detected_entities: detected,
        };
      }
    }
  }

  protected async updated(changedProps: Map<string, any>) {
    super.updated(changedProps);

    // Load devices when hass becomes available or when editor is opened
    if (changedProps.has('hass') && this.hass) {
      if (this.devices.length === 0) {
        await this.loadDevices();
      }

      // If we have a device_id in config but no detected entities, run detection
      if (this.config?.device_id && !this.config?.detected_entities?.fan) {
        const detected = await detectPhilipsEntities(this.hass, this.config.device_id);
        this.config = {
          ...this.config,
          detected_entities: detected,
          entity: detected.fan,
        };
      }
    }
  }

  private async loadDevices() {
    if (!this.hass) return;

    const allDevices = await getDevices(this.hass);
    this.devices = filterPhilipsDevices(allDevices);

    // Load areas
    try {
      this.areas = await this.hass.callWS({ type: 'config/area_registry/list' });
    } catch (error) {
      console.error('Error fetching areas:', error);
      this.areas = [];
    }

    // Request update to refresh the device dropdown with loaded devices
    this.requestUpdate();
  }

  private getAreaName(areaId: string): string {
    const area = this.areas.find((a) => a.area_id === areaId);
    return area?.name || 'Unknown';
  }

  private toggleSection(sectionId: string): void {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }
    this.requestUpdate();
  }

  private renderSection(
    id: string,
    icon: string,
    titleKey: string,
    content: Template
  ): Template {
    const isExpanded = this.expandedSections.has(id);

    return html`
      <div class="section">
        <div
          class="section-header"
          @click=${() => this.toggleSection(id)}
        >
          <ha-icon .icon=${icon}></ha-icon>
          <span class="section-header-title">${localize(`editor.section_${titleKey}`)}</span>
          <ha-icon-button class=${isExpanded ? 'expanded' : ''}>
            <ha-icon icon="mdi:chevron-down"></ha-icon>
          </ha-icon-button>
        </div>
        <div class="section-content ${isExpanded ? '' : 'collapsed'}">
          ${content}
        </div>
      </div>
    `;
  }

  private renderSensorCheckboxes(): Template {
    const detectedEntities = this.config?.detected_entities;
    if (!detectedEntities) return nothing;

    const availableSensors: Array<{key: string, label: string}> = [];
    if (detectedEntities.pm25) availableSensors.push({ key: 'pm25', label: 'PM2.5' });
    if (detectedEntities.allergen_index) availableSensors.push({ key: 'iai', label: 'IAI' });
    if (detectedEntities.humidity) availableSensors.push({ key: 'humidity', label: 'Humidity' });
    if (detectedEntities.temperature) availableSensors.push({ key: 'temperature', label: 'Temperature' });

    if (availableSensors.length === 0) return nothing;

    const visibleSensors = this.config?.visible_sensors || [];

    return html`
      <div class="sensor-checkboxes" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px;">
        ${availableSensors.map(sensor => html`
          <div class="option" style="padding: 8px;">
            <ha-switch
              .checked=${visibleSensors.length === 0 || visibleSensors.includes(sensor.key)}
              @change=${(e: Event) => this.sensorVisibilityChanged(e, sensor.key)}
            >
            </ha-switch>
            ${sensor.label}
          </div>
        `)}
      </div>
    `;
  }

  private sensorVisibilityChanged(event: Event, sensorKey: string): void {
    if (!this.config || !this.hass || !event.target) {
      return;
    }

    const target = event.target as HTMLInputElement;
    const isChecked = target.checked;
    const detectedEntities = this.config.detected_entities;

    if (!detectedEntities) {
      return;
    }

    let visibleSensors = [...(this.config.visible_sensors || [])];

    // Get all available sensor keys
    const allSensors: string[] = [];
    if (detectedEntities.pm25) allSensors.push('pm25');
    if (detectedEntities.allergen_index) allSensors.push('iai');
    if (detectedEntities.humidity) allSensors.push('humidity');
    if (detectedEntities.temperature) allSensors.push('temperature');

    if (isChecked) {
      // Turning sensor ON (making it visible)
      if (visibleSensors.length === 0) {
        // If empty (all visible), stay empty - no change needed
        // because empty means all are visible
      } else {
        // Add this sensor to the visible list if not already there
        if (!visibleSensors.includes(sensorKey)) {
          visibleSensors.push(sensorKey);
        }
        // If we now have all sensors, clear the list (empty = all visible)
        if (visibleSensors.length === allSensors.length) {
          visibleSensors = [];
        }
      }
    } else {
      // Turning sensor OFF (hiding it)
      if (visibleSensors.length === 0) {
        // If empty (all visible), create explicit list without this sensor
        visibleSensors = allSensors.filter(k => k !== sensorKey);
      } else {
        // Remove this sensor from the visible list
        visibleSensors = visibleSensors.filter(k => k !== sensorKey);
      }
    }

    this.config = {
      ...this.config,
      visible_sensors: visibleSensors,
    };

    fireEvent(this, 'config-changed', { config: this.config });
  }

  private renderPresetModeCheckboxes(): Template {
    if (!this.config?.entity && !this.config?.detected_entities?.fan) {
      return nothing;
    }

    const entityId = this.config.entity || this.config.detected_entities?.fan;
    if (!entityId) return nothing;

    const entityState = this.hass?.states[entityId];
    if (!entityState) return nothing;

    const presetModes = entityState.attributes.preset_modes as string[] | undefined;
    if (!presetModes || presetModes.length === 0) return nothing;

    const availableModes: Array<{key: string, label: string}> = presetModes.map(mode => ({
      key: mode.toLowerCase(),
      label: localize(`preset_mode.${mode.toLowerCase()}`) || mode
    }));

    const visibleModes = this.config?.visible_preset_modes || [];

    return html`
      <div class="preset-mode-checkboxes" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px;">
        ${availableModes.map(mode => html`
          <div class="option" style="padding: 8px;">
            <ha-switch
              .checked=${visibleModes.length === 0 || visibleModes.includes(mode.key)}
              @change=${(e: Event) => this.presetModeVisibilityChanged(e, mode.key)}
            >
            </ha-switch>
            ${mode.label}
          </div>
        `)}
      </div>
    `;
  }

  private presetModeVisibilityChanged(event: Event, modeKey: string): void {
    if (!this.config || !this.hass || !event.target) {
      return;
    }

    const target = event.target as HTMLInputElement;
    const isChecked = target.checked;

    const entityId = this.config.entity || this.config.detected_entities?.fan;
    if (!entityId) return;

    const entityState = this.hass.states[entityId];
    if (!entityState) return;

    const presetModes = entityState.attributes.preset_modes as string[] | undefined;
    if (!presetModes) return;

    let visibleModes = [...(this.config.visible_preset_modes || [])];

    // Get all available preset mode keys (lowercase)
    const allModes: string[] = presetModes.map(m => m.toLowerCase());

    if (isChecked) {
      // Turning preset mode ON (making it visible)
      if (visibleModes.length === 0) {
        // If empty (all visible), stay empty - no change needed
      } else {
        // Add this mode to the visible list if not already there
        if (!visibleModes.includes(modeKey)) {
          visibleModes.push(modeKey);
        }
        // If we now have all modes, clear the list (empty = all visible)
        if (visibleModes.length === allModes.length) {
          visibleModes = [];
        }
      }
    } else {
      // Turning preset mode OFF (hiding it)
      if (visibleModes.length === 0) {
        // If empty (all visible), create explicit list without this mode
        visibleModes = allModes.filter(k => k !== modeKey);
      } else {
        // Remove this mode from the visible list
        visibleModes = visibleModes.filter(k => k !== modeKey);
      }
    }

    this.config = {
      ...this.config,
      visible_preset_modes: visibleModes,
    };

    fireEvent(this, 'config-changed', { config: this.config });
  }

  protected render(): Template {
    if (!this.hass || !this.config) {
      return nothing;
    }

    return html`
      <div class="card-config">
        <!-- Device Selector -->
        <div class="option">
          <ha-select
            .label=${localize('editor.device')}
            @selected=${this.deviceChanged}
            @change=${this.deviceChanged}
            .value=${this.config?.device_id || ''}
            @closed=${(e: PointerEvent) => e.stopPropagation()}
            fixedMenuPosition
            naturalMenuWidth
          >
            ${this.devices.length === 0
              ? html`<mwc-list-item value="">Loading devices...</mwc-list-item>`
              : this.devices.map(
                  (device) =>
                    html`<mwc-list-item .value=${device.id}>
                      <span style="display: flex; flex-direction: column; gap: 2px;">
                        <span style="font-weight: 500;">${device.name_by_user || device.name}</span>
                        <span style="font-size: 0.85em; opacity: 0.7;">
                          ${device.model}${device.area_id ? ` • ${this.getAreaName(device.area_id)}` : ''}
                        </span>
                      </span>
                    </mwc-list-item>`,
                )}
          </ha-select>
        </div>

        ${this.config?.detected_entities?.fan
          ? html`
              <div class="detected-info">
                <ha-alert alert-type="info">
                  ${localize('editor.detected_entities')}:
                  ${Object.keys(this.config?.detected_entities ?? {}).length}
                </ha-alert>
              </div>
            `
          : nothing}

        <!-- Display Section -->
        ${this.renderSection(
          'display',
          'mdi:monitor',
          'display',
          html`
            <div class="option">
              <ha-switch
                aria-label=${localize(
                  this.config?.show_name
                    ? 'editor.show_name_aria_label_off'
                    : 'editor.show_name_aria_label_on',
                )}
                .checked=${this.config?.show_name ?? true}
                .configValue=${'show_name'}
                @change=${this.valueChanged}
              >
              </ha-switch>
              ${localize('editor.show_name')}
            </div>

            ${this.config?.show_name
              ? html`
                  <ha-textfield
                    .label=${localize('editor.name')}
                    .value=${this.config?.name || ''}
                    .placeholder=${localize('editor.name_placeholder')}
                    .configValue=${'name'}
                    @input=${this.valueChanged}
                  ></ha-textfield>
                `
              : nothing}

            <div class="option">
              <ha-switch
                aria-label=${localize(
                  this.config?.show_state
                    ? 'editor.show_state_aria_label_off'
                    : 'editor.show_state_aria_label_on',
                )}
                .checked=${this.config?.show_state ?? true}
                .configValue=${'show_state'}
                @change=${this.valueChanged}
              >
              </ha-switch>
              ${localize('editor.show_state')}
            </div>

            <div class="option">
              <ha-switch
                .checked=${this.config?.fill_container ?? false}
                .configValue=${'fill_container'}
                @change=${this.valueChanged}
              >
              </ha-switch>
              ${localize('editor.fill_container')}
            </div>
          `
        )}

        <!-- Icon Section -->
        ${this.renderSection(
          'icon',
          'mdi:image-outline',
          'icon',
          html`
            <div class="option">
              <ha-switch
                .checked=${this.config?.show_icon ?? true}
                .configValue=${'show_icon'}
                @change=${this.valueChanged}
              >
              </ha-switch>
              ${localize('editor.show_icon')}
            </div>

            ${this.config?.show_icon
              ? html`
                  <div class="option">
                    <ha-switch
                      .checked=${this.config?.icon_animation ?? true}
                      .configValue=${'icon_animation'}
                      @change=${this.valueChanged}
                    >
                    </ha-switch>
                    ${localize('editor.icon_animation')}
                  </div>
                `
              : nothing}
          `
        )}

        <!-- Sensors Section -->
        ${this.renderSection(
          'sensors',
          'mdi:chip',
          'sensors',
          html`
            <div class="option">
              <ha-switch
                aria-label=${localize(
                  this.config?.show_sensors
                    ? 'editor.show_sensors_aria_label_off'
                    : 'editor.show_sensors_aria_label_on',
                )}
                .checked=${this.config?.show_sensors ?? true}
                .configValue=${'show_sensors'}
                @change=${this.valueChanged}
              >
              </ha-switch>
              ${localize('editor.show_sensors')}
            </div>

            ${this.config?.show_sensors
              ? html`
                  ${this.config?.detected_entities
                    ? html`
                        <div style="margin-top: 8px;">
                          <div style="font-weight: 500; margin-bottom: 8px; font-size: 12px; color: var(--secondary-text-color);">
                            ${localize('editor.visible_sensors')}
                          </div>
                          ${this.renderSensorCheckboxes()}
                        </div>
                      `
                    : nothing}

                  <div class="option">
                    <ha-switch
                      .checked=${this.config?.sensors_in_separate_card ?? true}
                      .configValue=${'sensors_in_separate_card'}
                      @change=${this.valueChanged}
                    >
                    </ha-switch>
                    ${localize('editor.sensors_in_separate_card')}
                  </div>

                  <div class="option">
                    <ha-switch
                      .checked=${!(this.config?.hide_sensors_when_off ?? false)}
                      .configValue=${'hide_sensors_when_off'}
                      @change=${(e: Event) => {
                        // Invert the value since the label is "Show Sensors When Off"
                        const target = e.target as HTMLInputElement;
                        this.config = {
                          ...this.config,
                          hide_sensors_when_off: !target.checked,
                        };
                        fireEvent(this, 'config-changed', { config: this.config });
                      }}
                    >
                    </ha-switch>
                    ${localize('editor.show_sensors_when_off')}
                  </div>
                `
              : nothing}
          `
        )}

        <!-- Controls Section -->
        ${this.renderSection(
          'controls',
          'mdi:tune',
          'controls',
          html`
            <div class="option">
              <ha-switch
                .checked=${this.config?.show_child_lock ?? true}
                .configValue=${'show_child_lock'}
                @change=${this.valueChanged}
              >
              </ha-switch>
              ${localize('editor.show_child_lock')}
            </div>

            <div class="option">
              <ha-switch
                .checked=${!(this.config?.collapse_controls_when_off ?? false)}
                .configValue=${'collapse_controls_when_off'}
                @change=${(e: Event) => {
                  // Invert the value since the label is "Show Controls When Off"
                  const target = e.target as HTMLInputElement;
                  this.config = {
                    ...this.config,
                    collapse_controls_when_off: !target.checked,
                  };
                  fireEvent(this, 'config-changed', { config: this.config });
                }}
              >
              </ha-switch>
              ${localize('editor.collapse_controls_when_off')}
            </div>

            <div class="option">
              <ha-switch
                aria-label=${localize(
                  this.config?.show_preset_modes
                    ? 'editor.show_preset_modes_aria_label_off'
                    : 'editor.show_preset_modes_aria_label_on',
                )}
                .checked=${this.config?.show_preset_modes ?? true}
                .configValue=${'show_preset_modes'}
                @change=${this.valueChanged}
              >
              </ha-switch>
              ${localize('editor.show_preset_modes')}
            </div>

            ${this.config?.show_preset_modes && (this.config?.entity || this.config?.detected_entities?.fan)
              ? html`
                  <div style="margin-top: 8px;">
                    <div style="font-weight: 500; margin-bottom: 8px; font-size: 12px; color: var(--secondary-text-color);">
                      ${localize('editor.visible_preset_modes')}
                    </div>
                    ${this.renderPresetModeCheckboxes()}
                  </div>
                `
              : nothing}
          `
        )}
      </div>
    `;
  }

  private async deviceChanged(event: Event): Promise<void> {
    if (!this.hass || !event.target) {
      return;
    }

    const target = event.target as any;
    const deviceId = target.value;

    if (!deviceId) {
      return;
    }

    // Detect entities for this device
    const detected = await detectPhilipsEntities(this.hass, deviceId);

    // Create updated config
    const updatedConfig = {
      ...this.config,
      type: 'custom:philips-purifier-card',
      device_id: deviceId,
      entity: detected.fan,
      detected_entities: detected,
    };

    this.config = updatedConfig;

    // Fire config-changed event to update the preview
    fireEvent(this, 'config-changed', { config: updatedConfig });

    // Request update to refresh the UI
    this.requestUpdate();
  }

  private valueChanged(event: Event): void {
    if (!this.config || !this.hass || !event.target) {
      return;
    }
    const target = event.target as ConfigElement;

    if (!target.configValue) {
      return;
    }

    // Get the new value (either checked state for switches or value for selects)
    const newValue = target.checked !== undefined ? target.checked : target.value;

    // Don't update if the value hasn't changed
    if (this.config[target.configValue] === newValue) {
      return;
    }

    // Update config
    if (target.value === '' && target.checked === undefined) {
      delete this.config[target.configValue];
    } else {
      this.config = {
        ...this.config,
        [target.configValue]: newValue,
      };
    }

    fireEvent(this, 'config-changed', { config: this.config });
  }

  static get styles() {
    return styles;
  }
}
