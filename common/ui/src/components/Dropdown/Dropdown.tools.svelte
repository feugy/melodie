<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'
  import Dropdown from './DropdownToolWrapper.svelte'
  import {
    dropdownData,
    dropdownCustomData,
    dropdownSimpleData
  } from './Dropdown.testdata'
</script>

<ToolBox
  name="Components/Dropdown"
  component={Dropdown}
  props={dropdownData}
  events={['click', 'select']}
>
  <Tool name="Default" />
  <Tool name="Simple array" props={dropdownSimpleData} />
  <Tool name="Custom option" props={dropdownCustomData} />
  <Tool
    name="Independent text and icon"
    props={{
      valueAsText: false,
      text: 'options',
      icon: 'settings',
      align: 'text-left'
    }}
  />
  <Tool
    name="Icon only with relative parent"
    props={{
      parentPosition: 'relative',
      icon: 'more_vert',
      withArrow: false,
      valueAsText: false
    }}
  />
  <Tool
    name="Custom button options"
    props={{
      text: 'Primary',
      primary: true,
      valueAsText: false,
      icon: 'person',
      align: 'text-right'
    }}
  />
</ToolBox>
