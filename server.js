const hashtags = "#RatFink #HotRodArt #CustomArtwork";
const link = productLink || "";

const reservedLength =
  title.length +
  hashtags.length +
  link.length +
  8;

const maxDescriptionLength = Math.max(40, 279 - reservedLength);

const shortDescription =
  (description || "").length > maxDescriptionLength
    ? description.substring(0, maxDescriptionLength).trim() + "..."
    : description || "";

const message = [
  title,
  shortDescription,
  hashtags,
  link,
]
  .filter(Boolean)
  .join("\n")
  .trim();

console.log("X MESSAGE DEBUG:");
console.log(message);
