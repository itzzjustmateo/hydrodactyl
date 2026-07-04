import { Sorting01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface SortPreset {
    value: string;
    label: string;
}

interface SortDropdownProps {
    presets: SortPreset[];
    value?: string;
    onSortChange: (value: string) => void;
}

const SortDropdown = ({ presets, value, onSortChange }: SortDropdownProps) => {
    const currentPreset = useMemo(() => presets.find((p) => p.value === value), [presets, value]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size={'sm'} variant={'secondary'} className='px-1 pl-3 gap-1 rounded-full hover:cursor-pointer'>
                    <div className='flex flex-row items-center gap-1'>
                        <HugeiconsIcon size={16} strokeWidth={2} icon={Sorting01Icon} className='size-4' />
                        {currentPreset?.label || 'Sort'}
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='flex flex-col gap-1 z-99999 hover:cursor-pointer' sideOffset={8}>
                {presets.map((preset) => (
                    <DropdownMenuItem
                        key={preset.value}
                        onSelect={() => onSortChange(preset.value)}
                        className={value === preset.value ? 'bg-accent/20' : ''}
                    >
                        <span className='flex items-center justify-between w-full gap-4'>
                            {preset.label}
                            {value === preset.value && <span className='text-xs opacity-60'>&#10003;</span>}
                        </span>
                    </DropdownMenuItem>
                ))}
                {value && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => onSortChange('')} className='text-red-400'>
                            Clear Sort
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default SortDropdown;
