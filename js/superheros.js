/*
 * Code partagé par toutes les pages : accès à l'API, recherche, filtres et composants Vue.
 *
 * Script classique (pas de module ES) : l'application fonctionne aussi en ouvrant les fichiers
 * HTML directement, sans serveur. Dans Node.js, le même fichier est chargé par les tests.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SuperHeros = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const API_URL = "https://akabab.github.io/superhero-api/api";

  const STATS = [
    { key: "intelligence", label: "Intelligence" },
    { key: "strength", label: "Force" },
    { key: "speed", label: "Vitesse" },
    { key: "durability", label: "Résistance" },
    { key: "power", label: "Puissance" },
    { key: "combat", label: "Combat" },
  ];

  const ALIGNMENTS = { good: "Héros", bad: "Méchant", neutral: "Neutre" };
  const GENDERS = { Male: "Homme", Female: "Femme" };

  const NAV_LINKS = [
    { href: "index.html", label: "Recherche" },
    { href: "liste.html", label: "Tous les personnages" },
    { href: "matcher.html", label: "SuperPower Matcher" },
    { href: "auteur.html", label: "Auteur" },
  ];

  // --- Données ------------------------------------------------------------------------------

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Réponse ${response.status} du serveur`);
    }
    return response.json();
  }

  let allHeroes = null;

  /** Liste complète, téléchargée une seule fois par page. */
  function loadHeroes() {
    if (!allHeroes) {
      allHeroes = fetchJson(`${API_URL}/all.json`).catch((error) => {
        allHeroes = null; // une nouvelle tentative reste possible
        throw error;
      });
    }
    return allHeroes;
  }

  function isValidId(id) {
    return /^[1-9]\d{0,4}$/.test(String(id ?? ""));
  }

  function loadHero(id) {
    if (!isValidId(id)) {
      return Promise.reject(new Error("Identifiant invalide"));
    }
    return fetchJson(`${API_URL}/id/${id}.json`);
  }

  // --- Recherche et filtres -----------------------------------------------------------------

  /** Minuscules sans accents : « Écarlate » et « ecarlate » se correspondent. */
  function normalize(text) {
    return String(text ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
  }

  /** Recherche par nom de héros ou par nom civil. */
  function searchHeroes(heroes, query) {
    const q = normalize(query);
    if (!q) return [];
    return heroes.filter(
      (hero) => normalize(hero.name).includes(q) || normalize(hero.biography?.fullName).includes(q),
    );
  }

  function totalStats(hero) {
    return STATS.reduce((sum, stat) => sum + (Number(hero.powerstats?.[stat.key]) || 0), 0);
  }

  function byName(a, b) {
    return a.name.localeCompare(b.name, "fr");
  }

  /**
   * Personnages qui atteignent au moins le niveau demandé pour chaque statistique,
   * du plus puissant au moins puissant. Un niveau à 0 ne filtre pas.
   */
  function matchHeroes(heroes, minimums) {
    const active = STATS.filter((stat) => Number(minimums[stat.key]) > 0);
    return heroes
      .filter((hero) =>
        active.every((stat) => Number(hero.powerstats?.[stat.key]) >= Number(minimums[stat.key])),
      )
      .sort((a, b) => totalStats(b) - totalStats(a) || byName(a, b));
  }

  /** Filtres de la page « Tous les personnages ». */
  function filterHeroes(heroes, { publisher = "", alignment = "", sort = "name" } = {}) {
    const result = heroes.filter(
      (hero) =>
        (!publisher || hero.biography?.publisher === publisher) &&
        (!alignment || hero.biography?.alignment === alignment),
    );
    return result.sort(sort === "power" ? (a, b) => totalStats(b) - totalStats(a) || byName(a, b) : byName);
  }

  /** Éditeurs classés par nombre de personnages. */
  function publishers(heroes) {
    const counts = new Map();
    for (const hero of heroes) {
      const name = hero.biography?.publisher;
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
      .map(([name, count]) => ({ name, count }));
  }

  function alignmentLabel(alignment) {
    return ALIGNMENTS[alignment] || "Inconnu";
  }

  function genderLabel(gender) {
    return GENDERS[gender] || display(gender);
  }

  function detailsUrl(id) {
    return `details.html?id=${encodeURIComponent(id)}`;
  }

  /** Valeur lisible : « - », « null » ou tableau vide deviennent « Non renseigné ». */
  function display(value) {
    if (Array.isArray(value)) value = value.filter((v) => v && v !== "-").join(", ");
    if (value === null || value === undefined || value === "" || value === "-" || value === "null") {
      return "Non renseigné";
    }
    return String(value);
  }

  // --- Composants Vue -----------------------------------------------------------------------

  function currentPage() {
    const name = (typeof location !== "undefined" ? location.pathname : "").split("/").pop();
    return name || "index.html";
  }

  const SiteNav = {
    data: () => ({ open: false, links: NAV_LINKS, current: currentPage() }),
    template: `
      <nav class="navbar navbar-expand-md navbar-dark bg-dark" aria-label="Navigation principale">
        <div class="container">
          <a class="navbar-brand fw-semibold" href="index.html">SuperHéros</a>
          <button class="navbar-toggler" type="button" aria-controls="menu-principal"
                  :aria-expanded="String(open)" aria-label="Afficher le menu" @click="open = !open">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div id="menu-principal" class="collapse navbar-collapse" :class="{ show: open }">
            <ul class="navbar-nav ms-auto">
              <li v-for="link in links" :key="link.href" class="nav-item">
                <a class="nav-link" :class="{ active: link.href === current }"
                   :aria-current="link.href === current ? 'page' : null" :href="link.href">{{ link.label }}</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>`,
  };

  const SiteFooter = {
    template: `
      <footer class="site-footer border-top mt-5 py-4 text-body-secondary small">
        <div class="container">
          Données : <a href="https://github.com/akabab/superhero-api">superhero-api</a>, d'après superheroapi.com.
          Réalisé par <a href="https://miscuitatlas.github.io">Maxence Français</a>.
        </div>
      </footer>`,
  };

  const LoadStatus = {
    props: { loading: Boolean, error: String },
    emits: ["retry"],
    template: `
      <div v-if="loading" class="text-center py-5" role="status">
        <div class="spinner-border text-primary" aria-hidden="true"></div>
        <p class="mt-2 mb-0">Chargement des personnages…</p>
      </div>
      <div v-else-if="error" class="alert alert-danger d-flex align-items-center justify-content-between gap-3" role="alert">
        <span>Impossible de charger les données ({{ error }}). Vérifiez votre connexion.</span>
        <button type="button" class="btn btn-outline-danger btn-sm" @click="$emit('retry')">Réessayer</button>
      </div>`,
  };

  const HeroStats = {
    props: { stats: { type: Object, required: true } },
    data: () => ({ list: STATS }),
    template: `
      <dl class="hero-stats">
        <div v-for="stat in list" :key="stat.key" class="hero-stat">
          <dt>{{ stat.label }}</dt>
          <dd>
            <div class="progress" role="progressbar" :aria-label="stat.label"
                 :aria-valuenow="stats[stat.key]" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-bar" :style="{ width: stats[stat.key] + '%' }"></div>
            </div>
            <span class="hero-stat-value">{{ stats[stat.key] }}</span>
          </dd>
        </div>
      </dl>`,
  };

  const HeroItem = {
    props: { hero: { type: Object, required: true }, showStats: Boolean },
    components: { HeroStats },
    methods: { detailsUrl },
    template: `
      <a class="list-group-item list-group-item-action hero-item" :href="detailsUrl(hero.id)">
        <img class="hero-thumb" :src="hero.images.sm" alt="" width="56" height="56" loading="lazy">
        <span class="hero-item-text">
          <span class="fw-semibold">{{ hero.name }}</span>
          <span class="small text-body-secondary">{{ hero.biography.publisher || 'Éditeur inconnu' }}</span>
        </span>
        <hero-stats v-if="showStats" class="hero-item-stats" :stats="hero.powerstats"></hero-stats>
      </a>`,
  };

  /** Données et chargement de la liste complète, partagés par les pages qui en ont besoin. */
  const heroesMixin = {
    data: () => ({ heroes: [], loading: true, error: "" }),
    created() {
      this.load();
    },
    methods: {
      async load() {
        this.loading = true;
        this.error = "";
        try {
          this.heroes = await loadHeroes();
        } catch (error) {
          this.error = error.message;
        } finally {
          this.loading = false;
        }
      },
    },
  };

  /** Crée l'application Vue d'une page avec les composants communs, puis la monte sur #app. */
  function createPage(Vue, options) {
    const app = Vue.createApp(options);
    app.component("site-nav", SiteNav);
    app.component("site-footer", SiteFooter);
    app.component("load-status", LoadStatus);
    app.component("hero-stats", HeroStats);
    app.component("hero-item", HeroItem);
    return app.mount("#app");
  }

  return {
    API_URL,
    STATS,
    NAV_LINKS,
    loadHeroes,
    loadHero,
    isValidId,
    normalize,
    searchHeroes,
    totalStats,
    matchHeroes,
    filterHeroes,
    publishers,
    alignmentLabel,
    genderLabel,
    detailsUrl,
    display,
    heroesMixin,
    createPage,
  };
});
