
import Region from "../../models/regionModel.js";
import DepotCustomer from "../../models/depotCustomerModel.js";
import { isValidObjectId } from "mongoose";

// GET ALL DEPOT/CUSTOMERS
export const getDepotCustomers = async (req, res) => {
    
    try {
        const depotCustomers = await DepotCustomer.find({})
            .populate('region', 'name communicationAddress location')
            .sort({ depotCustomer: 1 });
        
        if (!depotCustomers) {
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

export const getDepotCustomersByRegion = async (req, res) => {
    try {
        const { regionId } = req.params;
        
        // Validate ObjectId format
        if (!isValidObjectId(regionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid region ID format"
            });
        }

        const depotCustomers = await DepotCustomer.find({ region: regionId })
            .populate('region', 'name communicationAddress location')
            .sort({ depotCustomer: 1 });
        
        if (!depotCustomers || depotCustomers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No Depot/Customers found for this region"
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Depot/Customers retrieved successfully for region",
            data: depotCustomers,
            count: depotCustomers.length,
            regionId: regionId
        });
    } catch (error) {
        console.error('Error fetching depot customers by region:', error);
        return res.status(500).json({
            success: false,
            message: "Backend Error",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};


// GET SINGLE DEPOT/CUSTOMER BY ID
export const getDepotCustomer = async (req, res) => {

    const { id } = req.params;

    
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
    const { depotCustomer, region,code } = req.body;
    
       
    
    if (!depotCustomer || !region||!code) {
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
            region,code
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
  
    const { id } = req.params;
    const { depotCustomer, region ,code} = req.body;
    
       
    
    if (!depotCustomer || !region||!code) {
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
            { depotCustomer, region,code },
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



// GET DEPOT/CUSTOMERS STATISTICS
export const getDepotCustomerStats = async (req, res) => {
    const user = req.user;
    
       
    
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

export const getDepotById = async (req, res) => {
  try {
    const { id } = req.params;
    const depot = await DepotCustomer.findById(id).populate('region', 'name communicationAddress location');
    if (!depot) {
      return res.status(404).json({
        message: "Depot/Customer Not Found"
      });
    }
    return res.status(200).json({
      message: "Depot/Customer Retrieved Successfully",
      data: depot
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error"
    });
  }
};
