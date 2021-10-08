<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'
  import Annotation from './AnnotationToolWrapper.svelte'
</script>

<ToolBox name="Components/Annotation" component={Annotation}>
  <!-- Note: snapshots will all look the same as JSDom does has a mocked implementation of getBoundingClientRect() -->
  <Tool name="Default" />
  <Tool name="Above center left" props={{ slot: 1 }} />
  <Tool name="Above center right" props={{ slot: 2 }} />
  <Tool name="Above right" props={{ slot: 3 }} />
  <Tool name="Middle left" props={{ slot: 4 }} />
  <Tool name="Positionned" props={{ slot: 5, top: '5%', left: '60%' }} />
  <Tool name="Middle right" props={{ slot: 7 }} />
  <Tool name="Bellow left" props={{ slot: 8 }} />
  <Tool name="Bellow center left" props={{ slot: 9 }} />
  <Tool name="Bellow center right" props={{ slot: 10 }} />
  <Tool name="Bellow right" props={{ slot: 11 }} />
  <Tool name="Anchor not found" props={{ slot: null }} />
  <Tool name="Hidden anchor" props={{ slot: 12 }} />
</ToolBox>
