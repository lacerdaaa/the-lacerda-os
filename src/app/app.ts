import { Component } from '@angular/core';

interface DesktopShortcut {
  name: string;
  code: string;
}

interface DockApp {
  name: string;
  code: string;
  active?: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly menuItems = ['Finder', 'File', 'Edit', 'View', 'Go', 'Window', 'Help'];

  protected readonly desktopShortcuts: DesktopShortcut[] = [
    { name: 'About Me', code: 'AB' },
    { name: 'Projects', code: 'PR' },
    { name: 'Terminal', code: 'TM' },
    { name: 'Contact', code: 'CT' }
  ];

  protected readonly dockApps: DockApp[] = [
    { name: 'Finder', code: 'FD', active: true },
    { name: 'Notes', code: 'NT' },
    { name: 'Terminal', code: 'TM' },
    { name: 'Projects', code: 'PR' },
    { name: 'Settings', code: 'ST' }
  ];
}
