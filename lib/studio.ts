export const REGIONS = ['lips', 'cheeks', 'jaw', 'forehead'] as const;
export type Region = typeof REGIONS[number];
export type Finish = 'natural' | 'gold' | 'neon';
export type Landmark = { x: number; y: number; z: number };
export type StudioState = { region: Region; finish: Finish; amounts: Record<Region, number>; rotation: number; mesh: boolean };
export const INITIAL: StudioState = { region: 'cheeks', finish: 'natural', amounts: { lips: 0, cheeks: 0, jaw: 0, forehead: 0 }, rotation: 0, mesh: true };
export const REGION_NAMES: Record<Region,string> = { lips: 'Lips', cheeks: 'Cheekbones', jaw: 'Jawline', forehead: 'Forehead' };
export const ANGLES = ['Front', 'Slight left', 'Further left', 'Slight right', 'Further right'] as const;
export type Photo = { image: string; label: string };
export type RoutedCommand = { action: string; region: string; strength: string; direction: string; finish: string };
export function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
export function applyCommand(state: StudioState, command: RoutedCommand): StudioState {
  const region = REGIONS.includes(command.region as Region) ? command.region as Region : state.region;
  switch(command.action) {
    case 'highlight': return { ...state, region, mesh: true };
    case 'adjust': {
      const amount = command.strength === 'less' ? state.amounts[region] - 0.2 : command.strength === 'bold' ? 0.85 : command.strength === 'medium' ? 0.5 : 0.25;
      return { ...state, region, amounts: { ...state.amounts, [region]: clamp(amount, 0, 1) } };
    }
    case 'rotate': return { ...state, rotation: command.direction === 'front' ? 0 : clamp(state.rotation + (command.direction === 'left' ? -0.25 : command.direction === 'right' ? 0.25 : 0), -0.65, 0.65) };
    case 'style': return ['natural','gold','neon'].includes(command.finish) ? { ...state, region, finish: command.finish as Finish } : state;
    default: return state;
  }
}
// Smooth weights are shared by shape adjustments, artistic colour and region highlights.
export function regionWeights(points: Landmark[], i: number): Record<Region,number> {
  const p = points[i];
  const width = Math.abs((points[454]?.x ?? 0.8) - (points[234]?.x ?? 0.2));
  const height = Math.abs((points[152]?.y ?? 0.9) - (points[10]?.y ?? 0.1));
  const spot = (index: number, rx: number, ry: number) => {
    const c = points[index]; if (!c) return 0;
    return Math.exp(-2 * (((p.x-c.x)/(width*rx))**2 + ((p.y-c.y)/(height*ry))**2));
  };
  return { lips: Math.max(spot(13,.17,.06),spot(14,.17,.06)), cheeks: Math.max(spot(50,.19,.13),spot(280,.19,.13)), jaw: Math.max(spot(172,.17,.14),spot(397,.17,.14),spot(152,.20,.08)), forehead: spot(151,.33,.14) };
}
export function deform(points: Landmark[], i: number, amounts: StudioState['amounts']): Landmark {
  const p = points[i], w = regionWeights(points,i), centre = points[1];
  const mouth = points[13];
  return {
    x: p.x + (p.x-mouth.x)*amounts.lips*w.lips*.12 - (p.x-centre.x)*amounts.jaw*w.jaw*.045,
    y: p.y + (p.y-mouth.y)*amounts.lips*w.lips*.15 - amounts.cheeks*w.cheeks*.006,
    z: p.z - amounts.lips*w.lips*.012 - amounts.cheeks*w.cheeks*.015 - amounts.forehead*w.forehead*.005,
  };
}
export function meshIndices(edges: {start:number;end:number}[]): number[] {
  const result: number[] = [];
  for(let i=0;i+2<edges.length;i+=3) {
    const triangle = [...new Set([edges[i].start,edges[i].end,edges[i+1].start,edges[i+1].end,edges[i+2].start,edges[i+2].end])];
    if(triangle.length === 3 && triangle.every(x=>x<468)) result.push(...triangle);
  }
  return result;
}
