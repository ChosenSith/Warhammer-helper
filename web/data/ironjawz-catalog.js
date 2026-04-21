/**
 * Mâchefers (Ironjawz, Peaux-Vertes) — données pour le helper (synthèse battletome / phases).
 */

/** Traits d’armée (rappels par phase — hors formation). */
export const IRONJAWZ_BATTLE_TRAITS = [
  {
    id: "puissants_destructeurs",
    name: "Puissants Destructeurs",
    summary:
      "1×/tour (armée), n’importe quelle phase des héros : cible une unité MÂCHEFERS amie non placée ce tour — déplace-la de 3\" max, peut entrer en mêlée ; si déjà en mêlée, finit en mêlée.",
    phases: ["hero"],
    playerTurnOnly: true,
    heroPhase: "both",
  },
  {
    id: "waaagh_machefer",
    name: "Waaagh! Mâchefer",
    summary:
      "1×/bataille, ta phase de charge : choisis un Héros Mâchefer déclencheur — jusqu’à la fin du tour, unités Mâchefers amies entièrement à 18\" : +1 aux jets de charge et +1 A aux armes de mêlée ; unités Mâchefers ennemies entièrement à 18\" du déclencheur : −1 à la caractéristique de touche.",
    phases: ["charge"],
    playerTurnOnly: true,
    keywords: ["WAAAGH!"],
  },
];

export const IRONJAWZ_FORMATIONS = [
  {
    id: "ij_bagarde",
    name: "Bagarre de Mâchefers",
    ability: "Catastrophe naturelle",
    summary:
      "Passif : sur jet de charge non modifié 8+ avec une unité Mâchefers amie (non HÉROS), +1 A aux armes de mêlée de cette unité pour le restant du tour.",
    phases: ["charge", "combat"],
    playerTurnOnly: true,
  },
  {
    id: "ij_poing_fer",
    name: "Poing de Fer",
    ability: "Défoncer et dérouiller",
    summary:
      "Passif : chaque tour, la première fois qu’une unité ennemie est détruite par une aptitude CORPS À CORPS d’une unité Mâchefers amie, jusqu’à la fin du tour +1 au toucher (mêlée) pour la prochaine unité Mâchefers choisie pour une aptitude CORPS À CORPS.",
    phases: ["combat"],
    playerTurnOnly: true,
  },
  {
    id: "ij_poing_bizarre",
    name: "Poing Bizarre",
    ability: "Esprit de Gork",
    summary:
      "Passif : les INFANTERIE Mâchefers amies ont Protection (6+) tant qu’elles sont entièrement à 12\" d’un SORCIER ou PRÊTRE Mâchefer ami.",
    phases: ["hero", "movement", "charge", "combat", "end"],
    playerTurnOnly: true,
  },
  {
    id: "ij_ruee_grogneurs",
    name: "Ruée de Grogneurs",
    ability: "On arriv’",
    summary:
      "Passif : ajoute le nombre d’unités ennemies détruites pendant la bataille à la caractéristique Mouvement des Grognétrips et Gueule-ki-grogn’ amis (max +4).",
    phases: ["movement"],
    playerTurnOnly: true,
  },
];

export const IRONJAWZ_HEROIC_TRAITS = [
  {
    id: "ij_kogneur_lucide",
    name: "Kogneur lucide",
    summary:
      "Réaction : quand tu annonces Redéploiement pour une unité Mâchefers entièrement à 12\" — si tu fais 1–3 pour la distance, tu peux utiliser 4 à la place.",
    phases: ["movement"],
    playerTurnOnly: true,
  },
  {
    id: "ij_megabossesque",
    name: "Mégabossesque",
    summary:
      "Passif : si ce héros a chargé ce tour, jusqu’à la fin du tour +1 aux jets de charge des unités Mâchefers entièrement à 18\" de lui.",
    phases: ["charge"],
    playerTurnOnly: true,
  },
  {
    id: "ij_brute_epaisse",
    name: "Brute épaisse",
    summary:
      "N’importe quelle phase de charge : si cette unité a chargé, choisis une unité ennemie à 1\" — lance D3, sur 2+ dégâts mortels = résultat ; si charge non modifiée 8+, lance D6 à la place.",
    phases: ["charge"],
    playerTurnOnly: true,
  },
];

