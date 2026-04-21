/**
 * Rappels des aptitudes de commandement / règles générales (AoS 4e) — coûts en PC.
 * Textes de synthèse pour le tiroir « PC & règles » (toutes factions).
 */

const SECTIONS = [
  {
    id: "deploy",
    title: "Déploiement",
    phaseIds: ["deployment"],
    items: [
      {
        name: "Référence",
        cost: "—",
        text:
          "Pas d’aptitude de commandement générale obligatoire en déploiement : applique la mission (réserves, terrain, objectifs, etc.).",
      },
    ],
  },
  {
    id: "start",
    title: "Début de tour",
    phaseIds: ["hero"],
    items: [
      {
        name: "Activation de site de pouvoir",
        cost: "0 PC",
        text:
          "1× par tour (armée), début de n’importe quel tour. Annonce : choisis un <strong>HÉROS</strong> ami à 3\" d’un <strong>site de pouvoir</strong>, puis ce site comme cible. Choisis 1 effet : <strong>Pollen cautérisant</strong> (dé : sur 1, 1 BM à chaque unité à 6\" d’un ou plusieurs sites ; sur 3+, Soigne (2) chaque unité entièrement à 6\" de la cible) ; <strong>Pousse rapide</strong> (objectif Ghyranite ou terrain à 12\" du héros, dé : sur 3+, Occultant pour le reste de la bataille) ; <strong>Puiser dans les lignes telluriques</strong> (jusqu’à la fin du tour, si le héros n’est pas SORCIER/PRÊTRE, il peut Dissiper / Bannir comme SORCIER (1)).",
      },
    ],
  },
  {
    id: "hero",
    title: "Phase des héros",
    phaseIds: ["hero"],
    items: [
      {
        name: "Ralliement",
        cost: "1 PC",
        text:
          "N’importe quelle phase des héros. Unité amie <strong>hors mêlée</strong>. Lance 6 dés de ralliement (D6) ; chaque 4+ = 1 <strong>point de ralliement</strong> : Soigne (1) par point dépensé, ou dépense des points égaux à la <strong>Santé</strong> de l’unité pour ramener une figurine tuée. Points combinables ; non dépensés perdus. <em>Passif Musicien :</em> +1 dé de ralliement si la figurine musicien est présente.",
      },
      {
        name: "Bannir une manifestation",
        cost: "0 PC",
        text:
          "Ta phase des héros. SORCIER ou PRÊTRE ami — manifestation ennemie à 30\". Jet de bannissement 2D6 +1 pour chaque autre manifestation ennemie sur le champ. Si le total ≥ valeur de bannissement de la cible, elle est bannie. 1× par manifestation et par tour.",
      },
      {
        name: "Dissipation",
        cost: "0 PC",
        text:
          "<strong>Réaction :</strong> l’adversaire annonce une aptitude <strong>SORT</strong>. Un SORCIER ami à 30\" du SORCIER lanceur : jet 2D6 ; s’il est <strong>supérieur</strong> au jet d’incantation, le sort est dissipé. 1× par incantation.",
      },
      {
        name: "Intervention magique",
        cost: "1 PC",
        text:
          "Phase des héros <strong>adverse</strong>. SORCIER ou PRÊTRE ami : l’unité peut utiliser un <strong>SORT</strong> ou une <strong>PRIÈRE</strong> comme si c’était ta phase des héros ; −1 aux jets d’incantation / de psalmodie pour cette aptitude.",
      },
      {
        name: "Rites sacrés",
        cost: "0 PC",
        text:
          "Ta phase des héros. PRÊTRE : jet de psalmodie 1D6 ; sur un 1 non modifié, retire 1 point rituel au lieu de D3. Effet : le PRÊTRE gagne des points de rituel égaux au jet de psalmodie.",
      },
    ],
  },
  {
    id: "movement",
    title: "Phase de mouvement",
    phaseIds: ["movement"],
    items: [
      {
        name: "Mouvement normal",
        cost: "0 PC",
        text:
          "Ta phase de mouvement. Unité hors mêlée : déplace d’une distance égale à son M ; ne peut pas entrer en mêlée.",
      },
      {
        name: "Course",
        cost: "0 PC",
        text:
          "Unité hors mêlée : M + D6 ; ne peut pas entrer en mêlée.",
      },
      {
        name: "Repli",
        cost: "0 PC",
        text:
          "Unité en mêlée : inflige D3 BM à l’unité ; puis déplace d’une distance égale à M ; peut traverser la portée de mêlée ennemie mais ne finit pas en mêlée.",
      },
      {
        name: "Au pas de course",
        cost: "1 PC",
        text:
          "<strong>Réaction :</strong> tu as annoncé une aptitude <strong>Course</strong>. N’ajoute pas le D6 : ajoute 6\" au M pour ce déplacement.",
      },
      {
        name: "Redéploiement",
        cost: "1 PC",
        text:
          "Phase de mouvement <strong>adverse</strong>. Unité hors mêlée : déplace jusqu’à D6\" ; ne traverse ni ne finit dans la portée de mêlée d’une unité ennemie.",
      },
      {
        name: "Vol (passif)",
        cost: "—",
        text:
          "En te déplaçant : ignore les figurines, le terrain et les portées de mêlée ennemies ; ne finit pas en mêlée sauf indication ; ignore la distance verticale.",
      },
    ],
  },
  {
    id: "shooting",
    title: "Phase de tir",
    phaseIds: ["shooting"],
    items: [
      {
        name: "Tir",
        cost: "0 PC",
        text:
          "Ta phase de tir. Unité qui n’a pas Couru ni Replié : choisis des cibles ennemies et résous les attaques de tir.",
      },
      {
        name: "Tir de couverture",
        cost: "1 PC",
        text:
          "Phase de tir <strong>adverse</strong>. Unité qui n’a pas Couru ni Replié et hors mêlée : cible l’unité ennemie la plus proche à portée ; résous les tirs avec <strong>−1 pour toucher</strong>.",
      },
    ],
  },
  {
    id: "charge",
    title: "Phase de charge",
    phaseIds: ["charge"],
    items: [
      {
        name: "Charge",
        cost: "0 PC",
        text:
          "Ta phase de charge. Unité hors mêlée, qui n’a pas Couru ni Replié : lance 2D6 ; déplace d’une distance égale au résultat ; peut entrer en mêlée ; doit finir à ≤½\" d’une unité ennemie visible pour réussir.",
      },
      {
        name: "En avant, vers la victoire",
        cost: "1 PC",
        text:
          "<strong>Réaction :</strong> tu as annoncé une <strong>Charge</strong>. Tu peux relancer le 2D6 de charge.",
      },
      {
        name: "Contre-charge",
        cost: "2 PC",
        text:
          "Phase de charge <strong>adverse</strong>. Unité hors mêlée : peut utiliser une <strong>Charge</strong> comme si c’était ta phase de charge.",
      },
    ],
  },
  {
    id: "combat",
    title: "Phase de mêlée",
    phaseIds: ["combat"],
    items: [
      {
        name: "Corps à corps",
        cost: "0 PC",
        text:
          "N’importe quelle phase de mêlée. Unité en mêlée ou qui a <strong>chargé ce tour</strong> : pile-in, puis attaques de mêlée.",
      },
      {
        name: "Champion (passif)",
        cost: "—",
        text:
          "+1 à la caractéristique d’Attaques des armes utilisées par les champions de l’unité.",
      },
      {
        name: "Attaque en règle",
        cost: "1 PC",
        text:
          "<strong>Réaction :</strong> tu as déclaré une aptitude <strong>ATTAQUE</strong>. +1 pour toucher pour ces attaques (y compris compagnons) ; jusqu’à la fin du tour, <strong>−1 aux sauvegardes</strong> de l’unité qui utilise cette aptitude.",
      },
      {
        name: "Défense en règle",
        cost: "1 PC",
        text:
          "<strong>Réaction :</strong> l’adversaire a déclaré une aptitude <strong>ATTAQUE</strong> qui te cible. +1 aux sauvegardes jusqu’à la résolution de cette aptitude.",
      },
    ],
  },
  {
    id: "end",
    title: "Fin du tour",
    phaseIds: ["end"],
    items: [
      {
        name: "Porte-étendard (passif)",
        cost: "—",
        text:
          "Tant que l’unité contient un ou plusieurs porte-étendards : +1 au score de contrôle.",
      },
      {
        name: "Enfoncement",
        cost: "1 PC",
        text:
          "Fin de n’importe quel tour. Unité qui a <strong>chargé ce tour</strong> — choisis une unité ennemie en mêlée avec elle dont la <strong>Santé</strong> est inférieure à celle de ton unité : inflige D3 BM ; puis déplace jusqu’à M, peut traverser les ennemis avec lesquels elle était en mêlée, ne finit pas en mêlée avec d’autres ennemis.",
      },
    ],
  },
  {
    id: "defense",
    title: "Passifs de défense",
    phaseIds: ["shooting", "combat"],
    items: [
      {
        name: "Sauvegarde de protection",
        cost: "—",
        text:
          "À l’étape 1 de la séquence des dégâts : un jet de protection (D6) par point de dégâts dans la réserve ; sur le score indiqué ou +, annule ce dégât.",
      },
      {
        name: "Héros gardé",
        cost: "—",
        text:
          "Si ce HÉROS est à portée de mêlée d’une unité amie non-HÉROS : −1 pour toucher au tir contre ce héros ; si INFANTERIE, ne peut pas être ciblé par le tir d’unités à plus de 12\".",
      },
    ],
  },
];

