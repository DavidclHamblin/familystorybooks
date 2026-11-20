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
  api: "https://familyboardbooks-api.silent-forest-c98a.workers.dev",
  /* "My orders" page (account.html): Shopify customer accounts through the Customer Account API.
     clientId comes from Shopify admin > Sales channels > Headless > Customer Account API (a public ID, not a secret).
     Until it is filled in, the page says order tracking opens with ordering. */
  /* Checkout: the same Shopify store and public Storefront token as Family Board Books (Headless channel).
     One product, handle "family-storybook", with two variants: SKU FST-BOOK (the book) and FST-COPY (an extra copy).
     The story and names travel on the order line. Keep checkoutLive false until David opens ordering;
     add #shoptest to a story page's address to try checkout before then. */
  shopify: { domain: "nuwppy-0s.myshopify.com", token: "8f6930448d2a7ff75a544f49cb66e124", apiVersion: "2025-07",
             checkoutLive: false, handle: "family-storybook", maxCopies: 5 },
  // The customer's private page for checking and approving every page (proof.html?d=<draft>#<token>).
  site: "https://www.familystorybooks.co.uk",
  accounts: { shop: "nuwppy-0s.myshopify.com", shopId: "106338746711", apiVersion: "2025-07",
              clientId: "86dee738-3dae-4025-9e56-952317f2dd25", brand: "fst" }
};

/* Every Family Presents site sells from the same Shopify store, so orders are sorted into brands by SKU prefix. */
FST.brands = [
  { id: "fst", prefix: "FST-", name: "Family Storybooks", url: "https://www.familystorybooks.co.uk" },
  { id: "fbb", prefix: "FBB-", name: "Family Board Books", url: "https://www.familyboardbooks.com" },
  { id: "flr", prefix: "FLR-", name: "Family Learn to Read", url: "" },
  { id: "fjg", prefix: "FJG-", name: "Family Jigsaws", url: "" }
];

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
          detail: "Ordered with your book, for grandparents, cousins and godparents." }
};
FST.gbp = { 39: 34, 25: 22 };

/* Stories. "ready" stories are written and illustrated; the rest are coming soon.
   Roles are the parts the family plays. Villains are always our own characters, never family. */
