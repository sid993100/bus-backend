import PisManufacturer from "../../models/pisManufacturerModel.js";
import PisType from "../../models/pisTypeModel.js";


const populateType = (query) => {
    return query.populate('make', 'name shortName');
};

export const getPisTypes = async (req, res) => {
    try {
        const typeQuery = PisType.find({}).sort({ make: 1 });
        const pisTypes = await populateType(typeQuery);
        
        if (!pisTypes) {
            return res.status(404).json({ message: "Pis Types Not Found" });
        }
        
        return res.status(200).json({
            message: "Pis Types Retrieved Successfully",
            data: pisTypes
        });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const addPisType = async (req, res) => {
    const { make, name } = req.body;
    
    if (!make || !name) {
        return res.status(400).json({ message: "Make and Pis Type are required" });
    }
    
    try {
        const foundMake = await PisManufacturer.findById(make);
        if (!foundMake) {
            return res.status(404).json({ message: "Pis Manufacturer (Make) not found" });
        }

        const existingPisType = await PisType.findOne({ make, name });
        if (existingPisType) {
            return res.status(409).json({ message: "This Pis Type already exists for the selected Make" });
        }
        
        const newPisType = new PisType({ make, name });
        await newPisType.save();

        const typeQuery = PisType.findById(newPisType._id);
        const populatedType = await populateType(typeQuery);
        
        return res.status(201).json({
            message: "Pis Type Created Successfully",
            data: populatedType
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const updatepisType = async (req, res) => {
    const { id } = req.params;
    const { make, name } = req.body;  
   
    if (!make || !name) {
        return res.status(400).json({ message: "Make and Type are required" });
    }
    
    try {
        const foundMake = await PisManufacturer.findById(make);
        if (!foundMake) {
            return res.status(404).json({ message: "Pis Manufacturer (Make) not found" });
        }

        const typeQuery = PisType.findByIdAndUpdate(id, { make, PisType }, { new: true, runValidators: true });
        const updatedPisType = await populateType(typeQuery);
        
        if (!updatedPisType) {
            return res.status(404).json({ message: "Pis Type Not Found" });
        }
        
        return res.status(200).json({
            message: "Pis Type Updated Successfully",
            data: updatedPisType
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const deletePisType = async (req, res) => {
    const { id } = req.params;
    try {
        const PisType = await PisType.findByIdAndDelete(id);
        if (!PisType) {
            return res.status(404).json({ message: "Pis Type Not Found" });
        }
        return res.status(200).json({ message: "Pis Type Deleted Successfully", data: PisType });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// GET Pis TYPES BY MAKE
export const getPisTypesByMake = async (req, res) => {
    const user = req.user;
    const { make } = req.params;
    
    try {
        const PisTypes = await PisType.find({ 
            make: make.toUpperCase() 
        });
        
        if (!PisTypes || PisTypes.length === 0) {
            return res.status(404).json({
                message: "No Pis Types Found for this Make"
            });
        }
        
        return res.status(200).json({
            message: "Pis Types Retrieved Successfully",
            data: PisTypes,
            count: PisTypes.length
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
        const makes = await PisType.distinct("make");
        
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
