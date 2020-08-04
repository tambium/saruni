import fs from "fs";
import { getPaths } from "@saruni/internal";

export const saveEmail = (emailContent: string, filename: string) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(
      `${getPaths().static.generatedEmails}/${filename}.html`,
      emailContent,
      (err) => {
        if (err) return reject(err);
        return resolve();
      }
    );
  });
};
