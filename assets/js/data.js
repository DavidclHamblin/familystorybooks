/* Family Storybooks: catalogue and settings shared by every page.
   src/build.py reads this file (with node), so it is the one source of truth. */
var FST = window.FST = window.FST || {};

FST.config = {
  // Waitlist sign-ups are emailed to hello@ via FormSubmit (formsubmit.co), the same as Family Board Books.
  formEndpoint: "https://formsubmit.co/ajax/hello@familyboardbooks.com",
  email: "hello@familyboardbooks.com",
  foundingDiscount: 15,
  boardBooks: "https://www.familyboardbooks.com",
  // Shared photo and cartoon service (the Family Board Books worker). Draws the "Meet the characters" page.
  api: "https://familyboardbooks-api.silent-forest-c98a.workers.dev"
};

/* Shipping regions, the same as Family Board Books. Ordering is closed in both until checkout opens;
   the UK also waits for UK VAT. "notice" shows as a bar under the header. */
FST.regions = {
  uk: { id: "uk", label: "UK · £", name: "United Kingdom", currency: "£", notice: "" },
  eu: { id: "eu", label: "EU · €", name: "Europe", currency: "€", notice: "" }
};

/* Launch prices in euros. UK prices in pounds come from the fixed table FST.gbp, keyed by the euro price.
   These are provisional until the printer quote is in. Keep them the same as the prices in Shopify. */
FST.prices = {
  book: { name: "Your storybook", price: 39, pages: "Hardcover, 12 illustrated spreads",
          detail: "Your family as the characters, a “Meet the characters” page, your child's name on the cover and a dedication page." },
  copy: { name: "Extra copy", price: 25, pages: "The same book again",
          detail: "Ordered with your book, for grandparents, cousins and godparents." },
  giftbox: { name: "Gift box", price: 5 }
};
FST.gbp = { 39: 34, 25: 22, 5: 4 };

/* Stories. "ready" stories are written and illustrated; the rest are coming soon.
   Roles are the parts the family plays. Villains are always our own characters, never family. */
