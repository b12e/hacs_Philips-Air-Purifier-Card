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
  @state() private compact_view = false;
  @state() private show_name = true;
  @state() private show_state = true;
  @state() private show_preset_modes = true;
  @state() private show_sensors = true;
  @state() private show_toolbar = true;

  public async setConfig(config: LovelaceCardConfig & PurifierCardConfig) {
    this.config = config;

    // Load devices
    if (this.hass) {
      await this.loadDevices();
    }

    // Auto-detect entities if device_id is set
    if (this.config.device_id && this.hass) {
      const detected = detectPhilipsEntities(this.hass, this.config.device_id);
      this.config.detected_entities = detected;

      // Set the fan entity as the primary entity
      if (detected.fan && !this.config.entity) {
        this.config.entity = detected.fan;
      }
    }

    // Backward compatibility: if only entity is set, use it
    if (!this.config.device_id && this.config.entity) {
      const entityState = this.hass?.states[this.config.entity];
      const deviceId = entityState?.attributes.device_id;
      if (deviceId && typeof deviceId === 'string') {
        this.config.device_id = deviceId;
        const detected = detectPhilipsEntities(this.hass!, deviceId);
        this.config.detected_entities = detected;
      }
    }

    // Initialize state
    this.compact_view = this.config.compact_view ?? false;
    this.show_name = this.config.show_name ?? true;
    this.show_state = this.config.show_state ?? true;
    this.show_preset_modes = this.config.show_preset_modes ?? true;
    this.show_sensors = this.config.show_sensors ?? true;
    this.show_toolbar = this.config.show_toolbar ?? true;
  }

  private async loadDevices() {
    if (!this.hass) return;

    const allDevices = await getDevices(this.hass);
    this.devices = filterPhilipsDevices(allDevices);
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
            .value=${this.config.device_id}
            @closed=${(e: PointerEvent) => e.stopPropagation()}
            fixedMenuPosition
            naturalMenuWidth
          >
            ${this.devices.map(
              (device) =>
                html`<mwc-list-item .value=${device.id}>
                  ${device.name_by_user || device.name}
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
              this.compact_view
                ? 'editor.compact_view_aria_label_off'
                : 'editor.compact_view_aria_label_on',
            )}
            .checked=${this.compact_view}
            .configValue=${'compact_view'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.compact_view')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_name
                ? 'editor.show_name_aria_label_off'
                : 'editor.show_name_aria_label_on',
            )}
            .checked=${this.show_name}
            .configValue=${'show_name'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_name')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_state
                ? 'editor.show_state_aria_label_off'
                : 'editor.show_state_aria_label_on',
            )}
            .checked=${this.show_state}
            .configValue=${'show_state'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_state')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_preset_modes
                ? 'editor.show_preset_modes_aria_label_off'
                : 'editor.show_preset_modes_aria_label_on',
            )}
            .checked=${this.show_preset_modes}
            .configValue=${'show_preset_modes'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_preset_modes')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_sensors
                ? 'editor.show_sensors_aria_label_off'
                : 'editor.show_sensors_aria_label_on',
            )}
            .checked=${this.show_sensors}
            .configValue=${'show_sensors'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_sensors')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_toolbar
                ? 'editor.show_toolbar_aria_label_off'
                : 'editor.show_toolbar_aria_label_on',
            )}
            .checked=${this.show_toolbar}
            .configValue=${'show_toolbar'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_toolbar')}
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
    const detected = detectPhilipsEntities(this.hass, deviceId);

    this.config = {
      ...this.config,
      device_id: deviceId,
      entity: detected.fan,
      detected_entities: detected,
    };

    fireEvent(this, 'config-changed', { config: this.config });
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
