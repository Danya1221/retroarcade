let context,
  loop,
  t = 0;
const notes = [130.81, 164.81, 196, 261.63, 220, 196, 164.81, 146.83];
export function sound(type, settings) {
  if (!settings.sfx) return;
  try {
    context ||= new AudioContext();
    context.resume();
    const o = context.createOscillator(),
      g = context.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(
      type === "hit" ? 100 : type === "loot" ? 659 : 330,
      context.currentTime,
    );
    o.frequency.exponentialRampToValueAtTime(
      type === "hit" ? 40 : 880,
      context.currentTime + 0.15,
    );
    g.gain.setValueAtTime((settings.volume ?? 0.3) * 0.09, context.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
    o.connect(g).connect(context.destination);
    o.start();
    o.stop(context.currentTime + 0.21);
  } catch {}
}
export function music(settings) {
  clearInterval(loop);
  if (!settings.music) return;
  try {
    context ||= new AudioContext();
    context.resume();
    loop = setInterval(() => {
      if (context.state !== "running") return;
      const o = context.createOscillator(),
        g = context.createGain();
      o.type = "triangle";
      o.frequency.value = notes[t++ % notes.length];
      g.gain.setValueAtTime(
        (settings.volume ?? 0.3) * 0.07,
        context.currentTime,
      );
      g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.4);
      o.connect(g).connect(context.destination);
      o.start();
      o.stop(context.currentTime + 0.41);
    }, 250);
  } catch {}
}
export function silence() {
  clearInterval(loop);
  context?.suspend();
}
