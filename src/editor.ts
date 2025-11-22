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

  public async setConfig(config: LovelaceCardConfig & PurifierCardConfig) {
    this.config = config || {};

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

    this.requestUpdate();
  }

  private getAreaName(areaId: string): string {
    const area = this.areas.find((a) => a.area_id === areaId);
    return area?.name || 'Unknown';
  }

  protected render(): Template {
    if (!this.hass) {
      return nothing;
    }

    return html`
      <div class="card-config">
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

        ${this.config.detected_entities?.fan
          ? html`
              <div class="detected-info">
                <ha-alert alert-type="info">
                  ${localize('editor.detected_entities')}:
                  ${Object.keys(this.config.detected_entities).length}
                </ha-alert>
              </div>
            `
          : nothing}

        <div class="option">
          <ha-select
            .label=${localize('editor.layout')}
            @selected=${this.valueChanged}
            .configValue=${'layout'}
            .value=${this.config.layout || 'vertical'}
            @closed=${(e: PointerEvent) => e.stopPropagation()}
            fixedMenuPosition
            naturalMenuWidth
          >
            <mwc-list-item value="vertical">${localize('editor.layout_vertical')}</mwc-list-item>
            <mwc-list-item value="horizontal">${localize('editor.layout_horizontal')}</mwc-list-item>
          </ha-select>
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.config.show_name
                ? 'editor.show_name_aria_label_off'
                : 'editor.show_name_aria_label_on',
            )}
            .checked=${this.config.show_name ?? true}
            .configValue=${'show_name'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_name')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.config.show_state
                ? 'editor.show_state_aria_label_off'
                : 'editor.show_state_aria_label_on',
            )}
            .checked=${this.config.show_state ?? true}
            .configValue=${'show_state'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_state')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.config.show_preset_modes
                ? 'editor.show_preset_modes_aria_label_off'
                : 'editor.show_preset_modes_aria_label_on',
            )}
            .checked=${this.config.show_preset_modes ?? true}
            .configValue=${'show_preset_modes'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_preset_modes')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.config.show_sensors
                ? 'editor.show_sensors_aria_label_off'
                : 'editor.show_sensors_aria_label_on',
            )}
            .checked=${this.config.show_sensors ?? true}
            .configValue=${'show_sensors'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_sensors')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.config.show_toolbar
                ? 'editor.show_toolbar_aria_label_off'
                : 'editor.show_toolbar_aria_label_on',
            )}
            .checked=${this.config.show_toolbar ?? true}
            .configValue=${'show_toolbar'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_toolbar')}
        </div>

        <div class="option">
          <ha-switch
            .checked=${this.config.show_power_button ?? true}
            .configValue=${'show_power_button'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          Show Power Button (Click icon to toggle)
        </div>

        <div class="option">
          <ha-switch
            .checked=${this.config.show_child_lock ?? true}
            .configValue=${'show_child_lock'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          Show Child Lock Button
        </div>

        <div class="option">
          <ha-switch
            .checked=${this.config.collapsible_controls ?? false}
            .configValue=${'collapsible_controls'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          Collapsible Controls (Hide when off)
        </div>

        <div class="option">
          <ha-switch
            .checked=${this.config.fill_container ?? false}
            .configValue=${'fill_container'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          Fill Container
        </div>
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
    if (
      !target.configValue ||
      this.config[target.configValue] === target?.value
    ) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        delete this.config[target.configValue];
      } else {
        this.config = {
          ...this.config,
          [target.configValue]:
            target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this.config });
  }

  static get styles() {
    return styles;
  }
}
