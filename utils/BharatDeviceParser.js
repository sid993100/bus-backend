import axios from "axios";

export default class UnifiedDeviceParser {
    constructor() {
        // API configuration
        this.API_BASE_URL = process.env.MY_AXIOS_URL||"http://localhost:5000";
        this.API_TIMEOUT = 10000;

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

    // Save parsed data to API
    async saveToAPI(parsedData) {
        try {
            const { packet_type } = parsedData;
            let endpoint = '';

            // Determine API endpoint based on packet type
            switch (packet_type) {
                case 'login':
                    endpoint = '/api/tracking/login';
                    break;
                case 'tracking':
                case 'location':
                    endpoint = '/api/tracking/track';
                    break;
                case 'health':
                    endpoint = '/api/tracking/health';
                    break;
                case 'emergency':
                    endpoint = '/api/tracking/emergency';
                    break;
                default:
                    console.warn(`⚠️ Unknown packet type: ${packet_type}`);
                    return null;
            }

            const response = await axios.post(`${this.API_BASE_URL}${endpoint}`, parsedData, {
                timeout: this.API_TIMEOUT,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(`✅ Successfully saved ${packet_type} data to API (Status: ${response.status})`);
            return response.data;

        } catch (error) {
            console.error(`❌ Failed to save ${parsedData.packet_type} to API:`, error.message);
            return null;
        }
    }

    async parseDeviceData(rawData) {
        try {
            const cleanData = rawData.trim();
            const protocol = this.detectProtocol(cleanData);
            
            let parsedData = null;
            
            switch(protocol) {
                case 'BHARAT_101':
                    parsedData = await this.parseBharatPacket(cleanData);
                    break;
                case 'AIS_140':
                    parsedData = await this.parseAis140Packet(cleanData);
                    break;
                default:
                    console.warn('Unknown protocol detected');
                    return null;
            }

            // Automatically save to API if parsing was successful
            if (parsedData) {
                const savedData = await this.saveToAPI(parsedData);
                // Add save status to parsed data
                parsedData.apiSaveStatus = savedData ? 'success' : 'failed';
                parsedData.savedAt = new Date().toISOString();
            }

            return parsedData;
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
    async parseBharatPacket(data) {
        if (data.startsWith('$Header')) {
            return await this.parseBharatTrackingPacket(data);
        } else if (data.startsWith('$EPB')) {
            return await this.parseBharatEmergencyPacket(data);
        } else if (data.startsWith('$$')) {
            return await this.parseBharatSerialPacket(data);
        } else if (data.includes('HP')) {
            return await this.parseBharatHealthPacket(data);
        }
        return null;
    }

    async parseBharatTrackingPacket(data) {
        const fields = data.split(',');
        
        const parsedData = {
            protocol: "BHARAT_101",
            packet_type: "tracking",
            timestamp: new Date().toISOString(),
            raw_data: data,
            // Header fields
            header: fields[0], // $Header
            vendor_id: fields[1], // BHARTI
            firmware_version: fields[2], // 1.0
            message_type: fields[3], // 1
            message_id: parseInt(fields[4]), // 7
            message_description: this.bharatAlertMessages[parseInt(fields[4])] || "Unknown",
            packet_status: fields[5], // L
            
            // Device information
            imei: fields[6], // 867584032108765
            vehicle_reg_no: fields[7], // KA01AB1234
            
            // GPS information
            fix_status: parseInt(fields[8]) === 1, // 1
            date: fields[9], // 15032024
            time: fields[10], // 143052
            formatted_datetime: this.formatDateTime(fields[9], fields[10]),
            latitude: parseFloat(fields[11]) || 0, // 8
            latitude_dir: fields[12] || 'N', // 1.2
            longitude: parseFloat(fields[13]) || 0, // 0.8
            longitude_dir: fields[14] || 'E', // 12.9876
            speed_kmh: parseFloat(fields[15]) || 0, // N
            heading: parseInt(fields[16]) || 0, // 77.5946
            satellites: parseInt(fields[17]) || 0, // E
            altitude_m: parseFloat(fields[18]) || 0, // 45.5
            pdop: parseFloat(fields[19]) || 0, // 180
            hdop: parseFloat(fields[20]) || 0, // 545.2
            
            // Vehicle status
            operator_name: fields[21] || '', // 1
            ignition: parseInt(fields[22]) === 1, // 1
            main_power: parseInt(fields[23]) === 1, // 12.8
            main_voltage: parseFloat(fields[24]) || 0, // 4.2
            battery_voltage: parseFloat(fields[25]) || 0, // 0
            emergency_status: parseInt(fields[26]) === 1, // 0
            tamper_alert: fields[27] || 'C', // C
            
            // Network information
            gsm_signal: parseInt(fields[28]) || 0, // Airtel
            mcc: parseInt(fields[29]) || 0, // 404
            mnc: parseInt(fields[30]) || 0, // 45
            lac: fields[31] || '', // 1A2B
            cell_id: fields[32] || '', // 3C4D
            
            // Neighbor cells (flattened)
            neighbor_cell_1_signal: parseInt(fields[33]) || 0, // 20
            neighbor_cell_1_lac: fields[34] || '', // 2E3F
            neighbor_cell_1_cell_id: fields[35] || '', // 4G5H
            neighbor_cell_2_signal: parseInt(fields[36]) || 0, // 18
            neighbor_cell_2_lac: fields[37] || '', // 6I7J
            neighbor_cell_2_cell_id: fields[38] || '', // 8K9L
            neighbor_cell_3_signal: parseInt(fields[39]) || 0, // 15
            neighbor_cell_3_lac: fields[40] || '', // AA1B
            neighbor_cell_3_cell_id: fields[41] || '', // CC2D
            neighbor_cell_4_signal: parseInt(fields[42]) || 0, // 1010
            neighbor_cell_4_lac: fields[43] || '', // 1100
            neighbor_cell_4_cell_id: fields[44] || '', // 5.2
            
            // IO status
            digital_inputs: fields[45] || '0000', // 3.8
            digital_outputs: fields[46] || '00', // 001
            frame_number: fields[47] || '0', // 150
            analog_input_1: parseFloat(fields[48]) || 0, // Handle NaN
            analog_input_2: parseFloat(fields[49]) || 0, // Handle NaN
            
            // Additional information
            delta_distance: fields[50] || '0', // Provide default
            ota_response: fields[51] || null,
            checksum: fields[52] || null
        };

        return parsedData;
    }

    async parseBharatEmergencyPacket(data) {    
        const fields = data.split(',');
        
        return {
            protocol: "BHARAT_101",
            packet_type: "emergency",
            timestamp: new Date().toISOString(),
            raw_data: data,
            header: fields[0], // $EPB
            message_type: fields[1], // EMR or SEM
            device_id: fields[2], // IMEI
            packet_status: fields[3], // NM=Normal, SP=Stored
            datetime: fields[4], // DDMMYYYYHHMMSS
            gps_validity: fields[5], // A=Valid, V=Invalid
            latitude: parseFloat(fields[6]) || 0,
            latitude_dir: fields[7] || 'N',
            longitude: parseFloat(fields[8]) || 0,
            longitude_dir: fields[9] || 'E',
            altitude: parseFloat(fields[10]) || 0,
            speed: parseFloat(fields[11]) || 0,
            distance: parseInt(fields[12]) || 0,
            provider: fields[13] || 'G', // G=GPS, N=Network
            vehicle_reg_no: fields[14] || '',
            emergency_contact: fields[15] || '',
            checksum: fields[16] || null
        };
    }

    async parseBharatHealthPacket(data) {
        const fields = data.split(',');
        
        return {
            protocol: "BHARAT_101",
            packet_type: "health",
            timestamp: new Date().toISOString(),
            raw_data: data,
            header: fields[0], // $Header
            vendor_id: fields[1], // iTriangle
            firmware_version: fields[2], // 1_36T02B0164MAIS_6
            imei: fields[3], // IMEI
            battery_percentage: parseInt(fields[4]) || 0,
            low_battery_threshold: parseInt(fields[5]) || 0,
            server1_memory_percentage: parseFloat(fields[6]) || 0,
            server2_memory_percentage: parseFloat(fields[7]) || 0,
            ignition_on_interval: parseInt(fields[8]) || 0,
            ignition_off_interval: parseInt(fields[9]) || 0,
            digital_inputs: fields[10] || '0000',
            analog_input_1: parseFloat(fields[11]) || 0,
            analog_input_2: parseFloat(fields[12]) || 0,
            checksum: fields[13] || null
        };
    }

    async parseBharatSerialPacket(data) {
        const fields = data.split(',');
        
        return {
            protocol: "BHARAT_101",
            packet_type: "serial",
            timestamp: new Date().toISOString(),
            raw_data: data,
            client_id: fields[0].substring(2), // Remove $$
            imei: fields[1] || '',
            event_code: parseInt(fields[2]) || 0,
            latitude: parseFloat(fields[3]) || 0,
            longitude: parseFloat(fields[4]) || 0,
            datetime: fields[5] || '', // YYMMDDHHMMSS
            gps_status: fields[6] || 'V', // A/V
            serial_device_type: parseInt(fields[7]) || 0,
            serial_data: fields[8] || '',
            ignition_status: fields[9] ? parseInt(fields[9]) : null,
            speed: fields[10] ? parseFloat(fields[10]) : null,
            main_power_voltage: fields[11] ? parseFloat(fields[11]) : null,
            checksum: fields[12] || null
        };
    }

    // AIS-140 Protocol Parsers
    async parseAis140Packet(data) {
        if (data.startsWith('$LGN')) {
            return await this.parseAis140LoginPacket(data);
        } else if (data.startsWith('$NRM')) {
            return await this.parseAis140LocationPacket(data);
        } else if (data.startsWith('$ALT')) {
            return await this.parseAis140AlertPacket(data);
        } else if (data.startsWith('$HLM')) {
            return await this.parseAis140HealthPacket(data);
        }
        return null;
    }

    async parseAis140LoginPacket(data) {
        const fields = data.split(',');
        
        return {
            protocol: "AIS_140",
            packet_type: "login",
            timestamp: new Date().toISOString(),
            raw_data: data,
            header: fields[0], // $LGN
            device_name: fields[1] || '', // Vehicle Registration
            imei: fields[2] || '', // Device IMEI
            software_version: fields[3] || '', // Software version
            latitude: parseFloat(fields[4]) || 0,
            latitude_dir: fields[5] || 'N',
            longitude: parseFloat(fields[6]) || 0,
            longitude_dir: fields[7] || 'E'
        };
    }

    async parseAis140LocationPacket(data) {
        const fields = data.split(',');
        
        return {
            protocol: "AIS_140",
            packet_type: "location",
            timestamp: new Date().toISOString(),
            raw_data: data,
            header: fields[0], // $NRM
            vendor_id: fields[1] || '',
            software_version: fields[2] || '',
            packet_type: fields[3] || '',
            alert_id: parseInt(fields[4]) || 0,
            packet_status: fields[5] || 'L', // L/H
            imei: fields[6] || '',
            vehicle_reg_no: fields[7] || '',
            gps_fix: parseInt(fields[8]) === 1,
            date: fields[9] || '', // DDMMYYYY
            time: fields[10] || '', // HHMMSS
            latitude: parseFloat(fields[11]) || 0,
            latitude_dir: fields[12] || 'N',
            longitude: parseFloat(fields[13]) || 0,
            longitude_dir: fields[14] || 'E',
            speed: parseFloat(fields[15]) || 0,
            heading: parseFloat(fields[16]) || 0,
            satellites: parseInt(fields[17]) || 0,
            altitude: parseFloat(fields[18]) || 0,
            pdop: parseFloat(fields[19]) || 0,
            hdop: parseFloat(fields[20]) || 0,
            operator_name: fields[21] || '',
            ignition: parseInt(fields[22]) === 1,
            main_power: parseInt(fields[23]) === 1,
            main_voltage: parseFloat(fields[24]) || 0,
            battery_voltage: parseFloat(fields[25]) || 0,
            emergency_status: parseInt(fields[26]) === 1,
            tamper_alert: fields[27] || 'C',
            gsm_signal: parseInt(fields[28]) || 0,
            mcc: parseInt(fields[29]) || 0,
            mnc: parseInt(fields[30]) || 0,
            lac: fields[31] || '',
            cell_id: fields[32] || '',
            digital_inputs: fields[45] || '0000',
            digital_outputs: fields[46] || '00',
            analog_input_1: parseFloat(fields[47]) || 0,
            analog_input_2: parseFloat(fields[48]) || 0,
            frame_number: fields[49] || '0',
            odometer: parseFloat(fields[50]) || 0,
            checksum: fields[fields.length - 2] || '',
            end_char: fields[fields.length - 1] || ''
        };
    }

    async parseAis140AlertPacket(data) {
        const fields = data.split(',');
        
        return {
            protocol: "AIS_140",
            packet_type: "alert",
            timestamp: new Date().toISOString(),
            raw_data: data,
            header: fields[0], // $ALT
            vendor_id: fields[1] || '',
            software_version: fields[2] || '',
            packet_type: fields[3] || '',
            alert_id: parseInt(fields[4]) || 0,
            alert_description: this.ais140AlertMessages[parseInt(fields[4])] || "Unknown",
            packet_status: fields[5] || 'L',
            imei: fields[6] || '',
            vehicle_reg_no: fields[7] || '',
            gps_fix: parseInt(fields[8]) === 1,
            date: fields[9] || '',
            time: fields[10] || '',
            latitude: parseFloat(fields[11]) || 0,
            latitude_dir: fields[12] || 'N',
            longitude: parseFloat(fields[13]) || 0,
            longitude_dir: fields[14] || 'E'
        };
    }

    async parseAis140HealthPacket(data) {
        const fields = data.split(',');
        
        return {
            protocol: "AIS_140",
            packet_type: "health",
            timestamp: new Date().toISOString(),
            raw_data: data,
            header: fields[0], // $HLM
            vendor_id: fields[1] || '',
            software_version: fields[2] || '',
            imei: fields[3] || '',
            battery_percentage: parseInt(fields[4]) || 0,
            low_battery_threshold: parseInt(fields[5]) || 0,
            memory_percentage: parseFloat(fields[6]) || 0,
            ignition_on_rate: parseInt(fields[7]) || 0,
            ignition_off_rate: parseInt(fields[8]) || 0,
            digital_inputs: fields[9] || '0000',
            analog_inputs: fields[10] || '00',
            end_char: fields[11] || ''
        };
    }

    // Helper functions
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
