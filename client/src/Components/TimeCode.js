function TimeCode({ seconds }) {
  const m = seconds / 60;
  const s = seconds % 60;
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}
export default TimeCode;
