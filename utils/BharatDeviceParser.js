export default class UnifiedDeviceParser {
    constructor() {
        // Alert messages for both protocols
        this.bharatAlertMessages = {
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

        this.ais140AlertMessages = {
            1: "Location Update",
            2: "Location Update (History)",
            3: "Mains off",
            4: "Low Battery",
            5: "Low Battery removed",
            6: "Mains On",
            7: "Ignition On",
            8: "Ignition Off",
            9: "Temper Alert",
            10: "Emergency On",
            11: "Emergency Off",
            12: "OTA Alert",
            13: "Harsh Breaking",
            14: "Harsh Acceleration",
            15: "Rash Turning",
            16: "Wire Disconnect",
            17: "Overspeed",
            22: "Tilt Alert",
            26: "New Tag Alert",
            27: "Temperature High Alert",
            28: "Temperature Low Alert",
            29: "Relay Alert"
        };
    }

    parseDeviceData(rawData) {
        try {
            const cleanData = rawData.trim();
            const protocol = this.detectProtocol(cleanData);
            
            switch(protocol) {
                case 'BHARAT_101':
                    return this.parseBharatPacket(cleanData);
                case 'AIS_140':
                    return this.parseAis140Packet(cleanData);
                default:
                    console.warn('Unknown protocol detected');
                    return null;
            }
        } catch (error) {
            console.error('Error parsing device data:', error);
            return null;
        }
    }

    // Detect which protocol is being used
    detectProtocol(data) {
        if (data.startsWith('$Header')) {
            return 'BHARAT_101';
        } else if (data.startsWith('$EPB')) {
            return 'BHARAT_101'; // Emergency packet
        } else if (data.startsWith('$$')) {
            return 'BHARAT_101'; // Serial packet
        } else if (data.startsWith('$LGN')) {
            return 'AIS_140'; // Login packet
        } else if (data.startsWith('$NRM')) {
            return 'AIS_140'; // Normal/Location packet
        } else if (data.startsWith('$ALT')) {
            return 'AIS_140'; // Alert packet
        } else if (data.startsWith('$HLM')) {
            return 'AIS_140'; // Health monitoring packet
        } else if (data.includes('HP')) {
            return 'BHARAT_101'; // Health packet
        }
        
        return 'UNKNOWN';
    }

    // BHARAT_101 Protocol Parsers
    parseBharatPacket(data) {
        if (data.startsWith('$Header')) {
            return this.parseBharatTrackingPacket(data);
        } else if (data.startsWith('$EPB')) {
            return this.parseBharatEmergencyPacket(data);
        } else if (data.startsWith('$$')) {
            return this.parseBharatSerialPacket(data);
        } else if (data.includes('HP')) {
            return this.parseBharatHealthPacket(data);
        }
        return null;
    }

    parseBharatTrackingPacket(data) {
        const fields = data.split(',');
        
        return {
            protocol: "BHARAT_101",
            packet_type: "tracking",
            timestamp: new Date().toISOString(),
            raw_data: data,
            parsed_data: {
                header: fields[0], // $Header
                vendor_id: fields[1], // iTriangle
                firmware_version: fields[2], // 1_36T02B0164MAIS_6
                message_type: fields[3], // NR
                message_id: parseInt(fields[4]), // 16
                message_description: this.bharatAlertMessages[parseInt(fields[4])] || "Unknown",
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
                vehicle_status: {
                    operator_name: fields[21], // 40486 (Network operator)
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
                    delta_distance: fields[50], // 0
                    ota_response: fields[51] || null, // ()
                    checksum: fields[52] || null // *3E
                }
            }
        };
    }

    parseBharatEmergencyPacket(data) {    
        const fields = data.split(',');
        
        return {
            protocol: "BHARAT_101",
            packet_type: "emergency",
            timestamp: new Date().toISOString(),
            raw_data: data,
            parsed_data: {
                header: fields[0], // $EPB
                message_type: fields[1], // EMR or SEM
                device_id: fields[2], // IMEI
                packet_type: fields[3], // NM=Normal, SP=Stored
                datetime: fields[4], // DDMMYYYYHHMMSS
                gps_validity: fields[5], // A=Valid, V=Invalid
                location: {
                    latitude: parseFloat(fields[6]),
                    latitude_dir: fields[7],
                    longitude: parseFloat(fields[8]),
                    longitude_dir: fields[9],
                    altitude: parseFloat(fields[10]),
                    speed: parseFloat(fields[11])
                },
                distance: parseInt(fields[12]),
                provider: fields[13], // G=GPS, N=Network
                vehicle_reg_no: fields[14],
                emergency_contact: fields[15],
                checksum: fields[16] || null
            }
        };
    }

    parseBharatHealthPacket(data) {
        const fields = data.split(',');
        
        return {
            protocol: "BHARAT_101",
            packet_type: "health",
            timestamp: new Date().toISOString(),
            raw_data: data,
            parsed_data: {
                header: fields[0], // $Header
                vendor_id: fields[1], // iTriangle
                firmware_version: fields[2], // 1_36T02B0164MAIS_6
                imei: fields[3], // IMEI
                battery_info: {
                    battery_percentage: parseInt(fields[4]),
                    low_battery_threshold: parseInt(fields[5])
                },
                memory_info: {
                    server1_memory_percentage: parseFloat(fields[6]),
                    server2_memory_percentage: parseFloat(fields[7])
                },
                update_rates: {
                    ignition_on_interval: parseInt(fields[8]),
                    ignition_off_interval: parseInt(fields[9])
                },
                io_status: {
                    digital_inputs: fields[10],
                    analog_input_1: parseFloat(fields[11]),
                    analog_input_2: parseFloat(fields[12])
                },
                checksum: fields[13] || null
            }
        };
    }

    parseBharatSerialPacket(data) {
        const fields = data.split(',');
        
        return {
            protocol: "BHARAT_101",
            packet_type: "serial",
            timestamp: new Date().toISOString(),
            raw_data: data,
            parsed_data: {
                client_id: fields[0].substring(2), // Remove $$
                imei: fields[1],
                event_code: parseInt(fields[2]),
                location: {
                    latitude: parseFloat(fields[3]),
                    longitude: parseFloat(fields[4])
                },
                datetime: fields[5], // YYMMDDHHMMSS
                gps_status: fields[6], // A/V
                serial_device_type: parseInt(fields[7]),
                serial_data: fields[8],
                // Additional fields for Omnicomm serial packet (if present)
                ignition_status: fields[9] ? parseInt(fields[9]) : null,
                speed: fields[10] ? parseFloat(fields[10]) : null,
                main_power_voltage: fields[11] ? parseFloat(fields[11]) : null,
                checksum: fields[12] || null
            }
        };
    }

    // AIS-140 Protocol Parsers
    parseAis140Packet(data) {
        if (data.startsWith('$LGN')) {
            return this.parseAis140LoginPacket(data);
        } else if (data.startsWith('$NRM')) {
            return this.parseAis140LocationPacket(data);
        } else if (data.startsWith('$ALT')) {
            return this.parseAis140AlertPacket(data);
        } else if (data.startsWith('$HLM')) {
            return this.parseAis140HealthPacket(data);
        }
        return null;
    }

    parseAis140LoginPacket(data) {
        const fields = data.split(',');
        
        return {
            protocol: "AIS_140",
            packet_type: "login",
            timestamp: new Date().toISOString(),
            raw_data: data,
            parsed_data: {
                header: fields[0], // $LGN
                device_name: fields[1], // Vehicle Registration
                imei: fields[2], // Device IMEI
                software_version: fields[3], // Software version
                latitude: parseFloat(fields[4]),
                latitude_dir: fields[5],
                longitude: parseFloat(fields[6]),
                longitude_dir: fields[7]
            }
        };
    }

    parseAis140LocationPacket(data) {
        const fields = data.split(',');
        
        return {
            protocol: "AIS_140",
            packet_type: "location",
            timestamp: new Date().toISOString(),
            raw_data: data,
            parsed_data: {
                header: fields[0], // $NRM
                vendor_id: fields[1],
                software_version: fields[2],
                packet_type: fields[3],
                alert_id: parseInt(fields[4]),
                packet_status: fields[5], // L/H
                imei: fields[6],
                vehicle_reg_no: fields[7],
                gps_fix: parseInt(fields[8]) === 1,
                date: fields[9], // DDMMYYYY
                time: fields[10], // HHMMSS
                latitude: parseFloat(fields[11]),
                latitude_dir: fields[12],
                longitude: parseFloat(fields[13]),
                longitude_dir: fields[14],
                speed: parseFloat(fields[15]),
                heading: parseFloat(fields[16]),
                satellites: parseInt(fields[17]),
                altitude: parseFloat(fields[18]),
                pdop: parseFloat(fields[19]),
                hdop: parseFloat(fields[20]),
                operator_name: fields[21],
                ignition: parseInt(fields[22]) === 1,
                main_power: parseInt(fields[23]) === 1,
                main_voltage: parseFloat(fields[24]),
                battery_voltage: parseFloat(fields[25]),
                emergency_status: parseInt(fields[26]) === 1,
                tamper_alert: fields[27],
                gsm_signal: parseInt(fields[28]),
                mcc: parseInt(fields[29]),
                mnc: parseInt(fields[30]),
                lac: fields[31],
                cell_id: fields[32],
                // NMR data (fields 33-44)
                digital_inputs: fields[45],
                digital_outputs: fields[46],
                analog_input_1: parseFloat(fields[47]),
                analog_input_2: parseFloat(fields[48]),
                frame_number: fields[49],
                odometer: parseFloat(fields[50]),
                // Misc fields and debug info would follow
                checksum: fields[fields.length - 2],
                end_char: fields[fields.length - 1]
            }
        };
    }

    parseAis140AlertPacket(data) {
        const fields = data.split(',');
        
        return {
            protocol: "AIS_140",
            packet_type: "alert",
            timestamp: new Date().toISOString(),
            raw_data: data,
            parsed_data: {
                header: fields[0], // $ALT
                vendor_id: fields[1],
                software_version: fields[2],
                packet_type: fields[3],
                alert_id: parseInt(fields[4]),
                alert_description: this.ais140AlertMessages[parseInt(fields[4])] || "Unknown",
                packet_status: fields[5],
                imei: fields[6],
                vehicle_reg_no: fields[7],
                // Similar structure as location packet...
                gps_fix: parseInt(fields[8]) === 1,
                date: fields[9],
                time: fields[10],
                latitude: parseFloat(fields[11]),
                latitude_dir: fields[12],
                longitude: parseFloat(fields[13]),
                longitude_dir: fields[14],
                // ... rest of the fields
            }
        };
    }

    parseAis140HealthPacket(data) {
        const fields = data.split(',');
        
        return {
            protocol: "AIS_140",
            packet_type: "health",
            timestamp: new Date().toISOString(),
            raw_data: data,
            parsed_data: {
                header: fields[0], // $HLM
                vendor_id: fields[1],
                software_version: fields[2],
                imei: fields[3],
                battery_percentage: parseInt(fields[4]),
                low_battery_threshold: parseInt(fields[5]),
                memory_percentage: parseFloat(fields[6]),
                ignition_on_rate: parseInt(fields[7]),
                ignition_off_rate: parseInt(fields[8]),
                digital_inputs: fields[9],
                analog_inputs: fields[10],
                end_char: fields[11]
            }
        };
    }

    // Helper functions (same as before)
    formatDateTime(dateStr, timeStr) {
        try {
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

    parseNeighborCells(neighborFields) {
        const neighbors = [];
        
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
