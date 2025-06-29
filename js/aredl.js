export function aredl() {
  const request = "https://api.aredl.net/api/aredl/levels";
  const response = UrlFetchApp.fetch(request, {'muteHttpExceptions': true});
  const json = response.getContentText();
  const data = JSON.parse(json);
  return data.map(level => [level.position, level.name]);;
}
