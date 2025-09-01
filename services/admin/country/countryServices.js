import Country from "../../../models/countryModel.js";


export const getCountry = async (req,res) => {
    const user = req.user;
     try {
        const country= await Country.find({})
        if (!country||country.length===0) {
             return res.status(404).json({
            message: "Bus Stop Not Found",
            });
        }
        return res.status(200).json({
        message:country
       }) 
     } catch (error) {
        return res.status(500).json({
        message:"Backend Error"
         })
     }
};
export const addCountry= async (req,res) => {
  const {code,name}=req.body
  
     if(!name||!code){
       return res.status(404).json({
            message:"All details Required"
         })
     }

  try {
    const existingCountry = await Country.findOne({ $or: [{ countryCode: code }, { country: name }] });
    if (existingCountry) {
      return res.status(409).json({
        message: "Country with the same code or name already exists"
      });
    }
      const country=await Country.create({
        countryCode:code,
        country:name
      })
      
      if(!country){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Country "
             })
      }
      res.status(201).json({
        message:"created",
        data:country
      })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Already exists"
      });
    }
    
    return res.status(500).json({
      message: "Server Error"
    });
  }
};
export const updateCountry = async (req, res) => {
  try {
    const { id } = req.params; // BusStop ID from URL
    const { countryCode,name } = req.body;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        message: "BusStop ID is required",
      });
    }

    // Require at least one field to update
    if (!countryCode && !name) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    // Perform the update
    const country = await Country.findByIdAndUpdate(
      id,
      {
        ...(countryCode && { countryCode }),
        ...(name && { country:name }),
      },
      { new: true } // return updated document
    );

    if (!country) {
      return res.status(404).json({
        message: "BusStop not found",
      });
    }

    res.status(200).json({
      message: "BusStop updated successfully",
      data: country,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
