export async function getPositionByName(targetName) {
  const request = "https://api.aredl.net/api/aredl/levels";
  try {
    const response = await fetch(request);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    const level = data.find(level => level.name.toLowerCase() === targetName.toLowerCase());

    if (level) {
      return level.position;
    } else {
      console.warn("Name not found:", targetName);
      return null;
    }

  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}
