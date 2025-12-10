const fs = require("fs");
const path = require("path");

function savePNG(name, base64) {
  const filePath = path.join(__dirname, "..", "..", "assets", name);
  const buffer = Buffer.from(base64, "base64");
  fs.writeFileSync(filePath, buffer);
  console.log("✔ Image enregistrée :", name);
}

savePNG(
  "logo.png",
  "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAAGFBMVEUAAAD///8AAAB/f3+fn58/Pz+AgICFhYX09PT8/PxSEhFJAAABJklEQVR4nO3TQQ0AQAwEMb3/nZmIAwUChaJyut06Nkkkkkkkkkkkkkkkkkkkk6Jx1cmkTtLGlTtLGlTtLGlTtLGlTtLGlTtLGlTtLGlTtLGlTtLGnRvtnkjH6GdY8RbTH6eeMYo8xbTH6GeNYo8xbTH6GcNYo8xbTH6GeNYo8xbTH6GeNYo8xbTH6GeNYo8xbTH6GeNYo8xbTH6GeNYo8xbTH6GcNYo8xbTH6GeNYo8xbTH6GeNYo8xbTH6GeNYo8xbTH6GcNYo8xbTH6GeNYo8xbTH6GcNYo8xbTH6GcNco5B4uuMzgAAAP//AwCTrQd8eooooQAAAABJRU5ErkJggg=="
);

console.log("🎉 Toutes les images ont été générées !");
