// =============================================================================
// Utilities
// =============================================================================

const MAX_POKEMON = 151;

const IMAGES = {
  animated: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated",
  official: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork",
}

const TYPE_COLORS = {
  normal: "#C4C49A",
  fire: "#FF6B1A",
  water: "#4D7FFF",
  electric: "#FFE000",
  grass: "#5DDD2A",
  ice: "#6EEAEA",
  fighting: "#FF2020",
  poison: "#CC33CC",
  ground: "#F0C030",
  flying: "#C4AAFF",
  psychic: "#FF2277",
  bug: "#AACC00",
  rock: "#D4B840",
  ghost: "#9B6FD4",
  dragon: "#6622FF",
  dark: "#8B6A5A",
  steel: "#C8C8E8",
  fairy: "#FF77CC",
};

const isValidId = (id) => {
  return id > 0 && id <= MAX_POKEMON;
};

const getAnimatedImage = (id, { front = true, shiny = false } = {}) => {
  const frontImage = front ? "" : "back/";
  const shinyImage = shiny ? "shiny/" : "";
  return `${IMAGES.animated}/${frontImage}${shinyImage}${id}.gif`;
};

const getOfficialImage = (id) => {
  return `${IMAGES.official}/${id}.png`;
};

const clamp = (min, max, value) => {
  return Math.min(max, Math.max(min, value));
}

// https://github.com/veekun/pokedex/issues/218#issuecomment-339841781
const cleanText = (text) => {
  text = text.replace('\f',       '\n');
  text = text.replace('\u00ad\n', '');
  text = text.replace('\u00ad',   '');
  text = text.replace(' -\n',     ' - ');
  text = text.replace('-\n',      '-');
  text = text.replace('\n',       ' ');
  return text;
}

const extractIdFromUrl = (url) => {
  const parts = url.split("/").filter(Boolean);
  return Number(parts[parts.length - 1]);
};

// =============================================================================
// Resource Management
// =============================================================================

async function getJSON(url) {
  const resp = await fetch(url);
  const json = await resp.json();
  return json;
}

