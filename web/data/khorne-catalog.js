/**
 * Données de référence — Lames de Khorne (synthèse pour le helper).
 * Les aptitudes incluent des tags `phases` pour filtrer les rappels par phase.
 */
import {
  IRONJAWZ_ARTIFACTS,
  IRONJAWZ_FORMATIONS,
  IRONJAWZ_HEROIC_TRAITS,
  IRONJAWZ_PRAYERS,
  IRONJAWZ_UNITS,
} from "./ironjawz-catalog.js";
import {
  SOULBLIGHT_ARTIFACTS,
  SOULBLIGHT_FORMATIONS,
  SOULBLIGHT_HEROIC_TRAITS,
  SOULBLIGHT_LINKED_ENEMY_EFFECTS,
  SOULBLIGHT_PRAYERS,
  SOULBLIGHT_SPELLS,
  SOULBLIGHT_UNITS,
} from "./soulblight-catalog.js";
import {
  SERAPHON_ARTIFACTS,
  SERAPHON_ASTERISMS,
  SERAPHON_BATTLE_TRAITS,
  SERAPHON_FORMATIONS,
  SERAPHON_HEROIC_TRAITS,
  SERAPHON_PRAYERS,
  SERAPHON_SPELLS,
  SERAPHON_UNITS,
} from "./seraphon-catalog.js";

export const FORMATIONS = [
  {
    id: "legion",
    name: "Légion de Khorne",
    ability: "Bouchers des nations",
    summary:
      "1×/tour (armée), réaction : après une aptitude CORPS À CORPS d’une unité DÉMON Lames de Khorne, une unité SANG-LIÉS amie à 12\" tout autour qui n’a pas encore combattu peut combattre juste après.",
    phases: ["combat"],
    playerTurnOnly: true,
  },
  {
    id: "cavalcade",
    name: "Cavalcade d’airain",
    ability: "Attirés par le carnage",
    summary:
      "Ajoute X aux jets de charge des unités Lames de Khorne, X = nombre d’unités CAVALERIE ou MONSTRES amies ayant déjà chargé ce tour et à 12\" tout autour.",
    phases: ["charge"],
    playerTurnOnly: true,
  },
  {
    id: "horde",
    name: "Horde de guerre Sang-liés",
    ability: "Conquérants infatigables",
    summary:
      "+1 pour toucher (mêlée) pour les SANG-LIÉS contre une unité qui conteste un objectif que vous ne contrôlez pas.",
    phases: ["combat"],
    playerTurnOnly: true,
  },
  {
    id: "ost",
    name: "Ost du meurtre",
    ability: "Tueurs fervents",
    summary:
      "Fin de votre tour : chaque unité DÉMON Lames de Khorne ayant combattu ce tour et hors mêlée peut se déplacer de D6\" (ne finit pas en mêlée).",
    phases: ["end"],
    playerTurnOnly: true,
  },
];

/**
 * Synthèse « bonus de proximité » (distance, contact, objectif) pour la phase de mêlée,
 * d’après formations, traits, artefacts et aptitudes présents dans ce helper.
 */
export const MELEE_PROXIMITY_RECAP = [
  {
    label: "Formation — Bouchers des nations (Légion)",
    detail:
      "Après l’aptitude Corps à corps d’une unité Démon LK : une unité Sang-liés amie à 12\" tout autour qui n’a pas encore combattu peut combattre aussitôt après.",
  },
  {
    label: "Formation — Conquérants infatigables (Horde)",
    detail:
      "+1 pour toucher (mêlée) pour les Sang-liés contre une unité qui conteste un objectif que tu ne contrôles pas.",
  },
  {
    label: "Trait — Mépris pour la magie",
    detail:
      "À 12\" d’un Sorcier ennemi : −1 au jet d’incantation ; à 12\" d’un Prêtre ennemi : −1 à la psalmodie (noter en mêlée si les duels se jouent près de ton héros).",
  },
  {
    label: "Artefact — Ar’gath, la Reine des lames",
    detail:
      "Les sauvegardes ennemies sur les HÉROS au contact du porteur sont ignorées.",
  },
  {
    label: "Griffes de Karanak — Chasseur de meute",
    detail:
      "Si l’unité est entièrement à 12\" de Molosses de Khorne alliés ou d’un Karanak allié : touches critiques sur 5+ non modifiés en mêlée.",
  },
  {
    label: "Despote — Seigneur de sang lié / Apportez-moi leurs crânes !",
    detail:
      "+1 pour blesser (mêlée) contre des Sang-liés INF à 12\" du Despote ; 1×/tour un autre HÉROS Sang-liés INF à 12\" peut gagner Frappe en premier pour la phase.",
  },
  {
    label: "Le Preneur de crânes — Fléaux des héros",
    detail:
      "Choisir un HÉROS ennemi au contact : Frappe en premier tant qu’il est au contact, attaques de mêlée obligées de le cibler ce tour.",
  },
  {
    label: "Skarbrand — Rugissement de rage totale",
    detail:
      "Mêlée, cible ennemie au contact : jets de blessures mortelles selon dés ou selon les dégâts subis sur Skarbrand.",
  },
  {
    label: "Khorgorath — Prédateur abominable",
    detail:
      "Mêlée, cible au contact : sur 3+ elle ne peut pas recevoir d’ordres pour le reste du tour.",
  },
];

/**
 * `heroPhase` : en phase des héros, quand afficher le rappel fort (sinon phase seule).
 * `mine` = ta phase des héros ; `opponent` = phase des héros adverse ; `both` = les deux.
 */
export const HEROIC_TRAITS = [
  {
    id: "mepris_magie",
    name: "Mépris pour la magie",
    summary:
      "-1 aux jets d’incantation des SORCIERS ennemis à 12\" ; -1 aux psalmodies des PRÊTRES ennemis à 12\".",
    phases: ["hero"],
    heroPhase: "both",
  },
  {
    id: "contremaitre",
    name: "Contremaître frénétique",
    summary:
      "Phase de mouvement : cible INFANTERIE ou CAVALERIE Sang-liés à portée de mêlée, pas en mêlée — bouge D6\" (ne finit pas en mêlée) ; si fin à portée de mêlée de ce héros, D3 BM à l’unité.",
    phases: ["movement"],
    playerTurnOnly: true,
  },
  {
    id: "collectionneur",
    name: "Collectionneur de crânes",
    summary:
      "Fin de tour : si un HÉROS ennemi a été détruit par vos attaques de mêlée ce tour, +1 Attaques sur les armes de mêlée du héros pour le reste de la bataille (cumulable).",
    phases: ["end"],
    playerTurnOnly: true,
  },
];

