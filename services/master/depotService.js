import DepotCustomer from "../../../models/depotCustomerModel.js";
import Region from "../../../models/regionModel.js";

// GET ALL DEPOT/CUSTOMERS
export const getDepotCustomers = async (req, res) => {
    
    try {
        const depotCustomers = await DepotCustomer.find({})
            .populate('region', 'name communicationAddress location')
            .sort({ depotCustomer: 1 });
        
        if (!depotCustomers || depotCustomers.length === 0) {
            return res.status(404).json({
                message: "Depot/Customers Not Found",
            });
        }
        
        return res.status(200).json({
            message: "Depot/Customers Retrieved Successfully",
            data: depotCustomers,
            count: depotCustomers.length
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// GET SINGLE DEPOT/CUSTOMER BY ID
export const getDepotCustomer = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    try {
        const depotCustomer = await DepotCustomer.findById(id)
            .populate('region', 'name communicationAddress location');
        
        if (!depotCustomer) {
            return res.status(404).json({
                message: "Depot/Customer Not Found",
            });
        }
        
        return res.status(200).json({
            message: "Depot/Customer Retrieved Successfully",
            data: depotCustomer
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// ADD NEW DEPOT/CUSTOMER
export const addDepotCustomer = async (req, res) => {
    const user = req.user;
    const { depotCustomer, region } = req.body;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    if (!depotCustomer || !region) {
        return res.status(400).json({
            message: "All details Required"
        });
    }
    
    try {
        // Verify that the region exists
        const existingRegion = await Region.findById(region);
        if (!existingRegion) {
            return res.status(404).json({
                message: "Region Not Found"
            });
        }
        
        // Check if depot/customer name already exists
        const existingDepotCustomer = await DepotCustomer.findOne({
            depotCustomer: depotCustomer.toUpperCase()
        });
        
        if (existingDepotCustomer) {
            return res.status(409).json({
                message: "Depot/Customer with this name already exists"
            });
        }
        
        const newDepotCustomer = await DepotCustomer.create({
            depotCustomer,
            region
        });
        
        if (!newDepotCustomer) {
            return res.status(500).json({
                message: "Something went Wrong while Creating Depot/Customer"
            });
        }
        
        // Populate the region data in response
        await newDepotCustomer.populate('region', 'name communicationAddress location');
        
        return res.status(201).json({
            message: "Depot/Customer Created Successfully",
            data: newDepotCustomer
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Depot/Customer name must be unique"
            });
        }
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// UPDATE DEPOT/CUSTOMER
export const updateDepotCustomer = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    const { depotCustomer, region } = req.body;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    if (!depotCustomer || !region) {
        return res.status(400).json({
            message: "All details Required"
        });
    }
    
    try {
        // Verify that the region exists
        const existingRegion = await Region.findById(region);
        if (!existingRegion) {
            return res.status(404).json({
                message: "Region Not Found"
            });
        }
        
        // Check if depot/customer name already exists (excluding current record)
        const existingDepotCustomer = await DepotCustomer.findOne({
            _id: { $ne: id },
            depotCustomer: depotCustomer.toUpperCase()
        });
        
        if (existingDepotCustomer) {
            return res.status(409).json({
                message: "Depot/Customer with this name already exists"
            });
        }
        
        const updatedDepotCustomer = await DepotCustomer.findByIdAndUpdate(
            id,
            { depotCustomer, region },
            { new: true, runValidators: true }
        ).populate('region', 'name communicationAddress location');
        
        if (!updatedDepotCustomer) {
            return res.status(404).json({
                message: "Depot/Customer Not Found"
            });
        }
        
        return res.status(200).json({
            message: "Depot/Customer Updated Successfully",
            data: updatedDepotCustomer
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Depot/Customer name must be unique"
            });
        }
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// DELETE DEPOT/CUSTOMER
export const deleteDepotCustomer = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    try {
        const depotCustomer = await DepotCustomer.findByIdAndDelete(id)
            .populate('region', 'name communicationAddress location');
        
        if (!depotCustomer) {
            return res.status(404).json({
                message: "Depot/Customer Not Found"
            });
        }
        
        return res.status(200).json({
            message: "Depot/Customer Deleted Successfully",
            data: depotCustomer
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// GET DEPOT/CUSTOMERS BY REGION
export const getDepotCustomersByRegion = async (req, res) => {
    const user = req.user;
    const { regionId } = req.params;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    try {
        // Verify that the region exists
        const existingRegion = await Region.findById(regionId);
        if (!existingRegion) {
            return res.status(404).json({
                message: "Region Not Found"
            });
        }
        
        const depotCustomers = await DepotCustomer.find({ region: regionId })
            .populate('region', 'name communicationAddress location')
            .sort({ depotCustomer: 1 });
        
        if (!depotCustomers || depotCustomers.length === 0) {
            return res.status(404).json({
                message: "No Depot/Customers Found for this Region"
            });
        }
        
        return res.status(200).json({
            message: "Depot/Customers Retrieved Successfully",
            data: depotCustomers,
            count: depotCustomers.length
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// GET DEPOT/CUSTOMERS STATISTICS
export const getDepotCustomerStats = async (req, res) => {
    const user = req.user;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    try {
        const totalDepotCustomers = await DepotCustomer.countDocuments();
        
        // Count by region
        const regionStats = await DepotCustomer.aggregate([
            {
                $lookup: {
                    from: 'regions',
                    localField: 'region',
                    foreignField: '_id',
                    as: 'regionInfo'
                }
            },
            {
                $unwind: '$regionInfo'
            },
            {
                $group: {
                    _id: '$regionInfo.name',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        const stats = {
            totalDepotCustomers,
            regionDistribution: regionStats
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
