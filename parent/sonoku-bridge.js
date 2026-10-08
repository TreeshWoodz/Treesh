/* Sonoku (Treesh Games) bridge — reads the game's synced save `treesh_sonoku_v1`.
   The key starts with "treesh", so the existing Supabase sync (TRANSFER_PREFIXES) already backs it up and restores it. */
function _snkSave(){ return _gdJson('treesh_sonoku_v1',{})||{}; }
function _snkSum(){ return _snkSave().summary||{}; }
GAME_DATA_SOURCES.push({ key:'sonoku', name:'Sonoku', mono:'S', a:'#27b5c9', b:'#0b4a63',
  hasData:()=>_gdRaw('treesh_sonoku_v1')!=null,
  starlites:()=>Math.max(0,+_snkSave().starlites||0),
  chip:()=>{ const s=_snkSum(); return ['trophy',(s.unlocked||0)+'/'+(s.total||0)+' trophies']; },
  stats:()=>{ const s=_snkSum(), t=s.tiers||{}; return [
    ['Level',fmtNum(s.level||1)],
    ['Wins',fmtNum(s.winsTotal||0)],
    ['Best score',fmtNum(s.best||0)],
    ['Trophies',(t.gold||0)+'G \u00b7 '+(t.silver||0)+'S \u00b7 '+(t.bronze||0)+'B'],
    ['Platinum',fmtNum(t.platinum||0)],
    ['Day streak',fmtNum(s.streak||0)]]; } });
