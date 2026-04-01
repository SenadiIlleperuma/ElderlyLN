const mlService = require("./ml.service");

// Searches for suitable caregivers based on the provided filters
const searchCaregivers = async (filters) => {
  return mlService.getPredictions(filters);
};

module.exports = {
  searchCaregivers,
};