FST.order = ["redhood", "goldilocks", "pigs", "cinderella", "sleeping"];
FST.stories = {
  redhood: {
    slug: "little-red-riding-hood", name: "Little Red Riding Hood", short: "Little Red", color: "red", ready: true,
    /* Our own stand-in characters (hero, mum, grandma, helper) and the villain, drawn by the cartoon service in the
       book's painted style. A part with no family photo uses its stand-in. Files: <art><key>.webp
       Example pictures for each spread (painted with the stand-ins): <art>s<n>.webp. hero: the spread shown at the top of the page. */
    art: "assets/img/redhood/",
    hero: 9,
    // Story pages painted with the family's own characters in the free preview, best first
    // (no Wolf pages: our Wolf is not in their draft). Two are painted, if their characters are drawn.
    samples: [2, 12, 1, 3],
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
      { side: "right", cast: ["hero"], scene: "cottage", pic: "Little Red outside the cottage with the crooked chimney",
        text: "At the edge of the Whispering Wood, in a cottage with a crooked chimney, lived {hero}.\n{hero} had a cape as red as a ripe strawberry, so everyone called {hero} Little Red." },
      { side: "right", cast: ["mum", "hero"], scene: "kitchen", pic: "{mum} hands Little Red the basket in the sunny kitchen",
        text: "One sunny morning, {mum} packed a basket: warm honey buns, a jar of soup and a bunch of daisies.\n“{grandma} has a sniffly nose,” said {mum}. “Take this to her, straight down the path. No dawdling, and don't talk to strangers!”" },
      { side: "left", cast: ["hero"], scene: "wood", pic: "Little Red walks between the tall green trees",
        text: "“Straight down the path!” said Little Red, and off {she} went in {her} red cape, skipping between the tall green trees.\nThe birds sang hello. The squirrels waved their tails." },
      { side: "left", cast: ["hero"], scene: "wood", wolf: true, pic: "The Wolf peeks out from behind a mossy log",
        text: "But behind a mossy log, two yellow eyes were watching.\n“Good morning, little one,” purred the Wolf, with a smile far too wide. “Where are you going with that delicious-smelling basket?”" },
      { side: "right", cast: ["hero"], scene: "glade", wolf: true, pic: "Little Red picks bluebells while the Wolf sneaks away",
        text: "Little Red forgot all about not talking to strangers. “To {grandma}'s house, past the three tall pines!” {she} replied to the Wolf.\n“How lovely,” said the Wolf. “Why not pick some bluebells?” And while Little Red picked the flowers, the Wolf ran the short way through the trees to {grandma}'s house." },
      { side: "right", cast: ["grandma"], scene: "cottage", wolf: true, pic: "{grandma} spots the Wolf's tail from the window",
        text: "Knock, knock. “Who's there?” called {grandma}.\n“It's me, Little Red,” squeaked the Wolf in his very best little voice.\nBut {grandma} was nobody's fool. She peeked through the window, spotted a long grey tail, and hid in the wardrobe. She took her rolling pin with her." },
      { side: "left", cast: [], scene: "bedroom", wolf: true, pic: "The Wolf in bed, in a nightcap and round glasses",
        text: "The Wolf crept in. He put on {grandma}'s spare nightcap and her round reading glasses, and hopped into bed.\n“Hee hee,” he chuckled. “Lunch will be here any minute.”" },
      { side: "left", cast: ["hero"], scene: "bedroom", wolf: true, pic: "Little Red, holding bluebells, looks at the bed",
        text: "Little Red skipped up the path with a fistful of bluebells.\n“Hello, {grandma}! Oh… {grandma}, what big EARS you have!”\n“All the better to hear you with,” said a voice from the bed." },
      { side: "right", cast: ["hero"], scene: "bedroom", wolf: true, pic: "The Wolf grins to show his very big teeth",
        text: "“{grandma}, what big EYES you have!”\n“All the better to see you with.”\n“And {grandma}… what big TEETH you have!”\n“All the better to…”" },
      { side: "left", cast: ["grandma", "helper", "hero"], scene: "bedroom", wolf: true, pic: "{grandma} bursts out with the rolling pin and {helper} strides in",
        text: "“STOP RIGHT THERE!”\nThe wardrobe burst open, and out came {grandma} with her rolling pin. In through the door came {helper}, who had been chopping wood nearby and had heard every word." },
      { side: "right", cast: ["grandma", "helper", "hero"], scene: "hill", wolf: true, pic: "The Wolf runs over the hill while everyone waves",
        text: "The Wolf leapt out of bed so fast that the nightcap flew one way and the glasses flew the other.\nHe ran out of the door, over the hill and far, far away, and he was never seen in the Whispering Wood again." },
      { side: "right", cast: ["grandma", "helper", "hero"], scene: "kitchen", pic: "{grandma}, {helper} and Little Red share honey buns and soup",
        text: "Then {grandma}, {helper} and Little Red sat down together for honey buns and soup.\n“Next time,” said Little Red, “I'll stay on the path.”\n“And I'll keep my rolling pin handy,” laughed {grandma}.\nThe End." }
    ],
  },
  goldilocks: {
    slug: "goldilocks", name: "Goldilocks and the Three Bears", short: "Goldilocks", color: "sun", ready: true,
    art: "assets/img/goldilocks/",
    hero: 4,
    samples: [1, 11, 3, 4],
    line: "Porridge, chairs and beds: one curious child and three very patient bears.",
    blurb: "Goldilocks wanders off the path and into the bears' cottage: porridge, chairs and beds, and three very surprised bears. Our gentle retelling ends with a big sorry, a mended chair and an invitation to tea.",
    spreads: 12,
    roles: [
      { key: "hero", name: "Goldilocks", who: "Your child", example: "Amara", label: "Your child's name", required: true,
        line: "The curious explorer, in a buttercup-yellow jumper and red wellies." },
      { key: "mum", name: "Mum", who: "Mum, Dad or any grown-up", example: "Mummy", label: "What your child calls them",
        line: "Waves Goldilocks off at the garden gate." },
      { key: "helper", name: "The chair-mender", who: "Dad, a grandparent, an uncle or aunt", example: "Daddy", label: "What your child calls them",
        line: "Helps put things right, toolbox in hand." }
    ],
    villain: { name: "The Three Bears", line: "Big Bear, Middle Bear and Little Bear: our own friendly bears, drawn once and the same on every page." },
    title: "{hero} and the Three Bears",
    dedication: "For {hero}, with love from {mum}",
    pages: [
      { side: "right", cast: ["mum", "hero"], pic: "{mum} waves as Goldilocks sets off for the wood",
        text: "At the edge of the Honeycomb Wood lived {hero}, whose hair shone as bright as buttercups, so everyone called {her} Goldilocks.\n{hero} loved exploring. “Stay on the path,” said {mum}, “and be home in time for tea!”" },
      { side: "left", cast: [], villain: true, pic: "The three bears and their three bowls of porridge",
        text: "Deep in the wood, in a cosy cottage, lived three bears: Big Bear, Middle Bear and Little Bear.\nOne morning they made porridge. “Too hot!” said Big Bear. “Let's go for a walk while it cools.”" },
      { side: "right", cast: ["hero"], pic: "Goldilocks peeps in at the bears' open door",
        text: "Along came {hero}, chasing a butterfly far, far from the path. “A little cottage!”\nThe door was open. “Hello?” called {hero}. Nobody answered. So, very quietly, {she} tiptoed in." },
      { side: "left", cast: ["hero"], pic: "Goldilocks eats the little bowl of porridge",
        text: "On the table sat three bowls of porridge. {hero} tried the big bowl. “Too hot!”\n{she} tried the middle bowl. “Too cold!”\n{she} tried the little bowl. “Just right!” And {she} ate it all up." },
      { side: "right", cast: ["hero"], pic: "The little chair breaks with a CRACK",
        text: "By the fire stood three chairs. The big chair was too hard. The middle chair was too squashy.\nThe little chair was just right, until… CRACK! It broke into pieces. “Oh dear,” said {hero}." },
      { side: "left", cast: ["hero"], pic: "Goldilocks asleep in the littlest bed",
        text: "Up the stairs were three beds. The big bed was too lumpy. The middle bed was too bouncy.\nThe little bed was just right. {hero} snuggled down, yawned a great big yawn, and fell fast asleep." },
      { side: "right", cast: [], villain: true, pic: "The bears find their porridge eaten",
        text: "Home came the three bears. “Someone's been eating my porridge,” growled Big Bear.\n“Someone's been eating my porridge,” said Middle Bear.\n“Someone's been eating MY porridge,” squeaked Little Bear, “and they've eaten it ALL UP!”" },
      { side: "left", cast: [], villain: true, pic: "Little Bear's broken chair",
        text: "“Someone's been sitting in my chair,” growled Big Bear.\n“Someone's been sitting in my chair,” said Middle Bear.\n“Someone's been sitting in MY chair,” sniffed Little Bear, “and they've broken it!”" },
      { side: "right", cast: ["hero"], villain: true, pic: "The bears find Goldilocks asleep",
        text: "Up the stairs went the bears, creak, creak, creak.\n“Someone's been sleeping in my bed,” said Big Bear and Middle Bear.\n“Someone's been sleeping in MY bed,” squeaked Little Bear, “and here {she} is!”" },
      { side: "left", cast: ["hero"], villain: true, pic: "Goldilocks runs out of the cottage",
        text: "{hero} opened {her} eyes and saw three furry faces. “BEARS!”\n{she} jumped out of bed, down the stairs and out of the door, and ran all the way home to {mum} and {helper}." },
      { side: "right", cast: ["mum", "helper", "hero"], pic: "{helper} talks with Goldilocks at home",
        text: "“What a fright you gave them,” said {helper}, “and what a mess you left. Did you say sorry?”\n{hero} thought about the porridge and the broken chair. “No,” {she} said quietly.\n“Then let's put it right.”" },
      { side: "left", cast: ["mum", "helper", "hero"], villain: true, pic: "Tea with the bears and a mended chair",
        text: "So back they went with fresh porridge, a honey cake and a toolbox. {hero} said sorry, and {helper} mended the little chair good as new.\n“Will you come to tea again?” asked Little Bear.\n“Yes please,” said {hero}. “But next time, I'll knock first!”\nThe End." }
    ]
  },
  pigs: {
    slug: "three-little-pigs", name: "The Three Little Pigs", short: "Three Little Pigs", color: "pink", ready: true,
    art: "assets/img/pigs/",
    hero: 10,
    samples: [1, 12, 4, 3],
    line: "Straw, sticks and bricks, and a family who build something that lasts.",
    blurb: "Three little pigs build three little houses, and the Wolf has a terrible cold. Every huff ends in a giant sneeze, until he meets a house of bricks and a tub of cold, bubbly water.",
    spreads: 12,
    roles: [
      { key: "hero", name: "The brick builder", who: "Your child", example: "Amara", label: "Your child's name", required: true,
        line: "The clever little pig who builds with bricks." },
      { key: "big", name: "The straw builder", who: "A brother, sister, cousin or grown-up", example: "Leo", label: "Their name",
        line: "Builds with straw, then naps in the sun." },
      { key: "middle", name: "The stick builder", who: "A brother, sister, cousin or grown-up", example: "Maya", label: "Their name",
        line: "Builds with sticks, then runs off to play." },
      { key: "mum", name: "Mother Pig", who: "Mum, Dad or any grown-up", example: "Mummy", label: "What your child calls them",
        line: "Sends the little pigs off to build their houses." }
    ],
    villain: { name: "The Wolf", line: "Our own Wolf, with a terrible cold: every huff ends in a giant sneeze. Never a member of your family." },
    title: "{hero} and the Three Little Pigs",
    dedication: "For {hero}, with love from {mum}",
    pages: [
      { side: "right", cast: ["mum", "big", "middle", "hero"], pic: "{mum} waves the three little pigs off",
        text: "Once upon a time, three little pigs, {big}, {middle} and {hero}, lived with {mum} in a happy, muddy farmhouse.\nOne morning {mum} said, “You're big enough to build your own houses now. Build them strong!”" },
      { side: "left", cast: ["big"], pic: "{big} naps by the house of straw",
        text: "{big} built a house of straw. Swish, swoosh, finished before lunch!\n“Easy-peasy,” said {big}, and lay down in the sunshine for a nap." },
      { side: "right", cast: ["middle"], pic: "{middle} finishes the house of sticks",
        text: "{middle} built a house of sticks. Tap, tap, tap, finished by teatime!\n“Easy-peasy,” said {middle}, and ran off to play." },
      { side: "left", cast: ["hero"], pic: "{hero} lays the last brick by moonlight",
        text: "{hero} built a house of bricks. Slap went the mortar, clunk went each brick, all day long until the moon came up.\n“That's a lot of work,” yawned the others. “Strong is worth it,” said {hero}." },
      { side: "right", cast: ["big"], villain: true, pic: "The Wolf knocks at the straw house",
        text: "Along came the Wolf, sniffing and snuffling with a terrible cold.\n“Little pig, little pig, let me come in!”\n“Not by the hair on my chinny-chin-chin!” said {big}." },
      { side: "left", cast: ["big"], villain: true, pic: "AAA-CHOO! The straw house blows away",
        text: "“Then I'll huff, and I'll puff, and I'll… AAA-CHOO!”\nAway flew the straw house. {big} ran to {middle}'s house of sticks as fast as two trotters could go." },
      { side: "right", cast: ["big", "middle"], villain: true, pic: "The stick house tumbles down",
        text: "“Little pigs, little pigs, let me come in!” “Not by the hair on our chinny-chin-chins!”\n“Then I'll huff, and I'll puff, and I'll… AAA-CHOO!” Down tumbled the sticks, and two little pigs ran all the way to {hero}'s house of bricks." },
      { side: "left", cast: ["big", "middle", "hero"], villain: true, pic: "The brick house doesn't wobble one bit",
        text: "“Little pigs, little pigs, let me come in!”\n“Not by the hair on our chinny-chin-chins!” called all three.\nThe Wolf huffed, and he puffed, until his ears went pink. The brick house didn't wobble one bit." },
      { side: "right", cast: ["big", "middle", "hero"], villain: true, pic: "The Wolf climbs onto the roof",
        text: "“Then I'll come down the chimney!” sniffed the Wolf, and up onto the roof he scrambled.\nInside, {hero} had an idea. “Quick! Fill the big tub with cold water, and lots of bubbles!”" },
      { side: "left", cast: ["big", "middle", "hero"], villain: true, pic: "SPLASH! The Wolf lands in the bubbly tub",
        text: "Down the chimney slid the Wolf, faster and faster, and… SPLASH! Straight into the tub of cold, bubbly water.\n“BRRRR!” he howled, with bubbles on his nose and his ears." },
      { side: "right", cast: ["big", "middle", "hero"], villain: true, pic: "The Wolf runs off, dripping and sneezing",
        text: "Out of the door shot the Wolf, dripping and sneezing, over the hill and far, far away.\nAnd he never came huffing and puffing round there again." },
      { side: "left", cast: ["mum", "big", "middle", "hero"], pic: "Soup by the fire in the new brick house",
        text: "That evening {mum} came to visit. Together they built a bigger brick house, with room for everyone, and ate hot soup by the fire.\n“Strong is worth it,” said {big} and {middle}. {hero} just smiled.\nThe End." }
    ]
  },
  cinderella: {
    slug: "cinderella", name: "Cinderella", short: "Cinderella", color: "sky", ready: true,
    art: "assets/img/cinderella/",
    hero: 10,
    samples: [3, 5, 4, 7],
    line: "Our own telling, with a kind stepsister and a fairy godmother who looks a lot like Grandma.",
    blurb: "Sour Lady Pinchworth keeps Cinderella scrubbing, but a kind stepsister and a Fairy Godmother who looks a lot like Grandma have other ideas. Our own gentle telling: a pumpkin coach, a glass slipper, and a ball where everyone is invited.",
    spreads: 12,
    roles: [
      { key: "hero", name: "Cinderella", who: "Your child", example: "Amara", label: "Your child's name", required: true,
        line: "Kind and hard-working, with a gown of moonlight and roses for the ball." },
      { key: "grandma", name: "The Fairy Godmother", who: "Grandma, Grandad or any grandparent", example: "Granny", label: "What your child calls them",
        line: "Arrives with a twinkle and a pop, and a pumpkin plan." },
      { key: "sister", name: "The kind stepsister", who: "A sister, brother, cousin or friend", example: "Maya", label: "Their name",
        line: "Holds Cinderella's hand, and asks if she can try the slipper." }
    ],
    villain: { name: "Lady Pinchworth and the Prince", line: "Our own characters: a sour (but comical) stepmother, and a friendly Prince. Never a member of your family." },
    title: "Cinderella {hero}",
    dedication: "For {hero}, with love from {grandma}",
    pages: [
      { side: "right", cast: ["hero", "sister"], villain: true, pic: "Lady Pinchworth snaps orders while Cinderella scrubs",
        text: "Once upon a time, {hero} lived with {her} stepmother, Lady Pinchworth, and {her} stepsister, {sister}.\nLady Pinchworth was as sour as a lemon. “Scrub the floors! Sweep the chimney!” she snapped, all day long. Only {sister} was kind." },
      { side: "left", cast: ["hero", "sister"], villain: true, pic: "The golden invitation",
        text: "One day a golden invitation arrived. “A ball at the palace!” cried Lady Pinchworth. “{sister} and I shall go. {hero}, you will stay here and clean.”\n{sister} squeezed {hero}'s hand. “I'm so sorry,” {sister} whispered." },
      { side: "right", cast: ["hero", "grandma"], pic: "{grandma} appears as the Fairy Godmother",
        text: "When they had gone, {hero} sat by the fire and cried.\nThen, with a twinkle and a pop, there stood {grandma}, with a wand and a sparkly shawl. “Dry your eyes, my darling. I'm your Fairy Godmother, and you SHALL go to the ball!”" },
      { side: "left", cast: ["hero", "grandma"], pic: "A pumpkin becomes a golden coach",
        text: "“Fetch me a pumpkin!” With one wave of the wand it grew into a golden coach.\nSix white mice became six prancing horses, and the sleepy old cat became a coachman with very fine whiskers." },
      { side: "right", cast: ["hero", "grandma"], pic: "Cinderella's gown of moonlight and roses",
        text: "Another wave, and {hero}'s raggedy clothes became a gown the colour of moonlight and roses, with two sparkling glass slippers.\n“But remember,” said {grandma}, “at midnight, the magic ends!”" },
      { side: "left", cast: ["hero", "sister"], villain: true, pic: "Cinderella dances with the Prince",
        text: "At the palace, everyone stopped to stare. The Prince bowed. “Would you like to dance?”\nRound and round they twirled, and {sister} clapped loudest of all. Lady Pinchworth didn't recognise {hero} one bit." },
      { side: "right", cast: ["hero"], pic: "Midnight, and a slipper left behind",
        text: "BONG! The clock began to strike twelve.\n“Oh no!” cried {hero}, and ran down the palace steps so fast that one glass slipper slipped off and was left behind." },
      { side: "left", cast: [], villain: true, pic: "The Prince arrives with the glass slipper",
        text: "Next morning, the Prince went from house to house with the glass slipper.\n“Whoever it fits,” he said, “is the dancer I'm looking for.” Knock, knock! went the door of Lady Pinchworth's house." },
      { side: "right", cast: ["hero", "sister"], villain: true, pic: "Lady Pinchworth's foot won't fit",
        text: "“It's mine!” cried Lady Pinchworth. She pushed and she squeezed. Her toes wouldn't go in. Her heel stuck out.\nShe hopped and she wobbled until… POP! The slipper flew across the room, and the Prince caught it." },
      { side: "left", cast: ["hero", "sister"], villain: true, pic: "The slipper fits",
        text: "“May {hero} try?” asked {sister}. Lady Pinchworth huffed.\nBut the slipper slid onto {hero}'s foot, just right. And from {her} apron pocket, {hero} took out the other one." },
      { side: "right", cast: ["hero", "grandma"], villain: true, pic: "Lady Pinchworth says sorry",
        text: "With a twinkle and a pop, {grandma} appeared again. “Well done, my darling.”\nLady Pinchworth went as pink as a radish, and for the very first time in her life, she said, “Sorry.”" },
      { side: "left", cast: ["hero", "grandma", "sister"], villain: true, pic: "Everyone dances at the ball",
        text: "That night there was another ball, and everyone was invited. {hero} danced with the Prince, {sister} danced with {grandma}, and even Lady Pinchworth tapped her toes.\nAnd they all lived happily ever after.\nThe End." }
    ]
  },
  sleeping: {
    slug: "sleeping-beauty", name: "Sleeping Beauty", short: "Sleeping Beauty", color: "grape", ready: true,
    art: "assets/img/sleeping/",
    hero: 10,
    samples: [10, 5, 9, 6],
    line: "Good fairies, a hundred-year nap and a castle full of familiar faces.",
    blurb: "A grumpy fairy, a dusty spinning wheel and a whole castle fast asleep. In our gentle telling, it's a song from the good fairy (who looks a lot like Grandma) that wakes everyone up, and even Fairy Grumblethorn gets a party invitation.",
    spreads: 12,
    roles: [
      { key: "hero", name: "The young royal", who: "Your child", example: "Amara", label: "Your child's name", required: true,
        line: "Kind, curious and full of laughter, with a little gold crown." },
      { key: "mum", name: "The Queen", who: "Mum, Dad or any grown-up", example: "Mummy", label: "What your child calls them",
        line: "Throws the biggest party the kingdom has ever seen." },
      { key: "helper", name: "The King", who: "Dad, Mum or any grown-up", example: "Daddy", label: "What your child calls them",
        line: "Hides every spinning wheel in the land." },
      { key: "grandma", name: "The good fairy", who: "Grandma, Grandad or any grandparent", example: "Granny", label: "What your child calls them",
        line: "The wisest fairy of all, whose song wakes the castle." }
    ],
    villain: { name: "Fairy Grumblethorn", line: "Our own grumpy (but comical) fairy, who just wanted an invitation. Never a member of your family." },
    title: "{hero} and the Sleeping Castle",
    dedication: "For {hero}, with love from {grandma}",
    pages: [
      { side: "right", cast: ["mum", "helper"], pic: "The Queen and King show off baby {hero}",
        text: "In a castle covered in roses lived King {helper} and Queen {mum}.\nWhen their baby {hero} was born, they threw the biggest party the kingdom had ever seen, and invited every fairy in the land… except one." },
      { side: "left", cast: ["grandma"], pic: "The good fairies bring their gifts",
        text: "The good fairies brought wonderful gifts. “Kindness,” said one. “Laughter,” said another.\nLast of all came {grandma}, the wisest fairy of them all. But before {grandma} could speak, the great doors burst open." },
      { side: "right", cast: ["mum", "helper"], villain: true, pic: "Fairy Grumblethorn sweeps in",
        text: "In swept Fairy Grumblethorn, in a puff of grumpy green smoke. “No invitation for ME?” she snapped.\n“Then here's my gift. Before {her} seventh birthday, {hero} will prick a finger on a spinning wheel and fall asleep for a hundred years!”" },
      { side: "left", cast: ["grandma", "mum", "helper"], pic: "{grandma} changes the spell",
        text: "Everyone gasped. But {grandma} stepped forward.\n“I can't undo that spell,” {grandma} said gently, “but I can change it. {hero} will sleep, but a song sung with love will wake {her} up again.”" },
      { side: "right", cast: ["hero"], pic: "{hero} chasing butterflies in the rose garden",
        text: "The King hid every spinning wheel in the kingdom.\nYears went by, and {hero} grew up kind and full of laughter, climbing trees and chasing butterflies through the rose garden." },
      { side: "left", cast: ["hero"], pic: "The old spinning wheel at the top of the stairs",
        text: "The day before {her} seventh birthday, {hero} found a dusty little staircase that {she} had never seen before.\nAt the top sat an old spinning wheel, whirring all by itself. “What's this?” {she} wondered, and reached out a finger." },
      { side: "right", cast: ["hero", "mum", "helper"], pic: "The whole castle falls asleep",
        text: "Prick! {hero} gave an enormous yawn and fell fast asleep.\nThen the King yawned, the Queen yawned, and the cook, the cat and even the cake-taster yawned, until the whole castle was snoring." },
      { side: "left", cast: [], villain: true, pic: "Thorny roses grow over the castle",
        text: "Roses grew up over the walls, thicker and thornier, until the castle was hidden away.\nFrom behind a tree, Fairy Grumblethorn peeked out and grinned. But deep down, she felt a tiny bit lonely too." },
      { side: "right", cast: ["grandma"], pic: "The hedge parts for {grandma}",
        text: "Far away, {grandma} felt the magic tingle. “It's time.”\n{grandma} flew to the castle, and the thorny hedge parted to let {grandma} through, right up the dusty stair." },
      { side: "left", cast: ["grandma", "hero"], pic: "{grandma}'s song wakes {hero}",
        text: "{grandma} sat beside {hero} and softly sang {her} favourite song.\n{hero}'s eyes fluttered open. “{grandma}! Is it my birthday?”\n“It certainly is,” smiled {grandma}." },
      { side: "right", cast: ["mum", "helper"], villain: true, pic: "The castle wakes up",
        text: "All over the castle, everyone woke up, rubbing their eyes. The roses curled back. The cake-taster finished his slice.\nAnd outside the gate, all alone, stood Fairy Grumblethorn, looking very sorry indeed." },
      { side: "left", cast: ["hero", "mum", "helper", "grandma"], villain: true, pic: "A birthday party for everyone",
        text: "“Would you like to come to my party?” asked {hero}. Fairy Grumblethorn's grumpy face melted into a smile.\nThat night there was the biggest birthday party ever, and this time, everyone was invited.\nThe End." }
    ]
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
