const validateAge = (dateOfBirth) => {
  if (!dateOfBirth) return { isValid: false, age: null, message: 'Date of birth is required' };
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  // Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, age: null, message: 'Invalid date format' };
  }
  
  // Check if birth date is in future
  if (birthDate > today) {
    return { isValid: false, age: null, message: 'Date of birth cannot be in the future' };
  }
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  if (age < 18) {
    return { isValid: false, age, message: `Driver must be at least 18 years old. Current age: ${age}` };
  }
  
  if (age > 70) {
    return { isValid: false, age, message: `Driver age cannot exceed 70 years. Current age: ${age}` };
  }
  
  return { isValid: true, age, message: null };
};

export default validateAge