import { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("Init", {
    description: "Generate a new package for the Monorepo",
    prompts: [
      {
        type: "input",
        name: "name",
        message:
          "What is the name of the package? (You can skip the `@vidcastx/` prefix)",
      },
    ],
    actions: [
      (answers) => {
        if (
          "name" in answers &&
          typeof answers.name === "string" &&
          answers.name.startsWith("@vidcastx/")
        ) {
          answers.name = answers.name.replace("@vidcastx/", "");
        }
        return "Config sanitized";
      },
      {
        type: "add",
        path: "packages/{{ name }}/package.json",
        templateFile: "templates/package.json.hbs",
      },
      {
        type: "add",
        path: "packages/{{ name }}/tsconfig.json",
        templateFile: "templates/tsconfig.json.hbs",
      },
      {
        type: "add",
        path: "packages/{{ name }}/eslint.config.mjs",
        templateFile: "templates/eslint.config.mjs.hbs",
      },
    ],
  });
}
