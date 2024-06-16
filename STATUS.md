I spent the last two weeks on holiday, using my mornings and evenings to explore how well the React ecosystem can facilitate the clean, fast, and elegant migration of an app like OSMCha.

### Background

OSMCha is an invaluable tool that enhances my OSM mapping activities. Years ago, I contributed to improving its mobile experience, which gave me insight into its complex codebase. Unfortunately, the project suffers from a lack of support from a software development perspective. Some of the code is seven years old, and the technical debt makes it difficult to develop new features. When OSMCha became a charter project, I hoped for significant improvements. However, a year later, it's evident that substantial cleanup (like migrating servers and ensuring reliable performance) is still needed before frontend changes can be considered.

### Motivation & Conclusions

During this learning journey/sprint, I aimed to evaluate the current React ecosystem's suitability for an application like OSMCha:

- **React and NextJS:** The introduction of **React Server Components** allows for composing frontend and backend components in one React app, reminiscent of Ruby on Rails. My goal was to handle all API calls on the server with React server components, using client components only for interactivity. My conclusion: While the composability of these components is excellent, they can be challenging to understand initially. However, after some learning, I am satisfied with the setup.
- **Tailwind Catalyst:** Tailwind CSS is fantastic for creating bespoke UIs in a component-based environment like React. The [Catalyst](https://catalyst.tailwindui.com/) component library from Tailwind UI provides a solid starting point for quickly building beautiful UIs and interactions. My conclusion: For a project requiring a highly customized UI, Catalyst and Tailwind CSS are perfect.
- **Unified Repository with NextJS:** The current OSMCha frontend is complicated by the changeset-map being its own repository and npm package. My goal was to reduce this complexity by consolidating everything into one well-structured project. Using the app folder in NextJS makes structuring pages, API routes, components, and utilities much cleaner. It's great.
- **React Map GL:** I enjoy working with [react-map-gl](https://visgl.github.io/react-map-gl/). It simplifies working with Maplibre GL JS and allows for neat React-style abstractions of controls, sources, and layers.
- **State Management with Zustand and Nuqs:** I prefer managing relevant state in the URL. [Nuqs](https://github.com/47ng/nuqs) is excellent for this in NextJS. For other global but non-shareable states, Zustand works well.
- **API Response Parsing with Zod:** I extensively used [Zod](https://zod.dev/) for parsing API responses. Learning how to enable strict parsing of objects was worthwhile because it ensures that the data I have is in the expected shape and correctly represents the raw data. This was particularly useful without an API spec for most of the data used in OSMCha. The system now fails upon encountering unknown properties, providing robust type safety.

### Unplanned Detours

- **Linkify:** I unexpectedly delved into adding links, `@`-mentions, and hashtags with [Linkify](https://linkify.js.org/). It integrates well and enhances the changeset and discussion comments.
- **Real-Changeset-Parser Package:** Understanding and fixing issues with this Mapbox-era library was necessary. It illustrates the technical debt in OSMCha, a ~7-year-old project with minimal refactoring. I migrated the library to TypeScript and made minor modifications. More learning about ESM npm packages and their integration with modern build processes like NextJS is needed. Ideally, someone else could take over this task long-term. Wille and I discussed moving the library to the OSMCha Github organization and updating the npm package.
- **OAuth Integration in NextJS:** Integrating OAuth was challenging. I documented my notes in `auth/README.md`.

### UI Development

My goal was to create a new, powerful, and feature-rich UI for OSMCha. I iterated on the UI to compact the information efficiently, keeping all current data but reorganized. There's a vision to enable a more detailed review workflow with this new UI, allowing individual changeset checks before full evaluation and commenting.

### Current Status & Outlook

My holiday is ending, so this "sprint" is wrapping up. I won't have much time to work on this in the coming months due to another OSM project. However, given OSMCha's slow development pace, taking it slow with this project should fit well.

I briefly discussed this project with Wille, the OSMCha maintainer. This code might be released as a "next" UI to be tested alongside the current one, despite missing many features. The first step is to move the repos under the [osmcha](https://github.com/OSMCha/) organization and sort out authentication for read-only access.

---

### Missing Features

OSMCha has a significant feature footprint. Here are some tasks still to be completed:

- **Login Page:** The Auth button currently serves directly from the library. This page needs to explain OSMCha and provide a good user experience.
- **Handling Relations:** The changes-list and map don't handle or test relations yet. Code from the osmcha-frontend repo needs to be added.
- **Map and Changes List Interaction:** This interaction is still in draft form.
- **Review Workflow:** The entire review workflow is a draft. I have ideas to improve the commenting flow.
- **Additional Pages:** All pages (e.g., about) are drafts.
- **Form Handling:** I plan to use server actions and new React form APIs for form handling. Tailwind UI's form helpers will also be utilized. The filter form needs UX improvements, and a quick filter UI might be added to the changeset list.
- **Mobile UI:** The mobile UX needs improvement, which was my initial contribution to OSMCha. With the new setup and Tailwind CSS, significant enhancements are possible.

I likely won't have time to address these tasks soon, but I hope the new codebase will encourage community contributions from users familiar with modern React.
