import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

export async function getAllDashboardData(req, res) {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const modelsDir = path.join(__dirname, '../models');

        const files = await fs.readdir(modelsDir);
        const counts = {};

        // blacklist: do not count these packet models
        const blacklist = new Set([
            'healthMonitoringPacketModel',
            'trackingPacketModel',
            'loginPacketModel',
            'passengerBookingmodel'  // Add this line to fix the error
        ]);

        for (const file of files) {
            if (!file.endsWith('.js')) continue;
            const modelName = path.basename(file, '.js');
            if (blacklist.has(modelName)) {
                continue;
            }
            try {
                const modulePath = path.join(modelsDir, file);
                const moduleUrl = pathToFileURL(modulePath).href;
                const mod = await import(moduleUrl);
                const Model = mod.default || Object.values(mod).find(v => v && v.modelName);
                if (!Model || typeof Model.countDocuments !== 'function') {
                    // not a mongoose model
                    continue;
                }

                try {
                    counts[modelName] = await Model.countDocuments();
                } catch (cErr) {
                    counts[modelName] = null;
                }
            } catch (innerErr) {
                console.warn('dashboard: failed processing model file', file, innerErr && innerErr.message);
            }
        }

        return res.status(200).json({ success: true, data: { counts } });
    } catch (error) {
        console.error('getAllDashboardData error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch dashboard data', error: error?.message || error });
    }
}
