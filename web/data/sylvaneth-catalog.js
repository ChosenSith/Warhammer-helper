/**
 * Sylvaneth — catalogues (traits de bataille, saisons, clairières, unités, sorts).
 * Les résumés sont des rappels de jeu : vérifie les warscrolls / livre d’armée.
 */

/**
 * `bonusSummary` = effets de jeu (résumé pour l’écran de préparation).
 * Vérifie les valeurs sur ton battletome / MUSE si tu joues en tournoi.
 */
/** Traits de bataille (sélection « formation de bataille » dans l’app). */
export const SYLVANETH_FORMATIONS = [
  {
    id: "syl_form_clairiere",
    name: "Clairière",
    ability: "Clairière",
    summary:
      "Clairière d’Ostergeld : rappel — les bonus de la clairière choisie (préparation) s’appliquent selon le tableau de phases.",
    bonusSummary:
      "Tu n’as pas d’en-tête de clairière « fixe » ici : le **bonus d’allegiance** vient de la **clairière cochée** (bloc Saisons & clairières) — revenu de terrain, héros en plus, règles d’ordre, etc. Combine avec les aptitudes de clairière listées sur ta charte.",
    phases: ["hero", "combat", "deployment"],
    playerTurnOnly: true,
  },
  {
    id: "syl_form_lieux_pouvoir",
    name: "Lieux de pouvoir",
    ability: "Lieux de pouvoir",
    summary:
      "Rappel : phase des héros de ton camp — pense à tes objectifs de terrain / luxuriants (selon règles 2024+).",
    bonusSummary:
      "En **phase des héros (tour ami)** : bénéficie d’un **bonus de contrôle** ou d’**invocation** lié à tes **objectifs de terrain luxuriants** / Bois (selon ton livre : souvent pions de contrôle, repli, ou resserrement d’esprit sylvestre). Utilise l’encart de phase héros pour ne pas l’oublier.",
    phases: ["hero"],
    playerTurnOnly: true,
  },
  {
    id: "syl_form_fond_bois",
    name: "Du fond des bois",
    ability: "Du fond des bois",
    summary:
      "Rappel : phase de mouvement alliée et phase de mêlée alliée — bonus liés à la proximité des bois (voir coche 9p bois).",
    bonusSummary:
      "**Mouvement (tour ami)** : une fois par bataille ou par tour, une unité Sylvaneth peut se déplacer de **6\"** vers un bois, ou bénéficier d’une **reposition** en restant proche d’un luxuriant (détail exact : livre). **Mêlée (tour ami)** : +1 en mêlée (touch. ou save) si entièrement à **9p** d’un **Bois sauvage** / luxuriant — coche le suivi **9p bois** sur l’unité concernée.",
    phases: ["movement", "combat"],
    playerTurnOnly: true,
  },
  {
    id: "syl_form_verdoyance",
    name: "Bienfait de verdoyance",
    ability: "Bienfait de verdoyance",
    summary: "Rappel : phase des héros alliée — soins / régénération (selon ton livre d’armée).",
    bonusSummary:
      "En **phase des héros (tour ami)** : soigne des **D3** blessures sur une **unité Sylvaneth** entièrement à moins de **9\"** d’un **terrain luxuriant** (ou 1 héros), **1× par round** (selon règles 2024). Ajuste les dés si ton tome indique 2D3 / fixe.",
    phases: ["hero"],
    playerTurnOnly: true,
  },
];