FST.order = ["redhood", "goldilocks", "pigs", "cinderella", "sleeping"];
FST.stories = {
  redhood: {
    slug: "little-red-riding-hood", name: "Little Red Riding Hood", short: "Little Red", color: "red", ready: true,
    line: "A walk in the woods, a very silly Wolf, and a Grandma who's nobody's fool.",
    blurb: "Little Red sets off through the forest with a basket of honey buns for Grandma. The Wolf has a plan, but Grandma has a rolling pin. Our gentle retelling: nobody gets eaten, and the Wolf runs off over the hill.",
    spreads: 12,
    /* key: the role in the cartoon service (worker/src/stories.js in familyboardbooks).
       example: the name used in the preview until the family types their own. */
    roles: [
      { key: "hero", name: "Little Red", who: "Your child", example: "Amara", label: "Your child's name", required: true,
        line: "The hero, in a strawberry-red hooded cape with a basket for Grandma." },
      { key: "mum", name: "Mum", who: "Mum, Dad or any grown-up", example: "Mummy", label: "What your child calls them",
        line: "Packs the basket and waves Little Red off at the cottage door." },
      { key: "grandma", name: "Grandma", who: "Grandma, Grandad or any grandparent", example: "Granny", label: "What your child calls them",
        line: "Spots the Wolf at the window and springs the surprise." },
      { key: "helper", name: "The woodcutter", who: "Dad, an uncle, a big brother or sister", example: "Daddy", label: "What your child calls them",
        line: "Strides in at just the right moment." }
    ],
    villain: { name: "The Wolf", line: "Our own comical, far-too-grinny Wolf. Silly rather than scary, and never a member of your family." },
    title: "Little Red {hero}",
    dedication: "For {hero}, with love from {grandma}",
    /* The story, one entry per double-page spread. {hero}, {mum}, {grandma} and {helper} become the family's names.
       side: where the words sit on the picture. scene: which backdrop the preview uses. pic: what the picture shows. */
    pages: [
      { side: "right", scene: "cottage", pic: "Little Red outside the cottage with the crooked chimney",
        text: "At the edge of the Whispering Wood, in a cottage with a crooked chimney, lived {hero}.\n{hero} had a cape as red as a ripe strawberry, so everyone called {hero} Little Red." },
      { side: "right", scene: "kitchen", pic: "{mum} hands Little Red the basket in the sunny kitchen",
        text: "One sunny morning, {mum} packed a basket: warm honey buns, a jar of soup and a bunch of daisies.\n“{grandma} has a sniffly nose,” said {mum}. “Take this to her, straight down the path. No dawdling, and don't talk to strangers!”" },
      { side: "left", scene: "wood", pic: "Little Red walks between the tall green trees",
        text: "“Straight down the path!” said Little Red, and off went the red cape, tip-tap, tip-tap, between the tall green trees.\nThe birds sang hello. The squirrels waved their tails." },
      { side: "left", scene: "wood", wolf: true, pic: "The Wolf peeks out from behind a mossy log",
        text: "But behind a mossy log, two yellow eyes were watching.\n“Good morning, little one,” purred the Wolf, with a smile far too wide. “Where are you going with that delicious-smelling basket?”" },
      { side: "right", scene: "glade", wolf: true, pic: "Little Red picks bluebells while the Wolf sneaks away",
        text: "Little Red forgot all about strangers. “To {grandma}'s house, past the three tall pines!”\n“How lovely,” said the Wolf. “Why not pick some bluebells?” And while Little Red picked, the Wolf ran, swish!, the short way through the trees." },
      { side: "right", scene: "cottage", wolf: true, pic: "{grandma} spots the Wolf's tail from the window",
        text: "Knock, knock. “Who's there?” called {grandma}.\n“It's me, Little Red,” squeaked the Wolf in his very best little voice.\nBut {grandma} was nobody's fool. She peeked through the window, spotted a long grey tail, and hid in the wardrobe. She took her rolling pin with her." },
      { side: "left", scene: "bedroom", wolf: true, pic: "The Wolf in bed, in a nightcap and round glasses",
        text: "The Wolf crept in. He put on {grandma}'s spare nightcap and her round reading glasses, and hopped into bed.\n“Hee hee,” he chuckled. “Lunch will be here any minute.”" },
      { side: "left", scene: "bedroom", wolf: true, pic: "Little Red, holding bluebells, looks at the bed",
        text: "Little Red skipped up the path with a fistful of bluebells.\n“Hello, {grandma}! Oh… {grandma}, what big EARS you have!”\n“All the better to hear you with,” said a voice from the bed." },
      { side: "right", scene: "bedroom", wolf: true, pic: "The Wolf grins to show his very big teeth",
        text: "“{grandma}, what big EYES you have!”\n“All the better to see you with.”\n“And {grandma}… what big TEETH you have!”\n“All the better to…”" },
      { side: "left", scene: "bedroom", wolf: true, pic: "{grandma} bursts out with the rolling pin and {helper} strides in",
        text: "“STOP RIGHT THERE!”\nThe wardrobe burst open, and out came {grandma} with her rolling pin. In through the door came {helper}, who had been chopping wood nearby and had heard every word." },
      { side: "right", scene: "hill", wolf: true, pic: "The Wolf runs over the hill while everyone waves",
        text: "The Wolf leapt out of bed so fast that the nightcap flew one way and the glasses flew the other.\nHe ran out of the door, over the hill and far, far away, and he was never seen in the Whispering Wood again." },
      { side: "right", scene: "kitchen", pic: "{grandma}, {helper} and Little Red share honey buns and soup",
        text: "Then {grandma}, {helper} and Little Red sat down together for honey buns and soup.\n“Next time,” said Little Red, “I'll stay on the path.”\n“And I'll keep my rolling pin handy,” laughed {grandma}.\nThe End." }
    ],
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
