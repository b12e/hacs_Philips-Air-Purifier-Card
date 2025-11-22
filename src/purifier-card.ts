import { CSSResultGroup, LitElement, PropertyValues, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  hasConfigOrEntityChanged,
  fireEvent,
  HomeAssistant,
  ServiceCallRequest,
} from 'custom-card-helpers';
import registerTemplates from 'ha-template';
import localize from './localize';
import styles from './styles.css';

import {
  PurifierCardConfig,
  PurifierEntity,
  Template,
  DetectedEntities,
} from './types';
import buildConfig from './config';
import { detectPhilipsEntities } from './utils';

registerTemplates();

// String on the right side will be replaced by Rollup
const PKG_VERSION = 'PKG_VERSION_VALUE';

console.info(
  `%c PHILIPS-PURIFIER-CARD %c ${PKG_VERSION} `,
  'color: white; background: #0066CC; font-weight: 700;',
  'color: #0066CC; background: white; font-weight: 700;',
);

if (!customElements.get('ha-icon-button')) {
  customElements.define(
    'ha-icon-button',
    class extends (customElements.get('paper-icon-button') ?? HTMLElement) {},
  );
}

const SUPPORT_PRESET_MODE = 8;
@customElement('philips-purifier-card')
export class PurifierCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: PurifierCardConfig;
  @state() private requestInProgress = false;
  @state() private detectedEntities: DetectedEntities = {};

  public static get styles(): CSSResultGroup {
    return styles;
  }

  public static async getConfigElement() {
    await import('./editor');
    return document.createElement('purifier-card-editor');
  }

  public static getStubConfig(
    _: unknown,
    entities: string[],
  ): Partial<PurifierCardConfig> {
    const [purifierEntity] = entities.filter((eid) => eid.startsWith('fan'));

    return {
      type: 'custom:philips-purifier-card',
      entity: purifierEntity || undefined,
      show_name: true,
      show_state: true,
      show_preset_modes: true,
      show_sensors: true,
      show_toolbar: true,
      compact_view: false,
      layout: 'vertical',
    };
  }

  public setConfig(config: Partial<PurifierCardConfig>) {
    this.config = buildConfig(config);

    // Auto-detect entities if device_id is provided
    if (this.config.device_id && this.hass) {
      this.detectedEntities = this.config.detected_entities ||
        detectPhilipsEntities(this.hass, this.config.device_id);
    } else if (this.config.detected_entities) {
      this.detectedEntities = this.config.detected_entities;
    }
  }

  get entity(): PurifierEntity | undefined {
    if (!this.config || !this.hass) return undefined;
    const entityId = this.config.entity || this.detectedEntities.fan;
    return entityId ? (this.hass.states[entityId] as PurifierEntity) : undefined;
  }

  public getCardSize() {
    return this.config?.compact_view ? 1 : 3;
  }

  protected shouldUpdate(changedProps: PropertyValues) {
    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected updated(changedProps: PropertyValues) {
    const entityId = this.config.entity || this.detectedEntities.fan;
    if (
      entityId &&
      changedProps.get('hass') &&
      changedProps.get('hass').states[entityId] !==
        this.hass.states[entityId]
    ) {
      this.requestInProgress = false;
    }
  }

  private handleMore(entityId?: string) {
    const targetEntity = entityId || this.entity?.entity_id;
    if (!targetEntity) return;

    fireEvent(
      this,
      'hass-more-info',
      {
        entityId: targetEntity,
      },
      {
        bubbles: false,
        composed: true,
      },
    );
  }

  private callService(
    service: ServiceCallRequest['service'],
    options: ServiceCallRequest['serviceData'] = {},
    target?: ServiceCallRequest['target'],
    request = true,
  ) {
    const entityId = this.config.entity || this.detectedEntities.fan;
    if (!entityId) return;

    const [domain, name] = service.split('.');
    this.hass.callService(
      domain,
      name,
      {
        entity_id: entityId,
        ...options,
      },
      target,
    );

    if (request) {
      this.requestInProgress = true;
      this.requestUpdate();
    }
  }

  private handlePresetMode(presetMode: string) {
    this.callService('fan.set_preset_mode', { preset_mode: presetMode });
  }

  private handleToggle() {
    this.callService('fan.toggle');
  }

  private renderPresetModes(): Template {
    if (!this.entity || !this.config.show_preset_modes) {
      return nothing;
    }

    // Hide controls if collapsible_controls is enabled and device is off
    if (this.config.collapsible_controls && this.entity.state === 'off') {
      return nothing;
    }

    const {
      attributes: { preset_mode, preset_modes, supported_features = 0 },
    } = this.entity;

    if (
      !preset_mode ||
      !preset_modes ||
      !(supported_features & SUPPORT_PRESET_MODE)
    ) {
      return nothing;
    }

    return html`
      <div class="preset-modes">
        ${preset_modes.map(
          (mode) => html`
            <button
              class="preset-mode-button ${classMap({
                active: mode === preset_mode,
              })}"
              @click=${() => this.handlePresetMode(mode)}
            >
              <ha-icon icon="pap:${this.getPresetIcon(mode)}"></ha-icon>
              <span>${localize(`preset_mode.${mode.toLowerCase()}`) || mode}</span>
            </button>
          `,
        )}
      </div>
    `;
  }

  private getPresetIcon(mode: string): string {
    const iconMap: Record<string, string> = {
      auto: 'auto_mode',
      sleep: 'sleep_mode',
      turbo: 'speed_3',
      speed_1: 'speed_1',
      speed_2: 'speed_2',
      speed_3: 'speed_3',
      allergen: 'allergen_mode',
      bacteria: 'bacteria_virus_mode',
    };
    return iconMap[mode.toLowerCase()] || 'fan_speed_button';
  }

  private renderSensors(): Template {
    if (!this.config.show_sensors || !this.detectedEntities) {
      return nothing;
    }

    // Hide sensors if collapsible_controls is enabled and device is off
    if (this.config.collapsible_controls && this.entity?.state === 'off') {
      return nothing;
    }

    const sensors: Template[] = [];

    // PM2.5
    if (this.detectedEntities.pm25) {
      const sensorState = this.hass.states[this.detectedEntities.pm25];
      if (sensorState) {
        sensors.push(this.renderSensor(
          'PM2.5',
          sensorState.state,
          sensorState.attributes.unit_of_measurement || 'μg/m³',
          'pap:pm25',
          this.detectedEntities.pm25,
        ));
      }
    }

    // IAI / Allergen Index
    if (this.detectedEntities.allergen_index) {
      const sensorState = this.hass.states[this.detectedEntities.allergen_index];
      if (sensorState) {
        sensors.push(this.renderSensor(
          'IAI',
          sensorState.state,
          sensorState.attributes.unit_of_measurement || '',
          'pap:iai',
          this.detectedEntities.allergen_index,
        ));
      }
    }

    // Humidity
    if (this.detectedEntities.humidity) {
      const sensorState = this.hass.states[this.detectedEntities.humidity];
      if (sensorState) {
        sensors.push(this.renderSensor(
          localize('sensors.humidity') || 'Humidity',
          sensorState.state,
          sensorState.attributes.unit_of_measurement || '%',
          'mdi:water-percent',
          this.detectedEntities.humidity,
        ));
      }
    }

    // Temperature
    if (this.detectedEntities.temperature) {
      const sensorState = this.hass.states[this.detectedEntities.temperature];
      if (sensorState) {
        sensors.push(this.renderSensor(
          localize('sensors.temperature') || 'Temperature',
          sensorState.state,
          sensorState.attributes.unit_of_measurement || '°C',
          'mdi:thermometer',
          this.detectedEntities.temperature,
        ));
      }
    }

    return sensors.length > 0
      ? html`<div class="sensors">${sensors}</div>`
      : nothing;
  }

  private renderSensor(
    label: string,
    value: string,
    unit: string,
    icon: string,
    entityId: string,
  ): Template {
    return html`
      <div class="sensor" @click=${() => this.handleMore(entityId)}>
        <div class="sensor-icon">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div class="sensor-content">
          <div class="sensor-label">${label}</div>
          <div class="sensor-value">${value} ${unit}</div>
        </div>
      </div>
    `;
  }

  private renderHeader(): Template {
    if (!this.entity) return nothing;

    const { state, attributes } = this.entity;
    const name = attributes.friendly_name || 'Air Purifier';
    const stateText = localize(`state.${state}`) || state;
    const isOn = state === 'on';

    return html`
      <div class="card-header">
        <div class="entity-info">
          <div class="icon-state ${classMap({ active: isOn })}">
            <ha-icon icon="pap:power_button"></ha-icon>
          </div>
          <div class="info-content">
            ${this.config.show_name ? html`<div class="name">${name}</div>` : nothing}
            ${this.config.show_state
              ? html`<div class="state-text">${stateText}</div>`
              : nothing}
          </div>
        </div>
        <div class="header-actions">
          ${this.requestInProgress
            ? html`<ha-circular-progress size="small" indeterminate></ha-circular-progress>`
            : nothing}
          <ha-icon-button @click=${() => this.handleMore()}>
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </ha-icon-button>
        </div>
      </div>
    `;
  }

  private renderToolbar(): Template {
    if (!this.config.show_toolbar || !this.entity) {
      return nothing;
    }

    // Hide toolbar if collapsible_controls is enabled and device is off
    if (this.config.collapsible_controls && this.entity.state === 'off') {
      return nothing;
    }

    const { state } = this.entity;
    const isOn = state === 'on';

    return html`
      <div class="toolbar">
        <ha-icon-button
          class="${classMap({ active: isOn })}"
          @click=${() => this.handleToggle()}
        >
          <ha-icon icon="pap:power_button"></ha-icon>
        </ha-icon-button>

        ${this.detectedEntities.child_lock
          ? html`
              <ha-icon-button
                @click=${() =>
                  this.callService('switch.toggle', {}, undefined, false)}
              >
                <ha-icon icon="pap:child_lock_button"></ha-icon>
              </ha-icon-button>
            `
          : nothing}
      </div>
    `;
  }

  private renderUnavailable(): Template {
    return html`
      <ha-card class="mushroom-card">
        <div class="card-content unavailable">
          <ha-icon icon="mdi:alert-circle"></ha-icon>
          <div>${localize('common.not_available')}</div>
        </div>
      </ha-card>
    `;
  }

  protected render() {
    // If no config yet (e.g., during card picker preview), show a simple card
    if (!this.config) {
      return html`
        <ha-card class="mushroom-card">
          <div class="card-content unavailable">
            <ha-icon icon="pap:power_button"></ha-icon>
            <div>${localize('common.name')}</div>
          </div>
        </ha-card>
      `;
    }

    if (!this.entity) {
      return this.renderUnavailable();
    }

    return html`
      <ha-card class="mushroom-card ${classMap({
        compact: this.config.compact_view,
        horizontal: this.config.layout === 'horizontal',
        'fill-container': this.config.fill_container ?? false,
      })}">
        <div class="card-content">
          ${this.renderHeader()}
          ${this.renderPresetModes()}
          ${this.renderSensors()}
          ${this.renderToolbar()}
        </div>
      </ha-card>
    `;
  }
}

declare global {
  interface Window {
    customCards?: unknown[];
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'custom:philips-purifier-card',
  name: localize('common.name'),
  description: localize('common.description'),
});
