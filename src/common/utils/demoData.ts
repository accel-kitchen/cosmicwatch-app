let eventCounter = 1;
let totalTime = 0; // totaltimeを加算式で管理

// Box-Muller法で正規分布乱数を生成
function randn_bm(mu: number, sigma: number) {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return Math.round(Math.max(0, Math.min(1023, mu + sigma * z)));
}

export function generateDemoData(): string {
  // 1cps相当の到来間隔（平均1秒、指数分布で揺らぎを持たせる）
  const interval = -Math.log(1 - Math.random()); // 平均1.0
  totalTime += Math.round(interval * 1000); // totaltimeはms単位で加算

  const now = new Date();
  const date = now
    .toISOString()
    .replace("T", "-")
    .slice(0, 19)
    .replace(/:/g, "-");

  const adc = randn_bm(450, 100);
  const sipm = (Math.random() * 10 + 20).toFixed(2); // 20~30
  const deadtime = Math.floor(Math.random() * 100);
  const temp = (Math.random() * 10 + 20).toFixed(2); // 20~30

  return `${eventCounter++}\t${date}\t${totalTime}\t${adc}\t${sipm}\t${deadtime}\t${temp}`;
}

// デモデータの内部状態をリセットする関数を追加
export function resetDemoDataState(): void {
  eventCounter = 1;
  totalTime = 0;
}
