import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Code de la route Rocket League",
    short_name: "Code RL",
    description: "Entrainement tactique Rocket League en mode paysage.",
    start_url: "/",
    scope: "/",
    display: "fullscreen",
    orientation: "landscape",
    background_color: "#060a0e",
    theme_color: "#060a0e",
    categories: ["games", "education", "sports"]
  };
}
