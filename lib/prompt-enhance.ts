/* ─────────────────────────────────────────────────────────────────────────────
   Pixora Intelligent Prompt Enhancement System
   Transforms raw user prompts into world-class AI generation inputs.
   Handles: deity images, portraits, landscapes, animation, and general content.
───────────────────────────────────────────────────────────────────────────── */

/* ─── Hindu Deity Visual Database ────────────────────────────────────────────
   Accurate iconographic descriptions sourced from classical Hindu scriptures
   and traditional artistic representations (Natya Shastra, Vishnu Purana).
─────────────────────────────────────────────────────────────────────────── */
const DEITY_PROFILES: Record<string, string> = {
  hanuman:
    'Lord Hanuman, divine vanara devotee of Ram, vermilion orange complexion, muscular heroic divine physique, wearing saffron dhoti, sacred janeu thread, gold armlets and crown, holding golden gada mace, bhakti devotional expression, flying posture with divine wings, glowing spiritual aura, sacred red tilak on forehead',
  bajrangbali:
    'Lord Hanuman Bajrangbali, divine vanara, vermilion complexion, powerful form, saffron dhoti, golden ornaments, divine gada mace, devotional bhakti pose, divine aura, Himalayan background',
  ram:
    'Lord Rama, seventh avatar of Vishnu, Prince of Ayodhya, sky-blue divine complexion, wearing royal saffron pitambara and gold ornaments, Kirita mukuta crown, holding sacred Kodanda bow with golden arrows, younger brother Lakshmana standing beside, serene compassionate lotus eyes, divine Vaishnava tilak, divine aura and halo',
  rama:
    'Lord Rama, seventh avatar of Vishnu, sky-blue divine complexion, royal saffron attire, Kirita crown, Kodanda bow, serene compassionate expression, divine aura, lotus eyes',
  krishna:
    'Lord Krishna, eighth avatar of Vishnu, sky-blue divine complexion, wearing golden yellow pitambara silk dhoti, peacock feather (morpankh) in crown, playing divine flute (bansuri), Srivatsa mark on chest, Kaustubha gem, golden earrings and ornaments, divine radiant smile, lotus eyes, standing in trihanga pose',
  radha:
    'Goddess Radha Rani, fair golden complexion, wearing yellow and blue silk saree with gold border, divine love personified, holding lotus flowers, near Yamuna river, celestial smile, golden ornaments, divine halo',
  'radha krishna':
    'Radha Krishna divine couple, Lord Krishna sky-blue complexion with flute, Goddess Radha fair complexion in yellow saree, Vrindavan forest background, divine love and devotion, lotus pond, golden divine light, celestial flowers falling',
  shiva:
    'Lord Shiva Mahadev, the destroyer and transformer, fair divine complexion covered with sacred vibhuti ash, matted jata-juta hair with crescent moon (Chandra), holy river Ganga flowing from hair, third eye (triksha) on forehead, wearing tiger skin, garland of rudraksha beads, sacred serpent Vasuki around neck, holding trishul trident and damaru drum, seated in padmasana meditation on tiger skin, Kailash snow mountain background',
  mahadev:
    'Lord Shiva Mahadev, cosmic destroyer form, sacred ash vibhuti, matted jata hair with crescent moon, Ganga flowing, third eye, tiger skin, rudraksha, trishul trident, damaru drum, blue throat (Neelkantha), divine cosmic form, Kailash mountain background, bull Nandi nearby',
  shankar:
    'Lord Shankar Shiva, sacred ash vibhuti, trishul, damaru, rudraksha, crescent moon, divine meditation pose, Kailash background',
  vishnu:
    'Lord Vishnu Narayan, the preserver, sky-blue divine complexion, wearing golden Pitambara silk, Srivatsa mark, Kaustubha gem, garland of forest flowers (Vanamala), four divine arms holding Sudarshana Chakra disc (right upper), Panchajanya conch (left upper), Kaumodaki mace (right lower), lotus flower (left lower), Garuda eagle vehicle, Vaikuntha divine abode background',
  narayan:
    'Lord Vishnu Narayan, sky-blue complexion, four arms, Sudarshana Chakra, Panchajanya conch, golden ornaments, divine Garuda eagle, cosmic ocean (Kshira Sagara) background',
  ganesh:
    'Lord Ganesha Ganapati Vinayaka, elephant head with single tusk, round auspicious divine form, fair/vermilion complexion, four arms holding modak sweet (lower right), lotus flower (upper left), sacred axe parasu (upper right), noose pasha (lower left), ornate golden crown and jewelry, wearing saffron dhoti, mouse (mushaka) vehicle at feet, seated on lotus throne',
  ganesha:
    'Lord Ganesha Vighneshvara, elephant head, large fan-like ears, single intact tusk, round divine body, four arms, modak in hand, lotus, noose, axe, vermilion complexion, golden crown, saffron dhoti, his mouse vehicle, temple background with marigold flowers',
  durga:
    'Goddess Durga Bhavani Chandika, divine warrior goddess, ten arms each holding a divine weapon (trishul, sword, chakra, bow, arrow, lotus, conch, mace, shield, snake), riding golden lion, radiant golden divine complexion, wearing red silk saree, golden crown and ornaments, fierce yet compassionate maternal expression, divine halo, defeating Mahishasura demon, celestial warriors surrounding',
  mata:
    'Divine Goddess Mata, powerful divine feminine form, multiple arms with weapons, riding lion, divine golden light, warrior compassionate expression, wearing red silk, golden ornaments',
  kali:
    'Goddess Kali Mahakali, dark blue complexion, wild flowing black hair, wearing garland of skulls, four arms holding sword, severed demon head, blessing mudra, lotus, standing on recumbent Lord Shiva, tongue out, divine ferocious compassionate expression, cremation ground background, fire and divine light',
  lakshmi:
    'Goddess Lakshmi Mahalakshmi, golden divine complexion, wearing rich red silk Kanchipuram saree with gold border, four arms holding lotus flowers (upper two), gold coins falling from one lower hand, abhaya blessing gesture (other hand), seated on pink lotus, flanked by two white elephants with water pots, golden divine aura, lotus pond background',
  saraswati:
    'Goddess Saraswati Sharada, fair moon-white complexion, wearing white silk saree symbolizing purity, four arms holding Veena (musical instrument, lower right), Vedic palm leaf manuscript (upper left), crystal rosary akshamala (upper right), seated or standing on white lotus, white swan (hamsa) vehicle, serene scholarly divine expression',
  parvati:
    'Goddess Parvati Uma, fair golden complexion, wearing green silk saree, divine consort of Shiva, gentle maternal expression, sitting on Kailash, holding lotus and blessing mudra, divine ornaments and crown',
  sita:
    'Goddess Sita, divine consort of Lord Rama, fair golden complexion, wearing yellow silk saree, holding lotus, gentle devoted expression, forest or palace background, divine aura',
  lakshmana:
    'Lord Lakshmana, loyal brother of Lord Rama, fair complexion, wearing royal golden attire, holding bow and arrow, protective devotional expression, standing beside Lord Rama',
};

