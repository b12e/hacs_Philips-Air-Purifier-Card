# Philips Air Purifier Card

> Custom Lovelace card for [Home Assistant][home-assistant] specifically designed for Philips Air Purifiers

A modern, Mushroom-inspired card with device-based configuration and automatic entity detection for Philips Air Purifiers.

## ✨ Key Features

- **Device-Based Configuration** - Select your device, entities are auto-detected
- **Mushroom-Style Design** - Clean, modern interface with smooth animations
- **Visual Preset Controls** - Chip-based buttons for all modes
- **Auto-Detect Sensors** - PM2.5, IAI, humidity, temperature, filters
- **Official Philips Icons** - From the [philips-airpurifier-coap](https://github.com/kongo09/philips-airpurifier-coap) integration

## 📦 Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to "Frontend"
3. Click menu (⋮) → "Custom repositories"
4. Add this repository URL
5. Click "Install"
6. Reload Home Assistant

## 📋 Requirements

This card requires the [Philips AirPurifier CoAP integration](https://github.com/kongo09/philips-airpurifier-coap) by kongo09.

## ⚙️ Configuration

### Visual Editor (Recommended)

1. Add a new card to your dashboard
2. Search for "Philips Air Purifier Card"
3. Select your Philips Air Purifier device
4. Entities are automatically detected!
5. Customize display options

### Configuration Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | **Required** | `custom:philips-purifier-card` |
| `device_id` | string | Optional | Device ID for auto-detection (recommended) |


#### Display Options
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `name` | string | Auto | Custom name to display (overrides device name) |
| `show_name` | boolean | `true` | Show device name |
| `show_state` | boolean | `true` | Show on/off state below name |
| `show_icon` | boolean | `true` | Show power button/icon |
| `icon_animation` | boolean | `true` | Animate icon when device is on |
| `fill_container` | boolean | `false` | Stretch card to fill container |

#### Preset Modes
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `show_preset_modes` | boolean | `true` | Show preset mode control chips |
| `collapsible_preset_modes` | boolean | `false` | Show preset modes behind a toggle button |
| `visible_preset_modes` | array | All | Array of mode keys to show (e.g., `['auto', 'sleep', 'turbo']`). Empty = show all |

#### Sensors
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `show_sensors` | boolean | `true` | Show sensor grid (PM2.5, IAI, humidity, temp) |
| `visible_sensors` | array | All | Array of sensors to show: `['pm25', 'iai', 'humidity', 'temperature']`. Empty = show all |
| `sensors_in_separate_card` | boolean | `true` | Show sensors in separate card below main card |
| `hide_sensors_when_off` | boolean | `false` | Hide sensors when device is off |

#### Controls
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `show_child_lock` | boolean | `true` | Show child lock control button |
| `collapse_controls_when_off` | boolean | `false` | Hide all controls when device is off |

## Supported languages

This card supports translations. Please, help to add more translations and improve existing ones. Here's a list of supported languages:

- English
- Українська (Ukrainian)
- Türkçe (Turkish)
- Français (French)
- Norsk (Norwegian)
- Polski (Polish)
- Български (Bulgarian)
- 简体中文 (Simplified Chinese)
- Deutsch (German)
- Català (Catalan)
- Русский (Russian)
- Italiano (Italian)
- 繁體中文 (Traditional Chinese)
- Čeština (Czech)
- Dutch (Netherlands)
- Español (Spanish)
- Slovenčina (Slovak)
- Português (Portuguese)

## 🔧 Supported Models

This card is specifically designed for Philips Air Purifiers using the [philips-airpurifier-coap](https://github.com/kongo09/philips-airpurifier-coap) integration.

Supported models include (from the integration):
- AC0850, AC0951, AC1214, AC1715
- AC2729, AC2889, AC2936, AC2939, AC2958, AC2959
- AC3033, AC3036, AC3039, AC3055, AC3059
- AC3210, AC3220, AC3221, AC3259, AC3420, AC3421
- AC3737, AC3829, AC3836, AC3854, AC3858
- AC4220, AC4221, AC4236, AC4550, AC4558
- AC5660, AC5659
- AMF765, AMF870
- CX3120, CX3550, CX5120
- HU1509, HU1510, HU5710

And many more! See the [Philips Air Purifier integration's README](https://github.com/kongo09/philips-airpurifier-coap#supported-models) for a complete list.

## 🙏 Credits

- Original [Purifier Card](https://github.com/denysdovhan/purifier-card) by [Denys Dovhan](https://github.com/denysdovhan)
- [Philips AirPurifier CoAP](https://github.com/kongo09/philips-airpurifier-coap) integration by kongo09
- [Mushroom Cards](https://github.com/piitaya/lovelace-mushroom) design inspiration by piitaya

<!-- Badges -->

[npm-url]: https://npmjs.org/package/purifier-card
[npm-image]: https://img.shields.io/npm/v/purifier-card.svg?style=flat-square
[hacs-url]: https://github.com/hacs/integration
[hacs-image]: https://img.shields.io/badge/hacs-default-orange.svg?style=flat-square
[gh-sponsors-url]: https://github.com/sponsors/denysdovhan
[gh-sponsors-image]: https://img.shields.io/github/sponsors/denysdovhan?style=flat-square
[patreon-url]: https://patreon.com/denysdovhan
[patreon-image]: https://img.shields.io/badge/support-patreon-F96854.svg?style=flat-square
[buymeacoffee-url]: https://patreon.com/denysdovhan
[buymeacoffee-image]: https://img.shields.io/badge/support-buymeacoffee-222222.svg?style=flat-square
[twitter-url]: https://twitter.com/denysdovhan
[twitter-image]: https://img.shields.io/badge/twitter-%40denysdovhan-00ACEE.svg?style=flat-square

<!-- References -->

[home-assistant]: https://www.home-assistant.io/
[hacs]: https://hacs.xyz
[preview-image]: https://user-images.githubusercontent.com/3459374/164275676-504d92aa-2c61-4451-ae9b-23dad113ce14.png
[latest-release]: https://github.com/denysdovhan/purifier-card/releases/latest
[ha-scripts]: https://www.home-assistant.io/docs/scripts/
[xiaomi-miio-favorite-levels]: https://www.home-assistant.io/integrations/xiaomi_miio/#service-xiaomi_miiofan_set_favorite_level-air-purifiers-only
[original-gif]: https://github.com/macbury/SmartHouse/blob/master/home-assistant/www/custom-lovelace/air-purifier/standby.gif
[edit-readme]: https://github.com/denysdovhan/purifier-card/edit/master/README.md
[add-translation]: https://github.com/denysdovhan/purifier-card/blob/master/CONTRIBUTING.md#how-to-add-translation
[macbury-smart-house]: https://macbury.github.io/SmartHouse/HomeAssistant/Lovelace/#air-purifier
[denysdovhan]: https://denysdovhan.com