/**
 * @param {string} phaseId - id de phase courante (deployment, hero, …)
 * @param {(s: string) => string} escapeHtml
 */
export function buildUniversalPcDrawerHtml(phaseId, escapeHtml) {
  let h = `<p class="muted small pc-drawer-lead">Référence des aptitudes courantes — <strong>coût en points de commandement (PC)</strong>. Ajuste ton total avec les boutons <strong>− / +</strong> dans la barre (max 4 / tour en jeu classique).</p>`;

  for (const sec of SECTIONS) {
    const isCurrent =
      sec.phaseIds.length === 0
        ? false
        : sec.phaseIds.includes(phaseId);
    const cls = isCurrent ? "pc-drawer-section pc-drawer-section--current" : "pc-drawer-section";
    h += `<section class="${cls}" data-pc-section="${escapeHtml(sec.id)}">`;
    h += `<h3 class="pc-drawer-section-title">${escapeHtml(sec.title)}`;
    if (isCurrent) {
      h += ` <span class="tag tag--phase">Phase en cours</span>`;
    }
    h += `</h3><ul class="pc-rule-list">`;
    for (const it of sec.items) {
      h += `<li class="pc-rule-item"><div class="pc-rule-head">`;
      h += `<strong class="pc-rule-name">${escapeHtml(it.name)}</strong> `;
      h += `<span class="pc-rule-cost" title="Coût en PC">${escapeHtml(it.cost)}</span>`;
      h += `</div><p class="pc-rule-text muted small">${it.text}</p></li>`;
    }
    h += `</ul></section>`;
  }

  return h;
}
