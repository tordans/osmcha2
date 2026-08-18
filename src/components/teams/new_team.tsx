import { PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'
import { Button } from '../ui/button.tsx'
import { Field, FieldGroup, Label } from '../ui/fieldset.tsx'
import { Heading } from '../ui/heading.tsx'
import { Input } from '../ui/input.tsx'
import { Text } from '../ui/text.tsx'

type TeamUser = {
  username?: string
  uid?: string
  joined?: string
  left?: string
}

type Team = {
  id: number
  name: string
  users?: TeamUser[]
}

type NewTeamProps = {
  editing?: boolean
  activeTeam?: Team
  onChange?: (id: number, teamName: string, teamUsers: TeamUser[]) => void
  onCreate?: (teamName: string, teamUsers: TeamUser[]) => void
  userIsOwner: boolean
}

type ValidationResult = { valid: true } | { valid: false; error: string }

function cleanUsers(users: TeamUser[] | undefined): TeamUser[] {
  const cleaned = (users ?? []).map((user) =>
    Object.fromEntries(Object.entries(user).filter(([, value]) => value !== undefined)),
  ) as TeamUser[]
  return cleaned.length > 0 ? cleaned : [{}]
}

export default function NewTeam(props: NewTeamProps) {
  const [teamName, setTeamName] = useState(props.activeTeam?.name ?? '')
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>(() => cleanUsers(props.activeTeam?.users))
  const [editing, setEditing] = useState(Boolean(props.editing) || Boolean(props.activeTeam))
  const [validationErrorMessage, setValidationErrorMessage] = useState('')

  const onClickRemoveUser = (idx: number) => {
    const teamUsersToUpdate = [...teamUsers]
    teamUsersToUpdate.splice(idx, 1)
    setTeamUsers(teamUsersToUpdate)
  }

  const onClickAddAnotherUser = () => setTeamUsers([...teamUsers, {}])

  const onChangeInput = (property: keyof TeamUser, value: string | null, idx: number) => {
    const teamUsersToUpdate = [...teamUsers]
    teamUsersToUpdate[idx] = { ...teamUsersToUpdate[idx], [property]: value }
    setTeamUsers(teamUsersToUpdate)
  }

  const validateData = (): ValidationResult => {
    if (!teamName) {
      return { valid: false, error: 'Team name cannot be empty.' }
    }
    if (
      teamUsers.filter((user) => 'username' in user && user.username).length === teamUsers.length
    ) {
      return { valid: true }
    }
    return {
      valid: false,
      error: 'The username field should not be empty.',
    }
  }

  const onSave = () => {
    const validation = validateData()

    if (validation.valid) {
      if (props.activeTeam && props.onChange) {
        props.onChange(props.activeTeam.id, teamName, teamUsers)
        setValidationErrorMessage('')
      } else if (props.onCreate) {
        props.onCreate(teamName, teamUsers)
        setEditing(false)
        setValidationErrorMessage('')
      }
    } else {
      setValidationErrorMessage(validation.error)
    }
  }

  if (!editing) {
    return (
      <Button type="button" className="min-h-11" onClick={() => setEditing(true)}>
        <PlusIcon data-slot="icon" />
        New team
      </Button>
    )
  }

  return (
    <FieldGroup>
      {!props.activeTeam ? <Heading level={2}>Add a new mapping team</Heading> : null}

      <Field>
        <Label>
          Name <span className="text-red-600">*</span>
        </Label>
        <Input
          className="min-h-11"
          required
          placeholder="New team name"
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          disabled={!props.userIsOwner}
        />
      </Field>

      <div className="space-y-6">
        <Text className="font-semibold text-zinc-950">Users</Text>
        {teamUsers.map((user, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-3 rounded-lg bg-zinc-50 p-4 ring-1 ring-zinc-950/5 min-[40rem]:grid-cols-2 min-[56rem]:grid-cols-5"
          >
            <Field>
              <Label>
                Username <span className="text-red-600">*</span>
              </Label>
              <Input
                className="min-h-11"
                type="text"
                required
                placeholder="Username"
                value={user.username || ''}
                onChange={(event) => onChangeInput('username', event.target.value, index)}
                disabled={!props.userIsOwner}
              />
            </Field>
            <Field>
              <Label>UID</Label>
              <Input
                className="min-h-11"
                type="text"
                placeholder="User UID"
                value={user.uid || ''}
                onChange={(event) => onChangeInput('uid', event.target.value, index)}
                disabled={!props.userIsOwner}
              />
            </Field>
            <Field>
              <Label>Joined the team</Label>
              <Input
                className="min-h-11"
                type="date"
                value={user.joined || ''}
                onChange={(event) => onChangeInput('joined', event.target.value || null, index)}
                disabled={!props.userIsOwner}
              />
            </Field>
            <Field>
              <Label>Left the team</Label>
              <Input
                className="min-h-11"
                type="date"
                value={user.left || ''}
                onChange={(event) => onChangeInput('left', event.target.value || null, index)}
                disabled={!props.userIsOwner}
              />
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                plain
                disabled={teamUsers.length === 1}
                onClick={() => onClickRemoveUser(index)}
                className="min-h-11 min-w-11"
                title="Remove user"
                aria-label="Remove user"
              >
                <TrashIcon data-slot="icon" />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" outline className="min-h-11" onClick={onClickAddAnotherUser}>
          <PlusIcon data-slot="icon" />
          Add user
        </Button>
      </div>

      <Text>
        The mapping team members are <strong className="font-medium text-zinc-950">public</strong>{' '}
        and can be visualized by any logged in OSMCha user.
      </Text>

      {validationErrorMessage ? (
        <p className="text-base/6 font-medium text-red-600">{validationErrorMessage}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {props.userIsOwner ? (
          <Button type="button" className="min-h-11" onClick={onSave}>
            Save
          </Button>
        ) : null}
        {props.activeTeam ? (
          <Button outline href="/teams" className="min-h-11">
            Back to teams
          </Button>
        ) : (
          <Button type="button" outline className="min-h-11" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </div>
    </FieldGroup>
  )
}
