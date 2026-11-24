import * as React from 'react';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@tacc/core-components/ui/combobox';
import { Plus } from 'lucide-react';

const frameworks = ['Next.js', 'SvelteKit', 'Nuxt.js', 'Remix', 'Astro'];

export function UIPatternsCombobox() {
  const anchor = useComboboxAnchor();
  const [options, setOptions] = React.useState<string[]>(frameworks);
  const [values, setValues] = React.useState<string[]>([frameworks[0]]);
  const [inputValue, setInputValue] = React.useState('');

  const candidate = inputValue.trim();
  const canCreate =
    candidate.length > 0 &&
    !options.some((option) => option.toLowerCase() === candidate.toLowerCase());

  const items = canCreate ? [...options, candidate] : options;

  function handleValueChange(nextValues: string[]) {
    setValues(nextValues);

    // Retain custom options even after their chips are removed.
    setOptions((previous) => [
      ...previous,
      ...nextValues.filter((value) => !previous.includes(value)),
    ]);

    setInputValue('');
  }

  return (
    <Combobox
      multiple
      autoHighlight
      items={items}
      defaultValue={[frameworks[0]]}
      value={values}
      onValueChange={handleValueChange}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
    >
      <ComboboxChips ref={anchor} className="tw:w-full tw:max-w-xs">
        <ComboboxValue>
          {(values) => (
            <React.Fragment>
              {values.map((value: string) => (
                <ComboboxChip key={value}>{value}</ComboboxChip>
              ))}
              <ComboboxChipsInput />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {canCreate && item === candidate ? (
                <span className="tw:flex tw:items-center tw:gap-2">
                  <Plus /> Add “{item}”
                </span>
              ) : (
                item
              )}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
