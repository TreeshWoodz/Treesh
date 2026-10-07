import { LEXICON } from "@/data/lexicon";
import { FINISH, REAL_OR_CAP } from "@/data/content";

export const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const shuffle = (arr, r = Math.random) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const mc = (correct, wrong, r) => {
  const options = shuffle([correct, ...wrong], r);
  return { options, answer: options.indexOf(correct) };
};

const sayLess = (n, r) =>
  shuffle(LEXICON, r).slice(0, n).map((t) => {
    const wrong = shuffle(LEXICON.filter((x) => x.term !== t.term), r).slice(0, 3).map((x) => x.meaning);
    return { kind: "Say Less", prompt: `What does "${t.term}" mean?`, sub: `"${t.example}"`, ...mc(t.meaning, wrong, r), explanation: t.note, term: t.term };
  });

const finish = (n, r) =>
  shuffle(FINISH, r).slice(0, n).map((f) => ({
    kind: "Finish the Phrase", prompt: f.phrase, sub: "Fill in the blank", ...mc(f.answer, f.wrong, r), explanation: f.meaning,
  }));

const realOrCap = (n, r) =>
  shuffle(REAL_OR_CAP, r).slice(0, n).map((q) => ({
    kind: "Real or Cap?", prompt: q.s, sub: "Real or cap?", options: ["Real", "Cap"], answer: q.real ? 0 : 1, explanation: q.why,
  }));

const mixed = (n, r) => shuffle([...sayLess(Math.ceil(n / 3), r), ...finish(Math.ceil(n / 3), r), ...realOrCap(Math.ceil(n / 3), r)], r).slice(0, n);

const todaySeed = () => Number(new Date().toLocaleDateString("en-CA").replaceAll("-", ""));

export const buildQuestions = (kind) => {
  const r = Math.random;
  if (kind === "say_less") return sayLess(10, r);
  if (kind === "finish") return finish(10, r);
  if (kind === "real_or_cap") return realOrCap(12, r);
  if (kind === "mixed") return [...mixed(60, r), ...mixed(60, r)];
  if (kind === "daily") return mixed(5, rng(todaySeed()));
  return mixed(10, r);
};
