export default class BharatDeviceParser {
    constructor() {
        this.alertMessages = {
            1: "Location Update",
            2: "Location Update (history)",
            3: "Alert – Disconnected from main battery",
            4: "Alert – Low battery",
            5: "Alert – Low battery removed",
            6: "Alert – Connected back to main battery",
            7: "Alert – Ignition ON",
            8: "Alert – Ignition OFF",
            9: "Alert – GPS box opened",
            10: "Alert ON - emergency state",
            11: "Alert OFF - emergency state",
            12: "Alert Over the air",
            13: "Harsh Braking",
            14: "Harsh Acceleration",
            15: "Rash Turning",
            16: "Emergency button Tampered"
        };
    }

    // Main parsing function
    parseDeviceData(rawData) {
        try {
            const cleanData = rawData.trim();
            
            if (cleanData.startsWith('$Header')) {
                return this.parseTrackingPacket(cleanData);
            } else if (cleanData.startsWith('$EPB')) {
                return this.parseEmergencyPacket(cleanData);
            } else if (cleanData.startsWith('$$')) {
                return this.parseSerialPacket(cleanData);
            } else if (cleanData.includes('HP')) {
                return this.parseHealthPacket(cleanData);
            }
            
            return null;
        } catch (error) {
            console.error('Error parsing device data:', error);
            return null;
        }
    }

    // Parse tracking packet (most common)
    parseTrackingPacket(data) {
        const fields = data.split(',');
        
        if (fields.length < 50) {
            throw new Error('Invalid tracking packet length');
        }

        return {
            packet_type: "tracking",
            timestamp: new Date().toISOString(),
            raw_data: data,
            parsed_data: {
                header: fields[1],
                vendor_id: fields,
                firmware_version: fields,
                message_type: fields,
                message_id: parseInt(fields),
                message_description: this.alertMessages[parseInt(fields)] || "Unknown",
                packet_status: fields, // L=Live, H=History
                device_info: {
                    imei: fields,
                    vehicle_reg_no: fields
                },
                gps_info: {
                    fix_status: parseInt(fields) === 1,
                    date: fields, // DDMMYYYY
                    time: fields, // HHMMSS
                    formatted_datetime: this.formatDateTime(fields, fields),
                    satellites: parseInt(fields),
                    pdop: parseFloat(fields),
                    hdop: parseFloat(fields)
                },
                location: {
                    latitude: parseFloat(fields),
                    latitude_dir: fields,
                    longitude: parseFloat(fields),
                    longitude_dir: fields,
                    speed_kmh: parseFloat(fields),
                    heading: parseInt(fields),
                    altitude_m: parseFloat(fields)
                },
                vehicle_status: {
                    ignition: parseInt(fields) === 1,
                    main_power: parseInt(fields) === 1,
                    main_voltage: parseFloat(fields),
                    battery_voltage: parseFloat(fields),
                    emergency_status: parseInt(fields) === 1,
                    tamper_alert: fields // C=Closed, O=Opened
                },
                network_info: {
                    operator: fields,
                    gsm_signal: parseInt(fields),
                    mcc: parseInt(fields),
                    mnc: parseInt(fields),
                    serving_cell: {
                        lac: fields,
                        cell_id: fields
                    },
                    neighbor_cells: this.parseNeighborCells(fields.slice(34, 46))
                },
                io_status: {
                    digital_inputs: fields, // 4 bits: DIN1,DIN2,DIN3,DIN4
                    digital_outputs: fields, // 2 bits: DOUT1,DOUT2
                    analog_input_1: parseFloat(fields),
                    analog_input_2: parseFloat(fields)
                },
                additional_info: {
                    frame_number: fields,
                    delta_distance: parseInt(fields),
                    ota_response: fields || null
                }
            }
        };
    }

