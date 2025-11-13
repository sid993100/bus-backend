import Duty from "../models/dutyModel.js";

/**
 * Generate a unique duty number with depot code prefix
 * @param {string} depotCode - The depot code (shortname) to prefix the duty number
 * @returns {Promise<string>} - Generated duty number in format: <depotCode><9 digit incremental>
 */
export const generateDutyNumber = async (depotCode) => {
  if (!depotCode || typeof depotCode !== 'string') {
    throw new Error('Depot code is required and must be a string');
  }

  // Normalize depot code (uppercase, trim)
  const normalizedDepotCode = depotCode.trim().toUpperCase();

  // Find the last duty number with this depot code prefix
  const lastDuty = await Duty.findOne({
    dutyNumber: { $regex: `^${normalizedDepotCode}` }
  })
    .sort({ dutyNumber: -1 })
    .select('dutyNumber')
    .lean();

  let nextIncremental = 1;

  if (lastDuty && lastDuty.dutyNumber) {
    // Extract the incremental part (everything after depot code)
    const depotCodeLength = normalizedDepotCode.length;
    const incrementalPart = lastDuty.dutyNumber.substring(depotCodeLength);
    const lastNumber = parseInt(incrementalPart, 10);
    
    if (!isNaN(lastNumber)) {
      nextIncremental = lastNumber + 1;
    }
  }

  // Pad incremental number to 9 digits
  const incrementalStr = nextIncremental.toString().padStart(9, '0');
  
  // Final format: <depotCode><9 digit incremental>
  let generatedNumber = `${normalizedDepotCode}${incrementalStr}`;

  // Check if this number already exists and find next available if needed
  let exists = await Duty.findOne({ dutyNumber: generatedNumber });
  let attempts = 0;
  const maxAttempts = 100; // Safety limit to prevent infinite loop

  while (exists && attempts < maxAttempts) {
    nextIncremental += 1;
    const newIncrementalStr = nextIncremental.toString().padStart(9, '0');
    generatedNumber = `${normalizedDepotCode}${newIncrementalStr}`;
    exists = await Duty.findOne({ dutyNumber: generatedNumber });
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error(`Unable to generate unique duty number after ${maxAttempts} attempts for depot code: ${normalizedDepotCode}`);
  }

  return generatedNumber;
};