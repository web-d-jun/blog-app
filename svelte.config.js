const sveltePreprocess = require("svelte-preprocess");

/**
 * vscode scss 전처리기 적용해야 lang="scss"  사용가능
 */
module.exports = {
  preprocess: sveltePreprocess({
    sass: {
      sync: true,
      implementation: require("sass"),
    },
  }),
};
