export const command = "hello <world>";
export const desc = "hello";
export const handler = (args) => {
  console.log(args.world);
};
