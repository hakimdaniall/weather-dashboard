export const getLocalTimeNow = (timezoneOffsetInSeconds: number) => {
  const nowUTC = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
  const localTime = new Date(nowUTC + timezoneOffsetInSeconds * 1000);
  return localTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};