export const ARTIFACTS = [
  {
    id: "collier_mepris",
    name: "Collier de mépris",
    summary:
      "Dissipation comme SORCIER (1) ; chaque dissipation réussie : D3 BM au lanceur.",
    phases: ["hero"],
    heroPhase: "opponent",
  },
  {
    id: "lame_boucher",
    name: "Lame du boucher",
    summary:
      "Fin de votre tour : sur chaque unité ennemise ayant reçu des dégâts de mêlée de ce héros, D3 : sur 2+, D3 BM.",
    phases: ["end"],
    playerTurnOnly: true,
  },
  {
    id: "argath",
    name: "Ar’gath, la Reine des lames",
    summary:
      "Les sauvegardes ennemies sur les HÉROS au contact de ce héros sont ignorées.",
    phases: ["combat"],
  },
];

/** Prières du domaine (prêtre) — effets simplifiés pour buffs automatiques. */
/**
 * Dîme de sang — coût en points, prérequis (ids d’aptitudes déjà débloquées).
 * `requiresAny` : au moins un des ids doit être débloqué.
 * `requiresAll` : tous les ids doivent être débloqués.
 */
export const BLOOD_TITHE_ABILITIES = [
  {
    id: "soif_meurtre",
    name: "Soif de meurtre",
    cost: 0,
    summary:
      "1×/tour (armée), réaction après annonce d’une charge : remplace 1 dé de charge par 1 jet de dé ; puis D3 BM à l’unité qui charge une fois résolu.",
    defaultUnlocked: true,
  },
  {
    id: "mepris_divin",
    name: "Mépris divin",
    cost: 1,
    summary:
      "1×/tour, début de n’importe quel tour : jusqu’à 3 SORCIERS / PRÊTRES ennemis à 6\" des Lames de Khorne — sur 3+ : −1 au niveau de puissance jusqu’au prochain tour.",
  },
  {
    id: "punissez_pacifistes",
    name: "Punissez les pacifistes",
    cost: 1,
    summary:
      "Votre phase de mêlée : unités non en mêlée (toutes) — sur 1-2 : 1 BM chacune ; sur 3+ : 1 BM aux ennemies seulement.",
  },
  {
    id: "tuez_mystiques",
    name: "Tuez les mystiques",
    cost: 2,
    requiresAll: ["mepris_divin"],
    summary:
      "Votre phase des héros : jusqu’à 4 MANIFESTATIONS ennemies — jet de bannissement 2D6 par cible ; si ≥ bannissement, D3 BM aux unités ennemies à 3\", puis bannie.",
  },
  {
    id: "un_combat_glorieux",
    name: "Un combat glorieux ou rien",
    cost: 2,
    requiresAny: ["mepris_divin", "punissez_pacifistes"],
    summary:
      "Passif : −1 pour toucher aux attaques de tir contre les Lames de Khorne amies.",
  },
  {
    id: "euphorie_combat",
    name: "Euphorie du combat",
    cost: 3,
    requiresAll: ["punissez_pacifistes"],
    summary:
      "Passif : sauf Compagnon, les aptitudes d’arme des ennemis ayant chargé ce tour vs Lames de Khorne n’ont pas d’effet.",
  },
  {
    id: "massacre_triomphal",
    name: "Massacre triomphal",
    cost: 4,
    requiresAny: ["un_combat_glorieux", "tuez_mystiques"],
    summary:
      "Passif : +1 Attaques aux armes des unités Lames de Khorne amies qui ont chargé ce tour.",
  },
  {
    id: "tailladez_sourire",
    name: "Tailladez le sourire de Khorne",
    cost: 4,
    requiresAny: ["euphorie_combat", "un_combat_glorieux"],
    summary:
      "Passif : +1 pour toucher aux attaques de mêlée des Lames de Khorne amies.",
  },
];

export function tithePrereqsMet(ability, unlockedIds) {
  if (ability.requiresAll?.length) {
    return ability.requiresAll.every((id) => unlockedIds[id]);
  }
  if (ability.requiresAny?.length) {
    return ability.requiresAny.some((id) => unlockedIds[id]);
  }
  return true;
}

/** Coût en points de rituel (pas une psalmodie « + »). */
export const PRAYERS = [
  {
    id: "rage_incontrolable",
    name: "Rage incontrôlable",
    ritualPoints: 4,
    phase: "hero",
    summary:
      "Coût : 4 pts de rituel. Cible : unité alliée visible à 12\". Effet : la cible obtient les effets de « Trempés de sang » (trait de bataille). Si la récitation est 8+ (en utilisant les points de rituel cumulés), ignorez les effets de « Brutalité aveugle » (toujours dans les traits de bataille).",
    buffHint: "trempes_sang",
  },
  {
    id: "sang_bouillant",
    name: "Sang bouillant",
    ritualPoints: 4,
    phase: "hero",
    targetEnemy: true,
    summary:
      "Coût : 4 pts de rituel. Cible : unité ennemie visible à 18\". Effet : jetez autant de dés que le nombre de figurines dans l’unité ; pour chaque 5+, infligez 1 blessure mortelle. Si le jet de récitation est 8+, retirez 1 aux jets pour blesser pour les attaques de la cible jusqu’au début de votre prochain tour.",
  },
  {
    id: "acte_final",
    name: "Acte final de violence",
    ritualPoints: 4,
    phase: "hero",
    summary:
      "Coût : 4 pts de rituel. Cible : unité Lames de Khorne visible entièrement à 12\" du prêtre. Effet : pour chaque figurine tuée par une unité ennemie en mêlée, jetez un dé ; sur 5+, infligez 1 blessure mortelle. Si la récitation est 8+, jetez 2 dés au lieu d’un.",
  },
  {
    id: "convocation_sorcevores",
    name: "Convocation de crânes sorcevores",
    ritualPoints: 4,
    phase: "hero",
    summary:
      "Coût : 4 pts de rituel. Effet : placez une invocation de Crânes sorcevores visible et entièrement à 12\" du prêtre, et à plus de 9\" des unités ennemies. Une invocation a 2 parties à placer à 8\" l’une de l’autre.",
  },
  {
    id: "convocation_hache_rage",
    name: "Convocation de hache de rage",
    ritualPoints: 4,
    phase: "hero",
    summary:
      "Coût : 4 pts de rituel. Effet : placez une Hache de rage visible entièrement à 12\" du prêtre et à plus de 9\" des unités ennemies.",
  },
  {
    id: "convocation_icone_sanglante",
    name: "Convocation d’icône sanglante",
    ritualPoints: 4,
    phase: "hero",
    summary:
      "Coût : 4 pts de rituel. Effet : placez une icône sanglante visible et entièrement à 18\" du prêtre.",
  },
];

