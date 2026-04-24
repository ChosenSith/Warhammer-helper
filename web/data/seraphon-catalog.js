/**
 * Seraphon — catalogue helper (Asterismes, Hôtes, traits, trésors, unités).
 */

/** Asterisme choisi au déploiement (Le Grand Plan) — rappels et Poursuivre. */
export const SERAPHON_ASTERISMS = [
  {
    id: "ser_asterism_itzl",
    name: "Itzl le Dompteur",
    summary:
      "Armes de Compagnon des unités SAURUS amies : Crit (2 touches).",
    pursueCondition:
      "Poursuivre le Grand Plan (3e manche) : 3+ unités ennemies détruites.",
  },
  {
    id: "ser_asterism_quetzl",
    name: "Quetzl le Préservateur",
    summary:
      "−1 au Perforant des armes de mêlée contre les attaques qui ciblent des SAURUS amis entièrement dans ton territoire.",
    pursueCondition:
      "Poursuivre le Grand Plan (3e manche) : aucune unité ennemie entièrement dans ton territoire.",
  },
  {
    id: "ser_asterism_sotek",
    name: "Sotek le Vengeur",
    summary: "+2 à la caractéristique de Mouvement des unités SAURUS amies.",
    pursueCondition:
      "Poursuivre le Grand Plan (3e manche) : le Général ennemi est au mêlée ou a été détruit.",
  },
  {
    id: "ser_asterism_tepok",
    name: "Tepok l’Augure",
    summary: "+1 aux jets d’incantation des unités SAURUS amies.",
    pursueCondition:
      "Poursuivre le Grand Plan (3e manche) : au moins un SKINK allié sur le terrain, aucun SKINK allié au mêlée ni détruit.",
  },
];

export const SERAPHON_POURSUIVRE_INTRO =
  "1×/bataille, au début de la 3e manche, si la condition de ton Asterisme (celui du déploiement) est remplue : choisis un autre Asterisme — il s’utilise en plus du premier. ";

/** Traits d’armée gérés par Asterisme (pas de liste séparée pour les rappels de phase). */
export const SERAPHON_BATTLE_TRAITS = [];

/**
 * Rappel : Eternal = mouvement allié ; Shadowstrike = tir allié ; Sunclaw = fin de tour (2 camps) ; Thunderquake = passif +2 Santé (monstres Seraphon), pas de rappel de phase.
 */
export const SERAPHON_FORMATIONS = [
  {
    id: "ser_formation_eternal_starhost",
    name: "Hôte éternel des étoiles (Eternal Starhost)",
    ability: "Translocation céleste",
    summary:
      "1×/tour (armée), ta phase de mouvement : un Monstre SAURUS entièrement à 12\" d’un SLANN à pied — dé 3+ : retire l’unité et replace-la >9\" de tous les ennemis.",
    setupRecap:
      "Rappel en partie : <strong>ta phase de mouvement</strong> (tour allié).",
    phases: ["movement"],
    playerTurnOnly: true,
  },
  {
    id: "ser_formation_shadowstrike_starhost",
    name: "Frappe de l’ombre (Shadowstrike Starhost)",
    ability: "Agiles et rapides",
    summary:
      "1×/tour (armée), ta phase de mouvement (règles) : jusqu’à 3 unités TERRAUX / SKINKS CAVALE hors mêlée — D6\" sans entrer en mêlée.",
    setupRecap:
      "Rappel ciblé ici : <strong>ta phase de tir</strong> (tour allié) — marque l’endroit où tu noteras l’aptitude côté table.",
    phases: ["shooting"],
    playerTurnOnly: true,
  },
  {
    id: "ser_formation_sunclaw_starhost",
    name: "Aube-Griffe du soleil (Sunclaw Starhost)",
    ability: "Vengeance d’Azyr",
    summary:
      "1×/tour (armée), fin de tour de chaque joueur (manche) : Vengeance d’Azyr — détail des cibles (Kroxigor / Skinks au mêlée, etc.) sur ta fiche de formation ou le livre de règles.",
    setupRecap:
      "Rappel en partie : <strong>fin de tour</strong> (manche) — <strong>allié et ennemi</strong> (les deux tours).",
    phases: ["end"],
    playerTurnOnly: true,
    endPhaseBothSides: true,
  },
  {
    id: "ser_formation_thunderquake_starhost",
    name: "Séisme du tonnerre (Thunderquake Starhost)",
    ability: "Monstrosités hérissées d’écailles",
    summary:
      "Passif : +2 à la caractéristique de Santé des unités Monstre Seraphon (mot-clé MONSTRE + SERAPHON) — le helper l’applique aux PV max.",
    setupRecap:
      "Aucun rappel de phase : le bonus de PV est appliqué automatiquement sur les fiches d’unité éligibles.",
    thunderquakeHealthBonus: true,
    phases: [],
  },
];

