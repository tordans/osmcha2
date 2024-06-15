# OSMCha2

> [!WARNING]
> This is not finished!

## Scope

A new frontend for OSMCha, incorparating the osmcha-frontend project and the changeset-map in one NextJS app.

## Local development

Prepare:

```bash
sudo code /etc/hosts
# add:
# 127.0.0.1 osmcha2.test
```

Then:

```bash
npm run dev # this will prompt to use the NextJS https in Dev feature
```

Now: Open [https://osmcha2.test](https://osmcha2.test)

## Tool chain

The main parts of this appliation are…

- [Next.js](https://nextjs.org/docs) using the app router. All fetches are done in React Server Comonents (RSC)
- Tailwind CSS with Tailwind UI Catalyst for Styling and Components
- React Map GL for everything to do with Maplibre GL JS maps
- nuqs for handling public state in the URL and Zustand for handling internal shared state
- Zod for parsing API responses
