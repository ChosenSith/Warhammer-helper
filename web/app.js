const STORAGE_KEY_V1 = "warhammer-helper-v1";
const STORAGE_KEY = "warhammer-helper-v2";

/** Bonus positif = meilleur jet (seuil X+ plus bas). Malus = valeur négative. */
const BUFF_PRESETS = [
  { id: "hit_p1", label: "+1 pour toucher", hit: 1 },
  { id: "hit_m1", label: "-1 pour toucher", hit: -1 },
  { id: "wound_p1", label: "+1 pour blesser", wound: 1 },
  { id: "wound_m1", label: "-1 pour blesser", wound: -1 },
  { id: "save_p1", label: "+1 sauvegarde", save: 1 },
  { id: "save_m1", label: "-1 sauvegarde", save: -1 },
  { id: "rend_p1", label: "+1 perforant", rend: 1 },
];

const defaultState = () => ({
  schemaVersion: 3,
  armyName: "",
  armyRecap: "",
  armyRules: [],
  units: [],
});

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyStats() {
  return {
    move: "",
    save: "",
    wounds: "",
    bravery: "",
    control: "",
  };
}

function sumBuffToggles(buffToggles) {
  const s = { hit: 0, wound: 0, save: 0, rend: 0 };
  const bt = buffToggles || {};
  for (const p of BUFF_PRESETS) {
    if (bt[p.id]) {
      s.hit += p.hit || 0;
      s.wound += p.wound || 0;
      s.save += p.save || 0;
      s.rend += p.rend || 0;
    }
  }
  return s;
}

/** Extrait le nombre d’un jet « 4+ ». */
function parseRoll(str) {
  if (str == null || str === "") return null;
  const m = String(str).trim().match(/^(\d+)\s*\+/);
  if (m) return parseInt(m[1], 10);
  const d = String(str).trim().match(/^(\d+)$/);
  if (d) return parseInt(d[1], 10);
  return null;
}

function formatRoll(n) {
  if (n == null || Number.isNaN(n)) return "";
  return `${Math.min(6, Math.max(2, n))}+`;
}

function applyRollBonus(base, bonusSum) {
  if (base == null) return null;
  const n = base - bonusSum;
  return Math.min(6, Math.max(2, n));
}

/** Rend entier : 0 = aucun, négatif = perforant. */
function parseRend(str) {
  if (str == null || str === "") return null;
  const t = String(str).trim();
  if (t === "—" || t === "-") return 0;
  const m = t.match(/^(-?\d+)/);
  if (m) return parseInt(m[1], 10);
  return null;
}

function formatRendNum(n) {
  if (n == null) return null;
  if (n === 0) return "—";
  return String(n);
}

function applyBuffMath(unit, card) {
  const sums = sumBuffToggles(unit.buffToggles);
  const parts = [];
  for (const p of BUFF_PRESETS) {
    if (unit.buffToggles?.[p.id]) parts.push(p.label);
  }
  const summaryEl = card.querySelector("[data-buff-summary]");
  if (summaryEl) {
    summaryEl.textContent =
      parts.length > 0 ? `Actifs : ${parts.join(" · ")}` : "";
  }

  const saveRaw = unit.stats?.save ?? "";
  const saveBase = parseRoll(saveRaw);
  const saveEff =
    saveBase != null ? applyRollBonus(saveBase, sums.save) : null;
  const saveWrap = card.querySelector(".save-eff-wrap");
  const saveEffEl = card.querySelector(".st-save-eff");
  if (saveWrap && saveEffEl) {
    const show =
      saveBase != null &&
      saveEff != null &&
      sums.save !== 0 &&
      saveEff !== saveBase;
    if (show) {
      saveWrap.hidden = false;
      saveEffEl.textContent = formatRoll(saveEff);
    } else {
      saveWrap.hidden = true;
    }
  }

  const weaponBlocks = card.querySelectorAll(".weapon-block");
  for (const block of weaponBlocks) {
    const wid = block.dataset.weaponId;
    const w = unit.weapons.find((x) => x.id === wid);
    const effEl = block.querySelector(".weapon-eff");
    if (!effEl || !w) continue;

    const hitB = parseRoll(w.hit);
    const woundB = parseRoll(w.wound);
    const rendB = parseRend(w.rend);

    const hitE = hitB != null ? applyRollBonus(hitB, sums.hit) : null;
    const woundE = woundB != null ? applyRollBonus(woundB, sums.wound) : null;
    const rendE =
      rendB != null && sums.rend !== 0 ? rendB - sums.rend : rendB;

    const bits = [];
    if (hitB != null && hitE != null && (sums.hit !== 0 || hitE !== hitB))
      bits.push(`CT ${formatRoll(hitE)}`);
    if (woundB != null && woundE != null && (sums.wound !== 0 || woundE !== woundB))
      bits.push(`CB ${formatRoll(woundE)}`);
    if (
      rendB != null &&
      rendE != null &&
      sums.rend !== 0 &&
      rendE !== rendB
    )
      bits.push(`P ${formatRendNum(rendE)}`);

    if (bits.length > 0) {
      effEl.hidden = false;
      effEl.textContent = `→ eff. ${bits.join(" · ")}`;
    } else {
      effEl.hidden = true;
      effEl.textContent = "";
    }
  }
}

