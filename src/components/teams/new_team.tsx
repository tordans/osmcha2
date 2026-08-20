import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'
import { Button } from '../ui/button.tsx'
import { ErrorMessage, Field, FieldGroup, Label } from '../ui/fieldset.tsx'
import { Heading } from '../ui/heading.tsx'
import { PlusIcon, TrashIcon } from '../ui/icons.ts'
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

const teamUserSchema = z.object({
  username: z.string().min(1, 'The username field should not be empty.'),
  uid: z.string().optional(),
  joined: z.string().optional(),
  left: z.string().optional(),
})

const teamSchema = z.object({
  teamName: z.string().min(1, 'Team name cannot be empty.'),
  teamUsers: z.array(teamUserSchema).min(1),
})

function cleanUsers(users: TeamUser[] | undefined): TeamUser[] {
  const cleaned = (users ?? []).map((user) =>
    Object.fromEntries(Object.entries(user).filter(([, value]) => value !== undefined)),
  ) as TeamUser[]
  return cleaned.length > 0 ? cleaned : [{ username: '' }]
}

function formatFieldErrors(errors: unknown[]) {
  return errors.map((error) => (typeof error === 'string' ? error : String(error))).join(', ')
}

export default function NewTeam(props: NewTeamProps) {
  const [editing, setEditing] = useState(Boolean(props.editing) || Boolean(props.activeTeam))

  const form = useForm({
    defaultValues: {
      teamName: props.activeTeam?.name ?? '',
      teamUsers: cleanUsers(props.activeTeam?.users),
    },
    validators: {
      onSubmit: teamSchema,
    },
    onSubmit: ({ value }) => {
      if (props.activeTeam && props.onChange) {
        props.onChange(props.activeTeam.id, value.teamName, value.teamUsers)
      } else if (props.onCreate) {
        props.onCreate(value.teamName, value.teamUsers)
        setEditing(false)
      }
    },
  })

  if (!editing) {
    return (
      <Button type="button" className="min-h-11" onClick={() => setEditing(true)}>
        <PlusIcon data-slot="icon" />
        New team
      </Button>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        {!props.activeTeam ? <Heading level={2}>Add a new mapping team</Heading> : null}

        <form.Field name="teamName">
          {(field) => (
            <Field>
              <Label>
                Name <span className="text-red-600">*</span>
              </Label>
              <Input
                required
                placeholder="New team name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                disabled={!props.userIsOwner}
              />
              {field.state.meta.errors.length > 0 ? (
                <ErrorMessage>{formatFieldErrors(field.state.meta.errors)}</ErrorMessage>
              ) : null}
            </Field>
          )}
        </form.Field>

        <div className="space-y-6">
          <Text className="font-semibold text-zinc-950">Users</Text>
          <form.Field name="teamUsers" mode="array">
            {(usersField) => (
              <>
                {usersField.state.value.map((_, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 gap-3 rounded-lg bg-zinc-50 p-4 ring-1 ring-zinc-950/5 min-[40rem]:grid-cols-2 min-[56rem]:grid-cols-5"
                  >
                    <form.Field name={`teamUsers[${index}].username`}>
                      {(field) => (
                        <Field>
                          <Label>
                            Username <span className="text-red-600">*</span>
                          </Label>
                          <Input
                            type="text"
                            required
                            placeholder="Username"
                            value={field.state.value ?? ''}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            disabled={!props.userIsOwner}
                          />
                          {field.state.meta.errors.length > 0 ? (
                            <ErrorMessage>
                              {formatFieldErrors(field.state.meta.errors)}
                            </ErrorMessage>
                          ) : null}
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name={`teamUsers[${index}].uid`}>
                      {(field) => (
                        <Field>
                          <Label>UID</Label>
                          <Input
                            type="text"
                            placeholder="User UID"
                            value={field.state.value ?? ''}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            disabled={!props.userIsOwner}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name={`teamUsers[${index}].joined`}>
                      {(field) => (
                        <Field>
                          <Label>Joined the team</Label>
                          <Input
                            type="date"
                            value={field.state.value ?? ''}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value || undefined)
                            }
                            disabled={!props.userIsOwner}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name={`teamUsers[${index}].left`}>
                      {(field) => (
                        <Field>
                          <Label>Left the team</Label>
                          <Input
                            type="date"
                            value={field.state.value ?? ''}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value || undefined)
                            }
                            disabled={!props.userIsOwner}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        plain
                        disabled={usersField.state.value.length === 1}
                        onClick={() => usersField.removeValue(index)}
                        className="min-h-11 min-w-11"
                        title="Remove user"
                        aria-label="Remove user"
                      >
                        <TrashIcon data-slot="icon" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  outline
                  className="min-h-11"
                  onClick={() => usersField.pushValue({ username: '' })}
                >
                  <PlusIcon data-slot="icon" />
                  Add user
                </Button>
              </>
            )}
          </form.Field>
        </div>

        <Text>
          The mapping team members are <strong className="font-medium text-zinc-950">public</strong>{' '}
          and can be visualized by any logged in OSMCha user.
        </Text>

        <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
          {(submitError) =>
            submitError ? (
              <p className="text-base/6 font-medium text-red-600">{String(submitError)}</p>
            ) : null
          }
        </form.Subscribe>

        <div className="flex flex-wrap gap-3">
          {props.userIsOwner ? (
            <Button type="submit" className="min-h-11">
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
    </form>
  )
}
