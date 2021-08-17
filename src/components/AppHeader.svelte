<script>
  const imageLogo = "assets/images/logo_iam.png";
  const imageSvelteLogo = "assets/images/svelte.png";

  const handleNavigation = (navigation) => {
    let url = "";
    if (navigation === "Tutorial") {
      url = "https://svelte.dev/tutorial";
    } else if (navigation === "Doc") {
      url = "https://svelte.dev/docs";
    } else if (navigation === "Examples") {
      url = "https://svelte.dev/examples";
    } else if (navigation === "REPL") {
      url = "https://svelte.dev/repl";
    } else if (navigation === "FAQ") {
      url = "https://svelte.dev/faq";
    } else if (navigation === "SvelteKit") {
      url = "https://kit.svelte.dev/";
    }
    window.open(url);
  };
</script>

<header>
  <nav>
    <div class="logo__container">
      <img src={imageLogo} alt="logo" class="logo" />&<img src={imageSvelteLogo} alt="logo" class="logo" />
      <div class="logo-name">BAEHA & Svelte</div>
    </div>

    <ul class="ul">
      <li on:click={() => handleNavigation("Tutorial")}>Tutorial</li>
      <li on:click={() => handleNavigation("Doc")}>Doc</li>
      <li on:click={() => handleNavigation("Examples")}>Examples</li>
      <li on:click={() => handleNavigation("REPL")}>REPL</li>
      <li on:click={() => handleNavigation("FAQ")}>FAQ</li>
      <li on:click={() => handleNavigation("SvelteKit")}>SvelteKit</li>
    </ul>
  </nav>
</header>

<style lang="scss">
  header {
    width: 100%;
    height: 60px;
    box-shadow: 0 -0.4rem 0.9rem 0.2rem rgb(0 0 0 / 50%);
    padding: 0 3rem;
    color: #2d2d2d;
    & nav {
      display: flex;
      align-items: center;
      height: 100%;
      justify-content: space-between;
      & .logo__container {
        display: flex;
        align-items: center;
        font-size: 1.8rem;

        .logo {
          width: 30px;
          height: 30px;
          object-fit: contain;
        }
        .logo-name {
          padding-left: 4px;
        }
      }
      .ul {
        list-style: none;
        display: flex;
        li {
          font-size: 1.6rem;
          padding: 0 0.8rem;
          &:hover {
            cursor: pointer;
          }
        }
      }
    }
  }
</style>