function normalizeV3(data) {
  const s = defaultState();
  s.armyName = typeof data.armyName === "string" ? data.armyName : "";
  s.armyRecap = typeof data.armyRecap === "string" ? data.armyRecap : "";
  s.armyRules = (Array.isArray(data.armyRules) ? data.armyRules : []).map(
    (r) => ({
      id: r.id || uid(),
      name: typeof r.name === "string" ? r.name : "",
      description:
        typeof r.description === "string" ? r.description : "",
      readyThisTurn: !!r.readyThisTurn,
    }),
  );
  s.units = (Array.isArray(data.units) ? data.units : []).map((u) => {
    const abilities = Array.isArray(u.abilities) ? u.abilities : [];
    const notesFromAbilities = abilities
      .map((a) => {
        const name = typeof a.name === "string" ? a.name : "";
        const text = typeof a.text === "string" ? a.text : "";
        if (name && text) return `${name} — ${text}`;
        return name || text;
      })
      .filter(Boolean)
      .join("\n");

    const buffToggles =
      u.buffToggles && typeof u.buffToggles === "object"
        ? { ...u.buffToggles }
        : {};
    for (const p of BUFF_PRESETS) {
      if (buffToggles[p.id] !== true) delete buffToggles[p.id];
    }

    let unitNotes =
      typeof u.unitNotes === "string"
        ? u.unitNotes
        : typeof u.freeNote === "string"
          ? u.freeNote
          : "";
    if (notesFromAbilities) {
      unitNotes = unitNotes
        ? `${unitNotes}\n${notesFromAbilities}`
        : notesFromAbilities;
    }

    const oldBuffs = Array.isArray(u.buffs) ? u.buffs : [];
    const oldBuffText = oldBuffs
      .filter((b) => b.active !== false && b.label)
      .map((b) => b.label)
      .join(", ");
    if (oldBuffText) {
      unitNotes = unitNotes
        ? `${unitNotes}\n(Anciens buffs : ${oldBuffText})`
        : `(Anciens buffs : ${oldBuffText})`;
    }

    return {
      id: u.id || uid(),
      name: typeof u.name === "string" ? u.name : "",
      note:
        typeof u.note === "string"
          ? u.note
          : typeof u.role === "string"
            ? u.role
            : "",
      points: typeof u.points === "string" ? u.points : "",
      stats:
        u.stats && typeof u.stats === "object"
          ? {
              move: typeof u.stats.move === "string" ? u.stats.move : "",
              save: typeof u.stats.save === "string" ? u.stats.save : "",
              wounds: typeof u.stats.wounds === "string" ? u.stats.wounds : "",
              bravery:
                typeof u.stats.bravery === "string" ? u.stats.bravery : "",
              control:
                typeof u.stats.control === "string" ? u.stats.control : "",
            }
          : { ...emptyStats() },
      weapons: Array.isArray(u.weapons)
        ? u.weapons.map((w) => ({
            id: w.id || uid(),
            name: typeof w.name === "string" ? w.name : "",
            range: typeof w.range === "string" ? w.range : "",
            attacks: typeof w.attacks === "string" ? w.attacks : "",
            hit: typeof w.hit === "string" ? w.hit : "",
            wound: typeof w.wound === "string" ? w.wound : "",
            rend: typeof w.rend === "string" ? w.rend : "",
            damage: typeof w.damage === "string" ? w.damage : "",
          }))
        : [],
      buffToggles,
      unitNotes,
    };
  });
  return s;
}

