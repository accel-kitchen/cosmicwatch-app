let eventCounter = 1;
let time = 0; // timeを加算式で管理

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
  // 20回に1回の頻度でコメント行を生成（実用的な頻度）
  if (Math.random() < 0.05) {
    const now = new Date();
    const timestamp = now.toISOString();
    return `# Demo comment at ${timestamp} - Event ${eventCounter}`;
  }

  // 1cps相当の到来間隔（平均1秒、指数分布で揺らぎを持たせる）
  const interval = -Math.log(1 - Math.random()); // 平均1.0
  time += Math.round(interval * 1000); // timeはms単位で加算

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

  return `${eventCounter++} ${date} ${time} ${adc} ${sipm} ${deadtime} ${temp}`;
}

// デモデータの内部状態をリセットする関数を追加
export function resetDemoDataState(): void {
  eventCounter = 1;
  time = 0;
}
