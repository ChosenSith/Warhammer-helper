/**
 * Seigneurs Ruinemânes (Soulblight Gravelords) — données pour le helper.
 */

export const SOULBLIGHT_BATTLE_TRAITS = [
  {
    id: "sb_sites_funeraires",
    name: "Sites funéraires antiques",
    summary:
      "1×/bataille (armée), déploiement : si un Sépulcre maudit ami est sur le champ de bataille, place jusqu’à 2 Sépulcres maudits supplémentaires (placement selon règles : >3\" d’unités, objectifs, terrains ; le 2e entièrement hors territoire ennemi).",
    phases: ["deployment"],
    playerTurnOnly: true,
  },
  {
    id: "sb_morts_sans_repos",
    name: "Les morts sans repos",
    summary:
      "Déploiement : choisis une unité RACLEMORTS ou MARCHEMORTS non déployée — la place en réserve « dans la tombe » (pas plus d’unités en tombe que sur le champ).",
    phases: ["deployment"],
    playerTurnOnly: true,
  },
  {
    id: "sb_morts_se_levent",
    name: "Les morts se lèvent",
    summary:
      "Ta phase de mouvement : une unité « dans la tombe » — place-la entièrement à ≤6\" d’un Sépulcre maudit ami et >9\" des ennemis, ou au bord du champ dans ton territoire >9\" des ennemis.",
    phases: ["movement"],
    playerTurnOnly: true,
  },
  {
    id: "sb_invocation_cadaverique",
    name: "Invocation cadavérique",
    summary:
      "1×/tour (armée), n’importe quelle phase des héros : HÉROS SEIGNEUR RUINEMÂNE — jusqu’à 3 cibles RACLEMORTS ou MARCHEMORTS entièrement à 12\". Si blessée : Soigne (3) ; sinon : ramène des figurines tuées (Santé totale ≤3).",
    phases: ["hero"],
    playerTurnOnly: true,
    heroPhase: "mine",
  },
  {
    id: "sb_legions_sans_fin",
    name: "Légions sans fin",
    summary:
      "1×/bataille (armée), n’importe quelle phase de mouvement : cible RACLEMORTS ou MARCHEMORTS non UNIQUE, ≥2 figurines au départ, détruite — remplace à la moitié des figurines (sup.) à ≤12\" d’un HÉROS SEIGNEUR RUINEMÂNE ou ≤6\" d’un Sépulcre maudit, >9\" des ennemis (ou >3\" en ta phase de mouvement, sans aptitudes CHARGE ce tour si ≤9\").",
    phases: ["movement"],
    playerTurnOnly: true,
  },
  {
    id: "sb_la_faim",
    name: "La faim",
    summary:
      "1×/tour (armée), fin de n’importe quel tour : cibles unités VAMPIRES ayant utilisé une aptitude CORPS À CORPS ce tour — Soigne (D3), ou Soigne (2D3) si l’unité a détruit une unité ennemie en CORPS À CORPS ce tour.",
    phases: ["end"],
    playerTurnOnly: true,
    endPhaseBothSides: true,
  },
];

export const SOULBLIGHT_FORMATIONS = [
  {
    id: "sb_legion_shyish",
    name: "Légion de Shyish",
    ability: "Horreur sans fin",
    summary:
      "Passif : tu peux choisir 1 cible supplémentaire avec Invocation cadavérique.",
    phases: ["hero"],
    playerTurnOnly: true,
  },
  {
    id: "sb_bacchanale_sang",
    name: "Bacchanale de sang",
    ability: "Aristocratie de la nuit",
    summary:
      "Passif : +1 aux jets d’incantation pour les VAMPIRES amis hors mêlée ; +1 aux jets de blessure (mêlée) pour les VAMPIRES ayant chargé ce tour.",
    phases: ["hero", "charge", "combat"],
    playerTurnOnly: true,
  },
  {
    id: "sb_horde_putride",
    name: "Horde putride",
    ability: "Mis à terre et démembré",
    summary:
      "1×/tour (armée), fin de n’importe quel tour : jusqu’à 3 MARCHEMORTS au contact — engagement, unité ennemie au contact, D3, sur 2+ BM = résultat sur l’ennemi.",
    phases: ["end"],
    playerTurnOnly: true,
    endPhaseBothSides: true,
  },
  {
    id: "sb_marche_mort",
    name: "Marche de la mort",
    ability: "Vague d’os et de lames",
    summary:
      "Passif : +1 au perforant des armes de mêlée des RACLEMORTS ayant chargé ce tour, uniquement vs unités avec moins de figurines que l’attaquant.",
    phases: ["combat"],
    playerTurnOnly: true,
  },
];

