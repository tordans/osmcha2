import { useAuth } from '../hooks/useAuth.ts'
import { ANONYMOUS_NOTES_USER } from '../stores/changeset-notes-store.ts'

export function useNotesUserKey() {
  const { user } = useAuth()
  return user?.username ?? ANONYMOUS_NOTES_USER
}