/** Points de rituel requis (rétrocompat si ancienne sauvegarde avec `cv`). */
export function getPrayerRitualCost(p) {
  if (!p) return 4;
  if (p.ritualPoints != null) return p.ritualPoints;
  if (p.ritualHint != null) return p.ritualHint;
  if (p.cv != null) return p.cv;
  return 4;
}

/**
 * Traits de bataille — Lames de Khorne (réf. battletome français).
 * « Trempés de sang » : selon ton livre, lorsque le seuil de pertes est atteint
 * (ex. la moitié des unités de l’armée détruites), les effets s’appliquent à
 * **chaque** unité qui remplit les conditions — **sans** désigner une seule cible.
 * Utilise `getTrempesDeSangEffectsForUnit()` pour savoir quelles lignes concernent une unité.
 */
export const FACTION_BATTLE_TRAITS = {
  trempesDeSang: {
    name: "Trempés de sang",
    trigger:
      "Se déclenche lorsque la condition de pertes de l’armée est remplise (souvent la moitié des unités détruites — confirme le libellé exact dans ton battletome).",
    resolution:
      "Tous les effets ci-dessous s’appliquent alors à toutes les unités amies concernées, selon leurs mots-clés (pas de désignation d’une seule unité).",
  },
};

/**
 * Quelles lignes de « Trempés de sang » s’appliquent à cette unité une fois le seuil atteint.
 * Basé sur les mots-clés du warscroll (SANG-LIÉS, DÉMON, MONSTRE).
 * Les unités de coalition sans LAMES DE KHORNE sont exclues.
 */
export function getTrempesDeSangEffectsForUnit(unitDef) {
  if (!unitDef || unitDef.coalition) return [];
  const kw = unitDef.keywords || [];
  if (!kw.includes("LAMES DE KHORNE")) return [];

  const out = [];

  out.push({
    id: "brutalite_aveugle",
    name: "Brutalité aveugle",
    summary:
      "Ignore les modificateurs positifs aux jets de sauvegarde contre cette unité.",
  });

  if (kw.includes("SANG-LIÉS")) {
    out.push({
      id: "brume_sang",
      name: "Brume de sang",
      summary:
        "Si l’unité est Sang-liés : les armes Trempées de sang gagnent Crit (Blessure mortelle).",
    });
  }

  if (kw.includes("DÉMON") && !kw.includes("MONSTRE")) {
    out.push({
      id: "armes_meurtre",
      name: "Armes du meurtre",
      summary:
        "Si l’unité est Démon et non Monstre : +1 au perforant des armes Trempées de sang (y compris Compagnon).",
    });
  }

  if (kw.includes("MONSTRE")) {
    out.push({
      id: "seigneurs_sang",
      name: "Seigneurs du sang suprême",
      summary:
        "Si l’unité est Monstre : +1 aux dégâts des armes Trempées de sang.",
    });
  }

  return out;
}

/** Seuil : moitié du nombre d’unités pris en compte (souvent toute la partie — arrondi au supérieur). */
export function getTrempesDeSangThreshold(unitCount) {
  const n = unitCount ?? 0;
  if (n <= 0) return 0;
  return Math.ceil(n / 2);
}

/**
 * Trempés de sang : actif lorsque le nombre d’unités détruites (compteur global) ≥ moitié du total
 * de la partie (`totalGameUnits`, renseigné avant la bataille). Retombe sur `startingArmySize` si absent.
 */
export function isTrempesDeSangActive(battle) {
  if (!battle) return false;
  const total =
    battle.totalGameUnits != null && battle.totalGameUnits > 0
      ? battle.totalGameUnits
      : battle.startingArmySize ?? 0;
  if (total <= 0) return false;
  const dead = battle.deadUnitsCount ?? 0;
  return dead >= getTrempesDeSangThreshold(total);
}

/**
 * Modificateurs de profil applicables une fois Trempés de sang actif
 * (Armes du meurtre : +1 perforant ; Seigneurs du sang suprême : +1 dégâts sur armes Trempées de sang — simplifié : +1 D sur l’affichage).
 */
export function getTrempesDeSangCombatMods(unitDef, trempesActive) {
  if (!trempesActive || !unitDef) return { rend: 0, damageBonus: 0 };
  const effects = getTrempesDeSangEffectsForUnit(unitDef);
  let rend = 0;
  let damageBonus = 0;
  for (const e of effects) {
    if (e.id === "armes_meurtre") rend += 1;
    if (e.id === "seigneurs_sang") damageBonus += 1;
  }
  return { rend, damageBonus };
}