/** Saisons du réveil — choix d’armée. */
export const SYLVANETH_SEASONS = [
  {
    id: "syl_season_gemmation",
    name: "Gemmation",
    summary:
      "Règle de saison : pense à la repousse / croissance (selon règles 2024+) — mêlée (tour ami et tour ennemi).",
    setupRecap: "Rappel actif : phases de mêlée, les deux tours.",
    bonusSummary:
      "**Mêlée (tour ami & ennemi)** : à chaque phase de mêlée, quand une unité Sylvaneth **détruit** une fig. ennemie (ou 1+ BM sur une cible) à **3\" d’un bois** / luxuriant, l’adversaire subit un **-1** à la prochaine **sauvegarde** d’améliorée (ou gagne 1 pion d’arôme) — **synthèse** : bonus offensif lié à la mêlée près des arbres. Vérifie le tableau exact (Gemmation) dans le livre.",
    phases: ["combat"],
    combatBothSides: true,
  },
  {
    id: "syl_season_fenaison",
    name: "Fénaison",
    summary: "Règle de saison : effets en phase des héros (tour allié).",
    setupRecap: "Rappel : phase des héros alliée.",
    bonusSummary:
      "**Phase des héros (tour ami)** : une fois, tu peux **dupliquer** l’incant. d’**1 sort du Domaine** (ou lancer 1 sort **+1** au jet) si le lanceur est **entièrement à 9p d’un bois** ; ou récupère **1 PM** (selon tome 2024). Ajuste selon la charte de saison Fénaison.",
    phases: ["hero"],
    playerTurnOnly: true,
  },
  {
    id: "syl_season_declin",
    name: "Déclin",
    summary: "Règle de saison : effets en phase des héros (tour allié).",
    setupRecap: "Rappel : phase des héros alliée.",
    bonusSummary:
      "**Phase des héros (tour ami)** : cible un ennemi **visible** : jusqu’au début de **ton** prochain tour, la cible a **-1** au **coup au but** (tir) ou **-1\"** de mouvement (au choix du joueur / selon livre) — thème d’entropie et d’entassement. Compare au paragraphe **Déclin** de ton MUSE.",
    phases: ["hero"],
    playerTurnOnly: true,
  },
  {
    id: "syl_season_crepuscule",
    name: "Crépuscule",
    summary:
      "Règle de saison : pense à la baisse de lumière / bonus de fin de manche (selon règles) — mêlée (tous les tours).",
    setupRecap: "Rappel : phases de mêlée, tour ami et ennemi.",
    bonusSummary:
      "**Mêlée (tour ami & ennemi)** : la première fois qu’une unité reçoit une **sauvegarde** négative, elle peut tenter de **déplacer 3\"** en restant en cohérence, ou bénéficier d’**esquive** légère (thème ombre) — le plus souvent : **+1** à une sauvegarde pour les unités en **ligne de vue** d’un héros Sylvaneth (selon tome). Vérifie le mot exact **Crépuscule**.",
    phases: ["combat"],
    combatBothSides: true,
  },
];

/** Clairières d’Ostergeld (Chenfront exclu). */
export const SYLVANETH_GLADES = [
  {
    id: "syl_glad_racinoueuse",
    name: "Racinoueuse",
    summary:
      "Aptitudes de clairière (selon règles) : pense à tes racines / renvois (phase des héros alliée).",
    setupRecap: "Rappel principal : phase des héros (tour allié).",
    bonusSummary:
      "**Phase héros (tour ami)** : **1×/partie** — choisis 1 héros Sylvaneth : gagne un **+1** au jet d’**incantation** ou de **défense de sort** (au choix) **ou** 1 héros récupère **D3** blessures si à **9p** d’un **bois** (détail charte : Racinoueuse). C’est souvent l’en-tête « racines ».",
    phases: ["hero"],
    playerTurnOnly: true,
  },
  {
    id: "syl_glad_coeurbois",
    name: "Cœur de bois",
    summary: "Aptitudes de clairière : bonus au contact de la forêt / objectifs (mêlée).",
    setupRecap: "Rappel : phases de mêlée (tour allié et tour ennemi).",
    bonusSummary:
      "**Mêlée** (tour ami & ennemi) : les unités Sylvaneth **au contact d’un objectif** ou **d’un bois** gagnent **+1** pour **toucher** ou **blesser** (au choix du joueur, fig. par manche) — cœur d’Ostergeld / tenir la ligne.",
    phases: ["combat"],
    combatBothSides: true,
  },
  {
    id: "syl_glad_ferecorce",
    name: "Férecorce",
    summary: "Aptitudes de clairière : rappel côté adverse en mêlée.",
    setupRecap: "Rappel : phase de mêlée du tour ennemi.",
    bonusSummary:
      "**Mêlée (tour ennemi)** : la première attaque de mêlée portée **contre** une unité Sylvaneth **dans 3\" d’un bois** subit **-1** au touch. **ou** **Perforant -1** (selon tome) — haine du fer dans la sève.",
    phases: ["combat"],
    enemyTurnOnly: true,
  },
  {
    id: "syl_glad_givrefeuille",
    name: "Givrefeuille",
    summary: "Aptitudes de clairière : gèle / retrait (mouvement adverse).",
    setupRecap: "Rappel : phase de mouvement du tour ennemi.",
    bonusSummary:
      "**Mouvement (tour ennemi)** : **1** unité ennemie en déplacement, à **9p** d’une de tes unités Sylvaneth : réduis de **-2\"** sa **M** pour ce **mouvement** (ou retire **course**) — hiver feuillu.",
    phases: ["movement"],
    enemyTurnOnly: true,
  },
  {
    id: "syl_glad_affrebois",
    name: "Affre-bois",
    summary: "Aptitudes de clairière : terreur / mêlée (tour allié).",
    setupRecap: "Rappel : phase de mêlée (tour allié).",
    bonusSummary:
      "**Mêlée (tour ami)** : les attaques de mêlée **ciblant** (ou d’**unités héroïques** Sylvaneth **au contact d’un bois**) infligent des **-1** aux tests de **sauvegarde** ennemis sur **1+** (thème peur) — vér. charte 2024.",
    phases: ["combat"],
    playerTurnOnly: true,
  },
  {
    id: "syl_glad_bellemoisson",
    name: "Belle-moisson",
    summary: "Aptitudes de clairière : déploiement / placement de terrain.",
    setupRecap: "Rappel : phase de déploiement.",
    bonusSummary:
      "**Déploiement** : tu gagnes **+1** **terrain luxuriant** / **Bois** supplémentaire (ou repli **d’une unité** dans la réserve de bois) et souvent un **+3\"** de placement pour **1** unité — lire la phrase exacte *Belle-moisson* sur le livre.",
    phases: ["deployment"],
  },
];

