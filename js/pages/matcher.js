"use strict";

const ZERO = Object.fromEntries(SuperHeros.STATS.map((stat) => [stat.key, 0]));

SuperHeros.createPage(Vue, {
  mixins: [SuperHeros.heroesMixin],
  data() {
    return {
      stats: SuperHeros.STATS,
      minimums: { ...ZERO },
    };
  },
  computed: {
    active() {
      return Object.values(this.minimums).some((level) => level > 0);
    },
    matches() {
      return this.active ? SuperHeros.matchHeroes(this.heroes, this.minimums) : [];
    },
  },
  methods: {
    reset() {
      this.minimums = { ...ZERO };
    },
  },
});