/** Unités — profils de base pour calcul ; `weapons` pour modifs de prières / buffs. */
export const UNITS = [
  {
    id: "skarbrand",
    name: "Skarbrand",
    keywords: ["CHAOS", "LAMES DE KHORNE", "UNIQUE", "HÉROS", "MONSTRE", "DÉMON"],
    stats: { move: '8"', save: "4+", control: "5", wounds: "16" },
    weapons: [
      { name: "Massacre (Soif de sang)", hit: "3+", wound: "2+", rend: "2", damage: "4", attacks: "4" },
      { name: "Carnage (Crit mortel)", hit: "3+", wound: "2+", rend: "2", damage: "8", attacks: "2" },
    ],
    abilities: [
      {
        name: "La rage de Skarbrand",
        phases: ["combat"],
        summary:
          "Passif : si 10+ points de dégâts sur cette unité, ou si elle n’a pas utilisé une aptitude COMBATTRE au tour précédent, les effets de « Trempés de sang » s’appliquent à cette unité.",
      },
      {
        name: "Colère inéluctable",
        phases: ["charge"],
        summary:
          "Passif : +1 au nombre de dés lancés pour les jets de charge de cette unité (maximum 3 dés).",
      },
      {
        name: "Rugissement de rage totale",
        phases: ["combat"],
        summary:
          "1×/tour (armée), mêlée : cible ennemie au contact — lance 3 dés ou autant de dés que de points de dégâts sur cette unité ; chaque 4+ inflige 1 blessure mortelle à la cible.",
      },
    ],
  },
  {
    id: "skulltaker",
    name: "Le Preneur de crânes",
    keywords: ["CHAOS", "LAMES DE KHORNE", "UNIQUE", "HÉROS", "INFANTERIE", "DÉMON"],
    stats: { move: '5"', save: "4+", control: "2", wounds: "7" },
    weapons: [
      { name: "L’Épée du Tueur", hit: "2+", wound: "3+", rend: "2", damage: "2", attacks: "6", notes: "Anti-HÉROS +1 Perf." },
    ],
    abilities: [
      {
        name: "Fléaux des héros",
        phases: ["combat"],
        summary:
          "Choisis un HÉROS ennemi au contact : pour le reste du tour, Frappe en premier tant qu’il est au contact, mais toutes les attaques de mêlée doivent cibler ce HÉROS.",
      },
      {
        name: "Le duel éternel",
        phases: ["end"],
        summary:
          "Fin de tour : si un HÉROS ennemi a subi des dégâts de mêlée de cette unité et est détruit ce tour, soigne (X) cette unité, X = ses points de dégâts actuels.",
      },
      {
        name: "Attiré par le sang",
        phases: ["end"],
        summary:
          "1×/bataille (armée), fin du tour adverse : cible un HÉROS ennemi qui a utilisé COMBATTRE ce tour — retire cette unité puis replace-la au contact de cette cible uniquement.",
      },
    ],
  },
  {
    id: "skull_cannon",
    name: "Canon à crânes",
    keywords: ["CHAOS", "LAMES DE KHORNE", "MACHINE DE GUERRE", "DÉMON"],
    stats: { move: '8"', save: "4+", control: "2", wounds: "8" },
    weapons: [
      { name: "Crânes enflammés", hit: "4+", wound: "3+", rend: "1", damage: "2", attacks: "4", range: '15"', notes: "Tir en mêlée" },
      { name: "Gueule hurlante", hit: "4+", wound: "3+", rend: "1", damage: "D3", attacks: "1", notes: "Companion" },
      { name: "Lames infernales", hit: "3+", wound: "3+", rend: "1", damage: "1", attacks: "4", notes: "Crit mortel" },
    ],
    abilities: [
      {
        name: "Broyez leurs os, prenez leurs crânes",
        phases: ["combat", "shooting"],
        summary:
          "Si des figurines ennemies sont tuées par une aptitude COMBATTRE de cette unité, juste après : cette unité peut utiliser TIR comme en phase de tir.",
      },
      {
        name: "Bombardement macabre",
        phases: ["shooting"],
        summary:
          "Si des dégâts sont infligés par un TIR de cette unité : −3 au score de contrôle de la cible jusqu’à la fin du tour.",
      },
    ],
  },
  {
    id: "karanak",
    name: "Karanak",
    keywords: ["CHAOS", "LAMES DE KHORNE", "UNIQUE", "HÉROS", "BÊTE", "DÉMON"],
    stats: { move: '8"', save: "5+", control: "2", wounds: "7" },
    weapons: [
      {
        name: "Gueules sauvages",
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "2",
        attacks: "6",
        notes: "Anti-HÉROS +1 Perf.",
      },
    ],
    abilities: [
      {
        name: "Premier de la meute",
        phases: ["movement"],
        summary:
          "Phase de mouvement : choisissez un héros ennemi comme proie de cette unité, vous pouvez choisir un héros en réserve.",
      },
      {
        name: "Traquer la proie",
        phases: ["movement"],
        summary:
          "Phase de mouvement : retirez Karanak et les Molosses de Khorne du champ de bataille et replacez-les à plus de 6\" de la proie et à plus de 9\" des autres unités ennemies. L’unité des Molosses de Khorne doit aussi être placée entièrement à 12\" de Karanak.",
      },
    ],
  },
  {
    id: "flesh_hounds",
    name: "Molosses de Khorne",
    keywords: ["CHAOS", "LAMES DE KHORNE", "BÊTE", "DÉMON"],
    woundsPerModel: 2,
    defaultModelCount: 10,
    stats: { move: '8"', save: "6+", control: "1", wounds: "20" },
    weapons: [
      {
        name: "Griffes sang-noir",
        hit: "4+",
        wound: "3+",
        rend: "—",
        damage: "1",
        attacks: "4",
        notes: "Trempés de sang",
      },
    ],
    abilities: [
      {
        name: "Bête",
        phases: ["end"],
        summary:
          "Mot-clé BÊTE — rappel en fin de tour (comptage de score de table, objectifs, trempés de sang / pertes d’unités — voir livre de règles).",
      },
      {
        name: "Chasseurs de mystiques",
        phases: ["hero"],
        summary:
          "À 12\" d’un SORCIER : double 1-2 sur incantation = sort fourbe ; psalmodie 2 non modifiée = échec.",
      },
    ],
  },
  {
    id: "claws_karanak",
    name: "Griffes de Karanak",
    keywords: ["CHAOS", "LAMES DE KHORNE", "INFANTERIE", "SANG-LIÉS"],
    woundsPerModel: 1,
    defaultModelCount: 8,
    stats: { move: '6"', save: "5+", control: "1", wounds: "8" },
    weapons: [
      {
        name: "Armes de la chasse",
        hit: "4+",
        wound: "3+",
        rend: "—",
        damage: "1",
        attacks: "3",
        notes: "Crit (2 touches) de base ; voir Chasseur de meute si proximité Karanak / Molosses.",
      },
    ],
    abilities: [
      { name: "L’odeur du sang", phases: ["deployment"], summary: "Déploiement : mouvement normal une fois." },
      {
        name: "Chasseur de meute",
        phases: ["combat"],
        summary:
          "Les armes de mêlée ont déjà Crit (2 touches) de base (jets de 6). En plus, tant que cette unité est entièrement à 12\" d’une unité de Molosses de Khorne amie ou d’un Karanak ami, les touches critiques se comptent sur des jets non modifiés de 5+ (et pas seulement sur les 6), en phases de mêlée.",
      },
    ],
  },
  {
    id: "deathbringer",
    name: "Despote de Khorne",
    keywords: ["CHAOS", "LAMES DE KHORNE", "HÉROS", "INFANTERIE", "SANG-LIÉS"],
    stats: { move: '5"', save: "3+", control: "2", wounds: "7" },
    weapons: [
      {
        name: "Hache de Khorne",
        hit: "3+",
        wound: "3+",
        rend: "2",
        damage: "2",
        attacks: "5",
        notes: "Trempés de sang",
      },
    ],
    abilities: [
      {
        name: "Seigneur de sang lié",
        phases: ["combat"],
        summary:
          "+1 pour blesser aux attaques de mêlée contre les unités Sang-liés INFANTERIE à 12\" tout autour de ce héros.",
      },
      {
        name: "Apportez-moi leurs crânes !",
        phases: ["combat"],
        summary:
          "1×/tour (armée) : un autre HÉROS Sang-liés INFANTERIE à 12\" gagne Frappe en premier pour la phase.",
      },
    ],
  },
  {
    id: "bloodsecrator",
    name: "Consangcrateur",
    keywords: ["CHAOS", "LAMES DE KHORNE", "HÉROS", "INFANTERIE", "SANG-LIÉS"],
    stats: { move: '5"', save: "3+", control: "5", wounds: "6" },
    weapons: [
      {
        name: "Hache ensorcelée",
        hit: "3+",
        wound: "3+",
        rend: "1",
        damage: "2",
        attacks: "4",
        notes: "Trempés de sang",
      },
    ],
    abilities: [
      {
        name: "Icône du dieu du sang",
        phases: ["hero"],
        summary:
          "Passif : si une unité Sang-liés amie entièrement à 12\" utilise l’ordre « Ralliement », tu peux lancer 3 jets de ralliement supplémentaires sur D6.",
      },
      {
        name: "Rage de Khorne",
        phases: ["combat"],
        summary:
          "1×/bataille (armée), mêlée : +1 aux Attaques des armes de mêlée des unités Sang-liés amies jusqu’à la fin du tour.",
      },
    ],
  },
  {
    id: "bloodstoker",
    name: "Chauffe-sang",
    keywords: ["CHAOS", "LAMES DE KHORNE", "HÉROS", "INFANTERIE", "SANG-LIÉS"],
    stats: { move: '5"', save: "4+", control: "2", wounds: "5" },
    weapons: [
      {
        name: "Lame de torture et fouet sanglant",
        hit: "3+",
        wound: "4+",
        rend: "1",
        damage: "2",
        attacks: "4",
        notes: "Trempés de sang",
      },
    ],
    abilities: [
      {
        name: "Fustigateur",
        phases: ["movement"],
        summary:
          "1×/tour (armée), mouvement : cible une unité Sang-liés non-HÉROS amie à portée de mêlée — jusqu’à la fin du tour elle peut utiliser Charge même si elle a Couru ce tour (règle « À cran de fureur »).",
      },
    ],
  },
  {
    id: "khorgorath",
    name: "Khorgorath",
    keywords: ["CHAOS", "LAMES DE KHORNE", "MONSTRE", "SANG-LIÉS"],
    stats: { move: '8"', save: "5+", control: "2", wounds: "8" },
    weapons: [
      { name: "Griffes et crocs", hit: "4+", wound: "2+", rend: "1", damage: "2", attacks: "5", notes: "Companion" },
    ],
    abilities: [
      {
        name: "Prédateur abominable",
        phases: ["combat"],
        summary:
          "1×/tour (armée), mêlée : cible au contact — sur 3+ elle ne peut pas recevoir d’ordres pour le reste du tour.",
      },
      {
        name: "Repas d’os",
        phases: ["end"],
        summary:
          "Fin de tour : −3 au score de contrôle des unités ennemies non-MONSTRE au contact de cette unité.",
      },
    ],
  },
  {
    id: "slaughterpriest",
    name: "Prêtre du carnage",
    keywords: ["CHAOS", "LAMES DE KHORNE", "HÉROS", "PRÊTRE", "INFANTERIE", "SANG-LIÉS"],
    stats: { move: '5"', save: "5+", control: "2", wounds: "6" },
    weapons: [
      {
        name: "Arme baignée de sang",
        hit: "3+",
        wound: "3+",
        rend: "1",
        damage: "2",
        attacks: "4",
        notes: "Trempés de sang",
      },
    ],
    abilities: [
      {
        name: "Mépris de la sorcellerie",
        phases: ["hero"],
        bothHeroPhases: true,
        summary:
          "Passif : cette unité peut utiliser des aptitudes de dissipation comme si elle avait le mot-clé SORCIER (rappel : phase des héros alliée et phase des héros adverse).",
      },
      {
        name: "Sacrifice de sang",
        phases: ["hero"],
        summary:
          "Sort — 1× par tour, n’importe quelle phase de héros. Cible : n’importe quelle unité alliée ou ennemie en mêlée avec le prêtre. Jetez un D3 : sur 2+, infligez autant de blessures mortelles que le résultat du jet. Le prêtre gagne 1 point de rituel sanglant.",
      },
    ],
    isPriest: true,
  },
  {
    id: "blood_warriors",
    name: "Guerriers de sang",
    keywords: ["CHAOS", "LAMES DE KHORNE", "INFANTERIE", "SANG-LIÉS"],
    woundsPerModel: 2,
    defaultModelCount: 5,
    stats: { move: '5"', save: "3+", control: "1", wounds: "10" },
    weapons: [
      {
        name: "Armes goreuses",
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "1",
        attacks: "3",
        notes: "Trempés de sang, Crit (Blessure auto)",
      },
    ],
    abilities: [
      {
        name: "Aucun répit",
        phases: ["combat"],
        requiresInMelee: true,
        summary:
          "Passif : tant qu’elle conteste un objectif que tu ne contrôles pas, cette unité a une sauvegarde de protection 5+.",
      },
    ],
  },
  {
    id: "bloodreavers",
    name: "Pillards de sang",
    keywords: ["CHAOS", "LAMES DE KHORNE", "INFANTERIE", "SANG-LIÉS"],
    woundsPerModel: 1,
    defaultModelCount: 10,
    stats: { move: '5"', save: "6+", control: "1", wounds: "10" },
    weapons: [
      {
        name: "Lames et haches de pillard",
        hit: "4+",
        wound: "3+",
        rend: "—",
        damage: "1",
        attacks: "2",
        notes: "Trempés de sang",
      },
    ],
    abilities: [
      {
        name: "Du sang pour le dieu du sang !",
        phases: ["charge", "combat"],
        summary:
          "Passif : +1 au perforant des armes de mêlée de cette unité si elle a chargé ce même tour.",
      },
    ],
  },
  {
    id: "skullcrushers",
    name: "Massacreurs de Khorne",
    keywords: ["CHAOS", "LAMES DE KHORNE", "SANG-LIÉS", "CAVALERIE"],
    woundsPerModel: 5,
    defaultModelCount: 3,
    reinforcedModelCount: 6,
    stats: { move: '10"', save: "2+", control: "2", wounds: "15" },
    weapons: [
      {
        name: "Vouge infernale",
        hit: "3+",
        wound: "3+",
        rend: "1",
        damage: "1",
        attacks: "3",
        notes: "Trempés de sang, Crit mortel",
      },
      {
        name: "Sabots de juggernaut d’airain",
        hit: "4+",
        wound: "3+",
        rend: "1",
        damage: "D3",
        attacks: "2",
        notes: "Anti-CAVALERIE +1 Perf., Companion",
      },
    ],
    abilities: [
      {
        name: "Charge massacrante",
        phases: ["charge"],
        summary:
          "Passif : si le jet de charge non modifié est 8+, jusqu’à la fin de la phase cette unité traverse les figurines ennemies ; les unités CAVALERIE ennemies traversées ne font pas de resserrement ce tour.",
      },
    ],
  },
  {
    id: "belakor",
    name: "Be'lakor, le Maître des Ténèbres",
    keywords: [
      "CHAOS",
      "ESCLAVE DES TÉNÈBRES",
      "UNIQUE",
      "HÉROS",
      "MONSTRE",
      "DÉMON",
      "MAÎTRE DE GUERRE",
      "SORCIER (2)",
      "VOL",
      "PROTECTION 4+",
    ],
    coalition: true,
    wizardLevel: 2,
    stats: { move: '14"', save: "4+", control: "10", wounds: "14" },
    weapons: [
      {
        name: "Lame des ombres",
        range: '2"',
        hit: "3+",
        wound: "3+",
        rend: "2",
        damage: "2",
        attacks: "8",
        dynamicAttacks: "belakor_lame",
      },
      {
        name: "Griffe terrible et lance caudale",
        range: '1"',
        hit: "2+",
        wound: "2+",
        rend: "2",
        damage: "2",
        attacks: "2",
        notes: "Charge : +1 dégât",
      },
    ],
    stigmates: [
      {
        name: "Stigmate de guerre",
        phases: ["combat"],
        summary:
          "Passif : si Be’lakor a subi 10 blessures ou plus (PV restants ≤ 4 sur profil 14), le nombre d’attaques de la Lame des ombres est réduit à 6 (au lieu de 8). Le tableau d’armes se met à jour selon les PV renseignés.",
      },
      {
        name: "Silhouette d’ombre",
        phases: ["combat"],
        summary:
          "Passif : ignorez les modificateurs aux jets de sauvegarde de l’unité (positifs comme négatifs).",
      },
    ],
    abilities: [
      {
        name: "Affaiblissement de l’ennemi",
        phases: ["hero"],
        heroPhase: "mine",
        summary:
          "Phase des héros : choisissez une unité ennemie à 18\" et visible, puis lancez 2D6 : il faut obtenir au moins 6. Effet : jusqu’au début de votre prochain tour, −1 aux jets pour toucher de l’unité ciblée, et les attaques ennemies contre cette unité ne peuvent pas infliger de critique.",
      },
      {
        name: "Le maître des ténèbres",
        phases: ["hero"],
        bothHeroPhases: true,
        heroPhase: "opponent",
        summary:
          "1× par bataille — phase des héros adverse : choisissez comme cible une unité ennemie visible. Effet : jusqu’au début de votre prochain tour, chaque fois que la cible est choisie pour utiliser une aptitude, lancez un dé en réaction ; sur 3+, l’aptitude n’a aucun effet.",
      },
    ],
  },
  {
    id: "wrath_axe",
    name: "Hache de rage (manifestation)",
    invocationOnly: true,
    keywords: ["CHAOS", "LAMES DE KHORNE", "MANIFESTATION", "INVOCATION", "DÉMON"],
    stats: { move: '8"', save: "5+", control: "7+", wounds: "7" },
    weapons: [
      {
        name: "Hache de rage",
        hit: "4+",
        wound: "2+",
        rend: "2",
        damage: "D3",
        attacks: "4",
      },
    ],
    abilities: [
      {
        name: "Tranchant de haine",
        phases: ["combat"],
        summary: "Mêlée : si a chargé, 2D6 ≥ 8+ : 1 modèle de la cible au contact est tué.",
      },
    ],
  },
  {
    id: "hexgorger",
    name: "Crânes sorcevores",
    invocationOnly: true,
    keywords: ["CHAOS", "LAMES DE KHORNE", "MANIFESTATION", "INVOCATION", "DÉMON"],
    stats: { move: '8"', save: "5+", control: "7+", wounds: "6" },
    weapons: [
      {
        name: "Flot de sang en fusion",
        hit: "4+",
        wound: "3+",
        rend: "—",
        damage: "D3",
        attacks: "2",
        notes: "2 parties",
      },
    ],
    abilities: [
      {
        name: "Plusieurs parties",
        phases: ["combat"],
        summary:
          "Le modèle comporte plusieurs parties (voir warscroll pour blessures et ciblage).",
      },
      {
        name: "Mangeurs de sorts",
        phases: ["hero"],
        summary: "Chaque partie à 8\" d’un SORCIER : −1 au jet d’incantation (cumul).",
      },
    ],
  },
  {
    id: "icone_sanglante",
    name: "Icône sanglante (manifestation)",
    invocationOnly: true,
    keywords: ["CHAOS", "LAMES DE KHORNE", "MANIFESTATION", "INVOCATION"],
    stats: {
      move: "—",
      save: "5+",
      magicSave: "6+",
      banishment: "7+",
      control: "—",
      wounds: "8",
    },
    weapons: [
      {
        name: "—",
        hit: "—",
        wound: "—",
        rend: "—",
        damage: "—",
        attacks: "—",
        notes: "Pas d’arme",
      },
    ],
    abilities: [
      {
        name: "Signe de ruine",
        phases: ["hero"],
        summary:
          "Cible : une unité Lames de Khorne amie visible et entièrement à 8\" de l’icône. Puis choisissez une aptitude de dîme de sang que vous n’avez pas encore débloquée. Effet : jetez un dé ; si le résultat est supérieur au nombre de points de dîme nécessaires au pouvoir choisi, utilisez le pouvoir de dîme comme s’il était débloqué.",
      },
    ],
  },
];