export const SERAPHON_HEROIC_TRAITS = [
  {
    id: "ser_beastmaster",
    name: "Dompteur de bêtes (Beastmaster)",
    summary:
      "Début de mouvement : +2\" M pour les Saurus Écuyers et Monstres Saurus entièrement à 12\" de ce héros (reste de la phase).",
    setupRecap: "Rappel : <strong>ta phase de mouvement</strong> (tour allié).",
    phases: ["movement"],
    playerTurnOnly: true,
  },
  {
    id: "ser_reptilian_cunning",
    name: "Ruse reptilienne (Reptilian Cunning)",
    summary:
      "Si ce héros a chargé : un allié à 12\" peut utiliser « Tous les effets en attaque ! » en mêlée sans PC.",
    setupRecap: "Rappel : <strong>ta phase de mêlée</strong> (tour allié).",
    phases: ["combat"],
    playerTurnOnly: true,
  },
  {
    id: "ser_being_of_stars",
    name: "Être des étoiles (Being of the Stars)",
    summary:
      "Passif : ignore les modificateurs aux sauvegardes (positifs et négatifs) pour ce héros.",
    setupRecap:
      "Rappel : <strong>phases de tir et de mêlée</strong> — <strong>allié et ennemi</strong> (les deux).",
    phases: ["shooting", "combat"],
    playerTurnOnly: false,
  },
];

export const SERAPHON_ARTIFACTS = [
  {
    id: "ser_incandescent_rectrices",
    name: "Rectrices incandescentes (Incandescent Rectrices)",
    summary: "N’importe quelle phase des héros : soigne (D3) le porteur.",
    setupRecap: "Rappel : <strong>phases des héros</strong> (tour allié).",
    phases: ["hero"],
    playerTurnOnly: true,
    bothHeroPhases: true,
  },
  {
    id: "ser_bloodrage_pendant",
    name: "Pendentif de la fureur sanglante (Bloodrage Pendant)",
    summary:
      "+1 A mêlée ; +2 A si les dégâts alloués ≥ moitié de la Santé (arr. sup.).",
    setupRecap: "Rappel : <strong>phase de mêlée</strong> (tour allié).",
    phases: ["combat"],
    playerTurnOnly: true,
  },
  {
    id: "ser_coatl_familiar",
    name: "Familier coati (Coatl Familiar)",
    summary:
      "1×/bataille, réaction : sort de Magie d’une bataille d’un SLANN à pied au mêlée de ce héros — +D6 au jet d’incantation (puis coche « utilisé »).",
    setupRecap:
      "Rappel : <strong>phases des héros</strong> jusqu’à utilisation (case à cocher « déjà utilisé »).",
    phases: ["hero"],
    playerTurnOnly: true,
    bothHeroPhases: true,
  },
];

export const SERAPHON_SPELLS = [
  {
    id: "ser_vitesse_huanchi",
    name: "Vitesse d’Huanchi",
    lore: "Manipulation céleste",
    cast: "6",
    summary:
      "Cible SLANN, puis unité SLANN amie 12\" : jusqu’au début de ton prochain tour, Course + autres magies/commandes plus tard ce tour.",
    phases: ["hero"],
  },
  {
    id: "ser_deforge_mystique",
    name: "Déforger mystiquement",
    lore: "Manipulation céleste",
    cast: "7",
    summary: "Ennemi 12\" : −1 Perforant de ses armes jusqu’au début de ton prochain tour.",
    phases: ["hero"],
    requiresEnemyTarget: true,
    debuffRend: -1,
  },
  {
    id: "ser_appel_comete",
    name: "Appel de la comète",
    lore: "Manipulation céleste",
    cast: "6",
    summary: "Ennemi 18\" : 1 dé/fig., 5+ = 1 BM.",
    phases: ["hero"],
    requiresEnemyTarget: true,
  },
  {
    id: "ser_celestite_amplifiee",
    name: "Célestite renforcée",
    lore: "Jungles primordiales",
    cast: "6",
    summary: "Saurus Coalescé 12\" : +1 Perforant mêlée jusqu’à la fin du tour.",
    phases: ["hero"],
  },
  {
    id: "ser_lumiere_chotec",
    name: "Lumière de Chotec",
    lore: "Jungles primordiales",
    cast: "8",
    summary: "SLANN 12\" : 1 dé / dégât subi, 4+ = soigne 1.",
    phases: ["hero"],
  },
  {
    id: "ser_terre_tremble",
    name: "La terre tremble",
    lore: "Jungles primordiales",
    cast: "7",
    summary: "Point 18\" : ligne, D3 par unité traversée, 2+ = BM.",
    phases: ["hero"],
  },
];

