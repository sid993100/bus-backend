import VehicleType from "../../models/vehicleTypeModel.js";
import VehicleManufacturer from "../../models/vehiclemanufacturerModel.js";

const populateType = (query) => {
    return query.populate('make', 'make shortName');
};

export const getVehicleTypes = async (req, res) => {
    try {
        const typeQuery = VehicleType.find({}).sort({ make: 1 });
        const vehicleTypes = await populateType(typeQuery);
        
        if (!vehicleTypes) {
            return res.status(404).json({ message: "Vehicle Types Not Found" });
        }
        
        return res.status(200).json({
            message: "Vehicle Types Retrieved Successfully",
            data: vehicleTypes
        });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const addVehicleType = async (req, res) => {
    const { make, vehicleType } = req.body;
    
    if (!make || !vehicleType) {
        return res.status(400).json({ message: "Make and Vehicle Type are required" });
    }
    
    try {
        const foundMake = await VehicleManufacturer.findById(make);
        if (!foundMake) {
            return res.status(404).json({ message: "Vehicle Manufacturer (Make) not found" });
        }

        const existingVehicleType = await VehicleType.findOne({ make, vehicleType });
        if (existingVehicleType) {
            return res.status(409).json({ message: "This Vehicle Type already exists for the selected Make" });
        }
        
        const newVehicleType = new VehicleType({ make, vehicleType });
        await newVehicleType.save();

        const typeQuery = VehicleType.findById(newVehicleType._id);
        const populatedType = await populateType(typeQuery);
        
        return res.status(201).json({
            message: "Vehicle Type Created Successfully",
            data: populatedType
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const updateVehicleType = async (req, res) => {
    const { id } = req.params;
    const { make, vehicleType } = req.body;  
   
    if (!make || !vehicleType) {
        return res.status(400).json({ message: "Make and Vehicle Type are required" });
    }
    
    try {
        const foundMake = await VehicleManufacturer.findById(make);
        if (!foundMake) {
            return res.status(404).json({ message: "Vehicle Manufacturer (Make) not found" });
        }

        const typeQuery = VehicleType.findByIdAndUpdate(id, { make, vehicleType }, { new: true, runValidators: true });
        const updatedVehicleType = await populateType(typeQuery);
        
        if (!updatedVehicleType) {
            return res.status(404).json({ message: "Vehicle Type Not Found" });
        }
        
        return res.status(200).json({
            message: "Vehicle Type Updated Successfully",
            data: updatedVehicleType
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const deleteVehicleType = async (req, res) => {
    const { id } = req.params;
    try {
        const vehicleType = await VehicleType.findByIdAndDelete(id);
        if (!vehicleType) {
            return res.status(404).json({ message: "Vehicle Type Not Found" });
        }
        return res.status(200).json({ message: "Vehicle Type Deleted Successfully", data: vehicleType });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// GET VEHICLE TYPES BY MAKE
export const getVehicleTypesByMake = async (req, res) => {
    const user = req.user;
    const { make } = req.params;
    
    try {
        const vehicleTypes = await VehicleType.find({ 
            make: make.toUpperCase() 
        });
        
        if (!vehicleTypes || vehicleTypes.length === 0) {
            return res.status(404).json({
                message: "No Vehicle Types Found for this Make"
            });
        }
        
        return res.status(200).json({
            message: "Vehicle Types Retrieved Successfully",
            data: vehicleTypes,
            count: vehicleTypes.length
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// GET ALL UNIQUE MAKES
export const getUniqueMakes = async (req, res) => {
    const user = req.user;
    
    try {
        const makes = await VehicleType.distinct("make");
        
        if (!makes || makes.length === 0) {
            return res.status(404).json({
                message: "No Makes Found"
            });
        }
        
        return res.status(200).json({
            message: "Makes Retrieved Successfully",
            data: makes,
            count: makes.length
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};
