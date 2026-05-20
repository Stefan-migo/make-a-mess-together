/**
 * phone-sensor-orchestra — Phone Client Configuration
 * 
 * Edit this file to set your bridge IP and port.
 * URL param ?ip=... still overrides this value.
 * 
 * Spec: PLAN.md
 */

const PHONE_CONFIG = {
  // Bridge IP address (your laptop's LAN IP)
  bridgeIp: '192.168.100.15',
  
  // WebSocket port (default: 8080)
  wsPort: 8080,
  
  // How often to send sensor data (ms)
  sendIntervalMs: 33,  // ~30fps
};
