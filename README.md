# CHINT-IoT-Management-Dashboard

## A Switch Monitoring System using MERN stack (MongoDB-Express-React-Node)

### To install and run the project then do the following steps:

You should have installed Node.js in your workstation first and setup your own MongoDB Atlas database cluster.

### To run the backend application:

1. Open a new terminal
2. `git clone https://github.com/cole-lette/Switch-Monitoring-System`
3. `cd Switch-Monitoring System`
4. `cd backend`
5. Create a .env file and enter your JWT Secret
6. Generate a strong secret using Node.Js:
   `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
7. Enter your MongoDB Atlas connection string.  
   Format is the following: `MONGO_DB_URL=mongodb+srv://<username>:<password>@<server>/rfiddb?retryWrites=true&w=majority`
8. `npm install && npm start`
9. Type localhost:5000 in your browser and check if you would see "Cannot GET /". If you see this message then it means that you were able to run the backend server.

### To run the frontend application:

1.  Open another terminal and cd into where you clone your project
2.  `cd frontend`
3.  `npm install && npm start`
4.  Type localhost:3000 in your browser and check if you would see the user interface. You should be able to see the application but with no data displayed as your MongoDB is not populated with any test data.

### To run both applications:

1. Go to the root level of this project (make sure frontend and backend is working individually first)
2. `npm run dev`
3. Frontend (localhost:5000) and backend (localhost:3000) servers will start in parallel.

### Populating your MongoDB Atlas database with simulated data

1.  Open a new terminal and cd into the backend folder
2.  Type in `node mqtt-simulator.js`
3.  Check your database if it has been populated with values then you can now close the terminal
