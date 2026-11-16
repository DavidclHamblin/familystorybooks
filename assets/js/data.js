/* Family Storybooks: catalogue and settings shared by every page.
   src/build.py reads this file (with node), so it is the one source of truth. */
var FST = window.FST = window.FST || {};

FST.config = {
  // Waitlist sign-ups are emailed to hello@ via FormSubmit (formsubmit.co), the same as Family Board Books.
  formEndpoint: "https://formsubmit.co/ajax/hello@familyboardbooks.com",
  email: "hello@familyboardbooks.com",
  foundingDiscount: 15,
  boardBooks: "https://www.familyboardbooks.com"
};

/* Stories. "ready" stories are written and illustrated; the rest are coming soon.
   Roles are the parts the family plays. Villains are always our own characters, never family. */
FST.order = ["redhood", "goldilocks", "pigs", "cinderella", "sleeping"];
FST.stories = {
  redhood: {
    slug: "little-red-riding-hood", name: "Little Red Riding Hood", short: "Little Red", color: "red", ready: true,
    line: "A walk in the woods, a very silly Wolf, and a Grandma who's nobody's fool.",
    blurb: "Little Red sets off through the forest with a basket of honey buns for Grandma. The Wolf has a plan, but Grandma has a rolling pin. Our gentle retelling: nobody gets eaten, and the Wolf runs off over the hill.",
    spreads: 12,
    roles: [
      { name: "Little Red", who: "Your child", line: "The hero, in a strawberry-red hooded cape with a basket for Grandma." },
      { name: "Mum", who: "Mum, Dad or any grown-up", line: "Packs the basket and waves Little Red off at the cottage door." },
      { name: "Grandma", who: "Grandma, Grandad or any grandparent", line: "Spots the Wolf at the window and springs the surprise." },
      { name: "The woodcutter", who: "Dad, an uncle, a big brother or sister", line: "Strides in at just the right moment." }
    ],
    villain: { name: "The Wolf", line: "Our own comical, far-too-grinny Wolf. Silly rather than scary, and never a member of your family." },
    sample: "Grandma peeped out of the window and saw a long grey tail. <b>“A wolf in a hurry,”</b> she said, and picked up her rolling pin."
  },
  goldilocks: {
    slug: "goldilocks", name: "Goldilocks and the Three Bears", short: "Goldilocks", color: "sun",
    line: "Porridge, chairs and beds: one curious child and three very patient bears."
  },
  pigs: {
    slug: "three-little-pigs", name: "The Three Little Pigs", short: "Three Little Pigs", color: "pink",
    line: "Straw, sticks and bricks, and a family who build something that lasts."
  },
  cinderella: {
    slug: "cinderella", name: "Cinderella", short: "Cinderella", color: "sky",
    line: "Our own telling, with kind stepsisters and a fairy godmother who looks a lot like Grandma."
  },
  sleeping: {
    slug: "sleeping-beauty", name: "Sleeping Beauty", short: "Sleeping Beauty", color: "grape",
    line: "Good fairies, a hundred-year nap and a castle full of familiar faces."
  }
};

/* Simple cover motifs (our own drawings). */
FST.motifs = {
  redhood: '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M60 14c-24 0-38 22-38 46v44h76V60c0-24-14-46-38-46z" fill="#fff" opacity=".95"/><circle cx="60" cy="58" r="17" fill="#F6D2B8"/><path d="M41 52c4-14 34-14 38 0-8-6-30-6-38 0z" fill="#7a3b1e"/><circle cx="54" cy="60" r="2.2" fill="#1E1A33"/><circle cx="66" cy="60" r="2.2" fill="#1E1A33"/><path d="M54 67q6 5 12 0" stroke="#1E1A33" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M38 86h44l-5 20H43z" fill="#9A5B34"/><path d="M44 86q16-16 32 0" stroke="#9A5B34" stroke-width="4" fill="none"/></svg>',
  goldilocks: '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M8 62h44q-2 22-22 22T8 62z" fill="#fff"/><path d="M58 70h34q-2 17-17 17T58 70z" fill="#fff" opacity=".9"/><path d="M96 76h20q-1 11-10 11T96 76z" fill="#fff" opacity=".8"/><path d="M30 58q-6-10 0-18M75 66q-5-8 0-14M106 72q-4-6 0-10" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/></svg>',
  pigs: '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M20 56 60 24l40 32v50H20z" fill="#fff"/><rect x="76" y="26" width="10" height="20" fill="#fff"/><rect x="50" y="76" width="20" height="30" rx="10" fill="#D9467C"/><g fill="#D9467C" opacity=".35"><rect x="26" y="62" width="16" height="7"/><rect x="44" y="62" width="16" height="7"/><rect x="62" y="62" width="16" height="7"/><rect x="80" y="62" width="14" height="7"/><rect x="26" y="88" width="16" height="7"/><rect x="78" y="88" width="16" height="7"/></g></svg>',
  cinderella: '<svg viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="60" cy="70" rx="40" ry="32" fill="#fff"/><path d="M60 38v-14" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M60 26q12-10 22-4-10 4-22 4z" fill="#fff"/><path d="M40 44q-10 26 0 54M80 44q10 26 0 54M60 38v64" stroke="#1489BD" stroke-width="3" fill="none" opacity=".4"/><circle cx="28" cy="102" r="9" fill="#fff" opacity=".85"/><circle cx="92" cy="102" r="9" fill="#fff" opacity=".85"/></svg>',
  sleeping: '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M60 58v52" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M60 84q-16-4-22-16 14 0 22 10M60 96q14-4 20-14-12 0-20 8" fill="#fff"/><circle cx="60" cy="40" r="22" fill="#fff"/><path d="M60 22q12 6 8 18-6-8-16-6 0-8 8-12z" fill="#7036B8" opacity=".35"/><path d="M44 44q8 10 22 6" stroke="#7036B8" stroke-width="2.5" fill="none" opacity=".45"/></svg>'
};

FST.esc = function (s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
};
