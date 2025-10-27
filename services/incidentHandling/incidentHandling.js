import Incident from "../../models/incidentModel.js";


export async function createIncident(req,res) {
    try {
        const { vehicle, event, messageid } = req.body;

        const newIncident = await Incident.create({
            vehicle,
            event,
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