/** Command traits — `allowedHeroCatalogIds` : restreint le porteur (héros du catalogue seulement). */
export const SYLVANETH_HEROIC_TRAITS = [
  {
    id: "syl_ct_guerrier_noueux",
    name: "Guerrier noueux",
    summary:
      "Rappel : tirs et mêlée (tour allié et tour ennemi) — bonus d’arbre / noues (détails règles).",
    bonusSummary:
      "**Tir + mêlée** (tour ami & ennemi) : le porteur gagne **+1** attaque (ou +1 A sur **1** arme) si **3+** fig. de l’unité sont en **ligne** avec un **Bois** / luxuriant **ou** si l’adversaire est à **1\"** d’un de tes bois — noues du boleau.",
    phases: ["combat", "shooting"],
    combatAndShootingBothSides: true,
  },
  {
    id: "syl_ct_seigneur_fiel",
    name: "Seigneur des fiel-follets",
    summary: "Rappel : mêlée (tour allié) — fiel-follets / esprits (détails règles).",
    bonusSummary:
      "**Mêlée (tour ami)** : **1** ennemi au contact gagne le sort **Bille de fiel** (ou **-1** touch. jusqu’à fin de manche) — lire la **charte 2024** (Seigneur des fiel-follets).",
    phases: ["combat"],
    playerTurnOnly: true,
    allowedHeroCatalogIds: ["syl_spirit_durthu", "syl_branchwych"],
  },
  {
    id: "syl_ct_chanteur_guerre",
    name: "Chanteur de guerre",
    summary: "Rappel : phase de mouvement (tour allié).",
    bonusSummary:
      "**Mouvement (tour ami)** : **1** unité **Sylvaneth** amie entièrement à **9p** du porteur gagne **+1\"** de M ou **repli 3p** (au choix, 1×/tour) — chant d’où viennent les armées.",
    phases: ["movement"],
    playerTurnOnly: true,
    allowedHeroCatalogIds: ["syl_spirit_durthu", "syl_branchwych"],
  },
  {
    id: "syl_ct_nourris_magie",
    name: "Nourris par la magie",
    summary: "Rappel : phase des héros (tour allié) — régénération de sorts / flux.",
    bonusSummary:
      "**Phase héros (tour ami)** : le porteur **Sorcier** récupère **1** point de sort dissipé (ou lance 1 sort du Domaine avec **+1** au délai) s’il est à **6p** d’un **bois** — flux du grand-bosquet.",
    phases: ["hero"],
    playerTurnOnly: true,
    allowedHeroCatalogIds: ["syl_branchwych"],
  },
  {
    id: "syl_ct_chanteur_sorts",
    name: "Chanteur de sorts",
    summary: "Rappel : phase des héros (tour allié) — relance / sort supplémentaire (selon règles).",
    bonusSummary:
      "**Phase héros (tour ami)** : **1×/tour** — relance **1** **dé** d’**incantation** pour un sort du **Domaine du grand-bois** lancé par le porteur **ou** par un héros **9p** — Chanteur de sorts.",
    phases: ["hero"],
    playerTurnOnly: true,
    allowedHeroCatalogIds: ["syl_branchwych"],
  },
  {
    id: "syl_ct_ombre_bosquet",
    name: "Ombre du sous-bois",
    summary:
      "Rappel : phase des héros du tour ennemi — réaction / gêne (selon règles du trait).",
    bonusSummary:
      "**Phase héros (tour ennemi)** : **1×/tour** — quand l’adversaire lance un sort, sur **+** tu peux **désigner** 1 cible de sort à **+9p** d’un de tes **bois** : **+1** à la **dissipation** (ou annule 1** sort sur 2D6=8+) — ombre de la canopée (charte 2024).",
    phases: ["hero"],
    heroPhase: "opponent",
    allowedHeroCatalogIds: ["syl_spirit_durthu", "syl_branchwych"],
  },
];

