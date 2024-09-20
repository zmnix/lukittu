export const firstLetterUppercase = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const getInitials = (fullName: string) => {
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((name) => name.charAt(0))
    .join('');

  return initials;
};
