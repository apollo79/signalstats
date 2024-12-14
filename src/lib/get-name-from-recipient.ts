export const getNameFromRecipient = (
  joinedNickname: string | null,
  joinedSystemName: string | null,
  joinedProfileName: string | null
) => {
  let name = "Could not determine name";

  if (joinedNickname !== null) {
    name = joinedNickname;
  } else if (joinedSystemName !== null && joinedSystemName !== "") {
    name = joinedSystemName;
  } else if (joinedProfileName !== null) {
    name = joinedProfileName;
  }

  return name;
};
