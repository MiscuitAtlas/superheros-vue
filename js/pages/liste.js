"use strict";

const STEP = 50;

SuperHeros.createPage(Vue, {
  mixins: [SuperHeros.heroesMixin],
  data() {
    return {
      publisher: "",
      alignment: "",
      sort: "name",
      showStats: true,
      limit: STEP,
      step: STEP,
    };
  },
  computed: {
    publisherList() {
      return SuperHeros.publishers(this.heroes);
    },
    filtered() {
      return SuperHeros.filterHeroes(this.heroes, {
        publisher: this.publisher,
        alignment: this.alignment,
        sort: this.sort,
      });
    },
    visible() {
      return this.filtered.slice(0, this.limit);
    },
  },
  watch: {
    // Nouveau filtre ou nouveau tri : on repart des premiers résultats.
    filtered() {
      this.limit = STEP;
    },
  },
});