/**
 * Reliques (artefacts) — restreint au besoin.
 * Soricier = Branchanteresse seulement pour les objets « mage » ici.
 */
export const SYLVANETH_ARTIFACTS = [
  {
    id: "syl_rel_faine_ages",
    name: "Fiaine des âges",
    summary:
      "1× par bataille — puissante amélioration (voir livre) ; coche quand tu l’utilises.",
    bonusSummary:
      "**1×/bataille, phase héros (tour ami)** : l’héros gagne **+1** en **Coup au but** et **+1** en **Blesser** (mêlée) **jusqu’à la fin** de la bataille **ou** récupère **2D3** **PV** s’il est entièrement à **3p d’un** luxuriant — coche l’appli en partie. (Texte = synthèse type ; confirmer **Fiaine** au livre.)",
    phases: ["hero"],
    playerTurnOnly: true,
    oncePerBattle: true,
    allowedHeroCatalogIds: ["syl_spirit_durthu", "syl_branchwych"],
  },
  {
    id: "syl_rel_lampe_luneth",
    name: "Lampe de Luneth",
    summary: "Outil de guerre (sorcier) : rappel en phase des héros alliée.",
    bonusSummary:
      "**Héros sorcier** : **+1** au **jet d’incantation** (cumulable avec bonus de saison) ; en phase héros, **1** fois, une **dissipation** réussie inflige **D3** **BM** au lanceur — lampe d’Athel Loren.",
    phases: ["hero"],
    playerTurnOnly: true,
    allowedHeroCatalogIds: ["syl_branchwych"],
  },
  {
    id: "syl_rel_gemme_vesperale",
    name: "La gemme vespérale",
    summary: "Orbe mystique (sorcier) : rappel en phase des héros alliée.",
    bonusSummary:
      "**Héros sorcier** : porte 1 **sort** du **Domaine** connu en **+** (défense +1) **ou** relance 1 **dé** d’**incantation** par manche (selon tome) — gemme stellaire Sylvaneth.",
    phases: ["hero"],
    playerTurnOnly: true,
    allowedHeroCatalogIds: ["syl_branchwych"],
  },
  {
    id: "syl_rel_glaive_vert",
    name: "Glaive de vert-bois",
    summary: "Arme : rappel en phase de mêlée (tour allié).",
    bonusSummary:
      "**Mêlée (tour ami)** : l’**arme de mêlée** du porteur a **+1** **Perforant** (ou +1 A si déjà 2+) contre les **Cohorte** (INF) / **+D3** D si **touch**=6+ — règles d’arôme Trésor, confirmer à la fiche 2024.",
    phases: ["combat"],
    playerTurnOnly: true,
    allowedHeroCatalogIds: ["syl_spirit_durthu", "syl_branchwych"],
  },
  {
    id: "syl_rel_couronne_charmilles",
    name: "Couronne de charmilles funestes",
    summary: "Couronne : rappel en phase de mêlée (tour allié).",
    bonusSummary:
      "**Mêlée (tour ami)** : l’héros **n’est pas ciblé** en priorité par **tir** / **mêlée** si 2+ cibles, **s’il y a** d’autres cibles. Souvent : **+1** **sauvegarde** si en contact avec allié **Sylvaneth** (selon fiche d’arôme).",
    phases: ["combat"],
    playerTurnOnly: true,
    allowedHeroCatalogIds: ["syl_spirit_durthu", "syl_branchwych"],
  },
  {
    id: "syl_rel_graine_renaissance",
    name: "Graine de renaissance",
    summary: "Rappel : mêlée (tour allié et tour ennemi) — régén / résurrection de terrain.",
    bonusSummary:
      "**Mêlée** (tour ami & ennemi) : la première fig. de l’héros à **0** Pv (ou 1 D6 à la fin de mêlée) peut **récup 1** fig. **ou** replacer **1** arbre **(obj.)** : **+1** bois (selon fiche) — graine d’Athelwyrd.",
    phases: ["combat"],
    combatBothSides: true,
    allowedHeroCatalogIds: ["syl_spirit_durthu", "syl_branchwych"],
  },
];

