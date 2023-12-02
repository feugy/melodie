<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'

  import {
    dropdownCustomData,
    dropdownData,
    dropdownSimpleData
  } from './Dropdown.testdata'
  import Dropdown from './DropdownToolWrapper.svelte'
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
      icon: 'i-mdi-cog',
      align: 'text-left'
    }}
  />
  <Tool
    name="Icon only with relative parent"
    props={{
      parentPosition: 'relative',
      icon: 'i-mdi-dots-vertical',
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
      icon: 'i-mdi-account',
      align: 'text-right'
    }}
  />
</ToolBox>
