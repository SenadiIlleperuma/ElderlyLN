const mlService = require("./ml.service");

const searchCaregivers = async (filters) => {
  return mlService.getPredictions(filters);
};

module.exports = {
  searchCaregivers,
};
