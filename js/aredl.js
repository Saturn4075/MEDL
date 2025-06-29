export async function getPositionByName(targetName) {
  const response = await fetch("https://api.aredl.net/api/aredl/levels");
  const data = await response.json();
  const level = data.find(l => l.name.toLowerCase() === targetName.toLowerCase());
  return level ? level.position : null;
}
