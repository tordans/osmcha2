import { createFileRoute } from '@tanstack/react-router'
import { OsmOauthLanding } from '../views/osmOauthLanding.tsx'

export const Route = createFileRoute('/osm-oauth')({
  component: OsmOauthLanding,
})
