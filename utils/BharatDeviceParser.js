
export default class UnifiedDeviceParser {
    constructor() {
        // Alert messages for both protocols
        this.bharatAlertMessages = {
            1: "Location Update",
            2: "Location Update (history)",
            3: "Alert Disconnected from main battery",
            4: "Alert Low battery",
            5: "Alert Low battery removed",
            6: "Alert Connected back to main battery",
            7: "Alert Ignition ON",
            8: "Alert Ignition OFF",
            9: "Alert GPS box opened",
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

    // Helper method to get current Indian Standard Time (IST)
    getISTTime() {
        const now = new Date();
        // IST is UTC+5:30
        const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
        const istTime = new Date(now.getTime() + istOffset);
        return istTime.toISOString();
    }

    parseDeviceData(rawData) {
        try {
            console.log('Parsing raw data:', rawData);
            
            const cleanData = rawData.trim();
            const protocol = this.detectProtocol(cleanData);
            console.log('Detected protocol...................:', protocol);
            
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
        } else if (data.includes('$Header').length<=16) {
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
        } else if (data.includes('$Header')) {
            return this.parseBharatHealthPacket(data);
        }
        return null;
    }

    parseBharatTrackingPacket(data) {
        const fields = data.split(',');
        if (fields.length < 13) {
            return this.parseBharatLoginPacket(data);   
        } else if(fields.length < 17) {
            return this.parseBharatHealthPacket(data);
        }
        
        const lastField = fields[51] || '';
        let opt = "()";
        let checksum = null;
        
        if (lastField.includes('*')) {
            const parts = lastField.split('*');
            opt = parts[0] || "()";
            checksum = parts[1] || null;
        } else {
            opt = lastField || "()";
        }
        
        return {
            protocol: "BHARAT_101",
            packet_type: "tracking",
            timestamp: this.getISTTime(), // Changed to IST
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
            latitude: parseFloat(fields[11]), // 8
            latitude_dir: fields[12], // 1.2
            longitude: parseFloat(fields[13]), // 0.8
            longitude_dir: fields[14], // 12.9876
            speed_kmh: parseFloat(fields[15]), // N
            heading: parseInt(fields[16]), // 77.5946
            satellites: parseInt(fields[17]), // E
            altitude_m: parseFloat(fields[18]), // 45.5
            pdop: parseFloat(fields[19]), // 180
            hdop: parseFloat(fields[20]), // 545.2
            
            // Vehicle status
            operator_name: fields[21], // 1
            ignition: parseInt(fields[22]) === 1, // 1
            main_power: parseInt(fields[23]) === 1, // 12.8
            main_voltage: parseFloat(fields[24]), // 4.2
            battery_voltage: parseFloat(fields[25]), // 0
            emergency_status: parseInt(fields[26]) === 1, // 0
            tamper_alert: fields[27], // C
            
            // Network information
            gsm_signal: parseInt(fields[28]), // Airtel
            mcc: parseInt(fields[29]), // 404
            mnc: parseInt(fields[30]), // 45
            lac: fields[31], // 1A2B
            cell_id: fields[32], // 3C4D
            
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
            ota_response: opt || null,
            checksum: checksum || null
        };
    }

    parseBharatEmergencyPacket(data) {    
        const fields = data.split(',');
        
        const lastField = fields[15] || '';
        let emergency_contact = lastField;
        let checksum = null;
        
        if (lastField.includes('*')) {
            const parts = lastField.split('*');
            emergency_contact = parts[0] || "()";
            checksum = parts[1] || null;
        } else {
            emergency_contact = lastField;
        }
        
        return {
            protocol: "BHARAT_101",
            packet_type: "emergency",
            timestamp: this.getISTTime(), // Changed to IST
            raw_data: data,
            
            // Flat structure matching your schema
            header: fields[0], // $EPB
            message_type: fields[1], // EMR or SEM
            device_id: fields[2], // IMEI (864495034476850)
            packet_status: fields[3], // NM=Normal, SP=Stored
            datetime: fields[4], // DDMMYYYYHHMMSS (02022019093817)
            gps_validity: fields[5], // A=Valid, V=Invalid
            latitude: parseFloat(fields[6]) || 0, // 12.976358
            latitude_dir: fields[7] || 'N', // N
            longitude: parseFloat(fields[8]) || 0, // 77.549919
            longitude_dir: fields[9] || 'E', // E
            altitude: parseFloat(fields[10]) || 0, // 910.0
            speed: parseFloat(fields[11]) || 0, // 0.0
            distance: parseInt(fields[12]) || 0, // 2
            provider: fields[13] || 'G', // G=GPS, N=Network
            vehicle_reg_no: fields[14] || '', // KA01G1234
            emergency_contact: emergency_contact || '', // +9164061023
            checksum: checksum || null // *4B
        };
    }

    parseBharatHealthPacket(data) {
        const fields = data.split(',');
        
        const lastField = fields[12] || '';
        let input_2 = 0;
        let checksum = null;
        
        if (lastField.includes('*')) {
            const parts = lastField.split('*');
            input_2 = parts[0] || "()";
            checksum = parts[1] || null;
        } else {
            input_2 = parseFloat(lastField) || 0;
        }

        return {
            protocol: "BHARAT_101",
            packet_type: "health",
            timestamp: this.getISTTime(), // Changed to IST
            raw_data: data,
            
            // Flat structure matching your schema needs
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
            analog_input_2: parseFloat(input_2) || 0,
            checksum: checksum || null
        };
    }

    parseBharatLoginPacket(data) {
        const fields = data.split(',');
        
        // Parse the last field "E*1C" into components
        const lastField = fields[9] || '';
        let longitude_dir = 'E';
        let checksum_separator = '*';
        let checksum = null;
        
        if (lastField.includes('*')) {
            const parts = lastField.split('*');
            longitude_dir = parts[0] || 'E';
            checksum_separator = '*';
            checksum = parts[1] || null;
        } else {
            longitude_dir = lastField || 'E';
        }
        
        return {
            protocol: "BHARAT_101",
            packet_type: "login",
            timestamp: this.getISTTime(), // Changed to IST
            raw_data: data,
            
            start_character: '$',
            header: fields[0].replace('$', ''), // Remove $ to get just "Header"
            vendor_id: fields[1] || '',
            vehicle_reg_no: fields[2] || '',
            imei: fields[3] || '',
            firmware_version: fields[4] || '',
            protocol_version: fields[5] || '',
            latitude: parseFloat(fields[6]) || 0,
            latitude_dir: fields[7] || 'N',
            longitude: parseFloat(fields[8]) || 0,
            longitude_dir: longitude_dir,
            checksum_separator: checksum_separator,
            checksum: checksum
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
            timestamp: this.getISTTime(), // Changed to IST
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
            timestamp: this.getISTTime(), // Changed to IST
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
            timestamp: this.getISTTime(), // Changed to IST
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
            timestamp: this.getISTTime(), // Changed to IST
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
