export const appHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} · Basefy Seller` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · Basefy Seller` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ],
});
