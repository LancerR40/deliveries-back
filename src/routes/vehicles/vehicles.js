import query from "../../database";

export const createVehicle = async (vehicle) => {
  try {
    const owner = vehicle.owner;
    delete vehicle.owner;

    const { insertId: IDVehicle } = await query("INSERT INTO vehicle SET ?", vehicle);

    if (owner === "Company") {
      await query("INSERT INTO company_vehicle SET ?", IDVehicle);
      return true;
    }

    const result = await query("SELECT IDDriver FROM driver WHERE IdentificationCode = ?", owner);
    const { IDDriver } = result[0];

    await query("INSERT INTO driver_vehicle SET ?", { IDDriver, IDVehicle });

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const createVehicleDocument = async (document) => {
  try {
    const result = await query("SELECT IDVehicle FROM vehicle WHERE LicenseNumber = ?", document.licenseNumber);
    const { IDVehicle } = result[0];
    const { title: Title } = document;
    const Document = JSON.stringify(document);

    await query("INSERT INTO vehicle_document SET ?", { IDVehicle, Title, Document });

    await query("UPDATE vehicle SET IDVehicleStatus = ? WHERE IDVehicle = ?", [1, IDVehicle]);

    return true;
  } catch (error) {
    return false;
  }
};
