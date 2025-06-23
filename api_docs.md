# Network Engineer AI Assistant API

**Version:** 1.0.0

An AI assistant for network engineers, powered by LangChain, Ollama, and ChromaDB with real-time device monitoring.

## Base URL
localhost:8000/

## Endpoints

### Device Monitoring

#### List Devices
**GET** `/devices/`

Get list of all configured devices.

**Response:** Array of device list objects
- `200`: Successful Response

---

#### Create Device
**POST** `/devices/`

Create a new device.

**Request Body:** DeviceCreateRequest (required)
- `name` (string, required): Device name (1-100 characters)
- `host` (string, required): Device hostname or IP address
- `device_type` (enum): Device type (default: "generic")
  - Options: `router`, `switch`, `firewall`, `access_point`, `server`, `generic`
- `enabled_protocols` (array): Enabled protocols (default: `["snmp"]`)
  - Options: `snmp`, `ssh`, `rest`, `telnet`
- `credentials` (object, optional): Device credentials
- `timeout` (integer): Connection timeout in seconds (1-60, default: 10)
- `retry_count` (integer): Number of retry attempts (1-10, default: 3)
- `description` (string, optional): Device description (max 500 characters)

**Response:**
- `201`: Device created successfully
- `422`: Validation Error

---

#### Get Device Status
**GET** `/devices/{device_id}/status`

Get comprehensive device status.

**Parameters:**
- `device_id` (path, required): Device identifier

**Response:**
- `200`: DeviceStatusResponse object
- `422`: Validation Error

---

#### Get Device Interfaces
**GET** `/devices/{device_id}/interfaces`

Get all interfaces for a device.

**Parameters:**
- `device_id` (path, required): Device identifier

**Response:**
- `200`: Array of InterfaceResponse objects
- `422`: Validation Error

---

#### Get Device Interface
**GET** `/devices/{device_id}/interfaces/{interface_name}`

Get specific interface information.

**Parameters:**
- `device_id` (path, required): Device identifier
- `interface_name` (path, required): Interface name

**Response:**
- `200`: InterfaceResponse object
- `422`: Validation Error

---

#### Get Device Health
**GET** `/devices/{device_id}/health`

Get device health metrics.

**Parameters:**
- `device_id` (path, required): Device identifier

**Response:**
- `200`: HealthResponse object containing:
  - `cpu_usage` (number, optional)
  - `memory_usage` (number, optional)
  - `memory_total` (integer, optional)
  - `memory_used` (integer, optional)
  - `temperature` (number, optional)
  - `uptime` (integer, optional)
  - `load_average` (array of numbers)
  - `disk_usage` (object with disk usage percentages)

---

#### Ping Device
**POST** `/devices/{device_id}/ping`

Ping a device to test connectivity.

**Parameters:**
- `device_id` (path, required): Device identifier

**Response:**
- `200`: PingResponse object
- `422`: Validation Error

---

#### Test Device Connection
**GET** `/devices/{device_id}/test`

Test device connection using configured protocol.

**Parameters:**
- `device_id` (path, required): Device identifier

**Response:**
- `200`: Connection test result
- `422`: Validation Error

---

#### Get All Device Status
**GET** `/devices/status/all`

Get status for multiple devices concurrently.

**Parameters:**
- `device_ids` (query, optional): Array of specific device IDs to query

**Response:**
- `200`: Status information for all or specified devices
- `422`: Validation Error

---

#### Reload Device Configs
**POST** `/devices/reload`

Reload device configurations from file.

**Response:**
- `200`: Configuration reloaded successfully

---

#### Clear Cache
**DELETE** `/devices/cache`

Clear cache for specific device or all devices.

**Parameters:**
- `device_id` (query, optional): Device ID to clear cache for

**Response:**
- `200`: Cache cleared successfully
- `422`: Validation Error

---

#### Get Device
**GET** `/devices/{device_id}`

Get a specific device configuration.

**Parameters:**
- `device_id` (path, required): Device identifier

**Response:**
- `200`: DeviceResponse object
- `422`: Validation Error

---

#### Update Device
**PUT** `/devices/{device_id}`

Update an existing device.

**Parameters:**
- `device_id` (path, required): Device identifier

**Request Body:** DeviceUpdateRequest (required)
All fields are optional for updates:
- `name` (string): Device name (1-100 characters)
- `host` (string): Device hostname or IP address
- `device_type` (enum): Device type
- `enabled_protocols` (array): Enabled protocols
- `credentials` (object): Device credentials
- `timeout` (integer): Connection timeout (1-60 seconds)
- `retry_count` (integer): Retry attempts (1-10)
- `description` (string): Device description (max 500 characters)

**Response:**
- `200`: DeviceResponse object
- `422`: Validation Error

---

#### Delete Device
**DELETE** `/devices/{device_id}`

Delete a device.

**Parameters:**
- `device_id` (path, required): Device identifier

**Response:**
- `200`: Device deleted successfully
- `422`: Validation Error

---

#### Bulk Create Devices
**POST** `/devices/bulk`

Create multiple devices at once.

**Request Body:** BulkDeviceCreateRequest (required)
- `devices` (array, required): Array of DeviceCreateRequest objects (1-100 devices)

**Response:**
- `200`: BulkDeviceCreateResponse object
- `422`: Validation Error

---

### Configuration Management

#### Export Device Config
**GET** `/devices/config/export`

Export all device configurations.

**Response:**
- `200`: DeviceConfigExport object

---

