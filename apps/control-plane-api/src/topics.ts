export function uniqueTopics(services: { produces: string[]; consumes: string[] }[]): string[] {
  const topics = new Set<string>();
  for (const service of services) {
    for (const topic of [...service.produces, ...service.consumes]) topics.add(topic);
  }
  return [...topics];
}
