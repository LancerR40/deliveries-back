import query from "../../database";

export const createVehicle = async (vehicle) => {
  try {
    const owner = vehicle.owner;
    delete vehicle.owner;

    const { insertId: IDVehicle } = await query("INSERT INTO vehicle SET ?", vehicle);

    if (owner === "Company") {
      await query("INSERT INTO company_vehicle SET ?", { IDVehicle });
      return true;
    }

    const [driver] = await query("SELECT IDDriver FROM driver WHERE IdentificationCode = ?", owner);
    const { IDDriver } = driver;

    await query("INSERT INTO driver_vehicle SET ?", { IDDriver, IDVehicle });

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const createVehicleDocument = async (document) => {
  try {
    const [vehicle] = await query("SELECT IDVehicle FROM vehicle WHERE LicenseNumber = ?", document.licenseNumber);
    const { IDVehicle } = vehicle;
    const { title: Title } = document;
    const Document = JSON.stringify(document);

    // Insert document and update status to available
    await query("INSERT INTO vehicle_document SET ?", { IDVehicle, Title, Document });
    await query("UPDATE vehicle SET IDVehicleStatus = ? WHERE IDVehicle = ?", [1, IDVehicle]);

    return true;
  } catch (error) {
    return false;
  }
};

export const vehiclesByQueries = async (payload) => {
  try {
    const { search } = payload;

    let sql1 = "SELECT v.IDVehicle as vehicleId, v.Model as model, v.Brand as brand, v.Color as color, v.Type as type, v.LicenseNumber as licenseNumber, v.TiresNumber as tiresNumber, v.CreatedAt as createdAt, s.StatusName as statusName, s.Description as statusDescription FROM vehicle as v INNER JOIN vehicle_status as s ON v.IDVehicleStatus = s.IDVehicleStatus"; /* prettier-ignore */
    let sql2 = "SELECT COUNT(v.IDVehicle) FROM vehicle as v INNER JOIN vehicle_status as s ON v.IDVehicleStatus = s.IDVehicleStatus"; /* prettier-ignore */
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
    return error;
  }
};
