import asyncio, os, sys
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
KEY = os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-1D2051cB5Fa385c800')
STYLE = ("Glossy 3D cartoon mobile-game key art, in the style of a premium neon arcade poster. Characters are cute round 'fleas': "
 "smooth shiny jelly-like spherical bodies (pink, cyan-blue, purple, lime-green, orange), huge glossy cartoon eyes with white highlights, "
 "two thin curved antennae ending in glowing white bulbs, and 6-8 soft rubbery tentacle legs dangling below; expressive faces. "
 "Deep black-navy background with a subtle perspective neon grid, cinematic speed lines, glowing particles and sparks, strong rim lighting, "
 "depth of field with blurred foreground characters, vivid cyan / magenta / gold neon glow, floating glassy cyan geometric platforms (slabs and hexagons). "
 "Centered composition with the hero action in the middle, square format, no text, no letters, no logos, no watermark.")
MODES = {
 'classic': "Capture the Orb: a happy pink hero flea leaping to grab a glowing golden orb with orbiting light rings, rival blue and purple fleas diving after it.",
 'race': "Race: fleas sprinting and leaping along a glowing neon race track of platforms toward a checkered finish flag, motion blur and speed trails.",
 'survival': "Burning Orb hot potato: a nervous flea holding a fiery red-orange orb with a burning fuse and sparks, other fleas fleeing in panic.",
 'tag': "Tag: a mischievous green 'it' flea with a glowing green aura reaching to tag a laughing cyan flea, others scattering.",
 'hns': "Hide and Seek in a cozy haunted mansion at night: a flea disguised as a lamp in a magic puff of purple smoke, a seeker flea with a flashlight beam searching between furniture.",
 'hoops': "Flea basketball: a flea dunking itself through a glowing neon basketball hoop with net swishing, arena spotlights and a cheering flea crowd, an orange basketball.",
 'koth': "King of the Hill: a proud flea wearing a golden crown standing on the top glowing platform of a stacked pyramid of neon platforms, rivals climbing below.",
 'lava': "The Floor is Lava: fleas leaping up crumbling glowing platforms as bright orange lava rises from below with embers and heat haze.",
 'stars': "Star Collect: fleas leaping to snatch spinning glowing golden stars scattered across floating neon platforms, sparkle trails.",
 'redlight': "Red Light Green Light: fleas frozen mid-leap in silly poses while a giant glowing red traffic-light eye watches them, one flea wobbling.",
 'freeze': "Freeze Tag: an icy-blue flea freezing others into glossy ice blocks with frosty sparkles, a warm flea racing to unfreeze a friend.",
 'copycat': "Copycat: a leader flea striking a pose with a glowing spotlight, a line of fleas copying the same pose with matching neon outlines.",
 'musical': "Musical Chairs: fleas scrambling for glowing neon cushions as colorful music notes swirl from a disco speaker.",
 'sumo': "Sumo: two determined fleas bumping each other on a glowing round neon ring platform, shockwave rings and sparks.",
 'treasure': "Treasure Dig: fleas digging into glowing soil and popping out a treasure chest overflowing with gold coins and gems.",
 'zen': "Zen Sandbox: relaxed fleas floating calmly among pastel cherry blossoms, glowing paper lanterns and soft floating platforms, peaceful vibe.",
 'house': "Flea House: cute fleas living in a cozy cutaway dollhouse with glowing windows, one watching TV on a couch, one cooking, one sleeping in a tiny bed.",
 'crumb': "Crumb Run: a team of fleas racing across a chasm to grab a giant glowing golden cookie crumb, a wise 'shaman' flea with a glowing feather drawing a glowing wooden plank bridge in mid-air, a cozy burrow hole with a glowing arch entrance.",
 'cards': "Card game night: four cute fleas sitting around a round wooden table playing a colorful card game, holding fans of glossy red, blue, green and yellow number cards, one flea slamming down a glowing wild card with sparkles, a draw pile in the middle, warm lamp light.",
 'flappy': "Flap Dash: a determined cyan flea flapping its tiny wings, flying through a narrow gap between two tall glowing neon pillars, other fleas flapping behind, clouds and a rainbow far below, motion trails.",
 'party': "Party Mode: a crowd of colorful fleas celebrating with confetti, party hats, a glowing trophy and a mix of orb, basketball and star icons around them.",
}
async def one(gen, k, sem):
    out = f'/app/games/tools/ai_{k}.png'
    if os.path.exists(out): print('skip', k, flush=True); return
    async with sem:
        for attempt in range(2):
            try:
                imgs = await gen.generate_images(prompt=STYLE + " Scene: " + MODES[k], model='gpt-image-1', number_of_images=1, quality='medium')
                if imgs:
                    open(out, 'wb').write(imgs[0]); print('ok', k, flush=True); return
            except Exception as e:
                print('err', k, e, flush=True)
async def main():
    gen = OpenAIImageGeneration(api_key=KEY); sem = asyncio.Semaphore(6)
    keys = sys.argv[1].split(',') if len(sys.argv) > 1 else list(MODES)
    await asyncio.gather(*[one(gen, k, sem) for k in keys])
asyncio.run(main())
