const rad = (x) => x * Math.PI / 180;

export const distance = (pointOne, pointTwo) => {
  var R = 6378137; // Earth’s mean radius in meter

  var distanceLatitude = rad(pointTwo.latitude - pointOne.latitude);
  var distanceLongitude = rad(pointTwo.longitude - pointOne.longitude);

  var a = Math.sin(distanceLatitude / 2) * Math.sin(distanceLatitude / 2) + Math.cos(rad(pointOne.latitude)) * Math.cos(rad(pointTwo.latitude)) * Math.sin(distanceLongitude / 2) * Math.sin(distanceLongitude / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;

  return d; // returns the distance in meter
};