const ALL_CATALOG_UNITS = [
  ...UNITS,
  ...IRONJAWZ_UNITS,
  ...SOULBLIGHT_UNITS,
  ...SERAPHON_UNITS,
];

/** Prière (id) → warscroll d’invocation — uniquement si la convocation réussit en phase des héros. */
export const CONVOCATION_PRAYER_TO_UNIT = {
  convocation_sorcevores: "hexgorger",
  convocation_hache_rage: "wrath_axe",
  convocation_icone_sanglante: "icone_sanglante",
};

/** Factions jouables dans le helper (catalogue + partie). */
export const FACTIONS = [
  {
    id: "vampires",
    name: "Seigneurs Ruinemânes (Soulblight)",
    description:
      "Soulblight Gravelords : traits de bataille, formations, sorts du domaine de la Non-Vie, manifestations, traits héroïques, artefacts et unités — rappels par phase.",
    implemented: true,
  },
  {
    id: "peaux_vertes",
    name: "Les Peaux-Vertes (Mâchefers)",
    description:
      "Orruk Warclans — Mâchefers : formations, traits de bataille, traits héroïques, artefacts, prières et unités (Waaagh!, etc.).",
    implemented: true,
  },
  {
    id: "khorne",
    name: "Lames de Khorne",
    description:
      "Formation, trait, artefact d’armée, dîme de sang, Trempés de sang — catalogue ci-dessous.",
    implemented: true,
  },
  {
    id: "seraphon",
    name: "Seraphon",
    description:
      "Asterismes, formations d’Hôte (Étoile / ombre), traits héroïques, trésors des Anciens, littératures céleste & jungle, unités Coalescés / Starborne — rappels par phase.",
    implemented: true,
  },
];

