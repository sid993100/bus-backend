import Incident from "../../../models/incidentModel.js";

// GET ALL IncidentS
export const getIncidents = async (req, res) => {
    const user = req.user;
    
    try {
        const Incidents = await Incident.find({}).sort({ dateTime: -1 });
        
        if (!Incidents) {
            return res.status(404).json({
                message: "Incidents Not Found",
            });
        }
        
        return res.status(200).json({
            message: "Incidents Retrieved Successfully",
            data: Incidents
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// GET SINGLE Incident BY ID
export const getIncident = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    
    
    try {
        const Incident = await Incident.findById(id);
        
        if (!Incident) {
            return res.status(404).json({
                message: "Incident Not Found",
            });
        }
        
        return res.status(200).json({
            message: "Incident Retrieved Successfully",
            data: Incident
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// ADD NEW Incident
export const addIncident = async (req, res) => {

    const {
        vehicle,
        dateTime,
        depotOrCustomer,
        zoneOrRegion,
        IncidentDescription,
        IncidentStatus,
        creationDate
    } = req.body;

    
    if (!vehicle ||
        !dateTime ||
        !depotOrCustomer ||
        !zoneOrRegion ||
        !IncidentDescription ||
        !IncidentStatus ||
        !creationDate) {
        return res.status(400).json({
            message: "All details Required"
        });
    }
    
    try {
        const Incident = await Incident.create({
            vehicle,
            dateTime,
            depotOrCustomer,
            zoneOrRegion,
            IncidentDescription,
            IncidentStatus,
            creationDate
        });
        
        if (!Incident) {
            return res.status(500).json({
                message: "Something went Wrong while Creating An Incident"
            });
        }
        
        return res.status(201).json({
            message: "Incident Created Successfully",
            data: Incident
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// UPDATE Incident
export const updateIncident = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    const {
        vehicle,
        dateTime,
        depotOrCustomer,
        zoneOrRegion,
        IncidentDescription,
        IncidentStatus
    } = req.body;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    if (!vehicle ||
        !dateTime ||
        !depotOrCustomer ||
        !zoneOrRegion ||
        !IncidentDescription ||
        !IncidentStatus) {
        return res.status(400).json({
            message: "All details Required"
        });
    }
    
    try {
        const Incident = await Incident.findByIdAndUpdate(
            id,
            {
                vehicle,
                dateTime,
                depotOrCustomer,
                zoneOrRegion,
                IncidentDescription,
                IncidentStatus
            },
            { new: true, runValidators: true }
        );
        
        if (!Incident) {
            return res.status(404).json({
                message: "Incident Not Found"
            });
        }
        
        return res.status(200).json({
            message: "Incident Updated Successfully",
            data: Incident
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// DELETE Incident
export const deleteIncident = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    try {
        const Incident = await Incident.findByIdAndDelete(id);
        
        if (!Incident) {
            return res.status(404).json({
                message: "Incident Not Found"
            });
        }
        
        return res.status(200).json({
            message: "Incident Deleted Successfully",
            data: Incident
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// GET IncidentS BY VEHICLE
export const getIncidentsByVehicle = async (req, res) => {
    const user = req.user;
    const { vehicleNumber } = req.params;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    try {
        const Incidents = await Incident.find({ vehicle: vehicleNumber })
            .sort({ dateTime: -1 });
        
        if (!Incidents || Incidents.length === 0) {
            return res.status(404).json({
                message: "No Incidents Found for this Vehicle"
            });
        }
        
        return res.status(200).json({
            message: "Incidents Retrieved Successfully",
            data: Incidents,
            count: Incidents.length
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// GET IncidentS BY STATUS
export const getIncidentsByStatus = async (req, res) => {
    const user = req.user;
    const { status } = req.params;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    try {
        const Incidents = await Incident.find({ IncidentStatus: status })
            .sort({ dateTime: -1 });
        
        if (!Incidents || Incidents.length === 0) {
            return res.status(404).json({
                message: `No ${status} Incidents Found`
            });
        }
        
        return res.status(200).json({
            message: "Incidents Retrieved Successfully",
            data: Incidents,
            count: Incidents.length
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// GET IncidentS STATISTICS
export const getIncidentStats = async (req, res) => {
    const user = req.user;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    try {
        const totalIncidents = await Incident.countDocuments();
        const openIncidents = await Incident.countDocuments({ IncidentStatus: 'Open' });
        const closedIncidents = await Incident.countDocuments({ IncidentStatus: 'Closed' });
        const pendingIncidents = await Incident.countDocuments({ IncidentStatus: 'Pending' });
        
        const stats = {
            totalIncidents,
            openIncidents,
            closedIncidents,
            pendingIncidents
        };
        
        return res.status(200).json({
            message: "Statistics Retrieved Successfully",
            data: stats
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};
