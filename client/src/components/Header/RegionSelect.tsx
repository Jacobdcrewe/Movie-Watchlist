import { MapPin } from 'lucide-react';
import { REGIONS, type Region } from '../../../../shared/types';
import { Dropdown } from '../ui/Dropdown';

const OPTIONS = (Object.keys(REGIONS) as Region[]).map((r) => ({ value: r, label: REGIONS[r], tag: r }));

/** Which country's streaming availability to show. */
export function RegionSelect({ value, onChange }: { value: Region; onChange: (r: Region) => void }) {
  return (
    <Dropdown
      label="Region"
      value={value}
      options={OPTIONS}
      onChange={onChange}
      alignRight
      leading={<MapPin size={16} strokeWidth={1.9} style={{ opacity: 0.7, flex: 'none' }} aria-hidden />}
    />
  );
}