/** Ancienne structure (clé locale sans schemaVersion). */
function migrateFromV1(data) {
  const armyRules = (Array.isArray(data.powers) ? data.powers : []).map(
    (p) => ({
      id: p.id || uid(),
      name: typeof p.name === "string" ? p.name : "",
      description: typeof p.description === "string" ? p.description : "",
      readyThisTurn: !!p.readyThisTurn,
    }),
  );
  const units = (Array.isArray(data.units) ? data.units : []).map((u) => ({
    id: u.id || uid(),
    name: typeof u.name === "string" ? u.name : "",
    note: typeof u.role === "string" ? u.role : "",
    points: "",
    stats: { ...emptyStats() },
    weapons: [],
    abilities: [],
    buffs: Array.isArray(u.buffs) ? u.buffs : [],
  }));
  return {
    schemaVersion: 2,
    armyName: typeof data.armyName === "string" ? data.armyName : "",
    armyRecap: "",
    armyRules,
    units,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const coerced =
        data.schemaVersion === 2 || data.schemaVersion === 3
          ? data
          : migrateFromV1(data);
      return normalizeV3(coerced);
    }
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      const migrated = normalizeV3(migrateFromV1(JSON.parse(rawV1)));
      saveState(migrated);
      localStorage.removeItem(STORAGE_KEY_V1);
      return migrated;
    }
    return defaultState();
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

const el = {
  armyName: document.getElementById("army-name"),
  armyRecap: document.getElementById("army-recap"),
  armyRuleList: document.getElementById("army-rule-list"),
  unitList: document.getElementById("unit-list"),
  pasteUnits: document.getElementById("paste-units"),
  btnAddRule: document.getElementById("btn-add-rule"),
  btnAddUnit: document.getElementById("btn-add-unit"),
  btnParsePaste: document.getElementById("btn-parse-paste"),
  btnClearPaste: document.getElementById("btn-clear-paste"),
  btnReset: document.getElementById("btn-reset"),
  tplArmyRule: document.getElementById("tpl-army-rule"),
  tplUnit: document.getElementById("tpl-unit"),
  tplWeapon: document.getElementById("tpl-weapon"),
};

function persist() {
  saveState(state);
}

function ruleDom(r) {
  const node = el.tplArmyRule.content.cloneNode(true);
  const root = node.querySelector(".power-item");
  root.dataset.id = r.id;
  root.querySelector(".rule-name").value = r.name;
  root.querySelector(".rule-desc").value = r.description ?? "";

  root.querySelector(".rule-name").addEventListener("input", (e) => {
    r.name = e.target.value;
    persist();
  });
  root.querySelector(".rule-desc").addEventListener("input", (e) => {
    r.description = e.target.value;
    persist();
  });
  root.querySelector(".rule-ready").checked = !!r.readyThisTurn;
  root.querySelector(".rule-ready").addEventListener("change", (e) => {
    r.readyThisTurn = e.target.checked;
    persist();
  });
  root.querySelector(".btn-remove-rule").addEventListener("click", () => {
    state.armyRules = state.armyRules.filter((x) => x.id !== r.id);
    root.remove();
    persist();
  });

  return root;
}

function weaponDom(unit, w, refresh) {
  const node = el.tplWeapon.content.cloneNode(true);
  const block = node.querySelector(".weapon-block");
  block.dataset.weaponId = w.id;
  block.querySelector(".w-name").value = w.name;
  block.querySelector(".w-range").value = w.range;
  block.querySelector(".w-attacks").value = w.attacks;
  block.querySelector(".w-hit").value = w.hit;
  block.querySelector(".w-wound").value = w.wound;
  block.querySelector(".w-rend").value = w.rend;
  block.querySelector(".w-damage").value = w.damage;

  const fields = [
    [".w-name", "name"],
    [".w-range", "range"],
    [".w-attacks", "attacks"],
    [".w-hit", "hit"],
    [".w-wound", "wound"],
    [".w-rend", "rend"],
    [".w-damage", "damage"],
  ];
  for (const [sel, key] of fields) {
    block.querySelector(sel).addEventListener("input", (e) => {
      w[key] = e.target.value;
      persist();
      refresh();
    });
  }
  block.querySelector(".btn-remove-weapon").addEventListener("click", () => {
    unit.weapons = unit.weapons.filter((x) => x.id !== w.id);
    block.remove();
    persist();
    refresh();
  });
  return block;
}

