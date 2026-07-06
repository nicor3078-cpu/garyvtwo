import { Platform } from "react-native";

let injected = false;

export function injectWebIconFont() {
  if (Platform.OS !== "web") return;
  if (injected) return;
  if (typeof document === "undefined") return;

  const existing = document.getElementById("gary-feather-font-face");
  if (existing) {
    injected = true;
    return;
  }

  const style = document.createElement("style");
  style.id = "gary-feather-font-face";
  style.textContent = `
    @font-face {
      font-family: 'Feather';
      src: url('/fonts/Feather.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
      font-display: block;
    }
  `;
  document.head.appendChild(style);
  injected = true;
}
