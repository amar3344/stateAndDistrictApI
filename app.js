const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
let db = null;
app.use(express.json());

let dbPath = path.join(__dirname, "covid19India.db");

let initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running successfully");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
  }
};

initializeDBAndServer();

const convertStateDBObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDBObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//get states API 1

app.get("/states/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `SELECT * FROM state `;
  const statesArray = await db.all(stateQuery);
  response.send(
    statesArray.map((eachArray) =>
      convertStateDBObjectToResponseObject(eachArray)
    )
  );
});

//API - 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const state = await db.get(stateQuery);
  response.send(state);
});

//API - 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrict = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
    VALUES(
       ${districtName},
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths});`;
  const dbResponse = await db.run(addDistrict);
  const { district_id } = dbResponse.lastID;
  response.send("District Successfully Added");
});
