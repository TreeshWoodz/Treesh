"""Generate FREA! mode tile art with OpenAI gpt-image-1 (Emergent universal key).
Run: python3 /app/games/art/gen_tiles.py [key ...]   -> writes /app/games/art/raw/<key>.png
"""
import asyncio, os, sys
from dotenv import load_dotenv
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

load_dotenv('/app/backend/.env')
KEY = os.environ.get('EMERGENT_LLM_KEY')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'raw')
os.makedirs(OUT, exist_ok=True)

STYLE = ("Polished 3D render in a glossy Pixar-like style, cute tiny round jelly-like flea characters with big shiny "
         "eyes, little antennae and thin springy legs, soft studio lighting, rich saturated neon colors on a dark "
         "night-purple background, shallow depth of field, cinematic, high detail, game key art. "
         "No text, no letters, no logos, no UI, no watermark.")

PROMPTS = {
  'classic': "A glowing cyan energy orb floating at the centre, three cute fleas leaping toward it from crystal platforms, sparkling crystal kingdom.",
  'race': "Cute fleas racing up a tall neon green tower of floating platforms toward a glowing lime orb with a checkered flag at the top, sunset speedway sky.",
  'survival': "A cartoon black bomb-like orb with a burning fuse and flames bouncing between nervous cute fleas on rocky ember peaks, lava glow.",
  'tag': "A gooey glowing green slime-infected flea chasing two scared cute fleas through a misty slime swamp at night.",
  'hns': "A cute flea wearing a funny disguise (glasses and moustache) hiding among household objects in a moonlit grove while another flea searches with a flashlight.",
  'hoops': "A cute flea dunking a tiny glowing basketball through a neon rooftop basketball hoop, city skyline at dusk, motion trails.",
  'zen': "A happy sleepy purple flea relaxing on a floating cushion in a calm dreamy garden with soft bubbles, lanterns and pastel glow, peaceful vibe.",
  'koth': "A cute flea wearing a golden crown standing proudly on top of a glowing golden hill zone ring while other fleas climb up to challenge it.",
  'lava': "Cute fleas hopping across crumbling platforms above rising bright orange lava, embers in the air, volcano cavern.",
  'stars': "Cute fleas jumping to catch falling glowing golden stars while dodging pink spiky stars, starry cosmic sky.",
  'redlight': "A giant traffic light glowing red and green over a race track, cute fleas frozen mid-step in funny poses, one flea sneaking forward.",
  'freeze': "A cute flea encased in a clear ice cube while a friendly flea touches it to set it free, snowy icy night, frost sparkles.",
  'copycat': "A cute flea wearing a tiny conductor sash standing high on a glowing spotlit pedestal striking a funny dance pose, while a crowd of cute fleas on the floor below watch it closely and copy the exact same pose, little heart icons floating above them, theatre stage lights, playful mirror-match vibe.",
  'musical': "Cute fleas scrambling to jump onto a few glowing spotlit floating platforms as giant neon music notes float away and a jukebox fades out, disco stage lights, playful frantic energy.",
  'sumo': "Two chubby cute fleas wearing tiny sumo belts bumping bellies on a glowing floating circular ring arena high in a dark sky, one flea flying off the edge, dramatic rim light, impact sparkles.",
  'treasure': "Cute fleas with tiny shovels digging glowing sparkling spots on floating rock platforms, gold coins bursting out, one sneaky flea stealing a coin bag, treasure cave with crystals.",
  'party': "A wide festive party scene: many cute colorful fleas celebrating together with confetti, disco ball, balloons, a glowing orb, a tiny basketball, a star and an ice cube floating around, magenta and cyan party lights, wide panoramic composition with empty darker space on the left third.",
}
SIZES = {'party': '1536x1024'}

async def gen(k):
    path = os.path.join(OUT, k + '.png')
    if os.path.exists(path):
        print('skip', k, flush=True); return
    g = OpenAIImageGeneration(api_key=KEY)
    prompt = PROMPTS[k] + ' ' + STYLE
    for attempt in range(3):
        try:
            imgs = await g.generate_images(prompt=prompt, model='gpt-image-1', number_of_images=1)
            if imgs:
                open(path, 'wb').write(imgs[0]); print('ok', k, len(imgs[0]), flush=True); return
        except Exception as e:
            print('err', k, attempt, str(e)[:200], flush=True)
            await asyncio.sleep(3)

async def main():
    keys = sys.argv[1:] or list(PROMPTS)
    sem = asyncio.Semaphore(4)
    async def run(k):
        async with sem:
            await gen(k)
    await asyncio.gather(*[run(k) for k in keys])
    print('DONE', flush=True)

asyncio.run(main())