export const SOULBLIGHT_HEROIC_TRAITS = [
  {
    id: "sb_seigneur_cinglant",
    name: "Seigneur cinglant",
    summary:
      "Ta phase des héros : cible autre unité SEIGNEURS RUINEMÂNES à portée de mêlée — dé 2+ : hors mêlée déplace D6\" (sans entrer en mêlée) ; en mêlée mouvement d’engagement.",
    phases: ["hero"],
    playerTurnOnly: true,
    heroPhase: "mine",
  },
  {
    id: "sb_volonte_inebranlable",
    name: "Volonté inébranlable",
    summary:
      "Ta phase des héros : cible RACLEMORTS ou MARCHEMORTS (≥2 figurines) entièrement à 12\" — +D6 au contrôle pour le tour.",
    phases: ["hero"],
    playerTurnOnly: true,
    heroPhase: "mine",
  },
  {
    id: "sb_saccageur_derange",
    name: "Saccageur dérangé",
    summary:
      "Passif : relance les jets de charge de cette unité à ta phase de charge.",
    phases: ["charge"],
    playerTurnOnly: true,
  },
];

export const SOULBLIGHT_ARTIFACTS = [
  {
    id: "sb_pendule_terminus",
    name: "Pendule Terminus",
    summary:
      "Ta phase des héros : dé 3+ : jusqu’à ton prochain tour, −1 aux jets d’incantation des SORCIERS ennemis à 18\".",
    phases: [],
  },
  {
    id: "sb_echarde_nuit",
    name: "Écharde de nuit",
    summary:
      "Passif : ignore les modificateurs aux sauvegardes (positifs et négatifs) pour les attaques de tir qui ciblent cette unité.",
    phases: [],
  },
  {
    id: "sb_amulette_tombes",
    name: "Amulette des tombes",
    summary:
      "1×/bataille, ta phase des héros : s’il y a moins de 3 Sépulcres maudits amis, place un Sépulcre maudit (>9\" ennemis, >1\" amis, >3\" objectifs et terrains).",
    phases: ["hero"],
    playerTurnOnly: true,
    heroPhase: "mine",
  },
];

/** Domaine de la Non-Vie — sorts de sorcier. */
export const SOULBLIGHT_SPELLS = [
  {
    id: "sb_vil_transfert",
    name: "Vil transfert",
    cast: "7",
    summary:
      "Sorcier SEIGNEUR RUINEMÂNE : unité ennemie visible 18\" — 1 dé par figurine, chaque 6 = 1 BM ; si au moins une figurine tuée, Soigne (D3) le lanceur.",
    phases: ["hero"],
  },
  {
    id: "sb_prison_douleur",
    name: "Prison de douleur",
    cast: "7",
    summary:
      "Sorcier SEIGNEUR RUINEMÂNE : unité ennemie visible 12\" — Frappe en dernier jusqu’au début de ton prochain tour.",
    phases: ["hero"],
  },
  {
    id: "sb_decrepitude",
    name: "Décrépitude",
    cast: "7",
    summary:
      "Sorcier SEIGNEUR RUINEMÂNE : unité ennemie visible 12\" — jusqu’à la fin du tour, −1 aux dégâts des armes de mêlée de la cible.",
    phases: ["hero"],
  },
];

/** Prières : cette faction n’utilise pas les rituels comme les prêtres Khorne / Mâchefers. */
export const SOULBLIGHT_PRAYERS = [];

