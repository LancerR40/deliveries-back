import query from "../../database";
import jsonwebtoken from "jsonwebtoken"
import config from "../../config";
import { responseCodes, errorResponse } from "../../responses"

export const isAuth = (req, res, next) => {
  const token = req.headers["x-authorization-token"]

  try {
    const payload = jsonwebtoken.verify(token, config.TOKEN_KEY);
    req.user = payload;

    next()
  } catch (error) {
    res.status(responseCodes.HTTP_401_UNAUTHORIZED).json(errorResponse("No estas autorizado."));
  }
}

export const createDriver = async (driver) => {
  try {
    return await query("INSERT INTO driver SET ?", driver);
  } catch (error) {
    return false;
  }
};

export const createDriverDocument = async (document) => {
  try {
    await query("INSERT INTO driver_document SET ?", document);
    const updateResult = await updateDriverStatus(4, document.IDDriver);

    if (!updateResult) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const updateDriverStatus = async (status, driverId) => {
  try {
    await query("UPDATE driver SET IDDriverStatus = ? WHERE IDDriver = ?", [status, driverId]);

    return true;
  } catch (error) {
    return false;
  }
};

export const getDriverData = async (driverId) => {
  try {
    const result = await query("SELECT Name as driverName, Lastname as driverLastname, IdentificationCode as driverIdentificationCode, Photo as driverPhoto, DateOfBirth as driverDateOfBirth, Email as driverEmail FROM driver WHERE IDDriver = ?", driverId)
    return result[0]
  } catch (error) {
    return false
  }
}

export const getDriverIdByIdentificationCode = async (code) => {
  try {
    const result = await query("SELECT IDDriver FROM driver WHERE IdentificationCode = ?", code);

    return result[0].IDDriver;
  } catch (error) {
    return false;
  }
};

export const getDriversByQueries = async (queries) => {
  try {
    const { search } = queries;

    let sql1 = `SELECT d.IDDriver as driverId, d.Name as name, d.Lastname as lastname, d.IdentificationCode as identificationCode, d.Gender as gender, d.Photo as photo, d.Email as email, d.CreatedAt as createdAt, ds.StatusName as statusName, ds.Description as statusDescription FROM driver as d INNER JOIN driver_status as ds ON d.IDDriverStatus = ds.IDDriverStatus`; /* prettier-ignore */
    let sql2 = `SELECT COUNT(IDDriver) as counter FROM driver as d INNER JOIN driver_status as ds ON d.IDDriverStatus = ds.IDDriverStatus`;
    const params = [];

    if (search.field) {
      sql1 += ` WHERE Name LIKE ? OR IdentificationCode LIKE ?`;
      sql2 += ` WHERE Name LIKE ? OR IdentificationCode LIKE ?`;

      params.push(search.field + "%", search.field + "%");
    }

    if (search.page) {
      const counter = await query(sql2, params);

      const limit = 8;
      const offset = Number(search.page) * limit - limit;

      sql1 += " LIMIT ? OFFSET ?";
      params.push(limit);
      params.push(offset);

      return {
        drivers: await query(sql1, params),
        counter: counter[0].counter,
        perPage: limit,
      };
    }

    return {
      drivers: await query(sql1, params),
    };
  } catch (error) {
    return false;
  }
};