export function isKhorneFactionId(factionId) {
  return factionId === "khorne";
}

export function isPeauxVertesFactionId(factionId) {
  return factionId === "peaux_vertes";
}

export function isSoulblightFactionId(factionId) {
  return factionId === "vampires";
}

export function isSeraphonFactionId(factionId) {
  return factionId === "seraphon";
}

export function isPlayableFactionId(factionId) {
  return (
    isKhorneFactionId(factionId) ||
    isPeauxVertesFactionId(factionId) ||
    isSoulblightFactionId(factionId) ||
    isSeraphonFactionId(factionId)
  );
}

export function getFormationsForFaction(factionId) {
  if (isKhorneFactionId(factionId)) return FORMATIONS;
  if (isPeauxVertesFactionId(factionId)) return IRONJAWZ_FORMATIONS;
  if (isSoulblightFactionId(factionId)) return SOULBLIGHT_FORMATIONS;
  if (isSeraphonFactionId(factionId)) return SERAPHON_FORMATIONS;
  return [];
}

export function getHeroicTraitsForFaction(factionId) {
  if (isKhorneFactionId(factionId)) return HEROIC_TRAITS;
  if (isPeauxVertesFactionId(factionId)) return IRONJAWZ_HEROIC_TRAITS;
  if (isSoulblightFactionId(factionId)) return SOULBLIGHT_HEROIC_TRAITS;
  if (isSeraphonFactionId(factionId)) return SERAPHON_HEROIC_TRAITS;
  return [];
}