export const IRONJAWZ_ARTIFACTS = [
  {
    id: "ij_cranes_trophees",
    name: "Crânes-trophées",
    summary: "Passif : +10 au score de contrôle de cette unité.",
    phases: ["end"],
    playerTurnOnly: true,
  },
  {
    id: "ij_armure_gork",
    name: "Armure de Gork",
    summary: "Passif : Protection (6+).",
    phases: ["hero", "movement", "shooting", "charge", "combat"],
    playerTurnOnly: true,
  },
  {
    id: "ij_pierre_ambrivoire",
    name: "Pierre à aiguiser d’Ambrivoire",
    summary:
      "Phase de déploiement : choisis une arme de mêlée de cette unité — +1 au perforant de cette arme pour le reste de la bataille.",
    phases: ["deployment"],
    playerTurnOnly: true,
  },
];

/** Domaine du Bizarre (sorts) — rappels phase héros (sorcier). */
export const IRONJAWZ_SPELLS = [
  {
    id: "ij_sort_bash_lads",
    name: "Kognez d’ssus, lé gars !",
    cast: "6",
    summary:
      "Phase des héros (tour) : cible Mâchefers visible et entièrement à 12\" — armes de mêlée : Crit (2 touchers) jusqu’à la fin du tour.",
    phases: ["hero"],
  },
  {
    id: "ij_sort_headbutt",
    name: "Grand coup d’boule",
    cast: "6",
    summary:
      "Phase des héros : unité ennemie visible à 18\" — D3 BM ; si SORCIER, 3 BM.",
    phases: ["hero"],
  },
  {
    id: "ij_sort_green_hand",
    name: "La bonne grosse main verte",
    cast: "7",
    summary:
      "Phase des héros : unité alliée visible, à 12\", hors combat — retire la figurine et replace à <24\" du lanceur et >9\" des ennemis.",
    phases: ["hero"],
  },
];

export const IRONJAWZ_PRAYERS = [
  {
    id: "ij_pri_rififi",
    name: "Rythme à rififi",
    ritualPoints: 4,
    summary:
      "Cible Mâchefers à 12\" : +1 aux jets de charge pour le tour ; récit 8+ : +1 dé pour les jets de charge (max 3 dés).",
    ritualHint: 4,
    phase: "hero",
  },
  {
    id: "ij_pri_reparateur",
    name: "Rythme réparateur",
    ritualPoints: 4,
    summary: "Cible visible à 12\" : soigne (D6) ; récit 8+ : soigne (D3+3).",
    ritualHint: 4,
    phase: "hero",
  },
  {
    id: "ij_pri_tue",
    name: "Rythme ki tue",
    ritualPoints: 5,
    summary:
      "Cible visible à 12\" : +1 aux dégâts des armes de mêlée pour le tour ; récit 10+ : une deuxième cible éligible.",
    ritualHint: 5,
    phase: "hero",
  },
];

