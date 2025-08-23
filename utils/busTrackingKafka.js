import { Kafka } from 'kafkajs';
import BharatDeviceParser from './BharatDeviceParser.js';
import dotenv from 'dotenv';    

dotenv.config();

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092'; 

console.log("KAFKA_BROKER:", KAFKA_BROKER);

export default class BusTrackingKafkaProcessor {


    constructor() {
        this.parser = new BharatDeviceParser();
        this.kafka = new Kafka({
            clientId: 'bus-tracking-parser',
            brokers: KAFKA_BROKER
        });
        
        this.consumer = this.kafka.consumer({ groupId: 'device-parser-group' });
        this.producer = this.kafka.producer();
    }

    async initialize() {
        await this.consumer.connect();
        await this.producer.connect();
        
        await this.consumer.subscribe({ 
            topic: 'busTracking',
            fromBeginning: false 
        });
       
        console.log("......................................................",KAFKA_BROKER);
    }

    async processMessages() {
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const rawData = message.value.toString();
                    const parsedData = this.parser.parseDeviceData(rawData);
                    
                    if (parsedData) {
                        // Send to appropriate topic based on packet type
                        const outputTopic = this.getOutputTopic(parsedData.packet_type);
                        
                        console.log(`Processed ${parsedData.packet_type} packet from device: ${parsedData.parsed_data.device_info?.imei || 'unknown'}`);
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                    
                    // Send to error topic
                    await this.producer.send({
                        topic: 'device-parsing-errors',
                        messages: [{
                            value: JSON.stringify({
                                error: error.message,
                                original_data: message.value.toString(),
                                timestamp: new Date().toISOString()
                            })
                        }]
                    });
                }
            }
        });
    }

    getOutputTopic(packetType) {
        const topicMap = {
            'tracking': 'bus-location-updates',
            'emergency': 'bus-emergency-alerts',
            'health': 'device-health-monitoring',
            'serial': 'device-serial-data'
        };
        
        return topicMap[packetType] || 'unknown-packet-type';
    }

    async shutdown() {
        await this.consumer.disconnect();
        await this.producer.disconnect();
    }
}
