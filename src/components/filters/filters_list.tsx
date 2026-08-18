import { startOfDay } from 'date-fns'
import filters from '../../config/filters.json'
import { getDefaultFromDate } from '../../utils/filters.ts'
import { Button } from '../ui/button.tsx'
import { Subheading } from '../ui/heading.tsx'
import { DateField, parseStoredDate } from './date.tsx'
import type { Filter, FilterOption, Filters } from './index.ts'
import { LocationSelect } from './location.tsx'
import { Meta } from './meta.tsx'
import { MappingTeamMultiSelect, MultiSelect } from './multi_select.tsx'
import { Radio } from './radio.tsx'
import { Text } from './text.tsx'
import { Wrapper } from './wrapper.tsx'

const defaultDate = getDefaultFromDate().date__gte

const filtersData = filters.filter((f) => {
  return !('ignore' in f && f.ignore)
})

type FilterConfig = (typeof filtersData)[number] & {
  range?: boolean
  type?: string
  name: string
  display: string
  placeholder?: string
  description?: string
  options?: Array<{ label: string; value: unknown }>
  data_url?: string
  all?: boolean
  metaOf?: string[]
  min?: string | number
  max?: string | number
}

type FiltersListProps = {
  filters: Filters
  loading: boolean
  active: string
  token: string | null
  handleChange: (name: string, values?: Filter | null) => void
  handleFocus: (name: string) => void
  replaceFiltersState: (filters: Filters) => void
  handleToggleAll: (name: string, values?: Filter | null) => void
  handleApply: () => void
  handleClear: () => void
}

