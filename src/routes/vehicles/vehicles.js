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

export const createVehicle = async (vehicle) => {
  try {
    return await query("INSERT INTO vehicle SET ?", vehicle);
  } catch (error) {
    return false;
  }
};

export const createVehicleDocument = async (document, vehicleId) => {
  try {
    const { title } = document;
    const toInsert = { IDVehicle: vehicleId, title, document: JSON.stringify(document) };

    await query("INSERT INTO vehicle_document SET ?", toInsert);

    const updateResult = await updateVehicleStatus(1, vehicleId);

    if (!updateResult) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const createCompanyVehicle = async (vehicleId) => {
  try {
    await query("INSERT INTO company_vehicle SET ?", { IDVehicle: vehicleId });

    return true;
  } catch (error) {
    return false;
  }
};

export const createDriverVehicle = async (vehicleId, driverId) => {
  try {
    await query("INSERT INTO driver_vehicle SET ?", { IDDriver: driverId, IDVehicle: vehicleId });

    return true;
  } catch (error) {
    return false;
  }
};

export const createAssignment = async (vehicleId, driverId) => {
  const assignment = { IDVehicle: vehicleId, IDDriver: driverId };

  try {
    await query("INSERT INTO assigned_vehicle SET ?", assignment);

    return true;
  } catch (error) {
    console.log(error);

    return false;
  }
};

export const updateVehicleStatus = async (status, vehicleId) => {
  try {
    await query("UPDATE vehicle SET IDVehicleStatus = ? WHERE IDVehicle = ?", [status, vehicleId]);

    return true;
  } catch (error) {
    return error;
  }
};

export const deleteAssignment = async (assignmentId) => {
  try {
    await query("DELETE FROM assigned_vehicle WHERE IDAssignedVehicle = ?", assignmentId)
    return true
  } catch (error) {
    return error
  }
}

export const getVehiclesByQueries = async (payload) => {
  try {
    const { search } = payload;

    let sql1 = "SELECT v.IDVehicle as vehicleId, v.Model as model, v.Brand as brand, v.Color as color, v.Type as type, v.LicenseNumber as licenseNumber, v.TiresNumber as tiresNumber, v.CreatedAt as createdAt, s.StatusName as statusName, s.Description as statusDescription, json_extract(Document, '$.name') as ownerName, json_extract(Document, '$.lastname') as ownerLastname FROM vehicle as v LEFT JOIN vehicle_status as s ON v.IDVehicleStatus = s.IDVehicleStatus LEFT JOIN vehicle_document as vc ON v.IDVehicle = vc.IDVehicle"; /* prettier-ignore */
    let sql2 = "SELECT COUNT(v.IDVehicle) as counter FROM vehicle as v LEFT JOIN vehicle_status as s ON v.IDVehicleStatus = s.IDVehicleStatus LEFT JOIN vehicle_document as vc ON v.IDVehicle = vc.IDVehicle"; /* prettier-ignore */
    const params = [];

    if (search.field) {
      sql1 += ` WHERE Model LIKE ? OR Brand LIKE ? OR LicenseNumber LIKE ?`;
      sql2 += ` WHERE Model LIKE ? OR Brand LIKE ? OR LicenseNumber LIKE ?`;

      params.push(search.field + "%", search.field + "%", search.field + "%");
    }

    if (search.page) {
      const counter = await query(sql2, params);

      const limit = 8;
      const offset = Number(search.page) * limit - limit;

      sql1 += " LIMIT ? OFFSET ?";
      params.push(limit);
      params.push(offset);

      return {
        vehicles: await query(sql1, params),
        counter: counter[0].counter,
        perPage: limit,
      };
    }

    return {
      vehicles: await query(sql1, params),
    };
  } catch (error) {
    return false;
  }
};

export const getSuperAdmin = async () => {
  try {
    const result = await query(
      "SELECT Name as name, Lastname as lastname, IdentificationCode as identificationCode FROM admin WHERE Role = ?",
      1
    );

    return result[0];
  } catch (error) {
    return false;
  }
};

export const getDriverByIdentificationCode = async (identificationCode) => {
  try {
    const result = await query(
      "SELECT IDDriver as driverId FROM driver WHERE IdentificationCode = ?",
      identificationCode
    );

    return result[0].driverId;
  } catch (error) {
    return false;
  }
};

export const getVehicleByLicenseNumber = async (licenseNumber) => {
  try {
    const result = await query("SELECT IDVehicle FROM vehicle WHERE LicenseNumber = ?", licenseNumber);

    return result[0].IDVehicle;
  } catch (error) {
    return false;
  }
};

export const getAssigments = async () => {
  try {
    return await query("SELECT d.Name as driverName, d.Lastname as driverLastname, d.IdentificationCode as driverIdentificationCode, d.Photo as driverPhoto, v.LicenseNumber as vehicleLicenseNumber, v.Brand as vehicleBrand, v.Model as vehicleModel, av.IDAssignedVehicle as assignedVehicleId FROM assigned_vehicle as av INNER JOIN driver as d ON av.IDDriver = d.IDDriver INNER JOIN vehicle as v ON av.IDVehicle = v.IDVehicle")
  } catch (error) {
    return false
  }
}
