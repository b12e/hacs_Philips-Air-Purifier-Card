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
  @state() private _showPresetModes = false;

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

    // Store detected entities from config if provided
    if (this.config.detected_entities) {
      this.detectedEntities = this.config.detected_entities;
    }

    // Auto-detect entities if device_id is provided and hass is available
    if (this.config.device_id && this.hass) {
      detectPhilipsEntities(this.hass, this.config.device_id).then((detected) => {
        this.detectedEntities = detected;
        this.requestUpdate();
      });
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
    // If hass changed and we have a device_id but no detected entities, run detection
    if (changedProps.has('hass') && this.hass && this.config?.device_id && !this.detectedEntities.fan) {
      detectPhilipsEntities(this.hass, this.config.device_id).then((detected) => {
        this.detectedEntities = detected;
        this.requestUpdate();
      });
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected updated(changedProps: PropertyValues) {
    const entityId = this.config.entity || this.detectedEntities.fan;
    if (
      entityId &&
      changedProps.get('hass') &&
      changedProps.get('hass')?.states[entityId] !==
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
    this._showPresetModes = false;
  }

  private handleToggle() {
    this.callService('fan.toggle');
  }

  private handlePresetModesToggle(e: Event): void {
    e.stopPropagation();
    this._showPresetModes = !this._showPresetModes;
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

  private getSensorData(): Array<{key: string, label: string, value: string, unit: string, icon: string, entityId: string}> {
    const sensors: Array<{key: string, label: string, value: string, unit: string, icon: string, entityId: string}> = [];

    // PM2.5
    if (this.detectedEntities.pm25) {
      const sensorState = this.hass.states[this.detectedEntities.pm25];
      if (sensorState) {
        sensors.push({
          key: 'pm25',
          label: 'PM2.5',
          value: sensorState.state,
          unit: sensorState.attributes.unit_of_measurement || 'μg/m³',
          icon: 'pap:pm25',
          entityId: this.detectedEntities.pm25,
        });
      }
    }

    // IAI / Allergen Index
    if (this.detectedEntities.allergen_index) {
      const sensorState = this.hass.states[this.detectedEntities.allergen_index];
      if (sensorState) {
        sensors.push({
          key: 'iai',
          label: 'IAI',
          value: sensorState.state,
          unit: sensorState.attributes.unit_of_measurement || '',
          icon: 'pap:iai',
          entityId: this.detectedEntities.allergen_index,
        });
      }
    }

    // Humidity
    if (this.detectedEntities.humidity) {
      const sensorState = this.hass.states[this.detectedEntities.humidity];
      if (sensorState) {
        sensors.push({
          key: 'humidity',
          label: localize('sensors.humidity') || 'Humidity',
          value: sensorState.state,
          unit: sensorState.attributes.unit_of_measurement || '%',
          icon: 'mdi:water-percent',
          entityId: this.detectedEntities.humidity,
        });
      }
    }

    // Temperature
    if (this.detectedEntities.temperature) {
      const sensorState = this.hass.states[this.detectedEntities.temperature];
      if (sensorState) {
        sensors.push({
          key: 'temperature',
          label: localize('sensors.temperature') || 'Temperature',
          value: sensorState.state,
          unit: sensorState.attributes.unit_of_measurement || '°C',
          icon: 'mdi:thermometer',
          entityId: this.detectedEntities.temperature,
        });
      }
    }

    // Filter by visible sensors if specified
    if (this.config.visible_sensors && this.config.visible_sensors.length > 0) {
      return sensors.filter((sensor) => this.config.visible_sensors!.includes(sensor.key));
    }

    return sensors;
  }

  private renderSensors(): Template {
    if (!this.config.show_sensors || !this.detectedEntities) {
      return nothing;
    }

    // Hide sensors if hide_sensors_when_off is enabled and device is off
    // OR if collapse_controls_when_off is enabled and device is off
    if (this.entity?.state !== 'on' &&
        (this.config.hide_sensors_when_off || this.config.collapse_controls_when_off)) {
      return nothing;
    }

    const sensors = this.getSensorData();
    if (sensors.length === 0) {
      return nothing;
    }

    return html`<div class="sensors">
      ${sensors.map((sensor) => this.renderSensor(
        sensor.label,
        sensor.value,
        sensor.unit,
        sensor.icon,
        sensor.entityId,
      ))}
    </div>`;
  }

  private renderSeparateSensorCards(): Template {
    if (!this.config.show_sensors || !this.config.sensors_in_separate_card || !this.detectedEntities) {
      return nothing;
    }

    // Hide sensors if hide_sensors_when_off is enabled and device is off
    // OR if collapse_controls_when_off is enabled and device is off
    if (this.entity?.state !== 'on' &&
        (this.config.hide_sensors_when_off || this.config.collapse_controls_when_off)) {
      return nothing;
    }

    const sensors = this.getSensorData();
    if (sensors.length === 0) {
      return nothing;
    }

    return html`<div class="sensor-cards ${classMap({
      'fill-container': this.config.fill_container ?? false,
    })}">
      ${sensors.map((sensor) => html`
        <ha-card class="sensor-card" @click=${() => this.handleMore(sensor.entityId)}>
          <div class="sensor-card-content">
            <div class="sensor-icon">
              <ha-icon icon="${sensor.icon}"></ha-icon>
            </div>
            <div class="sensor-info">
              <div class="sensor-label">${sensor.label}</div>
              <div class="sensor-value">${sensor.value} ${sensor.unit}</div>
            </div>
          </div>
        </ha-card>
      `)}
    </div>`;
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

  private getSpinSpeedClass(presetMode?: string): string {
    if (!presetMode) return 'speed-slow';

    const mode = presetMode.toLowerCase();

    // Turbo mode - very fast
    if (mode === 'turbo') return 'speed-turbo';

    // Sleep and gentle modes - very slow
    if (mode.includes('sleep') || mode === 'gentle') return 'speed-very-slow';

    // Speed 3 - fast
    if (mode === 'speed_3') return 'speed-fast';

    // Speed 2 - medium
    if (mode === 'speed_2') return 'speed-medium';

    // Speed 1 - slow
    if (mode === 'speed_1') return 'speed-slow';

    // Auto and other modes - slow (default)
    return 'speed-slow';
  }

  private renderHeader(): Template {
    if (!this.entity) return nothing;

    const { state, attributes } = this.entity;
    const name = this.config.name || attributes.friendly_name || 'Air Purifier';
    const stateText = localize(`state.${state}`) || state;
    const isOn = state === 'on';

    // Determine if we should show preset mode buttons
    const shouldShowControls = (
      this.config.show_preset_modes ||
      this.config.show_child_lock
    ) && (!this.config.collapse_controls_when_off || isOn);

    // Get dynamic spin speed based on preset mode
    const spinSpeedClass = isOn && (this.config.icon_animation ?? true)
      ? this.getSpinSpeedClass(attributes.preset_mode)
      : '';

    return html`
      <div class="state-item">
        ${this.config.show_icon
          ? html`
              <div class="icon-state ${classMap({
                active: isOn,
                spin: isOn && (this.config.icon_animation ?? true),
                [spinSpeedClass]: true
              })}" @click=${() => this.handleToggle()}>
                <ha-icon icon="mdi:fan"></ha-icon>
              </div>
            `
          : nothing}
        <div class="info-content" @click=${() => this.handleToggle()}>
          ${this.config.show_name ? html`<div class="name">${name}</div>` : nothing}
          ${this.config.show_state
            ? html`<div class="state-text">${stateText}</div>`
            : nothing}
        </div>
        ${shouldShowControls ? html`
          <div class="actions">
            ${this.requestInProgress
              ? html`<ha-circular-progress size="small" indeterminate></ha-circular-progress>`
              : nothing}
            ${this.renderInlineControls()}
          </div>
        ` : nothing}
      </div>
    `;
  }

  private renderInlineControls(): Template {
    if (!this.entity) return nothing;

    const {
      attributes: { preset_mode, preset_modes, supported_features = 0 },
    } = this.entity;

    const hasPresetModes = this.config.show_preset_modes &&
      preset_mode &&
      preset_modes &&
      (supported_features & SUPPORT_PRESET_MODE);

    // If collapsible and not expanded, show just one button
    if (hasPresetModes && this.config.collapsible_preset_modes && !this._showPresetModes) {
      return html`
        <button
          class="control-button active"
          @click=${this.handlePresetModesToggle}
          title="${localize(`preset_mode.${preset_mode!.toLowerCase()}`) || preset_mode}"
        >
          <ha-icon icon="pap:${this.getPresetIcon(preset_mode!)}"></ha-icon>
        </button>
        ${this.renderChildLockInlineButton()}
      `;
    }

    // Filter visible preset modes
    let visibleModes: string[] = [];
    if (hasPresetModes) {
      visibleModes = this.config.visible_preset_modes && this.config.visible_preset_modes.length > 0
        ? preset_modes!.filter((mode) => this.config.visible_preset_modes!.includes(mode.toLowerCase()))
        : preset_modes!;
    }

    // Show all visible modes as inline buttons
    // Always wrap preset modes in a container to show grouping
    const modesHtml = visibleModes.map(
      (mode) => html`
        <button
          class="control-button ${classMap({
            active: mode === preset_mode,
          })}"
          @click=${() => this.handlePresetMode(mode)}
          title="${localize(`preset_mode.${mode.toLowerCase()}`) || mode}"
        >
          <ha-icon icon="pap:${this.getPresetIcon(mode)}"></ha-icon>
        </button>
      `,
    );

    // Always wrap preset modes in container for grouping
    if (this.config.collapsible_preset_modes && this._showPresetModes) {
      return html`
        <div class="preset-modes-container">
          ${modesHtml}
          <button
            class="control-button close-button"
            @click=${this.handlePresetModesToggle}
            title="Close"
          >
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        ${this.renderChildLockInlineButton()}
      `;
    }

    // Even when not collapsible, wrap modes in container
    return html`
      <div class="preset-modes-container">
        ${modesHtml}
      </div>
      ${this.renderChildLockInlineButton()}
    `;
  }

  private renderChildLockInlineButton(): Template {
    if (!this.config.show_child_lock || !this.detectedEntities.child_lock) {
      return nothing;
    }

    const childLockState = this.hass.states[this.detectedEntities.child_lock];
    const isLocked = childLockState?.state === 'on';

    return html`
      <button
        class="control-button ${classMap({ active: isLocked })}"
        @click=${() => this.callService('switch.toggle', { entity_id: this.detectedEntities.child_lock }, undefined, false)}
        title="Child Lock"
      >
        <ha-icon icon="pap:child_lock_button"></ha-icon>
      </button>
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
            <ha-icon icon="mdi:fan"></ha-icon>
            <div>${localize('common.name')}</div>
          </div>
        </ha-card>
      `;
    }

    if (!this.entity) {
      return this.renderUnavailable();
    }

    // If sensors should be in separate cards, render main card + sensor cards
    if (this.config.sensors_in_separate_card) {
      return html`
        <div class="card-container">
          <ha-card class="mushroom-card ${classMap({
            'fill-container': this.config.fill_container ?? false,
          })}">
            <div class="card-content">
              ${this.renderHeader()}
            </div>
          </ha-card>
          ${this.renderSeparateSensorCards()}
        </div>
      `;
    }

    // Otherwise render everything in one card
    return html`
      <ha-card class="mushroom-card ${classMap({
        'fill-container': this.config.fill_container ?? false,
      })}">
        <div class="card-content">
          ${this.renderHeader()}
          ${this.renderSensors()}
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
  type: 'philips-purifier-card',
  name: localize('common.name'),
  description: localize('common.description'),
  preview: true,
});