function unitDom(u) {
  const node = el.tplUnit.content.cloneNode(true);
  const card = node.querySelector(".unit-card");
  card.dataset.unitId = u.id;
  card.querySelector(".unit-name").value = u.name;
  card.querySelector(".unit-note").value = u.note ?? "";
  card.querySelector(".unit-points").value = u.points ?? "";

  if (!u.buffToggles || typeof u.buffToggles !== "object")
    u.buffToggles = {};
  if (typeof u.unitNotes !== "string") u.unitNotes = "";

  const refresh = () => applyBuffMath(u, card);

  const weaponList = card.querySelector(".weapon-list");
  const presetHost = card.querySelector("[data-preset-container]");

  presetHost.replaceChildren();
  for (const p of BUFF_PRESETS) {
    const lab = document.createElement("label");
    lab.className = "preset-chk";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.dataset.presetId = p.id;
    cb.checked = !!u.buffToggles[p.id];
    cb.addEventListener("change", () => {
      u.buffToggles[p.id] = cb.checked;
      if (!cb.checked) delete u.buffToggles[p.id];
      persist();
      refresh();
    });
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(` ${p.label}`));
    presetHost.appendChild(lab);
  }

  const freeNoteEl = card.querySelector(".unit-free-note");
  freeNoteEl.value = u.unitNotes;
  freeNoteEl.addEventListener("input", (e) => {
    u.unitNotes = e.target.value;
    persist();
  });

  card.querySelector(".unit-name").addEventListener("input", (e) => {
    u.name = e.target.value;
    persist();
  });
  card.querySelector(".unit-note").addEventListener("input", (e) => {
    u.note = e.target.value;
    persist();
  });
  card.querySelector(".unit-points").addEventListener("input", (e) => {
    u.points = e.target.value;
    persist();
  });
  card.querySelector(".btn-remove-unit").addEventListener("click", () => {
    state.units = state.units.filter((x) => x.id !== u.id);
    card.remove();
    persist();
  });

  const bindStat = (key, selector) => {
    const input = card.querySelector(selector);
    input.value = u.stats[key] ?? "";
    input.addEventListener("input", (e) => {
      u.stats[key] = e.target.value;
      persist();
      refresh();
    });
  };
  bindStat("move", ".st-move");
  bindStat("save", ".st-save");
  bindStat("wounds", ".st-wounds");
  bindStat("bravery", ".st-bravery");
  bindStat("control", ".st-control");

  const renderWeapons = () => {
    weaponList.replaceChildren();
    for (const w of u.weapons) {
      weaponList.appendChild(weaponDom(u, w, refresh));
    }
    refresh();
  };

  card.querySelector(".btn-add-weapon").addEventListener("click", () => {
    const w = {
      id: uid(),
      name: "",
      range: "",
      attacks: "",
      hit: "",
      wound: "",
      rend: "",
      damage: "",
    };
    u.weapons.push(w);
    weaponList.appendChild(weaponDom(u, w, refresh));
    persist();
    refresh();
  });

  renderWeapons();
  refresh();
  return card;
}

function renderAll() {
  el.armyName.value = state.armyName;
  el.armyRecap.value = state.armyRecap ?? "";
  el.armyRuleList.replaceChildren();
  for (const r of state.armyRules) el.armyRuleList.appendChild(ruleDom(r));
  el.unitList.replaceChildren();
  for (const u of state.units) el.unitList.appendChild(unitDom(u));
}

function addArmyRule() {
  const r = {
    id: uid(),
    name: "",
    description: "",
    readyThisTurn: true,
  };
  state.armyRules.push(r);
  el.armyRuleList.appendChild(ruleDom(r));
  persist();
}

function emptyUnit() {
  return {
    id: uid(),
    name: "",
    note: "",
    points: "",
    stats: { ...emptyStats() },
    weapons: [],
    buffToggles: {},
    unitNotes: "",
  };
}

function addUnit() {
  const u = emptyUnit();
  state.units.push(u);
  el.unitList.appendChild(unitDom(u));
  persist();
}

function parseUnitNamesFromText(text) {
  const names = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.includes(",")) {
      for (const part of trimmed.split(",")) {
        const p = part.trim();
        if (p) names.push(p);
      }
    } else {
      names.push(trimmed);
    }
  }
  return names;
}

el.armyName.addEventListener("input", (e) => {
  state.armyName = e.target.value;
  persist();
});

el.armyRecap.addEventListener("input", (e) => {
  state.armyRecap = e.target.value;
  persist();
});

el.btnAddRule.addEventListener("click", () => addArmyRule());
el.btnAddUnit.addEventListener("click", () => addUnit());

el.btnClearPaste.addEventListener("click", () => {
  el.pasteUnits.value = "";
});

el.btnParsePaste.addEventListener("click", () => {
  const names = parseUnitNamesFromText(el.pasteUnits.value);
  if (names.length === 0) {
    alert("Aucun nom trouvé.");
    return;
  }
  for (const name of names) {
    const u = emptyUnit();
    u.name = name;
    state.units.push(u);
    el.unitList.appendChild(unitDom(u));
  }
  persist();
  el.pasteUnits.value = "";
});

el.btnReset.addEventListener("click", () => {
  if (!confirm("Tout supprimer sur cet appareil ?")) return;
  state = defaultState();
  persist();
  renderAll();
});

renderAll();
