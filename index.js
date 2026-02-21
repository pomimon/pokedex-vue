
// =============================================================================
// Utilities
// =============================================================================

const MAX_POKEMON = 151;

const isValidId = (id) => {
  return id > 0 && id <= MAX_POKEMON;
};

// =============================================================================
// Components
// =============================================================================

const Pokedex = {
  data() {
    return {
      pokemon: [],
    };
  },

  mounted() {
    this.pokemon = JSON.parse(localStorage.getItem("pokemon"));
  },

  template: `
    <div class="pokedex">
      <div class="layout-header">
        <Header />
      </div>

      <div class="layout-panels">
        <div class="layout-panel lhs">
          <Preview />
          <Control />
        </div>

        <div class="layout-spine"></div>

        <div class="layout-panel rhs">
          <Evolution/>
          <ButtonGrid/>
          <PillBar/>
          <ButtonMoves/>
          <PokeInfo/>
        </div>
      </div>
    </div>
  `,
}

const Header = {
  template: `
    <div class="block" id="header">
      <div class="bar">
        <div class="button circle bg-blue"></div>
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
  template: `
    <div class="block" id="preview">
      <div class="bar">
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <div class="bar">
        <div class="image">
          <img class="is-pixelated" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/1.gif"/>
        </div>
      </div>
      <div class="bar">
        <div class="dot is-big"></div>
      </div>
    </div>
  `,
};

const Control = {
  template: `
    <div class="block" id="control">
      <div class="column lhs">
        <div class="bar">
          <div class="button circle"></div>
          <div class="button pill bg-red"></div>
          <div class="button pill bg-blue"></div>
        </div>
        <div class="bar">
          <div class="info"></div>
        </div>
      </div>
      <div class="column rhs">
        <div id="d-pad">
          <div class="btn up"></div>
          <div class="btn left"></div>
          <div class="btn center"></div>
          <div class="btn right"></div>
          <div class="btn down"></div>
        </div>
      </div>
    </div>
  `,
};

const Evolution = {
  template: `
    <div class="block" id="evolution">
      <div class="info">
        <div class="poke-group">
          <div class="image">
            <img class="is-pixelated" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/1.gif">
          </div>
          <p>Bulbasaur</p>
        </div>

        <div class="arrow"></div>

        <div class="poke-group">
          <div class="image">
            <img class="is-pixelated" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/2.gif">
          </div>
          <p>Ivysaur</p>
        </div>

        <div class="arrow"></div>

        <div class="poke-group">
          <div class="image">
            <img class="is-pixelated" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/3.gif">
          </div>
          <p>Venusaur</p>
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
  template: `
    <div class="block" id="button-moves">
      <div class="bar">
        <div class="square"></div>
        <div class="square"></div>
      </div>
      <div class="button circle"></div>
    </div>
  `,
};

const PokeInfo = {
  template: `
    <div class="block" id="poke-info">
      <div class="info"></div>
      <div class="info"></div>
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

const App = {
  template: `
    <RouterView />
  `,
}

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
