import Handlebars from "handlebars";

export function pascalCase(value: string): string {
  return value
    .split(/[.\-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

Handlebars.registerHelper("pascalCase", pascalCase);

export { Handlebars };