/* ─── Content Type Detection ─────────────────────────────────────────────── */
export type ContentType = 'deity' | 'portrait' | 'landscape' | 'architecture' | 'animation' | 'abstract' | 'product' | 'general';

export interface ContentDetection {
  type: ContentType;
  deityKey?: string;
}

const DEITY_KEYWORDS = Object.keys(DEITY_PROFILES);

export function detectContentType(prompt: string): ContentDetection {
  const lower = prompt.toLowerCase();

  const sortedKeys = DEITY_KEYWORDS.sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lower.includes(key)) return { type: 'deity', deityKey: key };
  }
  if (lower.match(/\b(lord|bhagwan|devta|devi|goddess|god|divine|sacred|temple|mandir|puja|aarti|darshan|bhakti|devotion)\b/)) {
    return { type: 'deity', deityKey: undefined };
  }
  if (lower.match(/\b(portrait|headshot|selfie|person|man|woman|girl|boy|baby|child|face|people|human)\b/)) return { type: 'portrait' };
  if (lower.match(/\b(landscape|mountain|forest|ocean|river|lake|sky|sunset|sunrise|nature|valley|waterfall|beach|cliff|jungle|desert)\b/)) return { type: 'landscape' };
  if (lower.match(/\b(building|architecture|city|street|interior|exterior|room|house|skyscraper|bridge|monument)\b/)) return { type: 'architecture' };
  if (lower.match(/\b(anime|cartoon|animated|illustration|painting|artwork|drawing|sketch|manga|comic|pixel art|3d render)\b/)) return { type: 'animation' };
  if (lower.match(/\b(abstract|pattern|texture|geometric|fractal|digital art|surreal|concept art)\b/)) return { type: 'abstract' };
  if (lower.match(/\b(product|item|object|food|bottle|car|phone|watch|jewelry|package)\b/)) return { type: 'product' };
  return { type: 'general' };
}

const QUALITY_BASE = 'ultra detailed, sharp focus, 8K resolution, masterpiece, award winning, professional quality';

export type { ContentType };