/** Invocations (profils réduits — pas dans la liste d’armée). */
const IRONJAWZ_INVOCATION_UNITS = [
  {
    id: "ij_pied_gork",
    name: "Pied de Gork",
    keywords: ["MANIFESTATION", "MÂCHEFERS", "DESTRUCTION"],
    stats: { move: '-', save: "-", control: "0", wounds: "—" },
    invocationOnly: true,
    abilities: [
      {
        name: "Convocation",
        phases: ["hero"],
        summary: "Placé à <12\" du sorcier, >9\" des ennemis ; 2 parties à <9\" l’une de l’autre.",
      },
    ],
  },
  {
    id: "ij_marais_mork",
    name: "Marais-mollard d’Mork",
    keywords: ["MANIFESTATION", "MÂCHEFERS", "DESTRUCTION"],
    stats: { move: '-', save: "-", control: "0", wounds: "—" },
    invocationOnly: true,
    abilities: [
      {
        name: "Convocation",
        phases: ["hero"],
        summary: "Placé à <18\" du sorcier, visible.",
      },
    ],
  },
  {
    id: "ij_gueulard_gork",
    name: "Gueulard d’Gork",
    keywords: ["MANIFESTATION", "MÂCHEFERS", "DESTRUCTION"],
    stats: { move: '-', save: "-", control: "0", wounds: "—" },
    invocationOnly: true,
    abilities: [
      {
        name: "Convocation",
        phases: ["hero"],
        summary: "Placé à <12\" du sorcier, >9\" des ennemis.",
      },
    ],
  },
];

export const CONVOCATION_SPELL_TO_UNIT_IRONJAWZ = {
  ij_invoc_pied: "ij_pied_gork",
  ij_invoc_marais: "ij_marais_mork",
  ij_invoc_gueulard: "ij_gueulard_gork",
};

/** Sorts « convocation » fictifs pour lien UI (même phase héros, coûts du livre). */
export const IRONJAWZ_CONVOCATION_SPELLS = [
  {
    id: "ij_invoc_pied",
    name: "Convocation du pied de Gork",
    cast: "7",
    linkedUnitId: "ij_pied_gork",
    summary: "Voir pied de Gork.",
  },
  {
    id: "ij_invoc_marais",
    name: "Convocation de marais-mollard d’Mork",
    cast: "5",
    linkedUnitId: "ij_marais_mork",
    summary: "Voir marais.",
  },
  {
    id: "ij_invoc_gueulard",
    name: "Convocation de gueulard d’Gork",
    cast: "5",
    linkedUnitId: "ij_gueulard_gork",
    summary: "Voir gueulard.",
  },
];

