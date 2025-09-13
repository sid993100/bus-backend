import TrackingPacket from '../../models/trackingPacketModel.js';

export const latestFirmware = async (req, res) => {
  try {
    const { search } = req.params;

    let query = {};
    if (search) {
      query.$or = [
        { imei: search },
        { vehicle_reg_no: search }
      ];
    }

    const device = await TrackingPacket.findOne(query)
      .sort({ timestamp: -1 });

    if (!device) {
      return res.status(404).json({ error: 'No device found' });
    }

    res.json({
      serialNo: 1,
      imeiNumber: device.imei,
      deviceMake: device.vendor_id || 'iTriangle',
      deviceModel: 'TM100',
      mappedVehicle: device.vehicle_reg_no,
      lastReportedDateTime: new Date(device.timestamp).toLocaleString('en-IN').replace(',', ''),
      firmwareVersion: device.firmware_version || '4GN6065'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