#### Import Device Config
**POST** `/devices/config/import`

Import device configurations.

**Request Body:** DeviceConfigImport (required)
- `devices` (object, required): Device configurations
- `global_settings` (object, optional): Global settings
- `merge_strategy` (string): Merge strategy (default: "replace")
  - Options: `replace`, `merge`, `skip_existing`

**Response:**
- `200`: Import completed successfully  
- `422`: Validation Error

---

### Network Discovery

#### Discover Devices
**GET** `/devices/discovery/{subnet}`

Discover devices on a network subnet.

**Parameters:**
- `subnet` (path, required): Network subnet to scan
- `snmp_communities` (query, optional): Array of SNMP communities to try

**Response:**
- `200`: Discovery results
- `422`: Validation Error

---

#### Start Discovery Scan
**POST** `/devices/discovery/scan`

Start a network discovery scan.

**Request Body:** DiscoveryRequest (required)
- `network` (string, required): Network range to scan (e.g., 192.168.1.0/24)
- `scan_type` (string): Type of scan (default: "ping")
  - Options: `ping`, `port`, `full`
- `snmp_communities` (array, optional): SNMP communities to try (default: `["public"]`)
- `ports` (array, optional): Custom ports to scan
- `timeout` (integer): Scan timeout in seconds (1-10, default: 2)
- `max_concurrent` (integer): Maximum concurrent operations (1-200, default: 50)

**Response:**
- `200`: DiscoveryResponse object
- `422`: Validation Error

---

#### Get Scan Status
**GET** `/devices/discovery/scan/{scan_id}`

Get the status of a discovery scan.

**Parameters:**
- `scan_id` (path, required): Scan identifier

**Response:**
- `200`: DiscoveryResponse object
- `422`: Validation Error

---

#### Delete Scan Result
**DELETE** `/devices/discovery/scan/{scan_id}`

Delete a discovery scan result.

**Parameters:**
- `scan_id` (path, required): Scan identifier

**Response:**
- `200`: Scan result deleted successfully
- `422`: Validation Error

---

#### Get Scan Results
**GET** `/devices/discovery/scan/{scan_id}/results`

Get the results of a completed discovery scan.

**Parameters:**
- `scan_id` (path, required): Scan identifier

**Response:**
- `200`: DiscoveryResultResponse object
- `422`: Validation Error

---

#### Auto Add Discovered Devices
**POST** `/devices/discovery/scan/{scan_id}/add-devices`

Automatically add discovered devices to configuration.

**Parameters:**
- `scan_id` (path, required): Scan identifier

**Response:**
- `200`: Devices added successfully
- `422`: Validation Error

---

#### Get Scan History
**GET** `/devices/discovery/history`

Get discovery scan history.

**Parameters:**
- `limit` (query, optional): Number of results to return (1-200, default: 50)

**Response:**
- `200`: Array of ScanHistoryResponse objects
- `422`: Validation Error

---

#### Start Advanced Discovery
**POST** `/devices/discovery/advanced`

Start an advanced discovery scan with custom rules.

**Request Body:** AdvancedDiscoveryRequest (required)
- `network` (string, required): Network to scan
- `custom_rules` (array): Array of CustomDiscoveryRule objects
- `deep_scan` (boolean): Perform deep scanning including SNMP walks (default: false)
- `save_results` (boolean): Save results for later retrieval (default: true)
- `auto_add_devices` (boolean): Automatically add discovered devices (default: false)
- `scan_name` (string, optional): Name for this scan

**Response:**
- `200`: DiscoveryResponse object
- `422`: Validation Error

---

#### Cleanup Old Scan Results
**POST** `/devices/discovery/cleanup`

Clean up old discovery scan results.

**Parameters:**
- `days` (query, optional): Age threshold in days (1-365, default: 30)

**Response:**
- `200`: Cleanup completed successfully
- `422`: Validation Error

---

#### Health Check
**GET** `/devices/health`

Health check for the monitoring service.

**Response:**
- `200`: Service health status

---

### AI Assistant

#### Ask Question
**POST** `/ask`

Ask the AI Assistant a question with streaming response.

**Request Body:** QueryRequest (required)
- `query` (string, required): The question or request for the AI assistant

**Response:**
- `200`: Streaming response chunks
- `422`: Validation Error

---

## Data Models

### Device Types
- `router`: Network router
- `switch`: Network switch  
- `firewall`: Firewall device
- `access_point`: Wireless access point
- `server`: Server device
- `generic`: Generic network device

### Supported Protocols
- `snmp`: Simple Network Management Protocol
- `ssh`: Secure Shell
- `rest`: REST API
- `telnet`: Telnet protocol

### Device Credentials
- `snmp_community`: SNMP community string
- `snmp_version`: SNMP version (1, 2c, or 3)
- `username`: Authentication username
- `password`: Authentication password (masked in responses)
- `ssh_key`: SSH private key (masked in responses)
- `api_token`: API authentication token (masked in responses)
- `api_key`: API key (masked in responses)

### Discovery Scan Types
- `ping`: Basic ping connectivity test
- `port`: Port scanning for open services
- `full`: Comprehensive scan including SNMP discovery

### Interface Status Values
- `up`: Interface is operational
- `down`: Interface is not operational
- `testing`: Interface is in testing mode
- `unknown`: Interface status is unknown

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created (for POST operations)
- `422`: Validation Error with detailed error information
- `404`: Resource not found
- `500`: Internal server error

Validation errors include detailed information about which fields failed validation and why.