    // Parse emergency packet
    parseEmergencyPacket(data) {
        const fields = data.split(',');
        
        return {
            packet_type: "emergency",
            timestamp: new Date().toISOString(),
            raw_data: data,
            parsed_data: {
                header: fields[1], // EPB
                message_type: fields, // EMR or SEM
                device_id: fields,
                packet_type: fields, // NM=Normal, SP=Stored
                datetime: this.parseEmergencyDateTime(fields),
                gps_validity: fields, // A=Valid, V=Invalid
                location: {
                    latitude: parseFloat(fields),
                    latitude_dir: fields,
                    longitude: parseFloat(fields),
                    longitude_dir: fields,
                    altitude: parseFloat(fields),
                    speed: parseFloat(fields)
                },
                distance: parseInt(fields),
                provider: fields, // G=GPS, N=Network
                vehicle_reg_no: fields,
                emergency_contact: fields
            }
        };
    }

    // Parse health monitoring packet
    parseHealthPacket(data) {
        const fields = data.split(',');
        
        return {
            packet_type: "health",
            timestamp: new Date().toISOString(),
            raw_data: data,
            parsed_data: {
                header: fields[1],
                vendor_id: fields,
                firmware_version: fields,
                imei: fields,
                battery_info: {
                    battery_percentage: parseInt(fields),
                    low_battery_threshold: parseInt(fields)
                },
                memory_info: {
                    server1_memory_percentage: parseFloat(fields),
                    server2_memory_percentage: parseFloat(fields)
                },
                update_rates: {
                    ignition_on_interval: parseInt(fields),
                    ignition_off_interval: parseInt(fields)
                },
                io_status: {
                    digital_inputs: fields,
                    analog_input_1: parseFloat(fields),
                    analog_input_2: parseFloat(fields)
                }
            }
        };
    }

    // Parse serial packet
    parseSerialPacket(data) {
        const fields = data.split(',');
        
        return {
            packet_type: "serial",
            timestamp: new Date().toISOString(),
            raw_data: data,
            parsed_data: {
                client_id: fields[0].substring(2), // Remove $$
                imei: fields[1],
                event_code: parseInt(fields),
                location: {
                    latitude: parseFloat(fields),
                    longitude: parseFloat(fields)
                },
                datetime: this.parseSerialDateTime(fields),
                gps_status: fields,
                serial_device_type: parseInt(fields),
                serial_data: fields,
                // Additional fields for Omnicomm serial packet
                ignition_status: fields ? parseInt(fields) : null,
                speed: fields ? parseFloat(fields) : null,
                main_power_voltage: fields ? parseFloat(fields) : null
            }
        };
    }

    // Helper functions
    formatDateTime(dateStr, timeStr) {
        try {
            // Convert DDMMYYYY and HHMMSS to ISO format
            const day = dateStr.substring(0, 2);
            const month = dateStr.substring(2, 4);
            const year = dateStr.substring(4, 8);
            const hour = timeStr.substring(0, 2);
            const minute = timeStr.substring(2, 4);
            const second = timeStr.substring(4, 6);
            
            return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
        } catch (error) {
            return null;
        }
    }

    parseEmergencyDateTime(dateTimeStr) {
        try {
            // Format: DDMMYYYY HHMMSS -> DDMMYYYYHHMMSS
            const day = dateTimeStr.substring(0, 2);
            const month = dateTimeStr.substring(2, 4);
            const year = dateTimeStr.substring(4, 8);
            const hour = dateTimeStr.substring(8, 10);
            const minute = dateTimeStr.substring(10, 12);
            const second = dateTimeStr.substring(12, 14);
            
            return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
        } catch (error) {
            return null;
        }
    }

    parseSerialDateTime(dateTimeStr) {
        try {
            // Format: YYMMDDHHMMSS
            const year = '20' + dateTimeStr.substring(0, 2);
            const month = dateTimeStr.substring(2, 4);
            const day = dateTimeStr.substring(4, 6);
            const hour = dateTimeStr.substring(6, 8);
            const minute = dateTimeStr.substring(8, 10);
            const second = dateTimeStr.substring(10, 12);
            
            return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
        } catch (error) {
            return null;
        }
    }

    parseNeighborCells(neighborFields) {
        const neighbors = [];
        
        // Process 4 neighbor cells (each has 3 fields: signal, lac, cell_id)
        for (let i = 0; i < 12; i += 3) {
            if (i + 2 < neighborFields.length) {
                neighbors.push({
                    signal_strength: parseInt(neighborFields[i]),
                    lac: neighborFields[i + 1],
                    cell_id: neighborFields[i + 2]
                });
            }
        }
        
        return neighbors;
    }
}
