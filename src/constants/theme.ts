// Sticker Palette mapping for Notion playful styling (from DESIGN.md)
export const STICKER_COLORS = {
  sky: {
    bg: "bg-[#EBF5FD]",
    text: "text-[#0075de]",
    border: "border-[#B8DCFA]",
    dot: "bg-[#62aef0]",
  },
  purple: {
    bg: "bg-[#F6EEFE]",
    text: "text-[#391c57]",
    border: "border-[#E7D1FB]",
    dot: "bg-[#d6b6f6]",
  },
  pink: {
    bg: "bg-[#FFEBF7]",
    text: "text-[#9E006A]",
    border: "border-[#FFC7EC]",
    dot: "bg-[#ff64c8]",
  },
  orange: {
    bg: "bg-[#FEF0E6]",
    text: "text-[#793400]",
    border: "border-[#FCD1B0]",
    dot: "bg-[#dd5b00]",
  },
  teal: {
    bg: "bg-[#E6F6F5]",
    text: "text-[#155755]",
    border: "border-[#B5E4E2]",
    dot: "bg-[#2a9d99]",
  },
  green: {
    bg: "bg-[#EBF8EE]",
    text: "text-[#0E5C1E]",
    border: "border-[#C0ECC9]",
    dot: "bg-[#1aae39]",
  },
} as const;

export type StickerColorKey = keyof typeof STICKER_COLORS;
