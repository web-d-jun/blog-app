<script>
  import Header from "@/components/AppHeader.svelte";
  import Body from "@/components/AppBody.svelte";
</script>

<div class="container">
  <Header />
  <Body />
</div>

<style lang="scss">
  :root {
    font-size: 62.5%;
  }
  :global(body) {
    padding: 0;
  }
  :global(*) {
    box-sizing: border-box;
  }
</style>
