import query from "../../database";

/* prettier-ignore */
export const getDrivers = async (field = "") => {
  try {
    let sql = "SELECT Name as driverName, Lastname as driverLastname, IdentificationCode as driverIdentificationCode, Photo as driverPhoto FROM driver WHERE Name LIKE ? OR Lastname LIKE ? OR IdentificationCode LIKE ?";
    const params = [field + "%", field + "%", field + "%"]
    const result = await query(sql, params)

    return result
} catch (error) {
    return false;
  }
};

/* prettier-ignore */
export const getAssigmentVehicles = async (field = "") => {
  try {
    const result = await query("SELECT v.Model as vehicleModel, v.LicenseNumber as vehicleLicenseNumber FROM driver as d LEFT JOIN assigned_vehicle as av ON av.IDDriver = d.IDDriver LEFT JOIN vehicle as v ON av.IDVehicle = v.IDVehicle WHERE d.IdentificationCode = ?", field)
    return result
  } catch (error) {
    return false
  }
}
