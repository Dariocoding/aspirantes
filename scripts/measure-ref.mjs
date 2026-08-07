const sharp = require("sharp");

(async () => {
  const { data, info } = await sharp("referencia-form.png")
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const at = (x, y) => data[y * w + x];

  console.log("--- vertical lines top block ---");
  for (let x = 0; x < 649; x++) {
    let s = 0;
    for (let y = 55; y < 178; y++) if (at(x, y) < 80) s++;
    if (s > 40) console.log("v", x, s);
  }

  console.log("--- horizontal lines personal ---");
  for (let y = 50; y < 210; y++) {
    let s = 0;
    for (let x = 110; x < 390; x++) if (at(x, y) < 80) s++;
    if (s > 100) console.log("h", y, s);
  }

  console.log("--- full width horizontals ---");
  for (let y = 0; y < 479; y++) {
    let s = 0;
    for (let x = 5; x < 640; x++) if (at(x, y) < 80) s++;
    if (s > 200) console.log("H", y, s);
  }

  console.log("--- right edge ---");
  for (let x = 620; x < 649; x++) {
    let s = 0;
    for (let y = 55; y < 470; y++) if (at(x, y) < 80) s++;
    if (s > 50) console.log("v", x, s);
  }
})();
