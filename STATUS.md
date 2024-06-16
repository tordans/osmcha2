I spend the last two weeks on holidays and spend my evenings (and morning) on an learning journey to see how well the React ecosystem is set up to migrate an app like OSMCha in a clean, fast and beautiful way.

### Background

OSMCha is a great piece of software that helps my OSM mapping activity a lot. Ages ago, I contributed some changes to improve the mobile experience and from that time I know the complexity of the current code. In general its sad to see the lack of support for the project from a software development point of view. Some of the code is seven years old and it's in a state where no real feature development can be done due to technical dept. I had high hopes for when the project became a charter project but about a year later it becomes clear that there is still a lot to clean up (thinks like migrating the servers and getting them to perform reliably) before any changes to the frontend can even be added to the roadmap.

### Motivation & Conclusions

For this learning journey / holiday / "sprint" I wanted to see, how well the current react ecosystem works for an application like OSMCha:

- React and NextJS recently introduce **React Server Components**, a way to compose frontend and backend components in one React app. I really like the Ruby on Rails vibes that gives. My idea is, to have all API calls happen on the server in react server components and actions and use client components only when (browser) interactivity is added. — My conclusion: The composability of those types of components is great. But at the same time it makes them harder to understand sometimes. However, after some learning, I am happy with the general setup ATM.
- **Tailwind Catalyst** component library: Tailwind CSS is just great to build bespoke UIs in a component base environment like React. Recently Tailwind UI released [Catalyst](https://catalyst.tailwindui.com/), a component library that gives a great starting point to build beautiful UIs and interactions fast. — My conclusion: This is one of those projects that needs a bespoke UI where every pixel can be adjusted. Catalyst and Tailwind CSS are perfect for this use case.
- **One repository** using the NextJS app folder: One of the things that make the current OSMCha frontend so hard to work with is, that the changeset-map is it's own repo and npm package. So one goal was, to reduce this complexity and have everything in one nicely structured project. Using the app folder in NextJS make structuring pages, api routes, components, utilities so much cleaner. Its great.
- **[React Map GL](https://visgl.github.io/react-map-gl/)**: I really enjoy working with react-map-gl. It makes working with Maplibre GL JS very easy and allows for nice react style abstractions of controls, sources and layers.
- Zustand and Nuqs: I am a big fan of holding all relevant state in the URL. [Nuqs](https://github.com/47ng/nuqs) is a great library for NextJS to do just that. And for all the other, global but non-shareable state, there is Zustand, which is also great to work with.
- [Zod](https://zod.dev/) for parsing API responses. I used zod extensevly for this project. I had learning some new thinks on how to enable strict parsing of objects. The main reason I spend a lot of time on this is,that it gives me convidence on a type (script) level that the data I think I have is actually in the shape I expect it to be and that shape is a correct representation of the raw data. This was especially usefull, because I did not have an API spec for most of the data that is used in in OSMCha. Right now, the system will explode whenever it encounters an unknown property and in return provides great type savety on the shape of the data.

Unplanned detours

- **[Linkify](https://linkify.js.org/)**: I did an unplanned deep dive into how to add links to links, `@`-mentions and hastags. As always, there is a ton of libraries which all fit a specific use case. I am happy with how Linkify integrates into the code and how well it adds the desired features to the changeset comments and discussion comments.
- One unexpected detour was to understand and fix issues with the **real-changeset-parser package**. This is a library from the Mapbox days of OSMCha which is still hosted on the Mapbox gihtub organisation but now a public archive. At the same time, it is part of the core of OSMCha. This is a nice illustration of the kind of technical and dependency dept that needs to be "paid" with a ~7 year old project like OSMCha that did not receive a lot of refactoring time over the years. In this case I migrated the library to TypeScript at https://github.com/tordans/real-changesets-parser/ and added small modifications. I still have a lot to learn about ESM npm packages and how to build them so they can be integrated in a modern build process like NextJS and have nice TypeScript support. It would be great if someone where to take this over. – Long term: I talked to Wille so this library might move into the OSMCha Github Org and maybe the npm package can be updated as well…
- Another thing that was hard and took time was to **integrate OAuth into NextJS**. I wrote some notes in auth/README.md.

All those are technical things. At the same time there was a more vague motivation to start building a **UI for OSMCha** that is different but still as powerful and feature rich as the current UI. I did a lot of iterations on the UI to see how dense the information can be compacted. I think I managed to keep all the data that is present in OSMCha today in various panels and tabs and reorganize it in a different way. There is a vagure vision to allow for a more detailed review workflow with this new UI where you check the changes of a changeset individually and from there step into the full changeset evaluation and adding a helpful comment.

### Current status & Outlook

My holidays are over soon so this "sprint" comes to an end. I am pretty sure I will not have at lot of time to work on this in the next few month due to [another OSM project](https://github.com/osmberlin/osm-traffic-sign-tool/issues/40) (more on that soon). But at the same time, OSMCha is in a kind of slumber for a few years now, so taking it slow with a project like this should fit right in.

I had a quick talk with Wille, the maintainer of OSMCha on this project. Maybe this code can be release as a kind of "next" UI that can be used alongside the current UI. There are tons of feature missing, still, so it would only be useful for testing this new system and UI with live data.

A first step in this direction will be to move the repos under the [osmcha](https://github.com/OSMCha/) organisation and geht the Auth sorted so one can use the app in read-only mode.

---

### Missing features

OSMCha looks like a simple app at first glance but it has quite a big footprint of features. Here is a quick list of things that still need to be done. We will find a ton more once we test it more…

- Login page: Right now the Auth button is served right from the library. Since this page is the only page that is visible for logged out users, it needs to explain OSMCha and provide a good experience. There is more on how I image the Auth to work in auth/README.md
- Relations are not handled or even tested yet by the changes-list nor the map. There is code in the osmcha-frontend repo for this (some is copied to the TODO.md) that needs to be added.
- The interaction between Map and Changes list is just a draft for now.
- The whole review-flow is just a draft for now (more on a possible workflow above). I have ideas on how to change the commenting flow as part of this as well.
- All pages (about, …) are just draft ATM.
- Everything to do with forms and writing data is not there at all. I plan to test out server actions for those and use the new form APIs that React introduced. And of course the form helpers that Tailwind UI added. I would very much like to rework the filter form, which can benefit for some UX improvements. And maybe we should add a quick filter UI on top of the changeset list to clearly separate which filters can be used as URL params and which require to save the filter?
- And then there is the mobile UI. I use OSMCha via RSS on my Phone and the lacking mobile UX is what brought me to contribute to OSMCha in the first place. With this new setup where the map and app are one piece and Tailwind CSS to handle the styling there is a lot that can be improved…

Again, I don't see that I will have the time to work on those things any time soon. But I hope that having this new codebase might spark some contributions from the community from Users that might know modern React …
