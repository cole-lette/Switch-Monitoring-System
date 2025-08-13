const mqtt = require('mqtt');

// MQTT broker URL and options
const brokerUrl = 'mqtt://broker.emqx.io:1883'; // Replace with your broker URL if needed
const options = {
    clientId: 'nodejs_backend_' + Math.random().toString(16).substr(2, 8),
    clean: true,
    connectTimeout: 4000,
    // username: 'your_username',
    // password: 'your_password',
};

// Topics grouped by category
const TOPICS = {
    SCAN: {
        REQUEST: 'modbus/scan/request',
        RESULT: 'modbus/scan/result',
    },
    DEVICEINFO: {
        REQUEST: 'modbus/deviceinfo/request',
        RESULT: 'modbus/deviceinfo/result',
    },
    READPARAMS: {
        REQUEST: 'modbus/readparams/request',
        RESULT: 'modbus/readparams/result',
    }
};

// Connect to MQTT broker
const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
    console.log('✅ Connected to MQTT broker');

    // Subscribe to result/response topics
    client.subscribe([
        TOPICS.SCAN.RESULT,
        TOPICS.DEVICEINFO.RESULT,
        TOPICS.READPARAMS.RESULT,
    ], (err) => {
        if (err) {
            console.error('❌ Failed to subscribe:', err);
        } else {
            console.log('📡 Subscribed to topics:', [
                TOPICS.SCAN.RESULT,
                TOPICS.DEVICEINFO.RESULT,
                TOPICS.READPARAMS.RESULT
            ]);
        }
    });

    // Send scan request as a demo
    sendScanRequest();
});

client.on('error', (err) => {
    console.error('❌ Connection error:', err);
    client.end();
});

client.on('message', (topic, message) => {
    const msgStr = message.toString();
    console.log(`📥 Received message on topic '${topic}': ${msgStr}`);

    try {
        const data = JSON.parse(msgStr);
        handleMessage(topic, data);
    } catch (e) {
        console.error('❌ Failed to parse JSON message:', e);
    }
});

// Send a Modbus scan request
function sendScanRequest() {
    const payload = {
        request: 'scanDevices',
    };
    client.publish(TOPICS.SCAN.REQUEST, JSON.stringify(payload), { qos: 1 }, (err) => {
        if (err) {
            console.error('❌ Failed to publish scan request:', err);
        } else {
            console.log('📤 Scan request sent');
        }
    });
}

// Send a device info request
function requestDeviceInfo(deviceId) {
    const payload = { device_id: deviceId };
    client.publish(TOPICS.DEVICEINFO.REQUEST, JSON.stringify(payload), { qos: 1 });
    console.log(`📤 Requested device info for device ${deviceId}`);
}

// Send a read parameters request
function requestReadParams(deviceId) {
    const payload = { device_id: deviceId };
    client.publish(TOPICS.READPARAMS.REQUEST, JSON.stringify(payload), { qos: 1 });
    console.log(`📤 Requested read parameters for device ${deviceId}`);
}

// Handle incoming messages by topic
function handleMessage(topic, data) {
    switch (topic) {
        case TOPICS.SCAN.RESULT:
            console.log('🔍 Scan Result:', data);
            if (data.address) {
                requestDeviceInfo(data.address);
            }
            break;

        case TOPICS.DEVICEINFO.RESULT:
            console.log('📄 Device Info:', data);
            if (data.address) {
                requestReadParams(data.address);
            }
            break;

        case TOPICS.READPARAMS.RESULT:
            console.log('📊 Device Parameters:', data);
            // Store or forward to frontend/database here
            break;

        default:
            console.log('⚠️ Unhandled topic:', topic);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('👋 Disconnecting MQTT client');
    client.end(() => process.exit(0));
});

