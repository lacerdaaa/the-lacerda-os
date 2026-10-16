import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { IconKey } from '../../core/apps';
import { format, I18nService, Localized } from '../../core/i18n';
import { LAUNCHABLE_APPS, ShellService } from '../../core/shell.service';
import { FileId } from '../../data/files';
import { AppIconComponent } from '../../shell/app-icon/app-icon.component';

const COPY = {
  intro: {
    'en-US': 'Recruiter mode: everything worth seeing in this portfolio, one click away.',
    'pt-BR': 'Modo recrutador: tudo o que vale a pena ver neste portfólio, a um clique.'
  },
  items: { 'en-US': '{count} items', 'pt-BR': '{count} itens' },
  name: { 'en-US': 'Name', 'pt-BR': 'Nome' },
  kind: { 'en-US': 'Description', 'pt-BR': 'Descrição' }
};

const DESCRIPTIONS: Record<string, Localized<string>> = {
  about: { 'en-US': 'Who I am, where I am and what I am building.', 'pt-BR': 'Quem eu sou, onde estou e o que estou construindo.' },
  experience: { 'en-US': 'From intern at Moderna Tecnologia to Thoughtworks.', 'pt-BR': 'De estagiário na Moderna Tecnologia à Thoughtworks.' },
  projects: { 'en-US': 'Featured GitHub work, live from the API.', 'pt-BR': 'Projetos em destaque, ao vivo do GitHub.' },
  courses: { 'en-US': 'Certifications and technical training.', 'pt-BR': 'Certificações e formação técnica.' },
  books: { 'en-US': 'Readings that shaped how I think.', 'pt-BR': 'Leituras que moldaram meu jeito de pensar.' },
  blog: { 'en-US': 'Articles published on Medium.', 'pt-BR': 'Artigos publicados no Medium.' },
  safari: { 'en-US': 'A tiny browser with my bookmarks.', 'pt-BR': 'Um navegador minúsculo com meus favoritos.' },
  terminal: { 'en-US': 'Commands, easter eggs and games.', 'pt-BR': 'Comandos, easter eggs e jogos.' },
  notes: { 'en-US': 'A scratchpad that remembers what you type.', 'pt-BR': 'Um bloco de notas que lembra o que você digita.' },
  quiz: { 'en-US': 'How well do you know me? There is a secret.', 'pt-BR': 'Quanto você me conhece? Tem um segredo.' },
  'about-me.txt': { 'en-US': 'Plain-text bio with my toolbox.', 'pt-BR': 'Bio em texto puro com minhas ferramentas.' },
  'readme.txt': { 'en-US': 'Tips for getting around lacOs.', 'pt-BR': 'Dicas para usar o lacOs.' }
};

const FILE_IDS: FileId[] = ['about-me.txt', 'readme.txt'];

interface FinderEntry {
  key: string;
  icon: IconKey;
  name: string;
  description: string;
  open: () => void;
}

@Component({
  selector: 'app-finder',
  imports: [AppIconComponent],
  templateUrl: './finder.component.html',
  styleUrl: './finder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinderComponent {
  private readonly i18n = inject(I18nService);
  private readonly shell = inject(ShellService);
  protected readonly copy = this.i18n.copy(COPY);

  protected readonly entries = computed<FinderEntry[]>(() => {
    const describe = (key: string) => this.i18n.pick(DESCRIPTIONS[key]);
    return [
      ...LAUNCHABLE_APPS.map((appId) => ({
        key: appId,
        icon: appId,
        name: this.shell.appName(appId),
        description: describe(appId),
        open: () => this.shell.openApp(appId)
      })),
      ...FILE_IDS.map((fileId) => ({
        key: fileId,
        icon: 'file' as const,
        name: fileId,
        description: describe(fileId),
        open: () => this.shell.openFile(fileId)
      }))
    ];
  });

  protected readonly itemCount = computed(() => format(this.copy().items, { count: this.entries().length }));
}
