const recommendCareers = async (req, res) => {
  try {
    res.status(200).json({ message: "Career recommendations endpoint", data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateRoadmap = async (req, res) => {
  try {
    res.status(200).json({ message: "Roadmap generation endpoint", data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  recommendCareers,
  generateRoadmap,
};