export function getArtifactsForFaction(factionId) {
  if (isKhorneFactionId(factionId)) return ARTIFACTS;
  if (isPeauxVertesFactionId(factionId)) return IRONJAWZ_ARTIFACTS;
  if (isSoulblightFactionId(factionId)) return SOULBLIGHT_ARTIFACTS;
  if (isSeraphonFactionId(factionId)) return SERAPHON_ARTIFACTS;
  return [];
}

export function getPrayersForFaction(factionId) {
  if (isKhorneFactionId(factionId)) return PRAYERS;
  if (isPeauxVertesFactionId(factionId)) return IRONJAWZ_PRAYERS;
  if (isSoulblightFactionId(factionId)) return SOULBLIGHT_PRAYERS;
  if (isSeraphonFactionId(factionId)) return SERAPHON_PRAYERS;
  return [];
}

/** Valeurs par défaut pour la préparation (liste déroulante). */
export function getDefaultArmySetupForFaction(factionId) {
  const formations = getFormationsForFaction(factionId);
  const traits = getHeroicTraitsForFaction(factionId);
  const arts = getArtifactsForFaction(factionId);
  const o = {
    formationId: formations[0]?.id ?? "",
    traitId: traits[0]?.id ?? "",
    artifactId: arts[0]?.id ?? "",
  };
  if (isSeraphonFactionId(factionId)) {
    o.seraphonAsterismId = SERAPHON_ASTERISMS[0]?.id ?? "";
  }
  return o;
}

/** Unités disponibles pour la faction (hors invocations : filtrées dans l’app). */
export function getUnitsForFaction(factionId) {
  if (isKhorneFactionId(factionId)) return UNITS;
  if (isPeauxVertesFactionId(factionId)) return IRONJAWZ_UNITS;
  if (isSoulblightFactionId(factionId)) return SOULBLIGHT_UNITS;
  if (isSeraphonFactionId(factionId)) return SERAPHON_UNITS;
  return [];
}

export function getUnitById(id) {
  return ALL_CATALOG_UNITS.find((u) => u.id === id) || null;
}

export function getFormationById(id) {
  return (
    FORMATIONS.find((f) => f.id === id) ||
    IRONJAWZ_FORMATIONS.find((f) => f.id === id) ||
    SOULBLIGHT_FORMATIONS.find((f) => f.id === id) ||
    SERAPHON_FORMATIONS.find((f) => f.id === id) ||
    null
  );
}