async function fetchDetails(id) {
  const details = await getJSON(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const species = await getJSON(details.species.url);
  const evolution = await getJSON(species.evolution_chain.url);

  // const moves = details
  //   .moves
  //   .filter((move) => {
  //     const VERSIONS = ["blue-japan", "red-blue", "red-green-japan"]

  //     for (const vgd of move.version_group_details) {
  //       if (VERSIONS.includes(vgd.version_group.name)) {
  //         console.log("including move", move)
  //         return true;
  //       }
  //     }

  //     return false;
  //   })
  //   .map(m => m.move.name)

  // debugger

  return {
    id: details.id,
    name: details.name,
    typeA: details.types[0].type.name,
    typeB: details.types[1]?.type?.name || null,
    stats: transformStats(details.stats),
    evolution: transformChain(evolution.chain),
    flavor: extractFlavor(species.flavor_text_entries),
    moves: [],
    // _raw: {
    //   details,
    //   species,
    // }
  };
}

const transformStats = (statsData) => {
  return statsData.map((stat) => ({
    name: stat.stat.name,
    value: stat.base_stat,
  }));
};

const transformChain = (node) => {
  const chain = [];

  function traverse(currentNode) {
    const id = extractIdFromUrl(currentNode.species.url);

    if (id <= MAX_POKEMON) {
      chain.push(id)
    }

    for (const node of currentNode.evolves_to) {
      traverse(node);
    }
  }

  traverse(node);

  return chain;
};

const extractFlavor = (entries) => {
  const englishEntries = entries.filter((entry) => {
    return entry.language.name == "en"
  });

  if (englishEntries.length == 0) {
    return "N/A"
  }

  return cleanText(englishEntries[0].flavor_text);
}

// =============================================================================
// Components
// =============================================================================

const App = {
  data() {
    return {
      pokemon: [],
      loading: false,
      failure: null,
    };
  },

  methods: {
    getName(id) {
      return this.pokemon[id - 1]?.name || "";
    },
    prevPokemon(currentId) {
      this.$router.push(`/pokemon/${clamp(1, MAX_POKEMON, currentId - 1)}`)
    },
    nextPokemon(currentId) {
      this.$router.push(`/pokemon/${clamp(1, MAX_POKEMON, currentId + 1)}`)
    },
    viewPokemon(pokemonId) {
      this.$router.push(`/pokemon/${clamp(1, MAX_POKEMON, pokemonId)}`)
    },
    async fetchPokemon(id) {
      const promises = [];

      for (let id = 1; id <= MAX_POKEMON; id++) {
        promises.push(fetchDetails(id));
      }

      this.loading = true;
      this.failure = null;

      try {
        this.pokemon = await Promise.all(promises);
        this.loading = false;

        localStorage.setItem("pokemon", JSON.stringify(this.pokemon));
      } catch (error) {
        console.error("Failed to fetch Pokemon:", error);
        this.failure = error.message;
        this.loading = false;
      }
    },
  },

  created() {
    if (localStorage.getItem("pokemon")) {
      this.pokemon = JSON.parse(localStorage.getItem("pokemon"));
    } else {
      this.fetchPokemon();
    }
  },

  template: `
    <RouterView />
  `,
}

const Pokedex = {
  data() {
    return {
      front: true,
      shiny: false,
    };
  },
  computed: {
    currentId() {
      return parseInt(this.$route.params.id, 10);
    },
    currentPokemon() {
      return this.$root.pokemon[this.currentId - 1]
    },
  },
  template: `
    <div class="pokedex" v-if="!$root.loading">
      <div class="layout-header">
        <Header :type="currentPokemon.typeA" />
      </div>

      <div class="layout-panels">
        <div class="layout-panel lhs">
          <Preview
            :id="currentId"
            :name="currentPokemon.name"
            :front="front"
            :shiny="shiny"
          />

          <Control
            :id="currentId"
            :text="currentPokemon.flavor"
            @toggle-front="front = !front"
            @toggle-shiny="shiny = !shiny"
          />
        </div>

        <div class="layout-spine"></div>

        <div class="layout-panel rhs">
          <Evolution
            :pokemon1="currentPokemon.evolution[0]"
            :pokemon2="currentPokemon.evolution[1]"
            :pokemon3="currentPokemon.evolution[2]"
          />

          <ButtonGrid />
          <PillBar />
          <ButtonMoves :type="currentPokemon.typeB" />

          <PokeInfo
            :id="currentId"
            :stats="currentPokemon.stats"
          />
        </div>
      </div>
    </div>
  `,
}

const Header = {
  props: {
    type: {
      type: String,
      required: true,
    },
  },
  computed: {
    typeColor() {
      return TYPE_COLORS[this.type];
    },
  },
  template: `
    <div class="block" id="header">
      <div class="bar">
        <div class="button circle"
        :class="{'has-glow': type}" :style="{backgroundColor: typeColor, color: typeColor}">
        </div>
        <div class="status">
          <div class="dot is-med bg-red" ></div>
          <div class="dot is-med bg-yellow" ></div>
          <div class="dot is-med bg-green" ></div>
        </div>
      </div>
    </div>
  `,
};

const Preview = {
  props: {
    id: {
      type: Number,
      required: true,
      validator: isValidId,
    },
    name: {
      type: String,
      required: true,
    },
    front: {
      type: Boolean,
      default: true,
    },
    shiny: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    imageUrl() {
      return getAnimatedImage(this.id, { front: this.front, shiny: this.shiny });
    },
    formattedId() {
      return `#${this.id.toString().padStart(3, "0")}`;
    },
  },
  template: `
    <div class="block" id="preview">
      <div class="bar">
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <div class="bar">
        <div class="image">
          <img class="is-pixelated" :src="imageUrl"/>
        </div>
      </div>
      <div class="bar">
        <div class="dot is-big"></div>
        <div class="name-id">
          <span v-text="name"/>
          <span v-text="formattedId"/>
      </div>
      </div>
    </div>
  `,
};

const Control = {
  props: {
    id: {
      type: Number,
      required: true,
      validator: isValidId,
    },
    text: {
      type: String,
      required: true,
    },
  },
  computed: {
    cryUrl() {
      return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${this.id}.ogg`;
    },
  },
    methods: {
    playCry() {
      this.$refs.audio.play();
    },
  },
  template: `
    <div class="block" id="control">
      <div class="column lhs">
        <div class="bar">
          <audio :src="cryUrl" ref="audio"/>
          <div class="button circle" @click="playCry"></div>
          <div class="button pill bg-red" @click="$emit('toggle-shiny')"></div>
          <div class="button pill bg-blue" @click="$emit('toggle-front')"></div>
        </div>
        <div class="bar">
          <div class="info" v-text="text"></div>
        </div>
      </div>
      <div class="column rhs">
        <div id="d-pad">
          <div class="btn up" @click="$root.nextPokemon(id)"></div>
          <div class="btn left" @click="$root.prevPokemon(id)"></div>
          <div class="btn center"></div>
          <div class="btn right" @click="$root.nextPokemon(id)"></div>
          <div class="btn down" @click="$root.prevPokemon(id)"></div>
        </div>
      </div>
    </div>
  `,
};

const Evolution = {
  props: {
    pokemon1: {
      type: Number,
      required: true,
    },
    pokemon2: Number,
    pokemon3: Number,
  },

  computed: {
    pokemon1Name() {
      return this.$root.getName(this.pokemon1)
    },
    pokemon2Name() {
      return this.$root.getName(this.pokemon2)
    },
    pokemon3Name() {
      return this.$root.getName(this.pokemon3)
    },
    pokemon1Image() {
      return getAnimatedImage(this.pokemon1)
    },
    pokemon2Image() {
      return getAnimatedImage(this.pokemon2)
    },
    pokemon3Image() {
      return getAnimatedImage(this.pokemon3)
    },
  },

  template: `
    <div class="block" id="evolution">
      <div class="info">
        <div class="poke-group">
          <div class="image" @click="$root.viewPokemon(pokemon1)">
            <img class="is-pixelated" :src="pokemon1Image">
          </div>
          <p v-text="pokemon1Name"/>
        </div>

        <div class="arrow"></div>

        <div class="poke-group">
          <div class="image" v-if="pokemon2" @click="$root.viewPokemon(pokemon2)">
            <img class="is-pixelated" :src="pokemon2Image">
          </div>
          <div class="pokeball" v-else/>

          <p v-text="pokemon2Name"/>
        </div>

        <div class="arrow"></div>

        <div class="poke-group">
          <div class="image" v-if="pokemon3" @click="$root.viewPokemon(pokemon3)">
            <img class="is-pixelated" :src="pokemon3Image">
          </div>
          <div class="pokeball" v-else/>

          <p v-text="pokemon3Name"/>
        </div>
      </div>
    </div>
  `,
};

const ButtonGrid = {
  template: `
    <div class="block" id="button-grid">
      <div class="square"></div>
      <div class="square"></div>
      <div class="square"></div>
      <div class="square"></div>
      <div class="square"></div>

      <div class="square"></div>
      <div class="square"></div>
      <div class="square"></div>
      <div class="square"></div>
      <div class="square"></div>
    </div>
  `,
};

const PillBar = {
  template: `
    <div class="block" id="pill-bar">
      <div class="bar">
        <div class="button pill"></div>
        <div class="button pill"></div>
      </div>
    </div>
  `,
};

const ButtonMoves = {
  props: {
    type: {
      type: String,
      default: null,
    },
  },
  computed: {
    typeColor() {
      return TYPE_COLORS[this.type] || "#222";
    },
  },
  template: `
    <div class="block" id="button-moves">
      <div class="bar">
        <div class="square"></div>
        <div class="square"></div>
      </div>
      <div class="button circle"
      :class="{'has-glow': type}" :style="{backgroundColor: typeColor, color: typeColor}">
      </div>
    </div>
  `,
};

const PokeInfo = {
  props: {
    id: {
      type: Number,
      required: true,
      validator: isValidId,
    },
    stats: {
      type: Object,
      required: true,
      validator(value) {
        return Array.isArray(value);
      },
    },
  },
  computed: {
    imageUrl() {
      return getOfficialImage(this.id);
    },
  },
  template: `
    <div class="block" id="poke-info">
      <div class="info">
        <p>Stats</p>
        <div class="stat-space">

          <div v-for="stat in stats">
            <span v-text="stat.name"/>
            <span v-text="stat.value"/>
          </div>
        </div>
      </div>
      <div class="info">
        <p>Official Artwork</p>
        <div class="image">
          <img class="is-pixelated" :src="imageUrl"/>
        </div>
      </div>
    </div>
  `,
};


// =============================================================================
// Vue Setup
// =============================================================================

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/pokemon/1",
    },
    {
      name: "pokedex",
      path: "/pokemon/:id",
      component: Pokedex,
    },
  ],
})

router.beforeEach((to, from) => {
  if (to.name != "pokedex") {
    return true;
  }

  const id = parseInt(to.params.id, 10)

  if (isValidId(id)) {
    return true;
  }

  return {
    name: "pokedex",
    params: {
      id: 1,
    },
  };
})

// =============================================================================
// Entrypoint
// =============================================================================

Vue.createApp(App)
  .component("ButtonGrid", ButtonGrid)
  .component("ButtonMoves", ButtonMoves)
  .component("Control", Control)
  .component("Evolution", Evolution)
  .component("Header", Header)
  .component("PillBar", PillBar)
  .component("PokeInfo", PokeInfo)
  .component("Preview", Preview)
  .use(router)
  .mount("#app");