export const SERAPHON_PRAYERS = [];

export function getSeraphonAsterismById(id) {
  return SERAPHON_ASTERISMS.find((a) => a.id === id) || null;
}

/** Monstre Seraphon : bonus Santé formation Thunderquake (+2 / figurine côté helper). */
export function seraphonUnitIsMonsterSeraphon(u) {
  if (!u?.keywords) return false;
  return (
    u.keywords.some((k) => String(k).toUpperCase().includes("MONSTRE")) &&
    u.keywords.some((k) => String(k).toUpperCase().includes("SERAPHON"))
  );
}

// --- Unités ---

export const SERAPHON_UNITS = [
  {
    id: "ser_oldblood_carnosaure",
    name: "Vétéran Saurus sur Carnosaure (Oldblood on Carnosaur)",
    keywords: [
      "HÉROS",
      "GÉNÉRAL",
      "MONSTRE",
      "SAURUS",
      "SERAPHON",
      "COALESCÉ",
    ],
    stats: { move: '10"', save: "4+", control: "5", wounds: "14" },
    woundsPerModel: 14,
    defaultModelCount: 1,
    weapons: [
      {
        name: "Gantelets-soleil (Sunbolt Gauntlet)",
        range: '12"',
        hit: "3+",
        wound: "3+",
        rend: "1",
        damage: "1",
        attacks: "D6",
        notes: "Tir en mêlée.",
      },
      {
        name: "Lance de pierre-soleil (Sunstone Spear)",
        hit: "3+",
        wound: "3+",
        rend: "1",
        damage: "2",
        attacks: "5",
        notes: "Charge +1 Dégâts.",
      },
      {
        name: "Avant-bras griffus du Carnosaure",
        hit: "4+",
        wound: "2+",
        rend: "1",
        damage: "3",
        attacks: "4",
        notes: "Compagnon.",
      },
      {
        name: "Mâchoires massives du Carnosaure",
        hit: "4+",
        wound: "2+",
        rend: "2",
        damage: "3",
        attacks: "3",
        dynamicAttacks: "carnosaur_machoires",
        notes: "Compagnon. Battue : 2 attaques si ≥10 dégâts alloués (PV rest. ≤4 sur 14) — le tableau se met à jour selon les PV saisis.",
      },
    ],
    abilities: [
      {
        name: "Frénésie sanguine (Blood Frenzy)",
        phases: ["combat"],
        oncePerTurnArmy: true,
        summary:
          "Mêlée vs monstre ennemi blessé : dé, sur 3+ Frappes de mort (tour) pour l’unité.",
      },
      {
        name: "Fer de lance de la charge (Spearhead of the Charge)",
        phases: ["charge"],
        summary:
          "A chargé : +1 aux jets de charge des SAURUS à 18\" (tour).",
      },
      {
        name: "Terreur (Terror)",
        phases: ["end"],
        summary:
          "Fin de tour de l’adversaire : ennemis au mêlée avec cette unité : −2 pour contrôler l’objectif (voir règles de Terreur).",
      },
    ],
  },
  {
    id: "ser_kroxigor_guerre_engloutie",
    name: "Kroxigors nés de la guerre (Kroxigor Warspawned)",
    keywords: [
      "INFANTERIE",
      "KROXIGOR",
      "SAURUS",
      "SERAPHON",
      "COALESCÉ",
    ],
    stats: { move: '5"', save: "4+", control: "2", wounds: "6" },
    woundsPerModel: 6,
    defaultModelCount: 3,
    weapons: [
      {
        name: "Pic de drake (Drakefang Warpick) — 2/3",
        hit: "4+",
        wound: "2+",
        rend: "1",
        damage: "2",
        attacks: "4",
        notes: "Anti-Monstre +1 Perforant.",
      },
      {
        name: "Pic d’étoile (Starfang Warpick) — 1/3",
        hit: "3+",
        wound: "2+",
        rend: "1",
        damage: "3",
        attacks: "4",
        notes: "Anti-Monstre +1 Perforant.",
      },
    ],
    abilities: [
      {
        name: "Rejeton de Sotek (Spawn of Sotek)",
        phases: ["combat"],
        summary:
          "Mêlée : +1 dégâts si entièrement à 12\" d’un Skink ou Saurus au mêlée (allié).",
      },
      {
        name: "Peau d’écailles lourde (Heavy Scaled Skin)",
        phases: ["shooting"],
        summary:
          "Tirs contre cette unité : −1 Perforant (rappel côté phase de tir de l’adversaire).",
      },
    ],
  },
  {
    id: "ser_saurus_guerriers",
    name: "Guerriers Saurus (Saurus Warriors)",
    keywords: [
      "INFANTERIE",
      "CHAMPION",
      "MUSICIEN (1/10)",
      "PORTE-ÉTENDARD (1/10)",
      "SAURUS",
      "SERAPHON",
      "COALESCÉ",
    ],
    stats: { move: '5"', save: "4+", control: "1", wounds: "2" },
    woundsPerModel: 2,
    defaultModelCount: 10,
    reinforcedModelCount: 20,
    weapons: [
      {
        name: "Arme de célestite (Celestite Weapon)",
        hit: "3+",
        wound: "3+",
        rend: "1",
        damage: "1",
        attacks: "2",
      },
    ],
    abilities: [
      {
        name: "Cohortes en ordre (Ordered Cohorts)",
        phases: ["combat", "shooting", "end"],
        summary: "+1 sauvegarde si chaque fig. conteste un objectif que tu contrôles.",
      },
    ],
  },
  {
    id: "ser_rejeton_chotec",
    name: "Rejeton de Chotec (Spawn of Chotec)",
    keywords: ["BÊTE", "MONSTRE", "SERAPHON", "COALESCÉ"],
    stats: { move: '5"', save: "5+", control: "1", wounds: "8" },
    woundsPerModel: 8,
    defaultModelCount: 1,
    weapons: [
      {
        name: "Globe d’acide de flamme",
        range: '16"',
        hit: "4+",
        wound: "2+",
        rend: "2",
        damage: "D3+3",
        attacks: "1",
        notes: "Compagnon. Choisir quelle S avec l’autre S.",
      },
      {
        name: "Rivière de feu",
        range: '10"',
        hit: "2+",
        wound: "3+",
        rend: "1",
        damage: "1",
        attacks: "5",
        notes: "Anti-Inf. +1 Perf., Compagnon.",
      },
      {
        name: "Gueule de feu",
        hit: "3+",
        wound: "3+",
        rend: "2",
        damage: "3",
        attacks: "3",
        notes: "Compagnon.",
      },
    ],
    abilities: [
      {
        name: "Flamme au soufre acide (Acid-fuelled flame)",
        phases: ["shooting"],
        summary:
          "Tir (globe) : chaque S choisit une arme. Après le globe qui blesse : −1 en sauvegarde sur l’ennemi (tour).",
      },
      {
        name: "Acolytes du soleil (Sun Acolyte)",
        phases: ["end"],
        summary:
          "Fin de ton tour (allié) : 3 jetons +Ctrl ; sur 1 non mod. sur 1, retire 1 acolyte ; 0 acolyte : Ctrl max 1 (bataille).",
      },
    ],
  },
  {
    id: "ser_seigneur_kroak",
    name: "Seigneur Kroak (Lord Kroak)",
    keywords: [
      "HÉROS",
      "SLANN",
      "MONSTRE",
      "SORCIER (3)",
      "SERAPHON",
      "STARBORNE",
    ],
    stats: { move: '5"', save: "4+", control: "5", wounds: "18" },
    woundsPerModel: 18,
    defaultModelCount: 1,
    isPriest: false,
    weapons: [
      {
        name: "Regard de Kroak",
        range: '12"',
        hit: "2+",
        wound: "3+",
        rend: "2",
        damage: "D6",
        attacks: "1",
        notes: "Tir en mêlée.",
      },
      {
        name: "Barrière de force azyrienne",
        hit: "3+",
        wound: "3+",
        rend: "1",
        damage: "1",
        attacks: "2D6",
        notes: "Crit (Mortal).",
      },
    ],
    abilities: [
      {
        name: "Morts depuis des éons innombrables",
        phases: ["end"],
        endPhaseBothSides: true,
        summary: "Tant que blessé : 3D6 + dégâts, 20+ = détruit, sinon soigne 18.",
      },
      {
        name: "Délivrance céleste (sort de guerre)",
        phases: ["hero"],
        bothHeroPhases: true,
        summary: "Plusieurs× en phase. 3 cibles 18\" : 2D6, D3 BM chacune.",
      },
      {
        name: "Vassal arcanique",
        phases: ["hero"],
        bothHeroPhases: true,
        oncePerTurn: true,
        summary: "Un autre SLANN 18\" : prochain sort mesuré depuis ce vassal.",
      },
      {
        name: "Suprême maître de l’ordre",
        phases: ["hero", "end"],
        summary: "+2 incant. ; +1 annul. / bann. ; défier n’importe où ; bannir n’importe où.",
      },
    ],
  },
];

export const MELEE_PROXIMITY_RECAP_SERAPHON = [];