export { IRONJAWZ_BATTLE_TRAITS, MELEE_PROXIMITY_RECAP_IRONJAWZ } from "./ironjawz-catalog.js";
export {
  SOULBLIGHT_BATTLE_TRAITS,
  SOULBLIGHT_LINKED_ENEMY_EFFECTS,
  SOULBLIGHT_SPELLS,
  SOULBLIGHT_CONVOCATION_SPELLS,
  MELEE_PROXIMITY_RECAP_SOULBLIGHT,
} from "./soulblight-catalog.js";
export {
  MELEE_PROXIMITY_RECAP_SERAPHON,
  SERAPHON_ARTIFACTS,
  SERAPHON_ASTERISMS,
  SERAPHON_BATTLE_TRAITS,
  SERAPHON_FORMATIONS,
  SERAPHON_HEROIC_TRAITS,
  SERAPHON_POURSUIVRE_INTRO,
  SERAPHON_SPELLS,
  getSeraphonAsterismById,
  seraphonUnitIsMonsterSeraphon,
} from "./seraphon-catalog.js";

/** Rappels dîme de sang par phase (usage ou rappel de passifs débloqués). */
export function getBloodTitheReasonsForPhase(phaseId) {
  const t = (id) => BLOOD_TITHE_ABILITIES.find((a) => a.id === id);
  if (phaseId === "hero") {
    const unlockNames =
      "Mépris divin ; Un combat glorieux ou rien ; Euphorie du combat ; Massacre triomphal ; Tailladez le sourire de Khorne.";
    const tm = t("tuez_mystiques");
    return [
      {
        title: "Déblocage (début de tour)",
        text: `Tu peux débloquer une aptitude parmi : ${unlockNames} (voir panneau Dîme).`,
      },
      ...(tm
        ? [{ title: tm.name, text: tm.summary }]
        : []),
    ];
  }
  if (phaseId === "charge") {
    const s = t("soif_meurtre");
    return s ? [{ title: s.name, text: s.summary }] : [];
  }
  if (phaseId === "combat") {
    const out = [];
    const p = t("punissez_pacifistes");
    const m = t("massacre_triomphal");
    const ta = t("tailladez_sourire");
    if (p) out.push({ title: p.name, text: p.summary });
    if (m)
      out.push({
        title: `${m.name} (passif)`,
        text: m.summary,
      });
    if (ta)
      out.push({
        title: `${ta.name} (passif)`,
        text: ta.summary,
      });
    return out;
  }
  return [];
}

/** Arme de tir pour les rappels de phase (portée ≥ 6"). */
export function weaponIsRangedForPhase(w) {
  if (!w?.range) return false;
  const m = String(w.range).match(/(\d+)/);
  if (!m) return false;
  return parseInt(m[1], 10) >= 6;
}

/**
 * Raisons d’afficher une unité dans le panneau de phase (aptitudes + stigmates tagués + prêtre/sorcier + armes à distance).
 * @param {{ isPlayerTurn?: boolean, instance?: { inMelee?: boolean, chargedThisTurn?: boolean }, factionId?: string }} [opts] — `instance` requis pour `requiresInMelee` / `requiresChargedThisTurn` (mêlée). `endPhaseBothSides` / `chargePhaseBothSides` / `combatPhaseBothSides` pour rappels au tour adverse.
 */
export function getUnitPhaseReasons(unitDef, phaseId, opts = {}) {
  const isPlayerTurn = opts.isPlayerTurn !== false;
  const factionId = opts.factionId;
  const reasons = [];
  if (!unitDef) return reasons;

  const fromList = [
    ...(unitDef.abilities || []),
    ...(unitDef.stigmates || []),
  ];
  for (const ab of fromList) {
    if (ab.phasePanel === false) continue;
    if (!ab.phases?.includes(phaseId)) continue;
    if (
      ab.requiresInMelee &&
      phaseId === "combat" &&
      (!opts.instance || opts.instance.inMelee !== true)
    ) {
      continue;
    }

    if (
      ab.requiresChargedThisTurn &&
      phaseId === "combat" &&
      (!opts.instance || opts.instance.chargedThisTurn !== true)
    ) {
      continue;
    }

    if (ab.playerTurnOnly && !isPlayerTurn) {
      if (phaseId === "end" && ab.endPhaseBothSides) {
        /* rappel fin de tour adverse */
      } else if (phaseId === "charge" && ab.chargePhaseBothSides) {
        /* rappel charge adverse */
      } else {
        continue;
      }
    }

    if (phaseId === "hero") {
      if (!isPlayerTurn && !ab.bothHeroPhases) continue;
      if (ab.heroPhase === "mine" && !isPlayerTurn) continue;
      if (ab.heroPhase === "opponent" && isPlayerTurn) continue;
    } else if (!isPlayerTurn) {
      if (phaseId === "end" && ab.endPhaseBothSides) {
        /* rappel aussi au tour adverse */
      } else if (phaseId === "charge" && ab.chargePhaseBothSides) {
        /* rappel aussi au tour adverse (charge adverse) */
      } else if (phaseId === "combat" && ab.combatPhaseBothSides) {
        /* mêlée adverse : passifs qui s’appliquent aussi */
      } else {
        continue;
      }
    }

    reasons.push({
      type: "ability",
      title: ab.name,
      text: ab.summary,
    });
  }

  const isPriestLike =
    unitDef.isPriest === true ||
    unitDef.keywords?.some((k) => String(k).startsWith("PRÊTRE"));

  if (phaseId === "hero" && isPriestLike && isPlayerTurn) {
    const prayerList = factionId
      ? getPrayersForFaction(factionId)
      : PRAYERS;
    for (const p of prayerList) {
      if (p.phase && p.phase !== "hero") continue;
      const cost = getPrayerRitualCost(p);
      reasons.push({
        type: "prayer",
        title: `Prière : ${p.name}`,
        text: `${cost} pts de rituel — ${p.summary}`,
      });
    }
  }

  if (phaseId === "shooting") {
    for (const w of unitDef.weapons || []) {
      if (weaponIsRangedForPhase(w)) {
        reasons.push({
          type: "weapon",
          title: w.name,
          text: `Attaque de tir (${w.range}${w.notes ? " — " + w.notes : ""})`,
        });
      }
    }
  }

  return reasons;
}

/** Instances de la liste triées par nom, avec au moins une raison pour la phase. */
export function getPhaseInstancesForArmy(phaseId, instances, opts = {}) {
  const rows = [];
  for (const inst of instances) {
    if (inst.destroyed) continue;
    const u = getUnitById(inst.catalogId);
    if (!u) continue;
    const reasons = getUnitPhaseReasons(u, phaseId, {
      ...opts,
      instance: inst,
      factionId: opts.factionId,
    });
    if (reasons.length)
      rows.push({ instanceId: inst.id, name: u.name, reasons });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return rows;
}