const STYLE_ENHATCERS: Record<ContentType, string> = {
  deity: ['traditional Indian devotional art meets photorealistic digital painting','golden divine radiance and sacred aura','celestial light rays and lotus flowers','ornate temple architecture background','spiritual luminescence and divine atmosphere','vivid sacred colors (saffron gold vermilion)',QUALITY_BASE].join(', '),
  portrait: ['professional portrait photography','studio softbox lighting','shallow depth of field f/1.4','Rembrandt three-point lighting','natural skin texture','bright catchlights in eyes','subtle bokeh background','professional retouching',QUALITY_BASE].join(', '),
  landscape: ['professional landscape photography','golden hour warm lighting','dramatic sky with volumetric clouds','HDR processing','wide angle lens perspective','atmospheric depth and haze','ray tracing and god rays','National Geographic quality',QUALITY_BASE].join(', '),
  architecture: ['professional architectural photography','wide angle tilt-shift lens','blue hour twilight lighting','HDR','perfect geometric perspective','clean sharp lines',QUALITY_BASE].join(', '),
  animation: ['high quality digital illustration','vibsant dynamic colors','cinematic scene composition','professional concept art','studio quality rendering',QUALITY_BASE].join(', '),
  abstract: ['abstract digital art','vibsant color palette','complex patterns','high contrast','Octane render quality','holographic elements',QUALITY_BASE].join(', '),
  product: ['professional commercial product photography','white or gradient studio background', 'multiple light sources','sharp focus on product details','advertising quality',QUALITY_BASE].join(', '),
  general: ['professional photography','cinematic lighting','vivid colors','perfect composition','dynamic perspective',QUALITY_BASE].join(', '),
};

const NEGATIVE_BASE = ['ugly','deformed','distorted','bad anatomy','extra limbs','missing limbs','extra fingers','missing fingers','blurry','low quality','pixelated','watermark','text overlay','logo','signature','noise','artifacts','oversaturated','bad proportions','duplicate','cropped','jpeg artifacts'].join(', ');

const NEGATIVE_PROMPTS: Record<ContentType, string> = {
  deity: ['ugly','deformed','disrespectful depiction','offensive','incorrect iconography','western cartoon caricature','inappropriate clothing','nsfw",'violence unless appropriate','incorrect deity features','bad anatomy','blurry','low quality','watermark','text','modern western clothing','incorrect number of arms','wrong symbolic objects'].join(', '),
  portrait: NEGATIVE_BASE + ', asymmetric face, crossed eyes, bad teeth, double face, extra head, bad skin',
  landscape: NEGATIVE_BASE + ', artificial looking, fake HDR, unnatural colors, people',
  architecture: NEGATIVE_BASE + ', distorted perspective, warped lines, tilted buildings',
  animation: NEGATIVE_BASE + ', photorealistic, bad linework, inconsistent style',
  abstract: NEGATIVE_BASE + ', recognizable objects, photorealistic',
  product: NEGATIVE_BASE + ', hands, background clutter',
  general: NEGATIVE_BASE,
};

export interface EnhancedImagePrompt {
  positive: string;
  negative: string;
  contentType: ContentType;
  isDeity: boolean;
  useHighQualityModel: boolean;
}

export function enhanceImagePrompt(userPrompt: string): EnhancedImagePrompt {
  const { type, deityKey } = detectContentType(userPrompt);
  let enhanced = userPrompt.trim();
  if (type === 'deity') {
    if (deityKey && DEITY_PROFILES[deityKey]) {
      const profile = DEITY_PROFILES[deityKey];
      if (!enhanced.toLowerCase().includes(profile.split(',')[0].toLowerCase())) {
        enhanced = `${enhanced}, ${profile}`;
      }
    } else {
      enhanced = `${enhanced}, divine Hindu deity, sacred traditional form, divine ornaments and attire`;
    }
  }
  return {
    positive: `${enhanced}, ${STYLE_ENHATCERS[type]}`,
    negative: NEGATIVE_PROMPTS[type],
    contentType: type,
    isDeity: type === 'deity',
    useHighQualityModel: type === 'deity' || type === 'portrait',
  };
}

export function enhanceVideoPrompt(userPrompt: string): string {
  const { type, deityKey } = detectContentType(userPrompt);
  let enhanced = userPrompt.trim();
  if (type === 'deity' && deityKey && DEITY_PROFILES[deityKey]) {
    const profile = DEITY_PROFILES[deityKey];
    if (!enhanced.toLowerCase().includes(profile.split(',')[0].toLowerCase())) {
      enhanced = `${enhanced}, ${profile}`;
    }
    enhanced += ', divine sacred scene, gentle ethereal movement, golden particles floating, divine light rays, devotional atmosphere';
  }
  return `${enhanced}, smooth cinematic camera movement, professional cinematography, steady shot, 4K quality, beautiful lighting, vivid colors, no camera shake, fluid motion, high frame rate`;
}
