import { z } from 'zod'
import { api } from './request.ts'

const mappingTeamUserSchema = z.object({
  username: z.string().optional(),
  uid: z.string().optional(),
  joined: z.string().optional(),
  left: z.string().optional(),
})

const mappingTeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  owner: z.string().nullable().optional(),
  trusted: z.boolean().optional(),
  users: z.array(mappingTeamUserSchema).optional(),
})

export type MappingTeam = z.infer<typeof mappingTeamSchema>

const mappingTeamListSchema = z.object({
  results: z.array(mappingTeamSchema),
})

export function createMappingTeam(name: string, users: object) {
  return api.post('/mapping-team/', { name, users })
}

export function fetchMappingTeam(id: number): Promise<MappingTeam> {
  return api.get(`/mapping-team/${id}/`).then((data) => mappingTeamSchema.parse(data))
}

export function deleteMappingTeam(id: number) {
  return api.delete(`/mapping-team/${id}/`)
}

export function fetchUserMappingTeams(owner: string): Promise<MappingTeam[]> {
  return api
    .get(`/mapping-team/?owner=${owner}`)
    .then((data) => mappingTeamListSchema.parse(data).results)
}

export function updateMappingTeam(id: number, name: string, users: object) {
  return api.put(`/mapping-team/${id}`, { name, users })
}
