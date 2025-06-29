export async function getPositionByName(targetName) {
  const request = "https://api.aredl.net/api/aredl/levels";
  const response = await fetch(request);
  const data = await response.json();
  const level = data.find(level => level.name.toLowerCase() === targetName.toLowerCase());
  return level ? level.position : null;
}
