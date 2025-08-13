const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Device = require("./model/Device");
// const devices = require("./data/MOCK_DATA.json");

//load the .env file
dotenv.config();

//connect to our mongodb atlas database
mongoose.connect(process.env.MONGO_DB_URL);

const importData = async () => {
  try {
    await Device.deleteMany();
    await Device.insertMany(devices);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const clearData = async () => {
  try {
    await Device.deleteMany();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  clearData();
} else {
  importData();
}