const SOULBLIGHT_INVOCATION_UNITS = [
  {
    id: "sb_main_nagash",
    name: "Main de Nagash",
    keywords: ["MANIFESTATION", "MORT", "SEIGNEURS RUINEMÂNES"],
    stats: { move: "-", save: "-", control: "0", wounds: "—" },
    invocationOnly: true,
    abilities: [
      {
        name: "Convocation",
        phases: ["hero"],
        summary: "À 18\" du lanceur, >9\" des ennemis.",
      },
    ],
  },
  {
    id: "sb_reliquaire_impie",
    name: "Reliquaire impie",
    keywords: ["MANIFESTATION", "MORT", "SEIGNEURS RUINEMÂNES"],
    stats: { move: "-", save: "-", control: "0", wounds: "—" },
    invocationOnly: true,
    abilities: [
      {
        name: "Convocation",
        phases: ["hero"],
        summary: "À 18\" du lanceur.",
      },
    ],
  },
  {
    id: "sb_nuee_sang",
    name: "Nuée de sang",
    keywords: ["MANIFESTATION", "MORT", "SEIGNEURS RUINEMÂNES"],
    stats: { move: "-", save: "-", control: "0", wounds: "—" },
    invocationOnly: true,
    abilities: [
      {
        name: "Convocation",
        phases: ["hero"],
        summary: "À 18\" du lanceur, >9\" des ennemis.",
      },
    ],
  },
];

export const SOULBLIGHT_CONVOCATION_SPELLS = [
  {
    id: "sb_invoc_main",
    name: "Convocation de Main de Nagash",
    cast: "7",
    linkedUnitId: "sb_main_nagash",
    summary: "Voir Main de Nagash.",
  },
  {
    id: "sb_invoc_reliquaire",
    name: "Convocation de Reliquaire impie",
    cast: "6",
    linkedUnitId: "sb_reliquaire_impie",
    summary: "Voir Reliquaire impie.",
  },
  {
    id: "sb_invoc_nuee",
    name: "Convocation de Nuée de sang",
    cast: "6",
    linkedUnitId: "sb_nuee_sang",
    summary: "Voir Nuée de sang.",
  },
];

export const CONVOCATION_SPELL_TO_UNIT_SOULBLIGHT = {
  sb_invoc_main: "sb_main_nagash",
  sb_invoc_reliquaire: "sb_reliquaire_impie",
  sb_invoc_nuee: "sb_nuee_sang",
};