const IRONJAWZ_UNITS_BASE = [
  {
    id: "ij_brutes",
    name: "Brutes",
    keywords: ["INFANTERIE", "CHAMPION", "MÂCHEFERS", "DESTRUCTION", "BRUTE"],
    woundsPerModel: 3,
    defaultModelCount: 5,
    reinforcedModelCount: 10,
    stats: { move: '4"', save: "3+", control: "1", wounds: "15" },
    weapons: [
      {
        name: "Armes de Brute",
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "2",
        attacks: "3",
        notes: "Anti-Infanterie +1 Perf.",
      },
      {
        name: "Koup’-tripes",
        hit: "4+",
        wound: "3+",
        rend: "2",
        damage: "3",
        attacks: "3",
      },
    ],
    abilities: [
      {
        name: "Tu cherches la bagarre ?",
        phases: ["end"],
        endPhaseBothSides: true,
        summary:
          "Les unités ennemies à Santé 1 ou 2 ne peuvent pas contester les objectifs tant qu’elles sont en mêlée avec cette unité (phase de contrôle).",
      },
    ],
  },
  {
    id: "ij_durboyz",
    name: "Durboyz",
    keywords: [
      "INFANTERIE",
      "CHAMPION",
      "MÂCHEFERS",
      "DESTRUCTION",
      "PORTE-ÉTENDARD (1/10)",
      "MUSICIEN (1/10)",
    ],
    woundsPerModel: 2,
    defaultModelCount: 10,
    reinforcedModelCount: 20,
    stats: { move: '4"', save: "3+", control: "1", wounds: "20" },
    weapons: [
      {
        name: "Kikoup’ ou Kitrou’",
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "1",
        attacks: "2",
        notes: "Anti-charge +1 Perf.",
      },
    ],
    abilities: [
      {
        name: "Coups d’boucliers",
        phases: ["combat"],
        requiresInMelee: true,
        summary:
          "Cible ennemie à 1\" : pour chaque figurine à 3\" de la cible, D6 — chaque 6+ inflige 1 BM à la cible.",
      },
    ],
  },
  {
    id: "ij_rageux_brutes",
    name: "Rageux brutes",
    keywords: ["INFANTERIE", "MÂCHEFERS", "DESTRUCTION", "BRUTE"],
    woundsPerModel: 3,
    defaultModelCount: 5,
    reinforcedModelCount: 10,
    stats: { move: '4"', save: "5+", control: "1", wounds: "15" },
    weapons: [
      {
        name: "Armes de rageux",
        hit: "4+",
        wound: "2+",
        rend: "1",
        damage: "2",
        attacks: "3",
        notes: "Anti-Monstre +1 Perf.",
      },
    ],
    abilities: [
      {
        name: "Berserkers",
        phases: ["movement"],
        summary:
          "Peut Courir et quand même utiliser Charge le même tour.",
      },
      {
        name: "Rage débridée",
        phases: ["combat"],
        requiresInMelee: true,
        requiresChargedThisTurn: true,
        summary:
          "Frappe en premier si l’unité a réussi une charge ce tour.",
      },
    ],
  },
  {
    id: "ij_megaboss",
    name: "Mégaboss",
    keywords: ["HÉROS", "INFANTERIE", "MÂCHEFERS", "DESTRUCTION", "BRUTE"],
    stats: { move: '4"', save: "3+", control: "2", wounds: "8" },
    weapons: [
      {
        name: "Kikoup’ de Boss",
        hit: "4+",
        wound: "2+",
        rend: "-1",
        damage: "2",
        attacks: "8",
      },
    ],
    abilities: [
      {
        name: "La victoire rend fort",
        phases: ["end"],
        summary:
          "Fin de n’importe quel tour : si des BM ont été alloués par les attaques de mêlée de cette unité et l’unité ennemie est détruite, gagne un pion Waaagh! (max 3). Jusqu’à la fin du prochain tour +1 A par pion.",
      },
      {
        name: "Têt’ de Brute",
        phases: ["combat"],
        summary:
          "Réaction après ton Corps à corps : une unité Brutes alliée au contact et n’ayant pas encore combattu peut combattre juste après — +1 A aux armes de mêlée pour le tour.",
      },
    ],
  },
  {
    id: "ij_gordrakk",
    name: "Gordrakk, le Poing de Gork",
    keywords: [
      "MAÎTRE DE GUERRE",
      "UNIQUE",
      "HÉROS",
      "MONSTRE",
      "VOL",
      "MÂCHEFERS",
      "DESTRUCTION",
      "GUEULE-KI-KRAZ",
    ],
    stats: { move: '10"', save: "3+", control: "5", wounds: "20" },
    weapons: [
      {
        name: "Rugissement de Gross’dents",
        hit: "2+",
        wound: "3+",
        rend: "-",
        damage: "1",
        attacks: "6",
        range: '8"',
        notes: "Tir en mêlée, Compagnon",
      },
      {
        name: "Krazeuz’ et Ruzeé",
        hit: "3+",
        wound: "2+",
        rend: "1",
        damage: "2",
        attacks: "8",
        notes: "Anti-Héros +1 Perf.",
      },
      {
        name: "Poings et queue de Gross’dents",
        hit: "4+",
        wound: "2+",
        rend: "1",
        damage: "3",
        attacks: "8",
        dynamicAttacks: "gordrakk_poings",
        notes: "Anti-Monstre +1 Perf., Compagnon",
      },
    ],
    stigmates: [
      {
        name: "Stigmates de guerre",
        phases: ["combat"],
        summary:
          "Tant que l’unité a subi 10+ dégâts alloués : les attaques « Poings et queue » passent à 6 A (au lieu de 8).",
      },
    ],
    abilities: [
      {
        name: "La victoire rend fort",
        phases: ["end"],
        summary:
          "Comme Mégaboss : BM de mêlée puis destruction ennemie → pion Waaagh! ; +1 A par pion jusqu’à la fin du prochain tour.",
      },
      {
        name: "Voix de Gork",
        phases: ["combat"],
        summary:
          "1×/bataille, réaction à une aptitude Waaagh! : jusqu’au début de ton prochain tour +1 au toucher (mêlée) pour les Mâchefers à 18\".",
      },
      {
        name: "Lutte de monstres",
        phases: ["combat"],
        requiresInMelee: true,
        summary:
          "1×/tour (armée), mêlée : Monstre ennemi au contact — sur 3+ divise par deux (arrondi sup.) les A d’une arme de la cible (priorité compagnon) pour le tour.",
      },
    ],
  },
  {
    id: "ij_grogn_etrip",
    name: "Grognétrip",
    keywords: ["CAVALERIE", "CHAMPION", "MÂCHEFERS", "DESTRUCTION"],
    woundsPerModel: 5,
    defaultModelCount: 3,
    reinforcedModelCount: 6,
    stats: { move: '9"', save: "3+", control: "2", wounds: "15" },
    weapons: [
      {
        name: "Kikoup’ ou charkuteur",
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "1",
        attacks: "4",
        notes: "Anti-cavalerie +1 Perf., Charge +1 dégât",
      },
      {
        name: "Défenses de grogneur",
        hit: "5+",
        wound: "2+",
        rend: "-",
        damage: "1",
        attacks: "4",
        notes: "Compagnon",
      },
    ],
    abilities: [
      {
        name: "Charge de grognétrip",
        phases: ["charge"],
        chargePhaseBothSides: true,
        summary:
          "Si l’unité a chargé : cible ennemie à 1\" — D3, sur 2+ BM = résultat ; +1 si cible CAVALERIE.",
      },
    ],
  },
  {
    id: "ij_orks_noirs",
    name: "Orks noirs (régiment)",
    keywords: ["INFANTERIE", "MÂCHEFERS", "DESTRUCTION"],
    woundsPerModel: 2,
    defaultModelCount: 10,
    reinforcedModelCount: 20,
    stats: { move: '4"', save: "3+", control: "1", wounds: "20" },
    weapons: [
      {
        name: "Armes d’ork noir",
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "1",
        attacks: "2",
      },
    ],
    abilities: [
      {
        name: "Ligne de fer",
        phases: ["combat", "end"],
        summary:
          "Rappel : profil générique « orcs noirs / ardboys » — ajuste selon ta fiche si ton arsenal diffère.",
      },
    ],
  },
];

