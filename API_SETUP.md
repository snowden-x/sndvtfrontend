# API Setup Guide

## Quick Start

To run the Device Monitoring API backend:

1. **Start the API Server:**
   ```bash
   python api.py
   ```
   
   Or alternatively:
   ```bash
   python -m app.main
   ```

2. **Verify the server is running:**
   - API should be available at: `http://localhost:8000`
   - API documentation at: `http://localhost:8000/docs`

3. **Start the Frontend:**
   ```bash
   npm run dev
   ```
   - Frontend will be available at: `http://localhost:5173`
   - API calls will be automatically proxied to the backend

## Phase 1 Features

The current implementation includes:

- ✅ Device CRUD operations (Create, Read, Update, Delete)
- ✅ Device list view with status indicators
- ✅ Device detail view and editing
- ✅ Add new device form with validation
- ✅ API proxy configuration
- ✅ Proper error handling for backend connectivity

## API Endpoints Used

- `GET /devices/` - List all devices
- `POST /devices/` - Create new device  
- `GET /devices/{id}` - Get device details
- `PUT /devices/{id}` - Update device
- `DELETE /devices/{id}` - Delete device
- `GET /devices/{id}/status` - Get device status
- `GET /devices/{id}/test` - Test device connection
- `POST /devices/{id}/ping` - Ping device

## Troubleshooting

**"Cannot connect to the backend server"** error:
1. Make sure the API server is running on port 8000
2. Check that no other application is using port 8000
3. Verify the api.py file exists and can be executed

**Frontend not loading:**
1. Make sure you've run `npm install`
2. Check that port 5173 is available
3. Restart the dev server with `npm run dev` 