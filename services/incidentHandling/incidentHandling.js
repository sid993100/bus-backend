import Incident from "../../models/incidentModel.js";
import DeviceEvent from "../../models/deviceEventModel.js";
import EventCategory from "../../models/eventCategoryModel.js";
import Vehicle from "../../models/vehicleModel.js";


export async function createIncident(req,res) {
    try {
        const { vehicle, messageid,long,lat } = req.body;

        const incidentExists = await Incident.findOne({ vehicle: vehicle.toUpperCase()})
        const event= await DeviceEvent.findOne({messageId:Number(messageid)})
        const vehivleId= await Vehicle.findOne({vehicleNumber:vehicle.toUpperCase()})

        const newIncident = await Incident.create({
            vehicle:vehivleId._id,
            event:event._id,
            long:Number(long),
            lat:Number(lat)
        });
        res.status(201).json({
            success: true,
            message: "Incident created successfully",
            data: newIncident
        });

    } catch (error) {
        console.error("Error creating incident:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create incident",
            error: error.message
        });
    }
}
export async function getIncidents(req, res) {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            vehicleId,
            eventId,
            status,
            severity,
            startDate,
            endDate,
            eventCategoryId
        } = req.query;

        // Parse and validate pagination params
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
        const skip = (pageNum - 1) * limitNum;

        // Build dynamic filter
        const filter = {};

        if (vehicleId && vehicleId.trim() !== '') {
            filter.vehicle = vehicleId.trim();
        }

        if (eventId && eventId.trim() !== '') {
            filter.event = eventId.trim();
        }

        if (status && status.trim() !== '') {
            filter.status = status.trim().toUpperCase();
        }

        if (severity && severity.trim() !== '') {
            filter.severity = severity.trim().toUpperCase();
        }

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }
        if (eventCategoryId && eventCategoryId.trim() !== '') {
            // Find events under the specified category
            const events = await DeviceEvent.find({ eventCategory: eventCategoryId.trim() }).select('_id');
            const eventIds = events.map(event => event._id);
            filter.event = { $in: eventIds };
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute queries in parallel
        const [incidents, total] = await Promise.all([
            Incident.find(filter)
                .populate('vehicle', 'vehicleNumber registrationNumber model')
                .populate('event', 'eventType eventName description')
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Incident.countDocuments(filter)
        ]);

        // Calculate pagination metadata
        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            success: true,
            message: `Retrieved ${incidents.length} incident(s)`,
            data: incidents,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: total,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
            filters: {
                vehicleId: vehicleId || undefined,
                eventId: eventId || undefined,
                status: status || undefined,
                severity: severity || undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            }
        });
    } catch (error) {
        console.error("Error fetching incidents:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch incidents",
            error: error.message
        });
    }
}
export async function setRemarks(req, res) {
    try {
        const { incidentId } = req.params;
        const { remarks } = req.body;   
        const incident = await Incident.findByIdAndUpdate(incidentId,{ remarks, }, { new: true });
        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }
}catch (error) {
        console.error("Error updating incident remarks:", error);
        res.status(500).json({  
            success: false,
            message: "Failed to update incident remarks",
            error: error.message
        });
    }
}

export async function deleteAllIncidents(req,res){
    try {
        const result = await Incident.deleteMany({});
        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} incident(s)`
        });
    } catch (error) {
        console.error("Error deleting incidents:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete incidents",
            error: error.message
        });
    }
}
