export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "darvin-theme-v1";

/** Runs in <head> before the body paints so a saved light theme never flashes dark. */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{
var stored=window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
var theme=stored==="light"?"light":"dark";
var root=document.documentElement;
root.setAttribute("data-theme",theme);
root.style.colorScheme=theme;
}catch(e){
document.documentElement.setAttribute("data-theme","dark");
}})();`;
