import { jsonwebtokenStrategy } from "../../strategies";

// add the option for devs to provide their own strategy
export const withAuthentication = (resolver) => (
  parent,
  args,
  context,
  info
) => {
  try {
    const contextWithPayload = jsonwebtokenStrategy(context);

    return resolver(parent, args, contextWithPayload, info);
  } catch {
    throw new Error("Authentication error!");
  }
};
