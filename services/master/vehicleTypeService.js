import VehicleType from "../../models/vehicleTypeModel.js";


// GET ALL VEHICLE TYPES
export const getVehicleTypes = async (req, res) => {
    
    try {
        const vehicleTypes = await VehicleType.find({});
        
        if (!vehicleTypes||vehicleTypes.length === 0) {
            return res.status(404).json({
                message: "Vehicle Types Not Found",
            });
        }
        
        return res.status(200).json({
            message: "Vehicle Types Retrieved Successfully",
            data: vehicleTypes
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// GET SINGLE VEHICLE TYPE BY ID
export const getVehicleType = async (req, res) => {
    const { id } = req.params;

    try {
        const vehicleType = await VehicleType.findById(id);
        
        if (!vehicleType) {
            return res.status(404).json({
                message: "Vehicle Type Not Found",
            });
        }
        
        return res.status(200).json({
            message: "Vehicle Type Retrieved Successfully",
            data: vehicleType
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// ADD NEW VEHICLE TYPE
export const addVehicleType = async (req, res) => {
    const { make, vehicleType } = req.body;
    
   
    
    if (!make || !vehicleType) {
        return res.status(400).json({
            message: "All details Required"
        });
    }
    
    try {
        // Check if combination already exists
        const existingVehicleType = await VehicleType.findOne({
            make: make.toUpperCase(),
            vehicleType: vehicleType.toUpperCase()
        });
        
        if (existingVehicleType) {
            return res.status(409).json({
                message: "Vehicle Type with this Make already exists"
            });
        }
        
        const newVehicleType = await VehicleType.create({
            make,
            vehicleType
        });
        
        if (!newVehicleType) {
            return res.status(500).json({
                message: "Something went Wrong while Creating Vehicle Type"
            });
        }
        
        return res.status(201).json({
            message: "Vehicle Type Created Successfully",
            data: newVehicleType
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// UPDATE VEHICLE TYPE
export const updateVehicleType = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    const { make, vehicleType } = req.body;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    if (!make || !vehicleType) {
        return res.status(400).json({
            message: "All details Required"
        });
    }
    
    try {
        // Check if combination already exists (excluding current record)
        const existingVehicleType = await VehicleType.findOne({
            _id: { $ne: id },
            make: make.toUpperCase(),
            vehicleType: vehicleType.toUpperCase()
        });
        
        if (existingVehicleType) {
            return res.status(409).json({
                message: "Vehicle Type with this Make already exists"
            });
        }
        
        const updatedVehicleType = await VehicleType.findByIdAndUpdate(
            id,
            { make, vehicleType },
            { new: true, runValidators: true }
        );
        
        if (!updatedVehicleType) {
            return res.status(404).json({
                message: "Vehicle Type Not Found"
            });
        }
        
        return res.status(200).json({
            message: "Vehicle Type Updated Successfully",
            data: updatedVehicleType
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// DELETE VEHICLE TYPE
export const deleteVehicleType = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    try {
        const vehicleType = await VehicleType.findByIdAndDelete(id);
        
        if (!vehicleType) {
            return res.status(404).json({
                message: "Vehicle Type Not Found"
            });
        }
        
        return res.status(200).json({
            message: "Vehicle Type Deleted Successfully",
            data: vehicleType
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// GET VEHICLE TYPES BY MAKE
export const getVehicleTypesByMake = async (req, res) => {
    const user = req.user;
    const { make } = req.params;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
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
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
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
