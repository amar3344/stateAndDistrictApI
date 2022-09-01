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
    process.exit(1);
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
  try {
    const { stateId } = request.params;
    const stateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
    const state = await db.get(stateQuery);
    response.send(state);
  } catch (e) {
    response.send(`${e.message}`);
    process.exit(1);
  }
});

//API - 3
app.post("/districts/", async (request, response) => {
  try {
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const addDistrict = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
            VALUES(
            '${districtName}',
                ${stateId},
                ${cases},
                ${cured},
                ${active},
                ${deaths});`;
    const dbResponse = await db.run(addDistrict);
    const { district_id } = dbResponse.lastID;
    response.send("District Successfully Added");
  } catch (e) {
    response.send(`${e.message}`);
    process.exit(1);
  }
});

//API - 4
app.get("/districts/:districtId/", async (request, respond) => {
  const { districtId } = request.params;
  const districtQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const dbResponse = await db.get(districtQuery);
  respond.send(dbResponse);
});

//API -5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const dbResponse = await db.run(districtQuery);
  response.send("District Removed");
});

//API - 6
app.put("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const districtQuery = `UPDATE district SET 
                district_name ='${districtName}',
                state_Id = ${stateId},
                cases = ${cases},
                cured = ${cured},
                active = ${active},
                deaths = ${deaths}
                WHERE district_id = ${districtId}
            ;`;
    const dbResponse = await db.run(districtQuery);
    response.send("District Details Updated");
  } catch (e) {
    response.send(`${e.message}`);
    process.exit(1);
  }
});

//API -7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `SELECT cases AS totalCases,
  cured AS totalCured,
  active AS totalActive,
  deaths AS totalDeaths 
  FROM 
   state INNER JOIN district
   ON state.state_id = district.state_id
    WHERE state.state_id = ${stateId};`;
  const dbResponse = await db.get(stateQuery);
  response.send(dbResponse);
});

//API -8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const tableQuery = `SELECT state_name AS stateName
    FROM state INNER JOIN district 
    ON state.state_id = district.state_id
    WHERE district.district_id = ${districtId};`;
  const dbResponse = await db.get(tableQuery);
  response.send(dbResponse);
});

module.exports = app;