export const IRONJAWZ_UNITS = [...IRONJAWZ_UNITS_BASE, ...IRONJAWZ_INVOCATION_UNITS];

export const MELEE_PROXIMITY_RECAP_IRONJAWZ = [
  {
    label: "Formation — Catastrophe naturelle",
    detail: "Charge non modifiée 8+ (non héros) : +1 A aux armes de mêlée ce tour.",
  },
  {
    label: "Formation — Défoncer et dérouiller",
    detail:
      "Première destruction ennemie par CORPS À CORPS Mâchefers ce tour : +1 toucher mêlée pour la prochaine unité Mâchefers en CORPS À CORPS.",
  },
  {
    label: "Formation — Esprit de Gork",
    detail: "INF à 12\" d’un Sorcier ou Prêtre Mâchefer : Protection 6+.",
  },
  {
    label: "Formation — On arriv’",
    detail: "Bonus de mouvement sur Grognétrip / Gueule-ki-grogn’ selon unités ennemies détruites (max +4).",
  },
  {
    label: "Trait — Mégabossesque",
    detail: "Après charge du héros : +1 charge pour Mâchefers à 18\".",
  },
  {
    label: "Artefact — Pierre d’Ambrivoire",
    detail: "Déploiement : +1 perforant sur une arme de mêlée pour la bataille.",
  },
];