const SOULBLIGHT_UNITS_BASE = [
  {
    id: "sb_squelettes_raclemorts",
    name: "Squelettes raclemorts",
    keywords: [
      "INFANTERIE",
      "CHAMPION",
      "PORTE-ÉTENDARD (1/10)",
      "PROTECTION (6+)",
      "MORT",
      "SEIGNEURS RUINEMÂNES",
      "RACLEMORTS",
    ],
    stats: { move: '4"', save: "5+", control: "1", wounds: "1" },
    woundsPerModel: 1,
    defaultModelCount: 20,
    reinforcedModelCount: 40,
    weapons: [
      {
        name: "Arme antique",
        hit: "4+",
        wound: "4+",
        rend: "-",
        damage: "1",
        attacks: "2",
      },
    ],
    abilities: [
      {
        name: "Légion de squelettes",
        phases: ["end"],
        endPhaseBothSides: true,
        summary:
          "Fin de n’importe quel tour : ramène jusqu’à D3 figurines tuées dans cette unité.",
      },
    ],
  },
  {
    id: "sb_garde_tertres",
    name: "Garde des tertres",
    keywords: [
      "INFANTERIE",
      "CHAMPION",
      "MUSICIEN (1/5)",
      "PORTE-ÉTENDARD (1/5)",
      "PROTECTION (6+)",
      "MORT",
      "SEIGNEURS RUINEMÂNES",
      "RACLEMORTS",
    ],
    stats: { move: '4"', save: "4+", control: "1", wounds: "1" },
    woundsPerModel: 1,
    defaultModelCount: 10,
    reinforcedModelCount: 20,
    weapons: [
      {
        name: "Lame de revenant",
        hit: "3+",
        wound: "3+",
        rend: "1",
        damage: "1",
        attacks: "2",
        notes: "Crit (Mortel).",
      },
    ],
    abilities: [
      {
        name: "Gardes royaux",
        phases: ["hero", "movement", "charge", "combat", "end"],
        summary:
          "Tant qu’un ou plusieurs HÉROS SEIGNEURS RUINEMÂNES d’infanterie amis sont à portée de mêlée : Protection (5+).",
      },
    ],
  },
  {
    id: "sb_chevaliers_sang",
    name: "Chevaliers de sang",
    keywords: [
      "CAVALERIE",
      "CHAMPION",
      "PORTE-ÉTENDARD (1/5)",
      "PROTECTION (6+)",
      "MORT",
      "SEIGNEURS RUINEMÂNES",
      "VAMPIRE",
    ],
    stats: { move: '12"', save: "3+", control: "1", wounds: "3" },
    woundsPerModel: 3,
    defaultModelCount: 5,
    reinforcedModelCount: 10,
    weapons: [
      {
        name: "Arme de templier",
        hit: "3+",
        wound: "3+",
        rend: "1",
        damage: "1",
        attacks: "3",
        notes: "Anti-Infanterie +1 Perf., Charge +1 dégât.",
      },
      {
        name: "Sabots et dents de cauchemar",
        hit: "5+",
        wound: "3+",
        rend: "-",
        damage: "1",
        attacks: "3",
        notes: "Compagnon.",
      },
    ],
    abilities: [
      {
        name: "Cavaliers de la ruine",
        phases: ["movement"],
        summary:
          "En se déplaçant : traverse les figurines INFANTERIE ennemies et la portée de mêlée des INFANTERIE ennemies ; ne finit pas en mêlée sauf si l’aptitude le précise.",
      },
      {
        name: "Réduits en poussière",
        phases: ["charge"],
        chargePhaseBothSides: true,
        summary:
          "N’importe quelle phase de charge : unité ennemie traversée ce tour — D3, sur 2+ BM = résultat.",
      },
    ],
  },
  {
    id: "sb_chevaliers_tertres",
    name: "Chevaliers des tertres",
    keywords: [
      "CAVALERIE",
      "CHAMPION",
      "MUSICIEN (1/5)",
      "PORTE-ÉTENDARD (1/5)",
      "PROTECTION (6+)",
      "MORT",
      "SEIGNEURS RUINEMÂNES",
      "RACLEMORTS",
    ],
    stats: { move: '10"', save: "4+", control: "1", wounds: "3" },
    woundsPerModel: 3,
    defaultModelCount: 5,
    reinforcedModelCount: 10,
    weapons: [
      {
        name: "Lance des tertres",
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "1",
        attacks: "2",
        notes: "Crit (Mortel), Charge +1 dégât.",
      },
      {
        name: "Sabots et dents de coursier squelette",
        hit: "5+",
        wound: "3+",
        rend: "-",
        damage: "1",
        attacks: "2",
        notes: "Compagnon.",
      },
    ],
    abilities: [
      {
        name: "Chevaliers du roi",
        phases: ["hero", "movement", "charge", "combat", "end"],
        summary:
          "Tant qu’un HÉROS de cavalerie RACLEMORTS ami est à portée de mêlée : Protection (5+).",
      },
      {
        name: "Condamnés à ressusciter derechef",
        phases: ["end"],
        endPhaseBothSides: true,
        summary:
          "Fin de n’importe quel tour : ramène 1 figurine tuée dans cette unité.",
      },
    ],
  },
  {
    id: "sb_necromancien",
    name: "Nécromancien",
    keywords: [
      "UNIQUE",
      "HÉROS",
      "SORCIER (1)",
      "INFANTERIE",
      "PROTECTION (6+)",
      "MORT",
      "SEIGNEURS RUINEMÂNES",
    ],
    stats: { move: '5"', save: "6+", control: "2", wounds: "5" },
    weapons: [
      {
        name: "Bâton Mortis",
        hit: "4+",
        wound: "4+",
        rend: "1",
        damage: "2",
        attacks: "3",
      },
    ],
    abilities: [
      {
        name: "Larbins morts-vivants",
        phases: ["combat"],
        combatPhaseBothSides: true,
        requiresInMelee: true,
        summary:
          "À portée de mêlée d’une unité RACLEMORTS ou MARCHEMORTS : Protection 4+ ; chaque sauvegarde réussie : 1 dégât alloué à une telle unité alliée au contact (sans sauvegarde).",
      },
      {
        name: "Danse macabre de Vanhel",
        phases: ["combat"],
        playerTurnOnly: true,
        summary:
          "1×/tour (armée), ta mêlée : cible RACLEMORTS ou MARCHEMORTS à 12\" — dé 3+ : 2 aptitudes CORPS À CORPS cette phase ; après la 1re : Frappe en dernier jusqu’à la fin du tour.",
      },
    ],
  },
  {
    id: "sb_roi_revenant_pied",
    name: "Roi revenant",
    keywords: [
      "HÉROS",
      "INFANTERIE",
      "PROTECTION (6+)",
      "MORT",
      "SEIGNEURS RUINEMÂNES",
      "RACLEMORTS",
    ],
    stats: { move: '4"', save: "3+", control: "2", wounds: "5" },
    weapons: [
      {
        name: "Lame sépulcrale de l’enfer",
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "2",
        attacks: "5",
        notes: "Crit (Mortel).",
      },
    ],
    abilities: [
      {
        name: "Roi des os ambulants",
        phases: ["hero"],
        playerTurnOnly: true,
        heroPhase: "mine",
        summary:
          "1×/tour (armée), ta phase des héros : RACLEMORTS à portée de mêlée — dé 3+ : armes de mêlée avec Crit (2 touches) pour le tour.",
      },
      {
        name: "Stratégies antiques",
        phases: ["combat"],
        playerTurnOnly: true,
        requiresInMelee: true,
        summary:
          "Réaction après CORPS À CORPS : INFANTERIE RACLEMORTS non héros au contact, sans CORPS À CORPS ce tour — peut combattre après ; +1 pour toucher pour le tour.",
      },
    ],
  },
  {
    id: "sb_machine_mortis",
    name: "Machine Mortis",
    keywords: [
      "HÉROS",
      "MACHINE DE GUERRE",
      "SORCIER (1)",
      "VOL",
      "PROTECTION (6+)",
      "MORT",
      "SEIGNEURS RUINEMÂNES",
    ],
    stats: { move: '10"', save: "4+", control: "5", wounds: "12" },
    weapons: [
      {
        name: "Bâton de maître des cadavres",
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "D3",
        attacks: "3",
      },
      {
        name: "Lames d’ost spectral",
        hit: "4+",
        wound: "4+",
        rend: "-",
        damage: "1",
        attacks: "10",
        notes: "Compagnon.",
      },
    ],
    abilities: [
      {
        name: "Le reliquaire",
        phases: ["hero", "movement", "shooting", "charge", "combat"],
        summary:
          "À la première mise en place : dé d’énergie à 1. Chaque sort réussi d’un SORCIER RUINEMÂNE à 12\" : +1 au dé (max 6).",
      },
      {
        name: "Nexus d’énergie de la mort",
        phases: ["hero"],
        playerTurnOnly: true,
        heroPhase: "mine",
        summary:
          "RACLEMORTS ou MARCHEMORTS à 12\" ciblés par Invocation cadavérique : +D3 aux PV soignés ou à la Santé des figurines ramenées.",
      },
      {
        name: "Onde de pouvoir",
        phases: ["shooting"],
        playerTurnOnly: true,
        summary:
          "1×/tour (armée), ta phase de tir : jusqu’à 3 unités ennemies à 10\" — par cible dé 3+ : BM = valeur du dé d’énergie ; puis remet le dé à 1.",
      },
    ],
  },
  {
    id: "sb_vargheists",
    name: "Vargheists",
    keywords: [
      "INFANTERIE",
      "CHAMPION",
      "VOL",
      "PROTECTION (6+)",
      "MORT",
      "SEIGNEURS RUINEMÂNES",
      "VAMPIRE",
      "BASE",
    ],
    stats: { move: '12"', save: "5+", control: "1", wounds: "4" },
    woundsPerModel: 4,
    defaultModelCount: 3,
    reinforcedModelCount: 6,
    weapons: [
      {
        name: "Serres et crocs meurtriers",
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "2",
        attacks: "3",
        notes: "Crit (2 touches).",
      },
    ],
    abilities: [
      {
        name: "Piqué de la mort",
        phases: ["movement"],
        playerTurnOnly: true,
        summary:
          "1×/tour (armée), ta phase de mouvement : si hors mêlée, retire l’unité et replace à >9\" des ennemis.",
      },
    ],
  },
  {
    id: "sb_seigneur_vampire",
    name: "Seigneur vampire",
    keywords: [
      "HÉROS",
      "SORCIER (1)",
      "INFANTERIE",
      "PROTECTION (6+)",
      "MORT",
      "SEIGNEURS RUINEMÂNES",
      "VAMPIRE",
    ],
    stats: { move: '6"', save: "3+", control: "2", wounds: "5" },
    weapons: [
      {
        name: "Relique de guerre dynastique",
        hit: "3+",
        wound: "3+",
        rend: "1",
        damage: "2",
        attacks: "5",
        notes: "Anti-Héros +1 Perf., Crit (2 touches).",
      },
    ],
    abilities: [
      {
        name: "Brume de sang",
        phases: ["hero"],
        playerTurnOnly: true,
        heroPhase: "mine",
        summary:
          "1×/tour (armée), ta phase des héros : dé 3+ — retire l’unité et replace à >3\" des HÉROS ennemis et >9\" des autres ennemis.",
      },
    ],
  },
  {
    id: "sb_prince_vhordrai",
    name: "Prince Vhordrai",
    keywords: [
      "UNIQUE",
      "HÉROS",
      "MONSTRE",
      "SORCIER (1)",
      "VOL",
      "PROTECTION (6+)",
      "SEIGNEURS RUINEMÂNES",
    ],
    stats: { move: '12"', save: "3+", control: "5", wounds: "18" },
    weapons: [
      {
        name: "Miasmes de Shordemaire",
        hit: "3+",
        wound: "3+",
        rend: "2",
        damage: "2",
        attacks: "D6",
        range: '10"',
        notes: "Tir en mêlée, Compagnon.",
      },
      {
        name: "La Lance de sang",
        hit: "3+",
        wound: "3+",
        rend: "2",
        damage: "2",
        attacks: "6",
        notes: "Charge (+1 dégât).",
      },
      {
        name: "Gueule de Shordemaire",
        hit: "4+",
        wound: "2+",
        rend: "2",
        damage: "3",
        attacks: "3",
        notes: "Compagnon.",
      },
      {
        name: "Griffes de Shordemaire",
        hit: "4+",
        wound: "2+",
        rend: "1",
        damage: "2",
        attacks: "7",
        dynamicAttacks: "vhordrai_griffes",
        notes: "Compagnon.",
      },
    ],
    stigmates: [
      {
        name: "Stigmates de guerre",
        phases: ["combat"],
        summary:
          "Tant que l’unité a subi 10+ dégâts alloués : les Griffes passent à 5 A (au lieu de 7).",
      },
    ],
    abilities: [
      {
        name: "Saint du massacre",
        phases: ["end"],
        endPhaseBothSides: true,
        summary:
          "Fin de n’importe quel tour : VAMPIRE non monstre à 12\" ayant détruit une unité en CORPS À CORPS ce tour — +2\" M ou +1 A mêlée ou +1 dégâts mêlée (cumulable, reste de bataille).",
      },
      {
        name: "Sillage écarlate",
        phases: ["combat"],
        playerTurnOnly: true,
        requiresInMelee: true,
        summary:
          "1×/tour (armée), ta mêlée : engagement puis unité ennemie au contact — dé 4+ : BM = résultat du dé.",
      },
      {
        name: "Sang-vif",
        phases: ["hero"],
        playerTurnOnly: true,
        heroPhase: "mine",
        summary:
          "Sort (incantation 7) : Frappe en premier jusqu’au début de ton prochain tour.",
      },
    ],
  },
];

export const SOULBLIGHT_UNITS = [
  ...SOULBLIGHT_UNITS_BASE,
  ...SOULBLIGHT_INVOCATION_UNITS,
];

export const MELEE_PROXIMITY_RECAP_SOULBLIGHT = [
  {
    label: "Formation — Aristocratie de la nuit",
    detail: "VAMPIRES hors mêlée : +1 incantation ; VAMPIRES ayant chargé : +1 blesser (mêlée).",
  },
  {
    label: "Formation — Vague d’os et de lames",
    detail: "RACLEMORTS ayant chargé : +1 perf. vs unités avec moins de figurines.",
  },
  {
    label: "Trône de Sabbat — Sagacité tactique",
    detail: "RACLEMORTS / MARCHEMORTS à 6\" : Protection 5+.",
  },
  {
    label: "Roi revenant (coursier) — Antique malédiction des tertres",
    detail: "Crit avec arme relique : cible maudite (−1 sauvegarde).",
  },
];
