import Sim from '../../../models/simVltModel.js';
import VltDevice from '../../../models/vltDeviceModel.js';


// GET ALL (with populate)
export const getAllSims = async (req, res) => {
  try {
    const sims = await Sim.find().populate('sim').populate({path:"imeiNumber",select:"imeiNumber iccid"},{path:"fallbackSim",select:"serviceProviderName"}); // Populates SimService reference
    res.status(200).json({
      success: true,
      data: sims
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ADD (create)
export const addSim = async (req, res) => {
  try {
    const {
      imeiNumber,
      iccid,
      sim,
      primeryMSISDN,
      fallbackSim,
      fallbackMISIDN,
    } = req.body;

    if (!imeiNumber || !iccid || !sim) {
      return res.status(400).json({
        success: false,
        error: "imeiNumber, iccid and sim are required"
      });
    }
  
    

    const newSim = new Sim({
      imeiNumber,
      iccid,
      sim,
      primeryMSISDN,
      fallbackSim,
      fallbackMISIDN
    });

    const savedSim = await newSim.save();

    const updatedVlt=await VltDevice.findOneAndUpdate({iccid},{sim:savedSim._id},{new:true}).populate('sim');
    if(!updatedVlt){
         return res.status(404).json({
        success: false,
        error: "VLT Device not found with provided vltId"
      });
    }
    res.status(201).json({
      success: true,
      data: savedSim
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// UPDATE
export const updateSim = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;


    const updatedSim = await Sim.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('sim').populate({path:"imeiNumber",select:"imeiNumber iccid"});

    if (!updatedSim) {
      return res.status(404).json({
        success: false,
        error: "Sim not found"
      });
    }

    res.status(200).json({
      success: true,
      data: updatedSim
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