/** Domaine du grand-bois — rappels (l’app gère cocher « lancé » pour effets durables). */
export const SYLVANETH_SPELLS = [
  {
    id: "syl_spell_trone_vigne",
    name: "Trône de vigne",
    cast: "6+",
    summary:
      "Si lancé : effet persiste jusqu’à ta prochaine phase des héros — coche en phase héros quand c’est en jeu.",
    bonusSummary:
      "Inc. **6+** : le lanceur (ou 1 héros **9p**) gagne **+1** **sauvegarde** et **+1** **Coup** **tant que** l’effet dure (jusqu’à ta prochaine phase héros) — trône de ronces.",
    phases: ["hero", "movement", "shooting", "charge", "combat", "end"],
    persistsUntilNextFriendlyHero: true,
    playerTurnOnly: true,
  },
  {
    id: "syl_spell_repousse",
    name: "Repousse",
    cast: "5+",
    summary: "Domaine : repousse (déplacements / gêne) — lance en phase des héros (tour allié).",
    bonusSummary:
      "Inc. **5+** : **1** unité ennemie **9p** subit un **6\" repli** ou **-2\"** M au prochain **mouvement** (au choix) — sort de repousse standard.",
    phases: ["hero"],
    playerTurnOnly: true,
  },
  {
    id: "syl_spell_etres_dessous",
    name: "Les êtres du dessous",
    cast: "7+",
    summary: "Invocation / dégâts souterrains — lance en phase des héros (tour allié).",
    bonusSummary:
      "Inc. **7+** : **D3+3** Bm (ou 1+BM par fig.) sur 1 cible en contact / à **1\" d’un** bois, ou **1** rôdeur **(invoc.)** — êtres des racines.",
    phases: ["hero"],
    playerTurnOnly: true,
  },
  {
    id: "syl_spell_moisson_fatale",
    name: "Moisson fatale",
    cast: "6+",
    summary: "Dégâts en zone — lance en phase des héros (tour allié).",
    bonusSummary:
      "Inc. **6+** : chaque **unité** en **zone 9p** d’un point **visible** (souvent un arbre) subit un **2D3** (ou 1+BM par 4+) — moisson fatale.",
    phases: ["hero"],
    playerTurnOnly: true,
  },
  {
    id: "syl_spell_harmonie_luxuriante",
    name: "Harmonie luxuriante",
    cast: "5+",
    summary: "Buffers / soins — lance en phase des héros (tour allié).",
    bonusSummary:
      "Inc. **5+** : soigne **D3** sur 1-2 **unités Sylvaneth** en **3p d’un** luxuriant **ou** +1 **Coup** à **+9p** d’un héros — harmonie Sylvaneth.",
    phases: ["hero"],
    playerTurnOnly: true,
  },
  {
    id: "syl_spell_chant_arbres",
    name: "Chant des arbres",
    cast: "6+",
    summary:
      "Si lancé : rappel en mêlée jusqu’à ta prochaine phase des héros (coche quand l’effet est actif).",
    bonusSummary:
      "Inc. **6+** : toutes les **Sylvaneth** en **+9p** d’un héros / bois gagnent **+1** **touch. mêlée** jusqu’à ta prochaine **phase héros** — chœur sylvestre.",
    phases: ["hero", "combat"],
    persistsMeleeUntilNextFriendlyHero: true,
    playerTurnOnly: true,
  },
];

export const SYLVANETH_BATTLE_TRAITS = [];
export const SYLVANETH_PRAYERS = [];