export function FiltersList({
  filters: currentFilters,
  loading,
  active,
  token,
  handleChange,
  handleFocus,
  replaceFiltersState,
  handleToggleAll,
  handleApply,
  handleClear,
}: FiltersListProps) {
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <p className="text-base text-zinc-500">Loading filters…</p>
      </div>
    )
  }

  const renderFilter = (config: FilterConfig, key: number) => {
    const propsToSend = {
      name: config.name,
      type: config.type ?? 'text',
      display: config.display,
      value: currentFilters[config.name],
      placeholder: config.placeholder ?? '',
      options: config.options,
      onChange: handleChange,
      dataURL: config.data_url,
      min: config.min,
      max: config.max,
    }
    const wrapperProps = {
      name: config.name,
      handleFocus: () => handleFocus(config.name),
      hasValue: config.name in currentFilters,
      display: config.display,
      key,
      description: active === config.name ? config.description : undefined,
    }

    if (config.range && config.type === 'number') {
      const gteValue = currentFilters[`${config.name}__gte`]
      const lteValue = currentFilters[`${config.name}__lte`]
      return (
        <Wrapper
          {...wrapperProps}
          hasValue={
            `${config.name}__gte` in currentFilters || `${config.name}__lte` in currentFilters
          }
        >
          <div className="grid grid-cols-2 gap-2">
            <Text
              {...propsToSend}
              name={`${config.name}__gte`}
              value={gteValue}
              placeholder="from"
              max={lteValue?.[0]?.value as string | number | undefined}
              min="0"
            />
            <Text
              {...propsToSend}
              name={`${config.name}__lte`}
              value={lteValue}
              placeholder="to"
              min={gteValue?.[0]?.value as string | number | undefined}
            />
          </div>
        </Wrapper>
      )
    }

    if (!config.range && config.type === 'number') {
      return (
        <Wrapper {...wrapperProps}>
          <Text {...propsToSend} min="1" max="100" />
        </Wrapper>
      )
    }

    if (config.range && config.type === 'date') {
      let gteValue = currentFilters[`${config.name}__gte`]
      if (config.name === 'date') {
        gteValue = currentFilters[`${config.name}__gte`] || defaultDate
      }
      const lteValue = currentFilters[`${config.name}__lte`]
      const today = startOfDay(new Date())
      const gteDate = parseStoredDate(gteValue?.[0]?.value as string | undefined) ?? undefined
      const lteDate = parseStoredDate(lteValue?.[0]?.value as string | undefined) ?? undefined
      return (
        <Wrapper
          {...wrapperProps}
          hasValue={
            `${config.name}__gte` in currentFilters || `${config.name}__lte` in currentFilters
          }
        >
          <div className="grid grid-cols-2 gap-2">
            <DateField
              name={`${config.name}__gte`}
              display={config.display}
              value={gteValue}
              placeholder="From"
              onChange={handleChange}
              max={lteDate || today}
            />
            <DateField
              name={`${config.name}__lte`}
              display={config.display}
              value={lteValue}
              placeholder="To"
              onChange={handleChange}
              min={gteDate}
              max={today}
            />
          </div>
        </Wrapper>
      )
    }

    if (config.type === 'text') {
      return (
        <Wrapper {...wrapperProps}>
          <Text {...propsToSend} />
        </Wrapper>
      )
    }

    if (config.type === 'radio') {
      return (
        <Wrapper {...wrapperProps}>
          <Radio {...propsToSend} options={(config.options ?? []) as FilterOption[]} />
        </Wrapper>
      )
    }

    if (config.type === 'meta') {
      return (
        <Wrapper
          {...wrapperProps}
          hasValue={Boolean(config.metaOf?.find((field) => field in currentFilters))}
        >
          <Meta
            {...propsToSend}
            replaceFiltersState={replaceFiltersState}
            metaOf={config.metaOf ?? []}
            activeFilters={currentFilters}
            options={(config.options ?? []) as unknown as Parameters<typeof Meta>[0]['options']}
          />
        </Wrapper>
      )
    }

    if (config.type === 'text_comma') {
      let { name, value, onChange } = propsToSend
      if (config.all) {
        onChange = handleToggleAll
      }
      if (config.all && `all_${config.name}` in currentFilters) {
        name = `all_${config.name}`
        value = currentFilters[name]
      }

      return (
        <Wrapper
          {...wrapperProps}
          name={name}
          hasValue={name in currentFilters}
          description={active === config.name ? config.description : undefined}
        >
          {name.endsWith('_teams') ? (
            <MappingTeamMultiSelect
              {...propsToSend}
              name={name}
              value={value}
              onChange={onChange}
              showAllToggle={config.all}
              token={token}
            />
          ) : (
            <MultiSelect
              {...propsToSend}
              name={name}
              value={value}
              onChange={onChange}
              showAllToggle={Boolean(config.all)}
              token={token}
            />
          )}
        </Wrapper>
      )
    }

    return null
  }

  return (
    <div className="flex flex-col gap-8 pt-6">
      <FilterSection title="Basic">
        {filtersData
          .slice(0, 2)
          .map((config, index) => renderFilter(config as FilterConfig, index))}
        <Wrapper
          name="location"
          display="Location"
          hasValue={'geometry' in currentFilters || 'in_bbox' in currentFilters}
          handleFocus={() => handleFocus('location')}
          description={
            active === 'location'
              ? 'Filter changesets whose bounding box intersects a chosen area'
              : undefined
          }
        >
          <LocationSelect
            name="location"
            value={currentFilters.geometry || currentFilters.in_bbox}
            placeholder="Type a place name"
            onChange={handleChange}
          />
        </Wrapper>
        {filtersData
          .slice(2, 3)
          .map((config, index) => renderFilter(config as FilterConfig, index))}
      </FilterSection>

      <FilterSection title="OSM Features">
        {filtersData
          .slice(3, 4)
          .map((config, index) => renderFilter(config as FilterConfig, index))}
      </FilterSection>

      <FilterSection title="Flags">
        {filtersData
          .slice(4, 6)
          .map((config, index) => renderFilter(config as FilterConfig, index))}
      </FilterSection>

      <FilterSection title="Review">
        {filtersData
          .slice(6, 10)
          .map((config, index) => renderFilter(config as FilterConfig, index))}
      </FilterSection>

      <FilterSection title="Users & Teams">
        {filtersData
          .slice(10, 17)
          .map((config, index) => renderFilter(config as FilterConfig, index))}
      </FilterSection>

      <FilterSection title="Changeset Details">
        {filtersData.slice(17).map((config, index) => renderFilter(config as FilterConfig, index))}
      </FilterSection>

      <div className="flex flex-wrap gap-2 pb-4">
        <Button
          type="button"
          outline
          className="min-h-11 cursor-pointer touch-manipulation select-none"
          onClick={handleClear}
        >
          Reset
        </Button>
        <Button
          type="button"
          className="min-h-11 cursor-pointer touch-manipulation select-none"
          onClick={handleApply}
        >
          Apply
        </Button>
      </div>
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <Subheading level={2} className="border-b border-zinc-950/10 pb-2">
        {title}
      </Subheading>
      <div className="mt-4 space-y-6">{children}</div>
    </section>
  )
}
