const checkForWords = (name: string): string[] => {
  const words: string[] = name.split(" ");
  return words;
};

const generateAlias = (words: string[]): string => {
  if (words.length > 1) {
    return words[0].charAt(0) + words[1].charAt(0);
  }
  return words[0].charAt(0);
};

export const aliasPipeTransform = (payload: string): string => {
  return generateAlias(checkForWords(payload));
};
