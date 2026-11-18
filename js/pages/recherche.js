"use strict";

SuperHeros.createPage(Vue, {
  mixins: [SuperHeros.heroesMixin],
  data() {
    return { query: "", showStats: false };
  },
  computed: {
    results() {
      return SuperHeros.searchHeroes(this.heroes, this.query);
    },
  },
});
