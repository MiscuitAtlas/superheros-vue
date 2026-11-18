"use strict";

SuperHeros.createPage(Vue, {
  data() {
    return {
      id: new URLSearchParams(location.search).get("id"),
      hero: null,
      notFound: false,
      loading: false,
      error: "",
    };
  },
  computed: {
    total() {
      return SuperHeros.totalStats(this.hero);
    },
    alignmentClass() {
      return { good: "text-bg-success", bad: "text-bg-danger" }[this.hero.biography.alignment] || "text-bg-warning";
    },
    missingTitle() {
      if (this.notFound) return `Aucun personnage ne porte le numéro « ${this.id} ».`;
      return "Aucun personnage sélectionné.";
    },
  },
  created() {
    this.load();
  },
  methods: {
    display: SuperHeros.display,
    alignmentLabel: SuperHeros.alignmentLabel,
    genderLabel: SuperHeros.genderLabel,

    async load() {
      this.error = "";
      this.notFound = false;
      if (this.id === null) return; // page ouverte depuis le menu : rien à charger
      if (!SuperHeros.isValidId(this.id)) {
        this.notFound = true;
        return;
      }
      this.loading = true;
      try {
        this.hero = await SuperHeros.loadHero(this.id);
        document.title = `${this.hero.name} – SuperHéros`;
      } catch (error) {
        if (error.message.includes("404")) {
          this.notFound = true;
        } else {
          this.error = error.message;
        }
      } finally {
        this.loading = false;
      }
    },

    async randomHero() {
      try {
        const heroes = await SuperHeros.loadHeroes();
        const hero = heroes[Math.floor(Math.random() * heroes.length)];
        location.href = SuperHeros.detailsUrl(hero.id);
      } catch (error) {
        this.error = error.message;
      }
    },
  },
});