export const MELEE_PROXIMITY_RECAP_SYLVANETH = [
  {
    label: "Sylvaneth — bois (luxe) et 9p",
    detail:
      "Coche « à 9p d’un bois » en suivi si l’unité compte sur la proximité d’un Bois sauvage / luxuriant (nombreuses aptitudes, warscrolls et sorts).",
  },
  {
    label: "Esprit de Durthu — Gardien colérique",
    detail:
      "+1 pour toucher en mêlée si la cible est à 3\" d’un bois (voir warscroll / terrain).",
  },
  {
    label: "Branchanteresse — Furie des forêts",
    detail:
      "Entièrement à 9p d’un luxuriant ou d’un bois : +1 toucher & +1 blesser en mêlée.",
  },
];

export function getSylvanethSeasonById(id) {
  return SYLVANETH_SEASONS.find((s) => s.id === id) || null;
}

export function getSylvanethGladeById(id) {
  return SYLVANETH_GLADES.find((g) => g.id === id) || null;
}

// --- Unités —

export const SYLVANETH_UNITS = [
  {
    id: "syl_spirit_durthu",
    name: "Esprit de Durthu (Spirit of Durthu)",
    keywords: [
      "HÉROS",
      "MONSTRE",
      "ORDRE",
      "SYLVANETH",
    ],
    stats: { move: '5"', save: "3+", control: "5", wounds: "14" },
    woundsPerModel: 14,
    defaultModelCount: 1,
    weapons: [
      {
        name: "Souffle verdoyant (Verdant Breath)",
        range: '12"',
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "2",
        attacks: "5",
        notes: "Tir.",
      },
      {
        name: "Épée gardienne (Guardian Sword)",
        hit: "3+",
        wound: "2+",
        rend: "2",
        damage: "5",
        attacks: "4",
        dynamicAttacks: "syl_durthu_epee",
        notes: "Anti-Monstre +1 Perforant. Voir stigmates pour 3 A.",
      },
      {
        name: "Énormes griffes empaleuses (Great Talons)",
        hit: "4+",
        wound: "2+",
        rend: "2",
        damage: "3",
        attacks: "2",
        notes: "Crit (Mortel).",
      },
    ],
    stigmates: [
      {
        name: "Stigmates de guerre",
        phases: ["combat", "shooting", "end"],
        summary:
          "Après 10+ blessures allouées (PV rest. ≤4 sur 14) : 3 attaques pour l’Épée gardienne (le tableau d’armes se met à jour selon les PV).",
      },
    ],
    abilities: [
      {
        name: "Gardien colérique",
        phases: ["combat"],
        playerTurnOnly: true,
        summary:
          "+1 pour toucher en mêlée si la cible est à 3\" d’un Bois sauvage éveillé (voir coche 9p bois / positionnement).",
      },
      {
        name: "Duel titanesque (Saccage)",
        phases: ["combat"],
        oncePerTurnArmy: true,
        playerTurnOnly: true,
        summary:
          "1×/tour (armée), mêlée (tour allié) : 1 MONSTRE ennemi au contact, 3+ : −1 A sur ses armes de mêlée jusqu’à la fin du tour.",
      },
    ],
  },
  {
    id: "syl_kurnoth_hunters_greatbow",
    name: "Chasseurs de Kurnoth — grands arcs (Kurnoth Hunters)",
    keywords: [
      "ORDRE",
      "ESPRITS LIBRES",
      "SYLVANETH",
      "CHASSEURS DE KURNOTH",
    ],
    stats: { move: '5"', save: "3+", control: "1", wounds: "5" },
    woundsPerModel: 5,
    defaultModelCount: 3,
    reinforcedModelCount: 6,
    weapons: [
      {
        name: "Grand arc de Kurnoth",
        range: '30"',
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "2",
        attacks: "2",
        notes: "1 fig. (maître de chasse) : +1 A. Âpres griffes en mêlée.",
      },
      {
        name: "Âpres griffes (Sharp Claws)",
        hit: "3+",
        wound: "3+",
        rend: "—",
        damage: "1",
        attacks: "3",
        notes: "Mêlée, 1\".",
      },
    ],
    abilities: [
      {
        name: "Maître de chasse (champion)",
        phases: ["shooting", "combat"],
        playerTurnOnly: true,
        summary:
          "1 figurine : +1 A sur le grand arc (peut varier côté composition).",
      },
      {
        name: "Envoyés de la reine éternelle (phase héros)",
        phases: ["hero"],
        playerTurnOnly: true,
        summary:
          "Tant que l’unité conteste un objectif : rappel en ta phase des héros (effets objectif / 6p bois — voir règles).",
      },
      {
        name: "Envoyés de la reine éternelle (mêlée)",
        phases: ["combat"],
        combatPhaseBothSides: true,
        summary:
          "Toujours si contestation d’objectif : alliés Sylvaneth à 6\" de l’objectif = comme à 6\" d’un bois (luxuriant) ; rappel chaque mêlée (tour ami et ennemi).",
      },
      {
        name: "Piétinement (Trample)",
        phases: ["combat"],
        combatPhaseBothSides: true,
        summary:
          "En fin de mêlée (tour ami et ennemi) : 1 unité ennemie à 1\" ; 1 dé par fig., 4+ = 1 blessure mortelle (voir warscroll).",
      },
    ],
  },
  {
    id: "syl_tree_revenants",
    name: "Sylve-revenants (Tree-Revenants)",
    keywords: [
      "CHAMPION",
      "MUSICIEN (1/5)",
      "PORTE-ÉTENDARD (1/5)",
      "ORDRE",
      "ESPRITS NOBLES",
      "SYLVANETH",
      "SYLVE-REVENANTS",
    ],
    stats: { move: '5"', save: "5+", control: "1", wounds: "2" },
    woundsPerModel: 2,
    defaultModelCount: 5,
    reinforcedModelCount: 20,
    weapons: [
      {
        name: "Lame enchantée",
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "1",
        attacks: "2",
        notes: "1\" mêlée. Scion : +1 A ; peut remplacer par Haste de protecteur.",
      },
      {
        name: "Haste de protecteur",
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "2",
        attacks: "2",
        notes: "Option Scion, 1\" mêlée.",
      },
    ],
    abilities: [
      {
        name: "Mémoires martiales",
        phases: ["combat"],
        combatPhaseBothSides: true,
        summary:
          "1×/manche : attaque en règle ou défense en règle sans ordre ni PC (mêlée, tour allié ou ennemi).",
      },
      {
        name: "Porte-étendard / Musicien (syringe des sentes)",
        phases: ["charge", "movement", "end"],
        playerTurnOnly: true,
        summary:
          "Porte-étendard (1/5) : engagement 6\" au lieu de 3\". Syringe (1/5) : repli côté règles (sentes).",
      },
    ],
  },
  {
    id: "syl_branchwych",
    name: "Branchanteresse (Branchwych)",
    keywords: [
      "HÉROS",
      "ORDRE",
      "ESPRITS NOBLES",
      "SYLVANETH",
      "BRANCHANTERESSE",
      "SORCIER",
    ],
    stats: { move: '7"', save: "5+", control: "1", wounds: "5" },
    woundsPerModel: 5,
    defaultModelCount: 1,
    isPriest: false,
    weapons: [
      {
        name: "Faux de vert-bois (Greenwood Scythe)",
        range: '2"',
        hit: "3+",
        wound: "3+",
        rend: "1",
        damage: "1",
        attacks: "3",
        notes: "Mêlée.",
      },
      {
        name: "Mandibules claqueuses (Ôpre-larve compagnon)",
        hit: "4+",
        wound: "3+",
        rend: "—",
        damage: "1",
        attacks: "D3",
        notes: "Compagnon, 1\".",
      },
    ],
    abilities: [
      {
        name: "Sorcière (Wizard)",
        phases: ["hero"],
        bothHeroPhases: true,
        summary:
          "1 sort lancé en ta phase héros ; 1 sort dissipé en phase héros adverse.",
      },
      {
        name: "Furie des forêts",
        phases: ["combat"],
        playerTurnOnly: true,
        summary:
          "Tant qu’entièrement à 9\" d’un terrain luxuriant ou d’un bois allié : +1 toucher et +1 blesser en mêlée (coche 9p bois en suivi).",
      },
      {
        name: "Lâcher de fiel-follets (sort de guerre)",
        phases: ["hero"],
        playerTurnOnly: true,
        summary:
          "Incant. 5, 9\" : autant de dés que le jet d’incantation, pour chaque unité ennemie à portée ; 5+ = 1 blessure mortelle sur cette unité.",
      },
    ],
  },
];
