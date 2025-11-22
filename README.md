# Philips Air Purifier Card

> Custom Lovelace card for [Home Assistant][home-assistant] specifically designed for Philips Air Purifiers

A modern, Mushroom-inspired card with device-based configuration and automatic entity detection for Philips Air Purifiers.

![Philips Air Purifier Card](https://img.shields.io/badge/version-3.0.0-blue.svg)

## ✨ Key Features

- **Device-Based Configuration** - Select your device, entities are auto-detected
- **Mushroom-Style Design** - Clean, modern interface with smooth animations
- **Visual Preset Controls** - Chip-based buttons for all modes
- **Auto-Detect Sensors** - PM2.5, IAI, humidity, temperature, filters
- **Official Philips Icons** - From the [philips-airpurifier-coap](https://github.com/kongo09/philips-airpurifier-coap) integration
- **Flexible Layouts** - Vertical, horizontal, and compact views

## 📦 Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to "Frontend"
3. Click menu (⋮) → "Custom repositories"
4. Add this repository URL
5. Click "Install"
6. Restart Home Assistant

### Manual Installation

1. Download `philips-purifier-card.js` from the [latest release](https://github.com/yourusername/philips-purifier-card/releases/latest)
2. Copy to `config/www` folder
3. Add resource to Lovelace:

   **Via UI:** Configuration → Dashboards → Resources → Add Resource
   - URL: `/local/philips-purifier-card.js`
   - Type: JavaScript Module

   **Via YAML:**
   ```yaml
   lovelace:
     resources:
       - url: /local/philips-purifier-card.js
         type: module
   ```

4. Restart Home Assistant

## 📋 Requirements

This card requires the [Philips AirPurifier CoAP integration](https://github.com/kongo09/philips-airpurifier-coap) by kongo09.

## ⚙️ Configuration

### Visual Editor (Recommended)

1. Add a new card to your dashboard
2. Search for "Philips Air Purifier Card"
3. Select your Philips Air Purifier device
4. Entities are automatically detected!
5. Customize display options

### YAML Configuration

#### Device-Based (Recommended)

```yaml
type: custom:philips-purifier-card
device_id: abc123def456  # Auto-detected from device
show_name: true
show_state: true
show_preset_modes: true
show_sensors: true
show_toolbar: true
compact_view: false
layout: vertical
```

#### Entity-Based (Legacy)

```yaml
type: custom:philips-purifier-card
entity: fan.philips_air_purifier
show_name: true
show_state: true
show_preset_modes: true
show_sensors: true
show_toolbar: true
```

### Configuration Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | **Required** | `custom:philips-purifier-card` |
| `device_id` | string | Optional | Device ID (recommended) |
| `entity` | string | Optional | Fan entity (legacy) |
| `show_name` | boolean | `true` | Show device name |
| `show_state` | boolean | `true` | Show on/off state |
| `show_preset_modes` | boolean | `true` | Show mode chips |
| `show_sensors` | boolean | `true` | Show sensor grid |
| `show_toolbar` | boolean | `true` | Show control buttons |
| `compact_view` | boolean | `false` | Compact layout |
| `layout` | string | `vertical` | `vertical` or `horizontal` |

### Auto-Detected Entities

- Fan control
- PM2.5 sensor
- IAI/Allergen Index
- Humidity sensor
- Temperature sensor
- Filter sensors
- Child lock switch
- Display light

## 🎨 Styling

The card uses Mushroom-inspired design and automatically adapts to your Home Assistant theme.

### Custom Styling with card-mod

```yaml
type: custom:philips-purifier-card
device_id: abc123
card_mod:
  style: |
    ha-card {
      --primary-color: #0066CC;
      --spacing: 16px;
    }
```

## 📝 Examples

### Minimal Setup
```yaml
type: custom:philips-purifier-card
device_id: abc123
```

### Compact View
```yaml
type: custom:philips-purifier-card
device_id: abc123
compact_view: true
show_preset_modes: false
```

### Horizontal Layout
```yaml
type: custom:philips-purifier-card
device_id: abc123
layout: horizontal
```

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
- [_Your language?_][add-translation]

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

And many more! See the [integration's README](https://github.com/kongo09/philips-airpurifier-coap#supported-models) for a complete list.

## 🤝 Contributing

Contributions are welcome! Please check [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 💬 Support

- [Report Issues](https://github.com/yourusername/philips-purifier-card/issues)
- [Home Assistant Community](https://community.home-assistant.io/)

## 📜 License

MIT © Bram Kragten

## 🙏 Credits

- Original [Purifier Card](https://github.com/denysdovhan/purifier-card) by [Denys Dovhan](https://github.com/denysdovhan)
- [Philips AirPurifier CoAP](https://github.com/kongo09/philips-airpurifier-coap) integration by kongo09
- [Mushroom Cards](https://github.com/piitaya/lovelace-mushroom) design inspiration by piitaya

## 📋 Changelog

### 3.0.0 (2024)

**Major Redesign**
- Complete rewrite with Mushroom-inspired styling
- Device-based configuration with automatic entity detection
- Visual preset mode controls with official Philips icons
- Improved sensor display with responsive grid layout
- Added horizontal and compact layout options
- Modern UI with smooth animations and transitions
- Better responsive design
- Removed legacy slider controls
- Focused specifically on Philips Air Purifiers

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
