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
    
    return {
        packet_type: "tracking",
        timestamp: new Date().toISOString(),
        raw_data: data,
        parsed_data: {
            header: fields[0], // $Header
            vendor_id: fields[1], // iTriangle
            firmware_version: fields[2], // 1_36T02B0164MAIS_6
            message_type: fields[3], // NR
            message_id: parseInt(fields[4]), // 16
            message_description: this.alertMessages[parseInt(fields[4])] || "Unknown",
            packet_status: fields[5], // L=Live, H=History
            device_info: {
                imei: fields[6], // 864495034476850
                vehicle_reg_no: fields[7] // KA01G1234
            },
            gps_info: {
                fix_status: parseInt(fields[8]) === 1, // 1
                date: fields[9], // 02022019 (DDMMYYYY)
                time: fields[10], // 083507 (HHMMSS)
                formatted_datetime: this.formatDateTime(fields[9], fields[10]),
                latitude: parseFloat(fields[11]), // 12.975843
                latitude_dir: fields[12], // N
                longitude: parseFloat(fields[13]), // 77.549438
                longitude_dir: fields[14], // E
                speed_kmh: parseFloat(fields[15]), // 0.0
                heading: parseInt(fields[16]), // 126
                satellites: parseInt(fields[17]), // 5
                altitude_m: parseFloat(fields[18]), // 799.0
                pdop: parseFloat(fields[19]), // 0.00
                hdop: parseFloat(fields[20]) // 1.59
            },
            location: {
                latitude: parseFloat(fields[11]),
                latitude_dir: fields[12],
                longitude: parseFloat(fields[13]),
                longitude_dir: fields[14],
                speed_kmh: parseFloat(fields[15]),
                heading: parseInt(fields[16]),
                altitude_m: parseFloat(fields[18])
            },
            vehicle_status: {
                mcc: parseInt(fields[21]), // 40486
                ignition: parseInt(fields[22]) === 1, // 1
                main_power: parseInt(fields[23]) === 1, // 1
                main_voltage: parseFloat(fields[24]), // 12.4
                battery_voltage: parseFloat(fields[25]), // 4.3
                emergency_status: parseInt(fields[26]) === 1, // 1
                tamper_alert: fields[27] // C=Closed, O=Opened
            },
            network_info: {
                gsm_signal: parseInt(fields[28]), // 31
                mcc: parseInt(fields[29]), // 404
                mnc: parseInt(fields[30]), // 86
                serving_cell: {
                    lac: fields[31], // 7b73
                    cell_id: fields[32] // b74a
                },
                neighbor_cells: this.parseNeighborCells([
                    fields[33], fields[34], fields[35], // 55, 02a0, 7d0b
                    fields[36], fields[37], fields[38], // 49, 4d0a, 7d0b
                    fields[39], fields[40], fields[41], // 49, 1948, 7b73
                    fields[42], fields[43], fields[44]  // 59, ffff, 0000
                ])
            },
            io_status: {
                digital_inputs: fields[45], // 0101
                digital_outputs: fields[46], // 01
                frame_number: fields[47], // 008273
                analog_input_1: parseFloat(fields[48]), // 0.0
                analog_input_2: parseFloat(fields[49]) // 0.0
            },
            additional_info: {
                reserved_1: fields[50], // 0.0
                reserved_2: fields[51] || null, // ()
                checksum: fields[52] || null // *3E
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
