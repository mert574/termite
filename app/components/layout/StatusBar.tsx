import { Menu, MenuItem, MenuButton } from '@headlessui/react';
import capitalize from 'lodash/capitalize';
import { useLayout } from '~/context/LayoutContext';
import { useEffect, useState } from 'react';
import Tooltip from '~/components/ui/Tooltip';

export default function StatusBar() {
  const { closedPanels, restorePanel } = useLayout();
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().split('T')[1].split('.')[0]);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-8 items-center justify-between border-b border-gray-800 bg-gray-800/50 px-4">
      <div className="flex items-center space-x-4">
        <div className="text-sm font-semibold tracking-wider text-gray-100">
          <span className="text-green-500">term</span>
          <span>ite</span>
        </div>
        <Menu as="div" className="relative">
          <MenuButton className="rounded px-2 py-1 text-xs text-gray-300 hover:bg-gray-800">
            Panels
          </MenuButton>
          <Menu.Items className="absolute left-0 mt-1 w-48 origin-top-left rounded-md border border-gray-700 bg-gray-800 p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            <div className="space-y-1 px-1 py-1">
              {closedPanels.length === 0 ? (
                <div className="px-2 py-1 text-xs text-gray-500">
                  All panels are open
                </div>
              ) : (
                closedPanels.map((type) => (
                  <MenuItem key={type}>
                    {({ active }) => (
                      <button
                        onClick={() => restorePanel(type)}
                        className={`
                          flex w-full items-center rounded px-2 py-1 text-xs
                          ${active ? 'bg-gray-700 text-white' : 'text-gray-300'}
                        `}
                      >
                        Restore {capitalize(type)}
                      </button>
                    )}
                  </MenuItem>
                ))
              )}
            </div>
          </Menu.Items>
        </Menu>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-xs text-gray-300">{time} UTC</div>
        <Tooltip content="Connected">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
        </Tooltip>
      </div>
    </div>
  );
} 