/* One-shot: merge English meanings into src/data/tarot_cards.json (22 Major Arcana).
   Standard Rider–Waite–Smith readings, authored in yume's own interpretive voice to
   parallel the existing Chinese fields. Idempotent — re-running just overwrites the _en fields. */
const fs = require("fs");
const path = require("path");

const EN = {
  0:  { s: "Beginnings, exploration, innocence, a leap of faith — and the single step between freedom and folly.",
        u: "A fresh start, spontaneity, setting out from zero, the courage to trust a dream; an open, unbound spirit.",
        r: "Drifting, recklessness, levity, missed chances, or a wrong turn taken out of inexperience and acting on impulse." },
  1:  { s: "Will, skill, and focused power — gathering what you have to make something real.",
        u: "Willpower, resourcefulness, manifestation, as-above-so-below; the moment to act with intent.",
        r: "Manipulation, scattered energy, trickery, or talent left untapped and misdirected." },
  2:  { s: "Intuition, mystery, and inner knowing — the veiled depth beneath the surface.",
        u: "Listen inward; the unconscious, secrets ripening, wisdom that does not announce itself.",
        r: "Secrets withheld, intuition ignored, surface chosen over depth, signals not heard." },
  3:  { s: "Abundance, nurture, fertility — creation and sensual growth.",
        u: "Creativity flowering, care, plenty, the body and the earth; tending something into being.",
        r: "Creative block, smothering or being smothered, neglect of self, growth stalled." },
  4:  { s: "Structure, authority, order — the steadying frame.",
        u: "Stability, leadership, boundaries, fatherly authority; building on solid ground.",
        r: "Rigidity, control, domination, or an authority that has gone weak or cold." },
  5:  { s: "Tradition, teaching, shared belief — the inherited path.",
        u: "Guidance, mentorship, convention, belonging to something older than yourself.",
        r: "Dogma questioned, rebellion, leaving the orthodox road to find your own." },
  6:  { s: "Union, choice, values — what you align yourself with.",
        u: "Love, harmony, a meaningful choice made from the heart, two things made one.",
        r: "Disharmony, values misaligned, a hard choice dodged, a bond out of tune." },
  7:  { s: "Drive, willful victory, direction — momentum reined and aimed.",
        u: "Determination, self-command, triumph through focus; holding the reins of opposing forces.",
        r: "Scattered drive, loss of control, force without direction, a stalled charge." },
  8:  { s: "Courage, gentle power, patience — strength that does not need to dominate.",
        u: "Inner strength, compassion, mastering instinct with tenderness rather than force.",
        r: "Self-doubt, raw impulse, or force used where patience was the truer strength." },
  9:  { s: "Solitude, inner search, guidance — the lamp carried alone.",
        u: "Introspection, withdrawing to find wisdom, the quiet that lets the inner light show.",
        r: "Isolation, loneliness, or avoiding the reflection you need to make." },
  10: { s: "Cycles, turning point, fate — the wheel comes round.",
        u: "Change, fortune turning, momentum, a pivot you can ride rather than resist.",
        r: "Resistance to change, a downturn, the sense of being at fate's mercy." },
  11: { s: "Balance, truth, consequence — cause meeting effect.",
        u: "Fairness, accountability, clear judgment, the reckoning of what was set in motion.",
        r: "Imbalance, evasion, unfairness, or dishonesty with yourself about the cost." },
  12: { s: "Surrender, pause, a new angle — gain through letting go.",
        u: "Suspension, release, seeing anew by staying still; a worthwhile, voluntary pause.",
        r: "Stalling, pointless sacrifice, clinging where surrender was the way through." },
  13: { s: "Ending, transformation, release — the old form shed.",
        u: "A necessary ending, transition, clearing space; what dies makes room to be reborn.",
        r: "Clinging to the past, change stalled, fear of letting the old self go." },
  14: { s: "Balance, blending, patience — the middle path.",
        u: "Moderation, synthesis, healing, mixing opposites into something whole and calm.",
        r: "Excess, imbalance, impatience, aims that pull against each other." },
  15: { s: "Bondage, shadow, attachment — the chain you forget is loose.",
        u: "Dependency, temptation, the appetites that bind; naming what holds you.",
        r: "Release, facing the shadow, unclasping the chain and stepping free." },
  16: { s: "Upheaval, sudden change, revelation — the false tower falls.",
        u: "Abrupt disruption, a brittle structure collapsing, a shock that wakes you.",
        r: "Fear of the fall, disaster delayed or softened, a slow erosion instead of a blast." },
  17: { s: "Hope, renewal, faith — quiet light after the storm.",
        u: "Hope, healing, serenity, guidance returning; you are seen and replenished.",
        r: "Discouragement, faith dimmed, feeling cut off from hope or inspiration." },
  18: { s: "Illusion, the unconscious, uncertainty — the half-lit path.",
        u: "Dreams, intuition, fear and the unclear road; trust the feel of the dark, not its shapes.",
        r: "Confusion clearing, a hidden truth surfacing, anxiety beginning to lift." },
  19: { s: "Joy, clarity, vitality — open daylight.",
        u: "Warmth, success, clarity, wholehearted joy; nothing left in shadow.",
        r: "Optimism dimmed, passing clouds, or a brightness that feels forced." },
  20: { s: "Reckoning, awakening, renewal — the call to rise.",
        u: "A summons to rise, honest self-reckoning, rebirth and a clear verdict on the past.",
        r: "Self-doubt, ignoring the call, judging yourself too harshly to move." },
  21: { s: "Completion, wholeness, fulfillment — the cycle made whole.",
        u: "Completion, integration, accomplishment; a journey arrives and a circle closes.",
        r: "An unfinished cycle, delay, closure withheld, the last step not yet taken." },
};

const file = path.join(__dirname, "..", "src", "data", "tarot_cards.json");
const cards = JSON.parse(fs.readFileSync(file, "utf8"));
let n = 0;
for (const c of cards) {
  const e = EN[c.id];
  if (!e) { console.warn("no EN for id", c.id, c.name_en); continue; }
  c.summary_en = e.s;
  c.upright_en = e.u;
  c.reversed_en = e.r;
  n++;
}
fs.writeFileSync(file, JSON.stringify(cards, null, 2) + "\n");
console.log(`merged EN into ${n}/${cards.length} cards`);
