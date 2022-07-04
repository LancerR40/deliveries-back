import query from "../../database";

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

const updateVehicleStatus = async (status, vehicleId) => {
  try {
    await query("UPDATE vehicle SET IDVehicleStatus = ? WHERE IDVehicle = ?", [status, vehicleId]);

    return true;
  } catch (error) {
    return error;
  }
};

export const vehiclesByQueries = async (payload) => {
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
      console.log(counter);

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
